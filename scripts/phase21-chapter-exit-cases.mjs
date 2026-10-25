import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";

const chapters = [
  {
    id: "roman-189",
    room: 8,
    read: ["8"],
    items: ["Marca de Varro", "Tablilla del intervalo"],
    defeated: ["enemy8"],
    witnessed: ["roman-formation"],
    artifact: "Tablilla del intervalo",
  },
  {
    id: "mosaic-312",
    room: 11,
    read: ["11"],
    items: ["Pigmento de cinabrio", "Boceto recompuesto", "Molde de Aurelia"],
    defeated: ["enemy12"],
    artifact: "Molde de Aurelia",
  },
  {
    id: "coast-537",
    room: 13,
    read: ["13", "14"],
    items: ["Tabla de mareas", "Registro corregido", "Lista de pasajeros"],
    defeated: ["enemy14"],
    artifact: "Lista de pasajeros",
  },
  {
    id: "stars-783",
    room: 15,
    read: ["15", "16"],
    items: ["Carta astral", "Patrón de Samira", "Disco estelar"],
    defeated: ["enemy16"],
    artifact: "Disco estelar",
  },
  {
    id: "quarry-1092",
    room: 17,
    read: ["17", "18"],
    items: ["Cuña marcada", "Arco ensamblado", "Plano del umbral"],
    defeated: ["enemy18"],
    artifact: "Plano del umbral",
  },
  {
    id: "hospital-1217",
    room: 19,
    read: ["19", "20"],
    items: [
      "Hierbas de serbal",
      "Remedio identificado",
      "Cuaderno de Oona",
      "Testimonio de Ada",
    ],
    defeated: ["enemy20"],
    artifact: "Cuaderno de Oona",
  },
  {
    id: "abbey-1348",
    room: 9,
    read: ["9", "10"],
    items: ["Sello de Montfort", "Códice de Montfort"],
    defeated: ["enemy10"],
    artifact: "Códice de Montfort",
  },
  {
    id: "press-1491",
    room: 21,
    read: ["21", "22"],
    items: ["Prueba de impresión", "Planchas ordenadas", "Plancha auténtica"],
    defeated: ["enemy22"],
    artifact: "Plancha auténtica",
  },
  {
    id: "veyr-1610",
    room: 23,
    read: ["23", "24"],
    items: ["Inventario de Inés", "Asiento corregido", "Acta original de Inés"],
    defeated: ["enemy24"],
    artifact: "Acta original de Inés",
  },
  {
    id: "theatre-1786",
    room: 25,
    read: ["25", "26"],
    items: [
      "Partitura de poleas",
      "Contrapesos alineados",
      "Partitura del silencio",
    ],
    defeated: ["enemy26"],
    artifact: "Partitura del silencio",
  },
  {
    id: "photo-1899",
    room: 27,
    read: ["27", "28"],
    items: ["Negativo anterior", "Exposición fijada", "Placa de la puerta"],
    defeated: ["enemy28"],
    artifact: "Placa de la puerta",
  },
];
const fresh = (chapter) => ({
  version: 2,
  room: chapter.room,
  x: 0,
  z: 5.2,
  floor: 0,
  health: 100,
  sanity: 100,
  items: chapter.items,
  collected: [chapter.artifact],
  read: chapter.read,
  defeated: chapter.defeated,
  seals: [],
  elapsed: 0,
  ended: false,
  phase2: {
    visited: [0, chapter.room],
    solved: [],
    steps: [0, 0, 0, 0],
    discoveries: [],
    shortcuts: [],
    ending: false,
  },
  campaign: {
    visited: ["mansion-1927", chapter.id],
    completed: [],
    witnessed: chapter.witnessed ?? [],
  },
});

export async function runChapterExitCases(
  page,
  url,
  output = "docs/capturas/fase21_1/salidas-dirigidas.json",
) {
  const errors = [];
  const records = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const inspect = () => page.evaluate(() => window.sanityInspect());
  for (const chapter of chapters) {
    await page.goto(url);
    await page.evaluate(
      (state) => localStorage.setItem("sanity404-save", JSON.stringify(state)),
      fresh(chapter),
    );
    await page.reload();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.waitForFunction(
      () =>
        window.sanityInspect().draw.frame > 4 && !window.sanityInspect().paused,
    );
    assert.equal((await inspect()).state.room, chapter.room);
    const before = (await inspect()).state.elapsed;
    await page.keyboard.press("e");
    await page.locator("#close").waitFor({ timeout: 10000 });
    assert.match(await page.locator("#panel").innerText(), /CONCLUIDO/);
    await page.locator("#close").click();
    assert.equal((await inspect()).state.room, 0);
    const stored = JSON.parse(
      await page.evaluate(() => localStorage.getItem("sanity404-save")),
    );
    assert.ok(stored.campaign.completed.includes(chapter.id));
    assert.ok(stored.items.includes(chapter.artifact));
    await page.reload();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    assert.ok((await inspect()).state.campaign.completed.includes(chapter.id));
    records.push({
      id: chapter.id,
      enteredRoom: chapter.room,
      returnedRoom: 0,
      elapsedBeforeExit: before,
      saved: true,
      loaded: true,
    });
    console.log(`PASS salida, inventario y recarga dirigida: ${chapter.id}`);
  }
  assert.deepEqual(errors, []);
  writeFileSync(
    output,
    JSON.stringify({ url, errors, records, preparedStates: true }, null, 2),
  );
  return records;
}
