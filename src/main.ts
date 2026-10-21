import * as T from "three";
import "./ui/style.css";
import { applyQuality, qualityProfile } from "./render/quality";
import { textureBudget, simplifyLowMaterials } from "./render/materials";
import { FrameMetrics } from "./render/metrics";
import { GpuTimer } from "./render/gpu-timer";
import { CinematicCamera } from "./engine/camera";
import { animateCharacter, animateDeath } from "./world/character";
import { luciusVarro } from "./world/lucius";
import { isabelleDeMontfort } from "./world/isabelle";
import { createEnemy, enemyKindForRoom } from "./world/enemies";
import { Input } from "./engine/input";
import {
  World,
  character,
  enemySpawn,
  names,
  subtitles,
  type Interactable,
} from "./world/scene";
import { fresh, clamp, move, type State } from "./systems/state";
import {
  advancePuzzle,
  phase2DoorLocked,
  puzzles,
  type PuzzleId,
} from "./systems/phase2";
import { Audio } from "./systems/audio";
import { TerrorDirector } from "./systems/terror";
import { notes, discoveries } from "./world/narrative";
import { readSave, writeSave } from "./systems/save";
import { legacy, reconcileLegacy, legacyEnding } from "./systems/legacy";
import {
  chosenMemory,
  chooseMemory,
  memoryConsequence,
} from "./systems/memory-choice";
import { Combat } from "./systems/combat";
import { Sanity } from "./systems/sanity";
import { drinkTonic } from "./systems/inventory";
import { readSettings } from "./systems/config";
import { trapFocus } from "./ui/accessibility";
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `<div id="viewport"></div><div id="veil"></div><div id="hit-feedback" aria-hidden="true"></div><div id="hud"><header><div class="brand">SANITY—404</div><div class="chapter"><div class="eyebrow" id="sub"></div><div class="location" id="location"></div></div></header><div class="bottom"><div class="vitals"><div class="eyebrow" id="hero-name">ÉLISE MOREAU · RESTAURADORA</div><div class="stat"><span>SALUD</span><span id="hptext">100</span></div><div class="bar"><div id="health" class="fill"></div></div><div class="stat"><span>CORDURA</span><span id="sptext">100</span></div><div class="bar"><div id="sanity" class="fill"></div></div><div class="stat"><span>RESISTENCIA</span><span id="sttext">100</span></div><div class="bar"><div id="stamina" class="fill"></div></div></div><div class="help">WASD / ↑↓←→ · MOVERSE<br>E · INTERACTUAR &nbsp; ESPACIO · ATACAR<br>J / CLIC DERECHO / RB · GOLPE FUERTE<br>V / R3 · ESQUIVAR &nbsp; F / LB · DEFENDER<br>TAB · INVENTARIO &nbsp; M · MAPA &nbsp; ESC · PAUSA</div></div></div><div id="prompt"></div><div id="toast" role="status" aria-live="polite"></div><div id="overlay" role="dialog" aria-modal="true" aria-label="Menú del juego"><div class="panel" id="panel"></div></div>`;
const el = (id: string) => document.getElementById(id)!;
trapFocus(el("overlay"));
let renderer: T.WebGLRenderer;
try {
  renderer = new T.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
} catch {
  el("panel").innerHTML =
    "<h2>WebGL no está disponible</h2><p>Activa la aceleración gráfica del navegador para explorar SANITY-404.</p>";
  throw new Error("WebGL unavailable");
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.3));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
el("viewport").append(renderer.domElement);
const camera = new T.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 70),
  input = new Input(renderer.domElement),
  audio = new Audio(),
  cinematic = new CinematicCamera(),
  metrics = new FrameMetrics(),
  gpuTimer = import.meta.env.DEV ? new GpuTimer(renderer.domElement) : null;
let state: State = fresh(),
  world: World,
  player: T.Group,
  enemy: T.Group,
  corpse: T.Group,
  contact: T.Mesh[],
  threat: T.Mesh,
  corpseTime = 0,
  deathTime = 0,
  combat: Combat,
  terror: TerrorDirector,
  sanity: Sanity,
  paused = true,
  started = false,
  yaw = 0,
  toastTime = 0,
  near: Interactable | undefined,
  settings = readSettings();
audio.setVolume(settings.volume);
audio.setReduceAudio(settings.reduceAudio);
applyQuality(renderer, settings.quality);

