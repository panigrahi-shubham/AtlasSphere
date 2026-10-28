import { defineConfig } from "@playwright/test";
import home from "./playwright.home.config";
import { suiteBase } from "./tests/config/base";
const production = process.env.HOME_PRODUCTION === "1";
const baseURL = production ? "http://127.0.0.1:31425" : "http://127.0.0.1:5177";
export default defineConfig({
  ...home,
  ...suiteBase(production ? "discovery-production" : "discovery"),
  use: {
    ...home.use,
    baseURL,
    launchOptions: {
      args: [
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
    },
  },
  testDir: "./tests/discovery",
  outputDir: "test-results/discovery",
  workers: 2,
  webServer: production
    ? {
        command: "node --experimental-strip-types api/server.ts",
        url: baseURL,
        env: {
          APP_ENV: "production",
          NODE_ENV: "production",
          PORT: "31425",
          DATABASE_URL: "",
          AUTH_SECRET: "",
          FIXTURES: "0",
        },
        reuseExistingServer: false,
        timeout: 30000,
      }
    : {
        command:
          "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5177",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 30000,
      },
});
