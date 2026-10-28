import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { discoveryPages } from '../src/pageRoutes.ts';

const root = fileURLToPath(new URL("../", import.meta.url));
const template = await readFile(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
if (!template.includes('<div id="root"></div>')) {
  throw new Error("Build the Vite HTML shell before prerendering.");
}

// This loader only transpiles the application. It does not open a server, load
// deployment environment files, or initialize the Express/database plugin.
const loader = await createServer({
  root,
  configFile: false,
  envFile: false,
  cacheDir: "node_modules/.vite-prerender",
  optimizeDeps: { noDiscovery: true, include: [] },
  plugins: [react()],
  appType: "custom",
  server: { middlewareMode: true, watch: null },
});
const pages = [
  ...discoveryPages.map(page => ({...page, title: `${page.title} — AtlasSphere`})),
  {
    route: "/",
    file: "index.html",
    title: "AtlasSphere — Explore Earth and Beyond",
    description:
      "Explore Earth and beyond with AtlasSphere. Discover countries, natural wonders, astronomy and Earth science through interactive maps, a 3D globe and geography games.",
  },
  {
    route: "/sources",
    file: "sources.html",
    title: "A world of trusted sources. — AtlasSphere",
    description:
      "Scientific references, geographic data, image credits and licenses used by AtlasSphere.",
  },
  {
    route: "/privacy",
    file: "privacy.html",
    title: "Your privacy, explained. — AtlasSphere",
    description:
      "How AtlasSphere uses browser storage, account data and external geographic and scientific services.",
  },
  {
    route: "/accessibility",
    file: "accessibility.html",
    title: "Exploration is for everyone. — AtlasSphere",
    description:
      "Keyboard controls, motion preferences, alternative views and accessibility information for AtlasSphere.",
  },
];

try {
  const { renderPage } = await loader.ssrLoadModule("/src/home/prerender.tsx");
  for (const page of pages) {
    const rendered = await renderPage(page.route);
    if (!rendered.includes("<main") || !rendered.includes("<h1")) {
      throw new Error(
        `Static rendering did not produce page content for ${page.route}`,
      );
    }
    if (rendered.includes("<!--$?-->") || rendered.includes("$RC(")) {
      throw new Error(
        `Static page still requires a streaming reveal: ${page.route}`,
      );
    }
    const html = template
      .replace(
        '<div id="root"></div>',
        () =>
          `<div id="root" data-prerendered="${page.route}">${rendered}</div>`,
      )
      .replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`)
      .replace(
        /<meta name="description" content="[^"]*">/,
        `<meta name="description" content="${page.description}">`,
      )
      .replace(
        /<meta property="og:title" content="[^"]*">/,
        `<meta property="og:title" content="${page.title}">`,
      )
      .replace(
        /<meta property="og:description" content="[^"]*">/,
        `<meta property="og:description" content="${page.description}">`,
      )
      .replace(/\s*<noscript>[\s\S]*?<\/noscript>/, "");
    await writeFile(new URL(`../dist/${page.file}`, import.meta.url), html);
    console.log(`Prerendered ${page.route} → dist/${page.file}`);
  }
} finally {
  await loader.close();
}