function toast(text: string) {
  el("toast").textContent = text;
  toastTime = 5;
}
function panel(html: string) {
  paused = true;
  audio.pause();
  input.clear();
  el("overlay").hidden = false;
  el("panel").innerHTML = html;
  el("panel").querySelector<HTMLButtonElement>("button")?.focus();
}
function button(id: string, fn: () => void) {
  el(id).onclick = fn;
}
renderer.domElement.tabIndex = 0;
function resume() {
  paused = false;
  el("overlay").hidden = true;
  input.clear();
  audio.resume();
  renderer.domElement.focus();
}
function loadRoom() {
  if (!state.phase2.visited.includes(state.room))
    state.phase2.visited.push(state.room);
  terror?.restore();
  world?.dispose();
  world = new World(
    state.room,
    state.items,
    state.seals,
    state.read,
    state.collected,
    settings.quality,
    state.phase2,
  );
  player =
    state.room === 8
      ? luciusVarro()
      : state.room >= 9
        ? isabelleDeMontfort()
        : character();
  player.position.set(state.x, 0, state.z);
  world.scene.add(player);
  enemy = createEnemy(enemyKindForRoom(state.room));
  const [enemyX, enemyZ] = enemySpawn(world.obstacles);
  enemy.position.set(enemyX, 0, enemyZ);
  enemy.visible = !state.defeated.includes("enemy" + state.room);
  world.scene.add(enemy);
  contact = [player, enemy].map((actor) => {
    const shadow = new T.Mesh(
      new T.PlaneGeometry(0.95, 0.7),
      new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        vertexShader:
          "varying vec2 v; void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader:
          "varying vec2 v; void main(){float a=1.-smoothstep(.05,.5,length(v-.5));gl_FragColor=vec4(.02,.025,.03,a*.32);}",
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.copy(actor.position).setY(0.025);
    shadow.visible = actor.visible;
    world.scene.add(shadow);
    return shadow;
  });
  threat = new T.Mesh(
    new T.RingGeometry(1.35, 1.39, 48),
    new T.MeshBasicMaterial({
      color: 0xcea36b,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      side: T.DoubleSide,
    }),
  );
  threat.rotation.x = -Math.PI / 2;
  threat.visible = false;
  world.scene.add(threat);
  corpse = createEnemy(enemyKindForRoom(state.room));
  corpse.visible = false;
  world.scene.add(corpse);
  corpseTime = deathTime = 0;
  combat = new Combat(state.room);
  terror = new TerrorDirector(world);
  sanity = new Sanity(world, state.elapsed);
  if (settings.quality === 1) simplifyLowMaterials(world.scene);
  audio.setRoom(state.room);
  el("location").textContent = names[state.room];
  el("hero-name").textContent =
    state.room >= 9
      ? "ISABELLE DE MONTFORT · COPISTA"
      : state.room === 8
        ? "LUCIUS VARRO · CARTÓGRAFO ROMANO"
        : "ÉLISE MOREAU · RESTAURADORA";
  el("sub").textContent = subtitles[state.room];
  cinematic.update(
    camera,
    state.x,
    state.z,
    state.room,
    0,
    settings.reduced,
    world.obstacles,
    { mode: settings.cameraMode },
  );
}
function begin(s: State) {
  state = s;
  started = true;
  yaw = 0;
  loadRoom();
  void audio
    .start()
    .catch(() => toast("Audio no disponible; puedes continuar sin sonido."));
  resume();
  toast("Encuentra a Adrien. Empieza por la carta y la llave del vestíbulo.");
}

function menu() {
  panel(
    `<div class="ornament">ARCHIVO DE LAS AUSENCIAS · 1927</div><h1>SANITY—404</h1><div class="subtitle">LO QUE OLVIDAS TAMBIÉN TE RECUERDA</div><div class="rule"></div><p>Una carta de tu hermano desaparecido. Una casa que no existe.<br>Once lugares donde la memoria empieza a pudrirse.</p><div class="actions"><button id="new">Nueva partida</button><button id="load" ${readSave() ? "" : "disabled"}>Continuar</button>${started ? '<button id="resume">Volver</button>' : ""}<button id="settings">Opciones</button></div><p class="small">Campaña de horror cósmico · auriculares recomendados<br>Teclado y ratón / mando estándar · recursos originales y audio sintetizado</p>`,
  );
  button("new", () => {
    if (started) {
      panel(
        '<h2>¿Comenzar de nuevo?</h2><p>Se perderá el progreso sin guardar. Tu partida guardada se conserva.</p><div class="actions"><button id="yes">Nueva partida</button><button id="no">Volver</button></div>',
      );
      button("yes", () => begin(fresh()));
      button("no", menu);
    } else begin(fresh());
  });
  button("load", () => {
    const s = readSave();
    if (s) begin(s);
    else toast("No hay una partida válida.");
  });
  button("settings", options);
  if (started) button("resume", resume);
}
function options() {
  panel(
    `<div class="eyebrow">AJUSTES DE LA EXPERIENCIA</div><h2>Un horror a tu medida</h2><label><input type="checkbox" id="reduced" ${settings.reduced ? "checked" : ""}> Reducir efectos psicológicos y movimiento de cámara</label><label><input type="checkbox" id="reduce-flashes" ${settings.reduceFlashes ? "checked" : ""}> Reducir variaciones de luz</label><label><input type="checkbox" id="reduce-distortion" ${settings.reduceDistortion ? "checked" : ""}> Reducir distorsiones visuales</label><label><input type="checkbox" id="reduce-audio" ${settings.reduceAudio ? "checked" : ""}> Reducir sonidos intensos y susurros</label><p class="small">Los eventos nunca bloquean el progreso ni imitan avisos del sistema. No se utilizan destellos rápidos.</p><label>Volumen <input id="volume" type="range" min="0" max="1" step=".05" value="${settings.volume}"></label><label>Calidad gráfica <select id="quality"><option value="1">Baja</option><option value="1.3">Media</option><option value="1.6">Alta</option></select></label><label>Cámara <select id="camera-mode"><option value="classic">Clásica · encuadres por zona</option><option value="modern">Moderna · seguimiento cercano</option></select></label><p class="small">Movimiento con ejes estables. Mando: stick izquierdo mover · LB defender · RB fuerte · R3 esquivar · A interactuar · B atacar · X tónico · Y inventario · Select mapa · Start pausa.<br>Teclado: J fuerte · V esquivar · Shift correr. Ratón: izquierdo atacar · derecho fuerte.</p><div class="actions"><button id="back">Aplicar y volver</button></div>`,
  );
  (el("camera-mode") as HTMLSelectElement).value = settings.cameraMode;
  (el("quality") as HTMLSelectElement).value = String(settings.quality);
  button("back", () => {
    settings.cameraMode =
      (el("camera-mode") as HTMLSelectElement).value === "modern"
        ? "modern"
        : "classic";
    settings.reduced = (el("reduced") as HTMLInputElement).checked;
    settings.reduceFlashes = (el("reduce-flashes") as HTMLInputElement).checked;
    settings.reduceDistortion = (
      el("reduce-distortion") as HTMLInputElement
    ).checked;
    settings.reduceAudio = (el("reduce-audio") as HTMLInputElement).checked;
    settings.volume = Number((el("volume") as HTMLInputElement).value);
    const quality = Number((el("quality") as HTMLSelectElement).value);
    const qualityChanged = quality !== settings.quality;
    settings.quality = quality;
    audio.setVolume(settings.volume);
    audio.setReduceAudio(settings.reduceAudio);
    if (qualityChanged) {
      const previousCombat = combat;
      const enemyPosition = enemy.position.clone();
      const enemyRotation = enemy.rotation.clone();
      applyQuality(renderer, quality);
      loadRoom();
      combat = previousCombat;
      enemy.position.copy(enemyPosition);
      enemy.rotation.copy(enemyRotation);
    }
    try {
      localStorage.setItem("sanity404-settings", JSON.stringify(settings));
    } catch {
      toast("No se han podido conservar los ajustes.");
    }
    menu();
  });
}
function inventory() {
  panel(
    `<div class="eyebrow">PERTENENCIAS Y RECUERDOS</div><h2>Inventario</h2><p>Arma: ${state.room === 8 ? "gladius romano" : state.room >= 9 ? "bastón de escriba" : "bastón de fresno"} · golpes sin munición</p><p>${legacy(state).clue}</p><p>Memoria de las tres épocas: ${state.items.includes("Memoria reconciliada") ? "reconciliada · pasaje Veyr abierto" : "pendiente"}</p><p>Decisión histórica: ${chosenMemory(state) ?? "pendiente"}</p><p>${state.items.filter((i) => !i.startsWith("Tónico")).join(" · ") || "Todavía no has recogido objetos."}</p><p>Tónicos: ${state.items.filter((i) => i.startsWith("Tónico")).length} · Sellos: ${state.seals.length}/3 · Mecanismos: ${state.phase2.solved.length}/4</p><div class="actions"><button id="heal">Beber tónico</button><button id="close">Volver</button></div><h2>Documentos</h2>${state.read.map((i) => `<p><strong>${notes[Number(i)][0]}</strong><br>${notes[Number(i)][1]}</p>`).join("")}${state.phase2.discoveries.map((id) => `<p><strong>${discoveries[id][0]}</strong><br>${discoveries[id][1]}</p>`).join("")}`,
  );
  button("close", resume);
  button("heal", () => {
    heal();
    inventory();
  });
}
function heal() {
  const result = drinkTonic(state);
  if (result === "empty") toast("No tienes tónicos.");
  else if (result === "full") toast("No necesitas un tónico ahora.");
  else {
    audio.tone(440, 0.5);
    toast("El pulso se estabiliza. +40 salud · +25 cordura");
  }
}
function phase2Puzzle(id: PuzzleId) {
  const puzzle = puzzles[id];
  if (state.phase2.solved.includes(id)) {
    toast("El mecanismo permanece abierto.");
    return;
  }
  const step =
    state.phase2.steps[
      ["manuscripts", "genealogy", "astronomy", "basement"].indexOf(id)
    ];
  panel(
    `<div class="eyebrow">MECANISMO DE LA MANSIÓN · ${step + 1}/3</div><h2>${puzzle.title}</h2><p>${state.read.includes(String(state.room)) ? puzzle.clue : "Las pistas están en el documento de esta sala."}</p><p>Selecciona el elemento ${step + 1} de la secuencia.</p><p id="puzzle-feedback" role="status" aria-live="polite"></p><div class="actions">${puzzle.choices.map((choice, i) => `<button id="phase2-answer${i}">${choice}</button>`).join("")}<button id="close">Volver</button></div>`,
  );
  for (let i = 0; i < 3; i++)
    button("phase2-answer" + i, () => {
      const result = advancePuzzle(state.phase2, id, i);
      if (result === "wrong") {
        state.sanity = clamp(state.sanity - 3);
        el("puzzle-feedback").textContent =
          "La secuencia no encaja. Puedes intentarlo de nuevo; el progreso correcto se conserva.";
        audio.tone(72, 0.28, "triangle");
      } else if (result === "solved") {
        resume();
        audio.tone(580, 0.6, "triangle");
        toast("Mecanismo abierto: " + puzzle.title + ". La casa ha cambiado.");
      } else phase2Puzzle(id);
    });
  button("close", resume);
}
function interact(o: Interactable) {
  audio.tone(260);
  if (o.kind === "memoryChoice") {
    const chosen = memoryConsequence(state);
    if (chosen) {
      panel(
        `<div class="eyebrow">ARCHIVO VEYR · UN LEGADO</div><h2>${chosen.heading}</h2><p>${chosen.description}</p><button id="close">Continuar</button>`,
      );
      button("close", resume);
      return;
    }
    panel(
      `<div class="eyebrow">ARCHIVO VEYR · 1927</div><h2>¿Qué recuerdo salvarás?</h2><p>Solo uno de los dos testimonios puede fijarse en el umbral. Tu elección permanecerá grabada en esta partida y cambiará el desenlace.</p><div class="actions"><button id="choose-lucius">El juramento de Lucius · +30 salud</button><button id="choose-isabelle">La promesa de Isabelle · +30 cordura</button><button id="close">Volver</button></div>`,
    );
    button("choose-lucius", () => {
      const result = chooseMemory(state, "Juramento de Lucius");
      if (result === "chosen") {
        loadRoom();
        panel(
          `<h2>El juramento de Lucius</h2><p>El cartógrafo entrega su última defensa. La memoria de las tres épocas adopta el brillo del bronce.</p><button id="close">Continuar</button>`,
        );
        button("close", resume);
      } else resume();
    });
    button("choose-isabelle", () => {
      const result = chooseMemory(state, "Promesa de Isabelle");
      if (result === "chosen") {
        loadRoom();
        panel(
          `<h2>La promesa de Isabelle</h2><p>La copista inscribe el nombre que ningún siglo borrará. El umbral adquiere el color de la tinta.</p><button id="close">Continuar</button>`,
        );
        button("close", resume);
      } else resume();
    });
    button("close", resume);
    return;
  }
  if (o.kind === "legacy") {
    const result = reconcileLegacy(state);
    if (result === "missing") {
      panel(
        `<div class="eyebrow">MANSIÓN VEYR · 1927</div><h2>La mesa de las tres edades</h2><p>${legacy(state).clue}</p><p>Regresa con los dos testimonios para reconstruir la ruta del Intervalo. Puedes continuar la historia original sin resolver este misterio.</p><button id="close">Volver</button>`,
      );
      button("close", resume);
    } else if (result === "already") {
      toast(
        "La memoria ya está reconciliada. Busca el pasaje junto al muro norte.",
      );
    } else {
      // Rebuild the entrance and reciprocal passage immediately.
      loadRoom();
      panel(
        `<div class="eyebrow">LAS TRES ÉPOCAS · MEMORIA RECONCILIADA</div><h2>La grieta ha encontrado su origen</h2><p>Lucius escondió la tablilla en 189; Isabelle preservó su lectura en 1348. Élise reúne ambas pruebas en 1927 y descubre que la Sociedad Veyr borró deliberadamente el nombre de su guardián.</p><p>Recuperas 20 de cordura. Un pasaje hacia el archivo familiar se ha abierto en el vestíbulo, y el círculo de las ruinas ha cambiado.</p><button id="close">Continuar</button>`,
      );
      button("close", resume);
      audio.tone(630, 0.6);
    }
    return;
  }
  if (o.kind === "medievalPuzzle") {
    if (state.items.includes("Sello de Montfort")) {
      toast("El códice ya conserva la respuesta de Isabelle.");
      return;
    }
    panel(
      `<div class="eyebrow">FRANCIA · 1348</div><h2>El nombre anterior</h2><p>El registro menciona tres huellas: lo que arde, lo que vuelve y aquello que cruza. ¿Qué signo antecede a los otros dos?</p><div class="actions"><button id="med-answer0">Marea</button><button id="med-answer1">Ceniza</button><button id="med-answer2">Umbral</button><button id="close">Volver</button></div>`,
    );
    for (let i = 0; i < 3; i++)
      button("med-answer" + i, () => {
        if (i === 1) {
          state.items.push("Sello de Montfort");
          resume();
          toast(
            "Isabelle descifra el primer signo. El códice puede recuperarse.",
          );
          audio.tone(590, 0.5);
        } else {
          state.sanity = clamp(state.sanity - 4);
          resume();
          toast(
            "Una voz repite la respuesta equivocada. Pierdes 4 de cordura.",
          );
        }
      });
    button("close", resume);
    return;
  }
  if (o.kind === "romanPuzzle") {
    if (state.items.includes("Marca de Varro")) {
      toast("La inscripción ya ha revelado su nombre.");
      return;
    }
    panel(
      `<div class="eyebrow">ROMA · AÑO 189</div><h2>Las tres edades del intervalo</h2><p>El testamento de Lucius ordena recordar primero lo que se consume, luego lo que retorna, y por último lo que se atraviesa. ¿Cuál es el orden?</p><div class="actions"><button id="roman-answer0">Umbral · Ceniza · Marea</button><button id="roman-answer1">Ceniza · Marea · Umbral</button><button id="roman-answer2">Marea · Umbral · Ceniza</button><button id="close">Volver</button></div>`,
    );
    for (let i = 0; i < 3; i++)
      button("roman-answer" + i, () => {
        if (i === 1) {
          state.items.push("Marca de Varro");
          resume();
          toast("La inscripción cede. La marca de Varro ha quedado grabada.");
          audio.tone(580, 0.6);
        } else {
          state.sanity = clamp(state.sanity - 4);
          resume();
          toast("Las palabras vuelven a desordenarse. Pierdes 4 de cordura.");
        }
      });
    button("close", resume);
    return;
  }
  if (o.kind === "item") {
    if (
      o.id === "medieval-codex" &&
      !state.items.includes("Sello de Montfort")
    ) {
      toast("El códice está protegido por la inscripción. Descífrala primero.");
      return;
    }
    if (o.id === "medieval-codex" && !state.defeated.includes("enemy10")) {
      toast("La sombra del copista protege el códice. Debes vencerla.");
      return;
    }
    if (o.id === "roman-tablet" && !state.items.includes("Marca de Varro")) {
      toast(
        "La tablilla está sellada. Descifra la inscripción junto al altar.",
      );
      return;
    }
    if (o.id === "roman-tablet" && !state.defeated.includes("enemy8")) {
      toast("El centurión sin rostro protege la tablilla. Debes derrotarlo.");
      return;
    }
    state.items.push(o.value!);
    state.collected.push(o.value!);
    world.remove(o);
    toast("Recogido: " + o.value);
    if (o.id === "medieval-codex") {
      panel(
        `<div class="eyebrow">FRANCIA · 1348 · EPÍLOGO</div><h2>El último nombre</h2><p>Isabelle recupera el códice. En sus páginas ve el sello de Lucius Varro y el plano de una mansión que todavía no existe. Escribe un último mensaje para quien lo encuentre en 1927: «No luches contra lo que recuerda. Descubre quién le enseñó a olvidar».</p><p>El camino de regreso atraviesa el claustro.</p><button id="close">Continuar</button>`,
      );
      button("close", resume);
    }
    if (o.id === "roman-tablet") {
      panel(
        `<div class="eyebrow">ROMA · 189 D. C. · EPÍLOGO</div><h2>El cartógrafo del vacío</h2><p>Lucius arranca del altar la última inscripción. El centurión permanece inmóvil. Bajo la piedra descubre el mapa de una casa que aún tardará siglos en construirse. Su nombre no figura en él: el de Élise Moreau sí.</p><p>La tablilla queda ligada a su recuerdo. El arco al sur conduce de regreso a 1927.</p><button id="close">Continuar</button>`,
      );
      button("close", resume);
    }
  }
  if (o.kind === "note") {
    if (!state.read.includes(String(state.room))) {
      state.read.push(String(state.room));
      state.sanity = clamp(state.sanity - 4);
    }
    panel(
      `<div class="eyebrow">DOCUMENTO ${state.room + 1} / ${notes.length}</div><h2>${notes[state.room][0]}</h2><p>${notes[state.room][1]}</p><button id="close">Guardar en el diario</button>`,
    );
    button("close", resume);
  }
  if (o.kind === "save") {
    toast(
      writeSave(state)
        ? "Memoria conservada. Partida guardada."
        : "El navegador no permite guardar. Libera almacenamiento o sal del modo privado.",
    );
  }
  if (o.kind === "phase2Puzzle") phase2Puzzle(o.id as PuzzleId);
  if (o.kind === "discovery") {
    if (!state.phase2.discoveries.includes(o.id))
      state.phase2.discoveries.push(o.id);
    world.remove(o);
    panel(
      `<div class="eyebrow">DESCUBRIMIENTO OPCIONAL</div><h2>${discoveries[o.id][0]}</h2><p>${discoveries[o.id][1]}</p><button id="close">Conservar en el diario</button>`,
    );
    button("close", resume);
  }
  if (o.kind === "door") {
    const phase2Lock = phase2DoorLocked(o.id, state.phase2);
    if (phase2Lock) {
      toast(phase2Lock);
      return;
    }
    if (
      o.target === 1 &&
      state.room === 0 &&
      !state.items.includes("Llave de latón")
    ) {
      toast("Cerrada. Necesitas la llave de latón del vestíbulo.");
      return;
    }
    if (
      o.target === 1 &&
      state.room === 0 &&
      !state.items.includes("Medallón Veyr")
    ) {
      toast(
        "La puerta exige el medallón de la caja astronómica. Lee la carta del vestíbulo.",
      );
      return;
    }
    if (o.target === 4 && state.seals.length < 3) {
      toast("El umbral exige los tres sellos. Consulta tu diario.");
      return;
    }
    state.room = o.target!;
    if (o.id === "legacy-passage" || o.id === "legacy-back") {
      state.x = o.id === "legacy-passage" ? -2.8 : 2.7;
      state.z = -4.3;
    } else if (
      [
        "medieval-portal",
        "medieval-return",
        "medieval-scriptorium",
        "medieval-back",
      ].includes(o.id)
    ) {
      state.x = 0;
      state.z =
        o.id === "medieval-portal" ||
        o.id === "medieval-scriptorium" ||
        o.id === "medieval-back"
          ? 5.2
          : -4.2;
    } else if (o.id === "roman-portal" || o.id === "roman-return") {
      state.x = 0;
      state.z = o.id === "roman-portal" ? 5.2 : -4.2;
    } else if (o.id === "back" || o.id === "next") {
      state.x = 0;
      state.z = o.id === "back" ? -5.8 : 5.8;
    } else {
      const side = o.x > 0 ? -1 : 1;
      state.x = side * ([6, 7].includes(state.room) ? 4.2 : 6.2);
      state.z = o.id.includes("shortcut") ? -4.4 : 0;
    }
    state.sanity = clamp(state.sanity - 3);
    audio.cue("door");
    loadRoom();
    toast(names[state.room]);
    if (o.id === "roman-portal")
      toast("189 d. C. · Un recuerdo anterior a la casa. Busca el altar.");
    if (o.id === "medieval-portal")
      toast("1348 · Isabelle recuerda el claustro. Busca el scriptorium.");
  }
  if (o.kind === "phase2End") {
    if (!state.phase2.solved.includes("basement")) {
      toast("Las tres mordazas del sótano siguen abiertas.");
      return;
    }
    if (enemy.visible) {
      toast(
        "El guardián retiene el umbral. Espera su abertura tras un ataque largo.",
      );
      return;
    }
    state.phase2.ending = true;
    state.ended = true;
    const remembered = state.phase2.discoveries.includes("adrien");
    const temporalEnding = legacyEnding(state);
    const chosenEnding = temporalEnding && memoryConsequence(state);
    panel(
      `<div class="eyebrow">FIN · LA MANSIÓN DE LOS ECOS</div><h2>${temporalEnding ? temporalEnding.title : remembered ? "Una puerta puede elegir a quién deja salir." : "El nombre que faltaba."}</h2><p>${temporalEnding ? temporalEnding.text + (chosenEnding ? " " + chosenEnding.description : "") : remembered ? "Élise pronuncia el verdadero nombre del guardián. Étienne deja caer los brazos y Adrien cruza el umbral por su propia voluntad. La casa pierde una voz, pero los hermanos conservan la historia que escribieron juntos." : "El guardián se disuelve cuando cesa el mecanismo. Adrien sale con Élise; en el tren, ninguno puede recordar cómo se abrió la puerta. El cuaderno mojado habría conservado esa respuesta."}</p><p>Investigación: ${state.phase2.discoveries.length}/3 · Documentos: ${state.read.length}/${notes.length} · Cordura: ${Math.round(state.sanity)}</p><button id="finish">Volver al título</button>`,
    );
    button("finish", () => {
      started = false;
      menu();
    });
  }
  if (o.kind === "seal") {
    if (
      o.id === "mansion-puzzle"
        ? state.items.includes("Medallón Veyr")
        : state.seals.includes(o.target!)
    ) {
      toast("Este sello ya descansa en tu inventario.");
      return;
    }
    panel(
      `<div class="eyebrow">EL MECANISMO ${o.target! + 1}</div><h2>Una palabra, una ausencia</h2><p>Tres inscripciones rodean la cerradura. Los documentos explican el orden. ¿Qué palabra corresponde a este sello?</p><div class="actions">${["Ceniza", "Marea", "Umbral"].map((s, i) => `<button id="answer${i}">${s}</button>`).join("")}<button id="close">Volver</button></div>`,
    );
    for (let i = 0; i < 3; i++)
      button("answer" + i, () => {
        resume();
        if (i === o.target) {
          if (o.id === "mansion-puzzle") state.items.push("Medallón Veyr");
          else state.seals.push(i);
          toast(
            o.id === "mansion-puzzle"
              ? "Medallón Veyr recuperado. Ya puedes abrir la biblioteca."
              : "Sello recuperado. " + state.seals.length + "/3",
          );
          audio.tone(620, 0.7);
        } else {
          state.sanity = clamp(state.sanity - 12);
          toast("La casa pronuncia tu nombre. Has perdido cordura.");
          audio.tone(65, 0.7, "sawtooth");
        }
      });
    button("close", resume);
  }
  if (o.kind === "end") {
    if (state.seals.length < 3) return;
    state.ended = true;
    const temporalEnding = legacyEnding(state);
    const chosenEnding = temporalEnding && memoryConsequence(state);
    panel(
      `<div class="eyebrow">FIN · ${temporalEnding ? temporalEnding.title : state.sanity >= 40 ? "LA MEMORIA DEL AMANECER" : "LA ÚLTIMA AUSENCIA"}</div><h2>${temporalEnding ? "Lo que tres épocas protegieron." : state.sanity >= 40 ? "Recordar también es dejar ir." : "La casa aprendió tu nombre."}</h2><p>${temporalEnding ? temporalEnding.text + (chosenEnding ? " " + chosenEnding.description : "") : state.sanity >= 40 ? "Élise quiebra los sellos. Por primera vez, la voz de Adrien parece lejana. Al amanecer, en el tren, una fotografía vuelve a tener dos rostros. Uno de ellos sonríe." : "El intervalo se cierra. En la estación encuentran una maleta y una fotografía sin rostros. En los Alpes, una casa añade una ventana. Detrás, alguien espera una carta."}</p><p>Tiempo: ${Math.floor(state.elapsed / 60)} min · Cordura: ${Math.round(state.sanity)} · Documentos: ${state.read.length}/5</p><button id="finish">Volver al título</button>`,
    );
    button("finish", () => {
      started = false;
      menu();
    });
  }
}
function update(dt: number) {
  const c = input.poll();
  if (input.take("Escape")) {
    menu();
    return;
  }
  if (input.take("Tab")) {
    inventory();
    return;
  }
  if (input.take("KeyM")) {
    panel(
      `<div class="eyebrow">PLANO DEL INTERVALO</div><h2>La mansión y sus ecos</h2><div id="map">${names.map((n, i) => `<div class="maproom ${i === state.room ? "current" : ""}">${i + 1} · ${state.phase2.visited.includes(i) ? n : "Zona no explorada"} ${i === state.room ? "← ESTÁS AQUÍ" : ""} ${i === 4 && state.seals.length < 3 ? "· requiere 3 sellos" : ""}</div>`).join("")}</div><p class="small">Ruta original: vestíbulo → biblioteca → cripta → capilla → ruinas. Rama lateral: biblioteca → archivo → invernadero → capilla → sótanos. Las puertas laterales están junto a los muros este y oeste. Mecanismos: ${state.phase2.solved.length}/4.</p><button id="close">Volver</button>`,
    );
    button("close", resume);
    return;
  }
  if (input.take("KeyH")) heal();
  if (state.health <= 0) {
    deathTime += dt;
    animateDeath(player, deathTime / 0.85);
    world.shadowBudget.mark(true);
    if (deathTime >= 0.85) {
      panel(
        '<div class="eyebrow">LA CASA CONSERVA OTRO RECUERDO</div><h2>Tu voz se ha apagado.</h2><p>Puedes recuperar la última memoria guardada o volver a empezar.</p><div class="actions"><button id="retry">Reintentar</button><button id="title">Título</button></div>',
      );
      button("retry", () => begin(readSave() ?? fresh()));
      button("title", menu);
    }
    return;
  }
  // Stable world axes prevent reversed input when the cinematic framing changes.
  yaw = 0;
  let x = c.x,
    z = c.z;
  let len = Math.hypot(x, z);
  if (input.take("KeyV") && combat.startDodge() && len < 0.1) {
    x = Math.sin(player.rotation.y);
    z = Math.cos(player.rotation.y);
    len = 1;
  }
  if (len > 1) {
    x /= len;
    z /= len;
  }
  const speed = combat.dodge > 0 ? 6.8 : c.guard ? 1.2 : c.run ? 4.1 : 2.7,
    dx = (x * Math.cos(yaw) + z * Math.sin(yaw)) * speed * dt,
    dz = (-x * Math.sin(yaw) + z * Math.cos(yaw)) * speed * dt;
  const p = move(state.x, state.z, dx, dz, world.obstacles);
  state.x = p.x;
  state.z = p.z;
  player.position.set(p.x, 0, p.z);
  if (len > 0.1) {
    player.rotation.y = Math.atan2(dx, dz);
    if (state.elapsed - audio.lastStep > 0.43) {
      audio.step(state.room, c.run);
      audio.lastStep = state.elapsed;
    }
  }
  contact[0].position.copy(player.position).setY(0.025);
  contact[1].position.copy(enemy.position).setY(0.025);
  threat.position.copy(enemy.position).setY(0.035);
  threat.visible =
    enemy.visible && enemy.position.distanceTo(player.position) < 2.8;
  const tell =
    combat.windup > 0 ? 1 - combat.windup / combat.windupDuration : 0;
  (threat.material as T.MeshBasicMaterial).opacity =
    combat.windup > 0
      ? settings.reduceFlashes
        ? 0.42
        : 0.2 + tell * 0.4
      : 0.09;
  threat.scale.setScalar(combat.windup > 0 ? 1 + tell * 0.16 : 1);
  const wasAlive = enemy.visible;
  const lightAttack = input.take("Space"),
    heavyAttack = input.take("KeyJ");
  combat.update(
    dt,
    state,
    player,
    enemy,
    world.obstacles,
    lightAttack,
    (f, d) => audio.tone(f, d, "triangle"),
    toast,
    c.guard,
    heavyAttack,
    c.run || lightAttack || heavyAttack ? 1 : len > 0.1 ? 0.25 : 0,
  );
  if (wasAlive && !enemy.visible) {
    corpse.position.copy(enemy.position);
    corpse.rotation.copy(enemy.rotation);
    corpse.visible = true;
    corpseTime = 0;
  }
  if (corpse.visible) {
    corpseTime += dt;
    animateDeath(corpse, corpseTime / 0.8);
    world.shadowBudget.mark(corpseTime < 1);
  }
  el("hit-feedback").style.opacity = String(
    combat.hurt > 0 ? (combat.guarding ? 0.18 : 0.36) : 0,
  );
  el("hit-feedback").classList.toggle("blocked", combat.guarding);
  audio.ambient(state.elapsed, state.sanity);
  terror.update(dt, player, enemy, combat, audio, settings, state.elapsed);
  animateCharacter(
    player,
    state.elapsed,
    len > 0.1,
    combat.animation,
    c.guard,
    combat.hurt,
    c.run,
    dt,
  );
  world.shadowBudget.mark(
    len > 0.1 ||
      combat.animation > 0 ||
      combat.windup > 0 ||
      combat.hurt > 0 ||
      c.guard !== world.guardPose ||
      Math.hypot(
        enemy.position.x - world.lastEnemyX,
        enemy.position.z - world.lastEnemyZ,
      ) > 0.001 ||
      enemy.visible !== world.lastEnemyVisible,
  );
  world.guardPose = c.guard;
  world.lastEnemyX = enemy.position.x;
  world.lastEnemyZ = enemy.position.z;
  world.lastEnemyVisible = enemy.visible;
  cinematic.update(
    camera,
    state.x,
    state.z,
    state.room,
    dt,
    settings.reduced,
    world.obstacles,
    {
      mode: settings.cameraMode,
      enemy: enemy.position,
      combat: enemy.visible && enemy.position.distanceTo(player.position) < 2.8,
    },
  );
  near = world.nearest(state.x, state.z);
  world.highlight.visible = Boolean(near);
  if (near) world.highlight.position.set(near.x, 0.075, near.z);
  world.atmosphere.update(dt, state.elapsed, settings.reduced);
  el("prompt").style.display = near ? "block" : "none";
  el("prompt").textContent = near ? "E / A · " + near.name : "";
  if (input.take("KeyE") && near) interact(near);
  state.elapsed += dt;
  el("health").style.width = state.health + "%";
  el("sanity").style.width = state.sanity + "%";
  el("hptext").textContent = String(Math.ceil(state.health));
  el("sptext").textContent = String(Math.ceil(state.sanity));
  el("stamina").style.width = combat.stamina + "%";
  el("sttext").textContent = String(Math.ceil(combat.stamina));
  el("veil").style.opacity = String(
    sanity.update(state, world, settings, toast, (event) =>
      audio.sanityEvent(event),
    ),
  );
}
let last = performance.now();
let nextMenuMove = 0;
function frame(now: number) {
  requestAnimationFrame(frame);
  const interval = now - last;
  const dt = Math.min(interval / 1000, 0.2);
  last = now;
  if (started && !paused) {
    const steps = Math.max(1, Math.ceil(dt / 0.025));
    for (let i = 0; i < steps && !paused; i++) update(dt / steps);
  } else {
    const nav = input.poll();
    if (Math.abs(nav.z) > 0.4 && now > nextMenuMove) {
      const controls = Array.from(
        el("panel").querySelectorAll<HTMLElement>(
          "button:not(:disabled),input,select",
        ),
      );
      const i = controls.indexOf(document.activeElement as HTMLElement);
      controls[
        (i + (nav.z > 0 ? 1 : -1) + controls.length) % controls.length
      ]?.focus();
      nextMenuMove = now + 220;
    }
    if (input.take("Space") && started && !state.ended) resume();
    if (input.take("Escape") && started && !state.ended) resume();
    if (input.take("KeyE")) {
      const b = el("panel").querySelector<HTMLButtonElement>("button:focus");
      b?.click();
    }
    if (input.take("Tab") && started && !state.ended) resume();
  }
  if (!started && world) {
    camera.position.set(Math.sin(now * 0.00008) * 3, 3.2, 6.7);
    camera.lookAt(0, 1, -2);
  }
  if (toastTime > 0 && !paused) {
    toastTime -= dt;
    if (toastTime <= 0) el("toast").textContent = "";
  }
  input.end();
  if (world) {
    world.shadowBudget.apply(world.shadowLight, now);
    const start = performance.now();
    gpuTimer?.begin();
    renderer.render(world.scene, camera);
    gpuTimer?.end();
    if (started && !paused) metrics.record(interval, performance.now() - start);
  }
}
loadRoom();
menu();
requestAnimationFrame(frame);
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  applyQuality(renderer, settings.quality);
});
addEventListener("blur", () => {
  if (started && !paused) menu();
});
addEventListener("pagehide", () => audio.dispose());
document.addEventListener("visibilitychange", () => {
  if (document.hidden && started && !paused) menu();
});
export function inspect() {
  return {
    state: structuredClone(state),
    paused,
    camera: camera.position.toArray(),
    target: player.position.toArray(),
    combat: {
      enemyHealth: combat.health,
      windup: combat.windup,
      guarding: combat.guarding,
      animation: combat.animation,
      kind: combat.kind,
      aiState: combat.aiState,
      phase: combat.phase,
      vulnerable: combat.vulnerable,
      stamina: combat.stamina,
      dodge: combat.dodge,
      hurt: combat.hurt,
    },
    cinematicZone: cinematic.zone,
    cameraMode: settings.cameraMode,
    corpse: { visible: corpse.visible, progress: corpseTime },
    cameraCorrected: cinematic.corrected,
    cameraQuaternion: camera.quaternion.toArray(),
    cameraFov: camera.fov,
    quality: qualityProfile(settings.quality),
    performance: metrics.snapshot(),
    gpuTime: gpuTimer?.snapshot(),
    sanityEvent: { id: sanity.activeId, count: sanity.eventCount },
    audio: {
      activeTones: audio.activeVoices,
      running: audio.ctx?.state === "running",
      volume: audio.volume,
      reduced: audio.reduceAudio,
    },
    memory: renderer.info.memory,
    textures: textureBudget(),
    playerRig: Boolean(player.userData.rig),
    limbPose: player.userData.rig?.leftLeg.rotation.x,
    enemy: { position: enemy.position.toArray(), visible: enemy.visible },
    draw: renderer.info.render,
    canvas: {
      width: renderer.domElement.width,
      height: renderer.domElement.height,
      rect: renderer.domElement.getBoundingClientRect().toJSON(),
    },
    objects: world.scene.children.length,
  };
}
// Read-only browser test observer. Vite removes this branch from production.
if (import.meta.env.DEV) {
  Object.defineProperty(window, "sanityInspect", {
    value: inspect,
    configurable: true,
  });

  Object.defineProperty(window, "sanityResetMetrics", {
    value: () => {
      metrics.clear();
      gpuTimer?.reset();
    },
    configurable: true,
  });
}
