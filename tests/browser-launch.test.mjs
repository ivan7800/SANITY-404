import { expect, it } from "vitest";
import { browserLaunchOptions } from "../scripts/browser-launch.mjs";

it("no fuerza SwiftShader por defecto y permite elegir GPU física o software", () => {
  const automatic = browserLaunchOptions({});
  expect(automatic.headless).toBe(true);
  expect(automatic.args).not.toContain("--use-angle=swiftshader");
  const hardware = browserLaunchOptions({ SANITY_HARDWARE: "1" });
  expect(hardware.headless).toBe(false);
  expect(hardware.chromiumSandbox).toBe(true);
  expect(hardware.args).toEqual([]);
  const software = browserLaunchOptions({ SANITY_SOFTWARE: "1" });
  expect(software.args).toContain("--use-angle=swiftshader");
  expect(() =>
    browserLaunchOptions({ SANITY_HARDWARE: "1", SANITY_SOFTWARE: "1" }),
  ).toThrow();
});
