import { chromium } from "@playwright/test";
import { runPhase21BrowserCases } from "./phase21-browser-cases.mjs";

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  headless: process.env.SANITY_HARDWARE !== "1",
  ...(process.env.SANITY_HARDWARE === "1" ? { chromiumSandbox: true } : {}),
  args:
    process.env.SANITY_HARDWARE === "1"
      ? []
      : [
          "--no-sandbox",
          "--use-angle=swiftshader",
          "--enable-unsafe-swiftshader",
        ],
});
const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await runPhase21BrowserCases(
    page,
    process.env.SANITY_TEST_URL || "http://127.0.0.1:5173/",
  );
  if (errors.length > 0) throw new Error(errors.join("\n"));
} finally {
  await browser.close();
}
