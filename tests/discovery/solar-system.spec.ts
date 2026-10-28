/**
 * Feature: Educational Solar System clock and accessible planet selection.
 * Real: React, URL state, Three.js lifecycle, browser controls.
 * Mocked: WebGL availability only in the fallback scenario; no live providers.
 * Run: npm run test:discovery -- solar-system.spec.ts
 */
import { test, expect } from "../support/uiTest";
import AxeBuilder from "@axe-core/playwright";

// Risk: Shared links may select the wrong planet or erase selection on reload.
test("planet selection updates facts and survives direct navigation", async ({
  page,
}) => {
  await page.goto("/universe/solar-system?planet=mars");
  await expect(page.getByTestId("solar-selected")).toContainText(
    "687 Earth days",
  );
  await page.getByTestId("solar-select-neptune").click();
  await expect(page).toHaveURL(/planet=neptune/);
  await expect(page.getByTestId("solar-selected")).toContainText(
    "59,800 Earth days",
  );
  await page.reload();
  await expect(page.getByTestId("solar-select-neptune")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

// Risk: Animation timing can drift or keep running after pause/reset.
test("the model clock responds to speed, pause and reset deterministically", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.goto("/universe/solar-system");
  // Freeze elapsed time as well as Date; clicks must not advance the teaching clock.
  await page.clock.pauseAt(new Date("2026-01-01T00:00:10Z"));
  await page.getByTestId("solar-play").click();
  await page.clock.runFor(1000);
  await expect(page.getByTestId("solar-day")).toHaveValue("30");
  await page.getByTestId("solar-play").click();
  await page.clock.runFor(1000);
  await expect(page.getByTestId("solar-day")).toHaveValue("30");
  await page.getByTestId("solar-speed").fill("60");
  await page.getByTestId("solar-play").click();
  await page.clock.runFor(1000);
  await expect(page.getByTestId("solar-day")).toHaveValue("90");
  await page.getByTestId("solar-play").click();
  await page.getByTestId("solar-day").fill("365");
  await expect(page.getByTestId("solar-day")).toHaveValue("365");
  await page.getByTestId("solar-reset").click();
  await expect(page.getByTestId("solar-day")).toHaveValue("0");
  await expect(page.getByTestId("solar-play")).toHaveText("Play");
});

// Risk: Missing GPU support must not remove the scientific content or keyboard controls.
test("WebGL failure retains the fallback and reduced motion disables autoplay", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl2") return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/universe/solar-system");
  await page.getByTestId("solar-activate").click();
  await expect(page.getByTestId("solar-status")).toContainText(
    "3D is unavailable",
  );
  await expect(page.getByTestId("solar-fallback")).toBeVisible();
  await expect(page.getByTestId("solar-play")).toBeDisabled();
  await page.getByTestId("solar-select-venus").click();
  await expect(page.getByTestId("solar-selected")).toContainText("Venus");
});

// Risk: A canvas alone can conceal broken camera controls, lost context or stale model time.
test("3D renders, focuses, changes the view and recovers from context loss", async ({
  page,
}) => {
  await page.goto("/universe/solar-system");
  await page.getByTestId("solar-activate").click();
  const canvas = page.getByTestId("solar-canvas");
  await expect(canvas).toBeVisible();
  // Every body label must fit the initial overview, including on touch screens.
  const canvasBounds = await canvas.boundingBox();
  for (const label of await page.locator(".solar-label").all()) {
    await expect(label).toBeVisible();
    const bounds = await label.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(canvasBounds!.x);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
      canvasBounds!.x + canvasBounds!.width,
    );
    expect(bounds!.y).toBeGreaterThanOrEqual(canvasBounds!.y);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(
      canvasBounds!.y + canvasBounds!.height,
    );
  }
  const initial = await canvas.getAttribute("data-camera");
  await page.getByTestId("solar-zoom-in").click();
  await expect(canvas).not.toHaveAttribute("data-camera", initial!);
  const zoomed = await canvas.getAttribute("data-camera");
  await page.getByTestId("solar-camera-rotate").click();
  await expect(canvas).not.toHaveAttribute("data-camera", zoomed!);
  await page.getByTestId("solar-select-jupiter").click();
  await page.getByTestId("solar-focus").click();
  await expect(canvas).not.toHaveAttribute("data-camera", initial!);
  await page.getByTestId("solar-day").fill("120");
  await expect(canvas).toHaveAttribute("data-model-day", "120");
  await page.getByTestId("solar-labels").uncheck();
  await expect(page.locator(".solar-label").first()).toBeHidden();
  await page.getByTestId("solar-camera-reset").click();
  await expect(canvas).toHaveAttribute("data-camera", initial!);
  await canvas.evaluate((element) =>
    element.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
  );
  await expect(page.getByTestId("solar-fallback")).toBeVisible();
  await expect(page.getByTestId("solar-selected")).toContainText("Jupiter");
});

// Risk: Educational controls may become unreadable or inaccessible on small screens or in light mode.
test("solar controls fit the viewport and pass automated accessibility in both themes", async ({
  page,
}) => {
  await page.goto("/universe/solar-system");
  for (const theme of ["dark", "light"]) {
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations).toEqual([]);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

// Risk: Prerendering must deliver educational text and retain real 404s.
test("production HTML is crawlable and invalid planet routes return 404", async ({
  request,
}) => {
  test.skip(
    process.env.HOME_PRODUCTION !== "1",
    "Requires the production build server.",
  );
  const response = await request.get("/universe/solar-system");
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('data-prerendered="/universe/solar-system"');
  expect(html).toContain("365.2");
  const missing = await request.get("/universe/planets/not-a-planet");
  expect(missing.status()).toBe(404);
});
