import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";

const cases = [
  {
    id: "roman-189",
    hero: /LUCIUS/,
    room: 8,
    pos: [-2.9, -4.25],
    read: ["8"],
    clue: [],
    prefix: "roman",
    order: [1],
    solution: "Marca de Varro",
    artifact: "Tablilla del intervalo",
    artifactPos: [0, -4.1],
  },
  {
    id: "mosaic-312",
    hero: /AURELIA/,
    room: 12,
    pos: [-3.5, -4.4],
    read: ["11", "12"],
    clue: ["Pigmento de cinabrio"],
    prefix: "mosaic",
    order: [1],
    solution: "Boceto recompuesto",
    artifact: "Molde de Aurelia",
    artifactPos: [0, -4.2],
  },
  {
    id: "coast-537",
    hero: /MAEVE/,
    room: 14,
    pos: [-2.7, -3.8],
    read: ["13", "14"],
    clue: ["Tabla de mareas"],
    prefix: "coast",
    order: [2],
    solution: "Registro corregido",
    artifact: "Lista de pasajeros",
    artifactPos: [0, -4.05],
  },
  {
    id: "stars-783",
    hero: /SAMIRA/,
    room: 16,
    pos: [-2.7, -4.4],
    read: ["15", "16"],
    clue: ["Carta astral"],
    prefix: "stars",
    order: [0, 2, 1],
    solution: "Patrón de Samira",
    artifact: "Disco estelar",
    artifactPos: [0, -4],
  },
  {
    id: "quarry-1092",
    hero: /IDRIS/,
    room: 18,
    pos: [-2.8, -4.4],
    read: ["17", "18"],
    clue: ["Cuña marcada"],
    prefix: "quarry",
    order: [0, 2, 1],
    solution: "Arco ensamblado",
    artifact: "Plano del umbral",
    artifactPos: [0, -4.05],
  },
  {
    id: "hospital-1217",
    hero: /OONA/,
    room: 20,
    pos: [-2.4, -2.2],
    read: ["19", "20"],
    clue: ["Hierbas de serbal"],
    prefix: "hospital",
    order: [1],
    solution: "Remedio identificado",
    artifact: "Cuaderno de Oona",
    artifactPos: [0, -4.1],
  },
  {
    id: "abbey-1348",
    hero: /ISABELLE/,
    room: 10,
    pos: [-2.9, -4.7],
    read: ["9", "10"],
    clue: [],
    prefix: "med",
    order: [1],
    solution: "Sello de Montfort",
    artifact: "Códice de Montfort",
    artifactPos: [0, -4.1],
  },
  {
    id: "press-1491",
    hero: /TOMÁS/,
    room: 22,
    pos: [-2.4, -2.2],
    read: ["21", "22"],
    clue: ["Prueba de impresión"],
    prefix: "late",
    order: [0, 1, 2],
    solution: "Planchas ordenadas",
    artifact: "Plancha auténtica",
    artifactPos: [2.4, -4.1],
    late: true,
  },
  {
    id: "veyr-1610",
    hero: /INÉS/,
    room: 24,
    pos: [-2.4, -2.2],
    read: ["23", "24"],
    clue: ["Inventario de Inés"],
    prefix: "late",
    order: [1, 2, 0],
    solution: "Asiento corregido",
    artifact: "Acta original de Inés",
    artifactPos: [2.4, -4.1],
    late: true,
  },
  {
    id: "theatre-1786",
    hero: /AMARA/,
    room: 26,
    pos: [-2.4, -2.2],
    read: ["25", "26"],
    clue: ["Partitura de poleas"],
    prefix: "late",
    order: [0, 1, 2],
    solution: "Contrapesos alineados",
    artifact: "Partitura del silencio",
    artifactPos: [2.4, -4.1],
    late: true,
  },
  {
    id: "photo-1899",
    hero: /ÉMILE/,
    room: 28,
    pos: [-2.4, -2.2],
    read: ["27", "28"],
    clue: ["Negativo anterior"],
    prefix: "late",
    order: [1, 0, 2],
    solution: "Exposición fijada",
    artifact: "Placa de la puerta",
    artifactPos: [2.4, -4.1],
    late: true,
  },
];

