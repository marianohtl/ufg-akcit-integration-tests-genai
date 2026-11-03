const { defineConfig, devices } = require("@playwright/test");

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080";
const APP_BASE_URL = process.env.APP_BASE_URL || API_BASE_URL;
const DEV_APP_BASE_URL = process.env.DEV_APP_BASE_URL || "http://localhost:5500";

module.exports = defineConfig({
  testDir: "./specs",
  outputDir: "test-results",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: APP_BASE_URL,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "same-origin",
      testIgnore: /cors\.spec\.js/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: APP_BASE_URL,
      },
    },
    {
      name: "cors",
      testMatch: /cors\.spec\.js/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: DEV_APP_BASE_URL,
      },
    },
  ],
});
