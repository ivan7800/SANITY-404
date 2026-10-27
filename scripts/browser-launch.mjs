/** Hardware runs use the desktop GPU; software rendering requires opt-in. */
export function browserLaunchOptions(env = process.env) {
  const hardware = env.SANITY_HARDWARE === "1";
  const software = env.SANITY_SOFTWARE === "1";
  if (hardware && software)
    throw new Error("SANITY_HARDWARE y SANITY_SOFTWARE son excluyentes.");
  return {
    headless: !hardware,
    ...(hardware
      ? {
          chromiumSandbox: true,
          ignoreDefaultArgs: ["--enable-unsafe-swiftshader"],
        }
      : {}),
    args: hardware
      ? []
      : [
          "--no-sandbox",
          ...(software
            ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
            : []),
        ],
  };
}
