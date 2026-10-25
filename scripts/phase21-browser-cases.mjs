import assert from "node:assert/strict";

const ids = [
  "roman-189",
  "mosaic-312",
  "coast-537",
  "stars-783",
  "quarry-1092",
  "hospital-1217",
  "abbey-1348",
  "press-1491",
  "veyr-1610",
  "theatre-1786",
  "photo-1899",
];
const artifacts = [
  "Tablilla del intervalo",
  "Molde de Aurelia",
  "Lista de pasajeros",
  "Disco estelar",
  "Plano del umbral",
  "Cuaderno de Oona",
  "Códice de Montfort",
  "Plancha auténtica",
  "Acta original de Inés",
  "Partitura del silencio",
  "Placa de la puerta",
];
const base = () => ({
  version: 2,
  room: 0,
  x: 0,
  z: 5,
  floor: 0,
  health: 100,
  sanity: 100,
  items: [],
  collected: [],
  read: [],
  defeated: [],
  seals: [],
  elapsed: 0,
  ended: false,
  phase2: {
    visited: [0],
    solved: [],
    steps: [0, 0, 0, 0],
    discoveries: [],
    shortcuts: [],
    ending: false,
  },
  campaign: { visited: ["mansion-1927"], completed: [], witnessed: [] },
});

export async function runPhase21BrowserCases(page, url) {
  const inspect = () => page.evaluate(() => window.sanityInspect());
  async function seed(patch) {
    await page.goto(url);
    await page.evaluate(
      (state) => localStorage.setItem("sanity404-save", JSON.stringify(state)),
      {
        ...base(),
        ...patch,
      },
    );
    await page.reload();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.waitForFunction(
      () =>
        document.getElementById("overlay").hidden &&
        !window.sanityInspect().paused &&
        window.sanityInspect().draw.frame > 4,
    );
    assert.equal((await inspect()).state.room, patch.room ?? 0);
  }
  async function interact() {
    await page.bringToFront();
    for (let attempt = 0; attempt < 2; attempt++) {
      if (
        await page
          .getByRole("button", { name: "Volver", exact: true })
          .isVisible()
          .catch(() => false)
      )
        await page.getByRole("button", { name: "Volver", exact: true }).click();
      await page.keyboard.press("e");
      if (
        !(await page
          .getByRole("button", { name: "Volver", exact: true })
          .isVisible()
          .catch(() => false))
      )
        return;
    }
  }

  const abbey = base();
  abbey.campaign.completed = ["abbey-1348"];
  abbey.campaign.visited.push("abbey-1348");
  await seed(abbey);
  let audit = await page.evaluate(() => window.sanityRoomAudit());
  assert.ok(
    !audit.interactables.some((object) => object.id === "press-1491-portal"),
  );
  abbey.campaign.visited.push("press-1491");
  await seed(abbey);
  audit = await page.evaluate(() => window.sanityRoomAudit());
  assert.ok(
    audit.interactables.some((object) => object.id === "press-1491-portal"),
  );
  console.log("PASS F21 portal posterior bloqueado y acceso previo conservado");

  await seed({ x: 6.2, z: 3 });
  await interact();
  await page.getByRole("heading", { name: "Lucius Varro" }).waitFor();
  assert.equal((await inspect()).state.room, 8);
  console.log("PASS F21 introducción al primer acceso romano");

  const ruins = {
    room: 4,
    x: 0,
    z: -1.4,
    seals: [0, 1, 2],
    defeated: ["enemy4"],
    phase2: { ...base().phase2, visited: [0, 4] },
  };
  await seed(ruins);
  await interact();
  assert.equal(await page.locator("#full-ending").count(), 0);
  await page.getByRole("button", { name: "Volver a investigar" }).click();
  assert.equal((await inspect()).state.ended, false);
  await interact();
  await page
    .getByRole("button", { name: /Cerrar ahora · final anticipado/ })
    .click();
  assert.equal((await inspect()).state.ended, true);
  console.log("PASS F21 final anticipado explícito y regreso sin bloqueo");

  const full = base();
  full.room = 4;
  full.z = -1.4;
  full.seals = [0, 1, 2];
  full.defeated = ["enemy4"];
  full.phase2.visited = [0, 4];
  full.phase2.discoveries = ["adrien"];
  full.items = [
    ...artifacts,
    "Memoria reconciliada",
    "Promesa de Isabelle",
    "Testimonio de Bran",
  ];
  full.campaign = {
    visited: ["mansion-1927", ...ids],
    completed: [...ids],
    witnessed: [],
  };
  full.items = full.items.filter((item) => item !== "Placa de la puerta");
  await seed(full);
  await interact();
  assert.equal(await page.locator("#full-ending").count(), 0);
  assert.match(await page.locator("#panel").innerText(), /pruebas materiales/);
  console.log("PASS F21 una prueba ausente bloquea el final histórico");

  full.items.push("Placa de la puerta");
  await seed(full);
  await interact();
  await page.getByRole("button", { name: "Cerrar con las pruebas" }).click();
  assert.match(await page.locator("#panel").innerText(), /FINAL HISTÓRICO/);
  assert.match(await page.locator("#panel").innerText(), /Tomás/);
  assert.match(await page.locator("#panel").innerText(), /Bran/);
  console.log("PASS F21 final histórico dirigido con once pruebas");
}