function stateFor(chapter, x, z, overrides = {}) {
  return {
    version: 2,
    room: chapter.room,
    x,
    z,
    floor: 0,
    health: 100,
    sanity: 100,
    items: [...chapter.clue],
    collected: [],
    read: [...chapter.read],
    defeated: [`enemy${chapter.room}`],
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
      witnessed: chapter.late
        ? [`${chapter.id}-evidence-0`, `${chapter.id}-evidence-1`]
        : [],
    },
    ...overrides,
  };
}

export async function runChapterFunctionalCases(
  page,
  url,
  output = "docs/capturas/fase21_1/funcional-dirigido.json",
) {
  const records = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const inspect = () => page.evaluate(() => window.sanityInspect());
  async function seed(state) {
    await page.goto(url);
    await page.evaluate(
      (value) => localStorage.setItem("sanity404-save", JSON.stringify(value)),
      state,
    );
    await page.reload();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.waitForFunction(
      () =>
        window.sanityInspect().draw.frame > 4 && !window.sanityInspect().paused,
    );
    assert.equal((await inspect()).state.room, state.room);
  }
  try {
    for (const chapter of cases.filter(
      (item) =>
        !process.argv.some((arg) => arg.startsWith("--chapter-id=")) ||
        process.argv.includes(`--chapter-id=${item.id}`),
    )) {
      const [px, pz] = chapter.pos;
      await seed(stateFor(chapter, px, pz));
      const enemySpawn = (await inspect()).enemy.position;
      assert.match(await page.locator("#hero-name").innerText(), chapter.hero);
      assert.ok((await page.locator("#objective").innerText()).length > 15);
      await page.keyboard.press("e");
      for (let step = 0; step < chapter.order.length; step++) {
        await page
          .locator(`#${chapter.prefix}-answer${chapter.order[step]}`)
          .click();
        if (chapter.late && step < chapter.order.length - 1)
          await page.keyboard.press("e");
      }
      assert.ok((await inspect()).state.items.includes(chapter.solution));
      const [ax, az] = chapter.artifactPos;
      await seed(
        stateFor(chapter, ax, az, {
          items: [...chapter.clue, chapter.solution],
        }),
      );
      await page.keyboard.press("e");
      await page
        .waitForFunction(
          (artifact) => window.sanityInspect().state.items.includes(artifact),
          chapter.artifact,
          { timeout: 3000 },
        )
        .catch(async () => {
          console.log(
            "ARTIFACT DIAGNOSTIC",
            chapter.id,
            await page.locator("#toast").innerText(),
            await page.locator("#prompt").innerText(),
          );
        });
      assert.ok((await inspect()).state.items.includes(chapter.artifact));
      assert.ok((await inspect()).state.collected.includes(chapter.artifact));
      const record = {
        id: chapter.id,
        roomLoaded: true,
        objectiveShown: true,
        puzzleSolved: true,
        artifactPickedUp: true,
        enemyVisible: false,
        attackRegistered: false,
        enemyDamaged: false,
      };
      await seed(
        stateFor(chapter, enemySpawn[0], enemySpawn[2] - 1.5, {
          items: [],
          read: [],
          defeated: [],
        }),
      );
      const before = await inspect();
      record.enemyVisible = before.enemy.visible;
      assert.equal(record.enemyVisible, true);
      await page.keyboard.press("j");
      await page.waitForTimeout(450);
      const after = await inspect();
      record.attackRegistered = after.combat.stamina < before.combat.stamina;
      record.enemyDamaged =
        after.combat.enemyHealth < before.combat.enemyHealth;
      assert.equal(record.attackRegistered, true);
      records.push(record);
      console.log(
        `PASS objetivo, puzle, artefacto y ataque dirigido: ${chapter.id}; daño=${record.enemyDamaged}`,
      );
    }
    assert.deepEqual(errors, []);
    return records;
  } finally {
    writeFileSync(
      output,
      JSON.stringify({ url, errors, records, preparedStates: true }, null, 2),
    );
  }
}
