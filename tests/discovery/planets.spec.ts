/** Planet encyclopedia: real local data, routes, images and accessible comparison; no live providers. */
import { test, expect } from "../support/uiTest";
import AxeBuilder from "@axe-core/playwright";
test("directory search and filters survive reload and clear empty results", async ({
  page,
}) => {
  await page.goto("/universe/planets?kind=Ice+giant");
  await expect(page.getByTestId("planet-results")).toHaveText(
    "2 planets found",
  );
  await page.getByTestId("planet-search").fill("neptune");
  await expect(page.getByTestId("planet-results")).toHaveText("1 planet found");
  await page.reload();
  await expect(page.getByTestId("planet-card-neptune")).toBeVisible();
  await page.getByTestId("planet-search").fill("pluto");
  await expect(page.getByTestId("planet-results")).toHaveText(
    "0 planets found",
  );
  await page.getByTestId("planet-clear").click();
  await expect(page.getByTestId("planet-results")).toHaveText(
    "8 planets found",
  );
});
test("all eight profiles render local photographs, facts and working adjacent navigation", async ({
  page,
}) => {
  for (const slug of [
    "mercury",
    "venus",
    "earth",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
  ]) {
    await page.goto(`/universe/planets/${slug}`);
    await expect(page.getByTestId("planet-facts")).toBeVisible();
    const photo = page.locator(".planet-photo img");
    await expect(photo).toBeVisible();
    await expect
      .poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
    await expect(page.getByTestId("planet-view-model")).toHaveAttribute(
      "href",
      `/universe/solar-system?planet=${slug}`,
    );
  }
  await page.getByTestId("planet-next").click();
  await expect(page).toHaveURL(/planets\/mercury$/);
  await page.getByTestId("planet-previous").click();
  await expect(page).toHaveURL(/planets\/neptune$/);
});
test("comparison handles signed measurements, four-planet limit and empty state", async ({
  page,
}) => {
  await page.goto("/universe/compare?planets=venus,earth");
  await expect(page.getByTestId("compare-venus-rotation")).toHaveText(
    "-5,832.5",
  );
  await page.getByTestId("compare-metric").selectOption("rotation");
  await expect(page.getByTestId("chart-value-venus")).toHaveText(
    "-5,832.5 hours",
  );
  await page.getByTestId("compare-select-mars").check();
  await page.getByTestId("compare-select-jupiter").check();
  await expect(page.getByTestId("compare-select-neptune")).toBeDisabled();
  await page.reload();
  await expect(page.getByTestId("compare-status")).toContainText(
    "4 planets selected",
  );
  for (const slug of ["venus", "earth", "mars", "jupiter"]) {
    await page.getByTestId(`compare-select-${slug}`).uncheck();
    await expect(page.getByTestId(`compare-select-${slug}`)).not.toBeChecked();
  }
  await expect(page.getByTestId("planet-comparison")).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("compare-status")).toContainText(
    "0 planets selected",
  );
});
test("encyclopedia pages have no overflow or automated accessibility violations in either theme", async ({
  page,
}) => {
  for (const route of [
    "/universe/planets",
    "/universe/planets/venus",
    "/universe/compare",
  ]) {
    await page.goto(route);
    for (const theme of ["light", "dark"]) {
      await page.evaluate(
        (value) => (document.documentElement.dataset.theme = value),
        theme,
      );
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
test("production serves unique static profiles, metadata and real missing-page status", async ({
  request,
}) => {
  test.skip(process.env.HOME_PRODUCTION !== "1", "Requires production HTML.");
  for (const slug of [
    "mercury",
    "venus",
    "earth",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
  ]) {
    const response = await request.get(`/universe/planets/${slug}`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(`data-prerendered="/universe/planets/${slug}"`);
    expect(html).toContain("Sidereal rotation");
  }
  expect((await request.get("/universe/planets/pluto")).status()).toBe(404);
});
