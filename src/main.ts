import * as T from "three";
import "./ui/style.css";
import "./ui/remaster.css";
import "./ui/menu-cinematic.css";
import { applyQuality, qualityProfile } from "./render/quality";
import { textureBudget, simplifyLowMaterials } from "./render/materials";
import { FrameMetrics } from "./render/metrics";
import { simulationDeltaSeconds } from "./engine/time";
import { GpuTimer } from "./render/gpu-timer";
import { CinematicCamera } from "./engine/camera";
import {
  animateCharacter,
  animateDeath,
  animateRitual,
} from "./world/character";
import { RitualVisual } from "./world/ritual-visual";
import { luciusVarro } from "./world/lucius";
import { isabelleDeMontfort } from "./world/isabelle";
import { aurelia } from "./world/aurelia";
import { maeve } from "./world/maeve";
import { samira } from "./world/samira";
import { idris } from "./world/idris";
import { oona } from "./world/oona";
import { lateHero } from "./world/late-chapters";
import {
  lateChapters,
  lateChapterForRoom,
  lateObjective,
  lateArtifactUnlocked,
  lateExitUnlocked,
  inspectLateEvidence,
  lateEvidenceCount,
  latePuzzleStage,
  solveLatePuzzle,
} from "./systems/late-chapters";
import { mansionFloorHeight, onMansionStair } from "./world/mansion";
import { mansionMove, upperWalkable } from "./world/mansion-navigation";
import { safeSpawn } from "./systems/collision";
import { activeMansionEchoes, mansionEchoes } from "./world/mansion-echoes";
import { createEnemy, enemyKindForRoom, type EnemyKind } from "./world/enemies";
import {
  isObserved,
  isThreatOnCamera,
  mansionThreatAt,
  mansionThreats,
} from "./systems/mansion-threats";
import { Input } from "./engine/input";
import {
  World,
  character,
  enemySpawn,
  names,
  subtitles,
  type Interactable,
} from "./world/scene";
import { fresh, clamp, move, blocked, type State } from "./systems/state";
import {
  advancePuzzle,
  phase2DoorLocked,
  puzzles,
  type PuzzleId,
} from "./systems/phase2";
import { Audio, audibleFootstep } from "./systems/audio";
import { interactionPrompt } from "./ui/interaction-prompt";
import { TerrorDirector } from "./systems/terror";
import { notes, discoveries } from "./world/narrative";
import { readSave, writeSave } from "./systems/save";
import { legacy, reconcileLegacy, legacyEnding } from "./systems/legacy";
import {
  chosenMemory,
  chooseMemory,
  memoryConsequence,
} from "./systems/memory-choice";
import { Combat, type TargetZone } from "./systems/combat";
import {
  invokeRitual,
  ritualSigns,
  rituals,
  ritualStatus,
  type RitualSign,
} from "./systems/ritual";
import { Sanity } from "./systems/sanity";
import { drinkTonic } from "./systems/inventory";
import {
  chapters,
  completeChapter,
  romanObjective,
  mosaicObjective,
  abbeyObjective,
  attemptMosaicPattern,
  coastObjective,
  correctCoastLedger,
  starsObjective,
  starAlignmentStep,
  quarryObjective,
  assembleQuarryArch,
  hospitalObjective,
  identifyHospitalRemedy,
  keepHospitalTestimony,
  romanEchoes,
  visitChapter,
  historicalEndingReadiness,
  chapterIntroductions,
} from "./systems/campaign";
import { readSettings } from "./systems/config";
import { weaponProfileForRoom } from "./systems/weapons";
import { trapFocus } from "./ui/accessibility";
const app = document.querySelector<HTMLDivElement>("#app")!;
const qaMode =
  import.meta.env.DEV && new URLSearchParams(location.search).get("qa") === "1";
let qaCameraView: { eye: T.Vector3; target: T.Vector3 } | undefined;
let qaArchitectureOnly = false;
app.innerHTML = `<div id="viewport"></div><div id="veil"></div><div id="hit-feedback" aria-hidden="true"></div><div id="hud"><header><div class="brand">SANITY—404</div><div class="chapter"><div class="eyebrow" id="sub"></div><div class="location" id="location"></div><div id="objective" class="objective" aria-live="polite"></div></div></header><div class="bottom"><div class="vitals"><div class="eyebrow" id="hero-name">ÉLISE MOREAU · RESTAURADORA</div><div class="stat"><span>SALUD</span><span id="hptext">100</span></div><div class="bar"><div id="health" class="fill"></div></div><div class="stat"><span>CORDURA</span><span id="sptext">100</span></div><div class="bar"><div id="sanity" class="fill"></div></div><div class="stat"><span>RESISTENCIA</span><span id="sttext">100</span></div><div class="bar"><div id="stamina" class="fill"></div></div><div class="eyebrow" id="target-zone">OBJETIVO · TORSO</div></div><div class="help">WASD / ↑↓←→ · MOVERSE<br>E · INTERACTUAR &nbsp; ESPACIO · ATACAR<br>J / CLIC DERECHO / RB · GOLPE FUERTE<br>C · CAMBIAR OBJETIVO: TORSO / BRAZOS / CABEZA<br>V / R3 · ESQUIVAR &nbsp; F / LB · DEFENDER<br>DEFENDER JUSTO ANTES DEL IMPACTO · CONTRAATAQUE<br>TAB · INVENTARIO &nbsp; M · MAPA &nbsp; ESC · PAUSA</div><div class="help-compact">WASD · MOVER &nbsp; E · INTERACTUAR<br>ESPACIO · ATACAR &nbsp; J · FUERTE<br>V · ESQUIVAR &nbsp; F · DEFENDER<br>TAB · INVENTARIO &nbsp; M · MAPA &nbsp; ESC · PAUSA</div></div></div><div id="prompt"></div><div id="toast" role="status" aria-live="polite"></div><div id="overlay" role="dialog" aria-modal="true" aria-label="Menú del juego"><div id="title-scene" aria-hidden="true"><div class="title-lamplight"></div><div class="title-mist"></div><div class="title-dust"></div></div><div class="panel" id="panel"></div></div><div id="title-transition" aria-hidden="true"></div>`;
app.insertAdjacentHTML(
  "beforeend",
  `<div id="touch-controls" aria-label="Controles táctiles" hidden><div class="touch-move" aria-label="Movimiento"><button data-touch-key="KeyW" aria-label="Avanzar">↑</button><div><button data-touch-key="KeyA" aria-label="Izquierda">←</button><button data-touch-key="KeyS" aria-label="Retroceder">↓</button><button data-touch-key="KeyD" aria-label="Derecha">→</button></div></div><div class="touch-actions"><button data-touch-key="KeyE">Interactuar</button><button data-touch-key="Space">Atacar</button><button data-touch-key="KeyF">Defender</button><button data-touch-key="KeyV">Esquivar</button><button data-touch-key="KeyH">Tónico</button><button data-touch-key="Tab">Diario</button><button data-touch-key="Escape">Pausa</button></div></div>`,
);
const el = (id: string) => document.getElementById(id)!;
const hud = {
  health: el("health"),
  sanity: el("sanity"),
  stamina: el("stamina"),
  hptext: el("hptext"),
  sptext: el("sptext"),
  sttext: el("sttext"),
  veil: el("veil"),
  hitFeedback: el("hit-feedback"),
};
function setHudText(element: HTMLElement, value: string) {
  if (element.textContent !== value) element.textContent = value;
}
function setHudStyle(
  element: HTMLElement,
  property: "width" | "opacity",
  value: string,
) {
  if (element.style[property] !== value) element.style[property] = value;
}
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
  graphicsLost = false,
  yaw = 0,
  toastTime = 0,
  near: Interactable | undefined,
  settings = readSettings();
let ritualVisual: RitualVisual | undefined;
let pendingRitualSound: "veil" | "reading" | undefined;
const mansionActors = new Map<
  EnemyKind,
  { actor: T.Group; corpse: T.Group; combat: Combat }
>();
let currentThreatKind: EnemyKind | undefined;
const targetZones: TargetZone[] = ["torso", "arms", "head"];
const targetNames = { torso: "TORSO", arms: "BRAZOS", head: "CABEZA" };
let targetZone: TargetZone = "torso";
audio.setVolume(settings.volume);
audio.setReduceAudio(settings.reduceAudio);
document.documentElement.classList.toggle("large-text", settings.largeText);
applyQuality(renderer, settings.quality);
const unlockTitleAudio = () => {
  if (
    started ||
    state.ended ||
    !el("overlay").classList.contains("overlay--title")
  )
    return;
  if (audio.ctx?.state === "running") return;
  void audio.start().catch(() => {
    // A blocked audio context must never block menu navigation.
  });
};
el("overlay").addEventListener("pointerdown", unlockTitleAudio);
el("overlay").addEventListener("keydown", unlockTitleAudio);
el("overlay").addEventListener("focusin", (event) => {
  if (
    !started &&
    event.target instanceof HTMLButtonElement &&
    audio.ctx?.state === "running"
  )
    audio.tone(240, 0.09, "triangle");
});

function toast(text: string) {
  el("toast").textContent = text;
  toastTime = 5;
}
function autoSave() {
  if (qaMode) return;
  if (!writeSave(state))
    queueMicrotask(() =>
      toast(
        "No se ha guardado el progreso. Libera almacenamiento o sal del modo privado.",
      ),
    );
}
function panel(html: string, kind = "story") {
  paused = true;
  if (!started || state.ended) audio.resume();
  else audio.pause();
  input.clear();
  el("overlay").hidden = false;
  el("overlay").classList.toggle("overlay--title", !started || state.ended);
  el("overlay").classList.toggle(
    "overlay--reduced",
    settings.reduced || matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  el("touch-controls").hidden = true;
  el("panel").className = `panel panel--${kind}`;
  el("panel").innerHTML = html;
  if (
    el("panel").querySelector('[id*="answer"], [id^="sign-"], [id^="choose-"]')
  )
    el("panel").classList.add("panel--puzzle");
  el("overlay").setAttribute(
    "aria-label",
    el("panel").querySelector("h1,h2")?.textContent || "Menú del juego",
  );
  el("panel").querySelector<HTMLButtonElement>("button")?.focus();
}
function button(id: string, fn: () => void) {
  el(id).onclick = fn;
}
function showEnding(route: "ruins" | "basement", full: boolean) {
  const historical = full ? legacyEnding(state) : null;
  if (full && !historical) throw new Error("Final histórico sin pruebas");
  completeChapter(state.campaign, "mansion-1927");
  state.ended = true;
  if (route === "basement") state.phase2.ending = true;
  const chosen = full ? memoryConsequence(state) : null;
  const remembered = state.phase2.discoveries.includes("adrien");
  const title = full
    ? historical!.title
    : route === "basement"
      ? remembered
        ? "La puerta que pudo abrirse antes"
        : "El nombre que faltaba"
      : state.sanity >= 40
        ? "La memoria del amanecer"
        : "La última ausencia";
  const text = full
    ? historical!.text + (chosen ? ` ${chosen.description}` : "")
    : route === "basement"
      ? remembered
        ? "Élise pronuncia el nombre de Étienne y Adrien cruza el umbral. Al salir, ambos saben que quedan testimonios de otras épocas sin escuchar; la casa pierde una voz, pero su origen permanece incompleto."
        : "El guardián se disuelve y Adrien sale con Élise. No recuerdan cómo se abrió la puerta ni quién la sostuvo antes que ellos."
      : state.sanity >= 40
        ? "Élise quiebra los tres sellos y abandona Veyr con una fotografía de dos rostros. Ha elegido cerrar el Intervalo sin reunir todos los testimonios de su origen."
        : "El Intervalo se cierra, pero la fotografía de la estación ya no tiene rostros. Élise eligió salir antes de conocer a quienes habían protegido sus nombres.";
  panel(
    `<div class="eyebrow">${full ? "FINAL HISTÓRICO · DOCE ÉPOCAS" : "FINAL ANTICIPADO · 1927"}</div><h2>${title}</h2><p>${text}</p><p>Investigaciones históricas: ${state.campaign.completed.filter((id) => id !== "mansion-1927").length}/11 · Tiempo: ${Math.floor(state.elapsed / 60)} min · Cordura: ${Math.round(state.sanity)} · Documentos: ${state.read.length}/${notes.length}</p><button id="finish">Volver al título</button>`,
    "ending",
  );
  button("finish", () => {
    started = false;
    menu();
  });
}
function offerEnding(route: "ruins" | "basement") {
  const readiness = historicalEndingReadiness(state);
  const missingNames = readiness.missingChapters
    .map((id) => chapters.find((chapter) => chapter.id === id)!.hero)
    .join(", ");
  const missing = [
    missingNames && `investigaciones de ${missingNames}`,
    readiness.missingArtifacts.length > 0 &&
      `${readiness.missingArtifacts.length} pruebas materiales`,
    readiness.missingReconciliation && "reconciliar tablilla y códice",
    readiness.missingAdrien && "el cuaderno de Adrien",
    readiness.missingChoice && "una decisión en el archivo familiar",
  ]
    .filter(Boolean)
    .join("; ");
  panel(
    `<div class="eyebrow">UMBRAL DE 1927</div><h2>${readiness.ready ? "Las doce épocas responden" : "Una salida antes de conocer el origen"}</h2><p>${readiness.ready ? "Las once investigaciones, sus pruebas y tu decisión permiten reconstruir el nombre borrado." : `Puedes cerrar el Intervalo ahora y obtener un final anticipado. Para el desenlace histórico faltan: ${missing}.`}</p><div class="actions">${readiness.ready ? '<button id="full-ending">Cerrar con las pruebas</button>' : ""}<button id="early-ending">Cerrar ahora · final anticipado</button><button id="return-ending">Volver a investigar</button></div>`,
  );
  if (readiness.ready) button("full-ending", () => showEnding(route, true));
  button("early-ending", () => showEnding(route, false));
  button("return-ending", resume);
}
renderer.domElement.tabIndex = 0;
function resume() {
  if (graphicsLost) return;
  paused = false;
  el("overlay").hidden = true;
  el("touch-controls").hidden = false;
  input.clear();
  audio.resume();
  renderer.domElement.focus();
}
function loadRoom() {
  mansionActors.clear();
  currentThreatKind = undefined;
  if (!state.phase2.visited.includes(state.room))
    state.phase2.visited.push(state.room);
  if (state.room === 8) visitChapter(state.campaign, "roman-189");
  if (state.room === 9 || state.room === 10)
    visitChapter(state.campaign, "abbey-1348");
  if (state.room === 11 || state.room === 12)
    visitChapter(state.campaign, "mosaic-312");
  if (state.room === 13 || state.room === 14)
    visitChapter(state.campaign, "coast-537");
  if (state.room === 15 || state.room === 16)
    visitChapter(state.campaign, "stars-783");
  if (state.room === 17 || state.room === 18)
    visitChapter(state.campaign, "quarry-1092");
  if (state.room === 19 || state.room === 20)
    visitChapter(state.campaign, "hospital-1217");
  const late = lateChapterForRoom(state.room);
  if (late) visitChapter(state.campaign, late.id);
  ritualVisual?.dispose();
  ritualVisual = undefined;
  pendingRitualSound = undefined;
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
    state.campaign,
  );
  const spawn = safeSpawn(
    { x: state.x, z: state.z },
    state.room === 0 && state.floor === 1
      ? world.upperObstacles
      : world.obstacles,
    state.room === 0 && state.floor === 1
      ? (x, z) => upperWalkable(x, z)
      : undefined,
  );
  if (!spawn)
    throw new Error(
      `No hay posición de entrada libre en sala ${state.room}: ${state.x},${state.z}`,
    );
  state.x = spawn.x;
  state.z = spawn.z;
  player = late
    ? lateHero(late)
    : state.room === 8
      ? luciusVarro()
      : state.room === 17 || state.room === 18
        ? idris()
        : state.room === 19 || state.room === 20
          ? oona()
          : state.room === 15 || state.room === 16
            ? samira()
            : state.room === 13 || state.room === 14
              ? maeve()
              : state.room === 11 || state.room === 12
                ? aurelia()
                : state.room === 9 || state.room === 10
                  ? isabelleDeMontfort()
                  : character();
  player.position.set(
    state.x,
    state.room === 0 ? mansionFloorHeight(state.x, state.z, state.floor) : 0,
    state.z,
  );
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
  if (state.room === 0) {
    mansionActors.set("shade", { actor: enemy, corpse, combat });
    currentThreatKind = "shade";
  }
  terror = new TerrorDirector(world);
  sanity = new Sanity(world, state.elapsed);
  if (settings.quality === 1) simplifyLowMaterials(world.scene);
  audio.setRoom(state.room);
  el("location").textContent = names[state.room];
  el("hero-name").textContent = late
    ? late.hero
    : state.room === 19 || state.room === 20
      ? "OONA · CURANDERA"
      : state.room === 17 || state.room === 18
        ? "IDRIS · CANTERO"
        : state.room === 15 || state.room === 16
          ? "SAMIRA · ASTRÓNOMA"
          : state.room === 13 || state.room === 14
            ? "MAEVE · ESCRIBA DEL ARCHIVO COSTERO"
            : state.room === 11 || state.room === 12
              ? "AURELIA · ARTESANA DEL MOSAICO"
              : state.room === 9 || state.room === 10
                ? "ISABELLE DE MONTFORT · COPISTA"
                : state.room === 8
                  ? "LUCIUS VARRO · CARTÓGRAFO ROMANO"
                  : "ÉLISE MOREAU · RESTAURADORA";
  el("sub").textContent = subtitles[state.room];
  el("objective").textContent = late
    ? lateObjective(state)
    : state.room === 8
      ? romanObjective(state)
      : state.room === 11 || state.room === 12
        ? mosaicObjective(state)
        : state.room === 13 || state.room === 14
          ? coastObjective(state)
          : state.room === 15 || state.room === 16
            ? starsObjective(state)
            : state.room === 17 || state.room === 18
              ? quarryObjective(state)
              : state.room === 19 || state.room === 20
                ? hospitalObjective(state)
                : state.room === 9 || state.room === 10
                  ? abbeyObjective(state)
                  : "";
  cinematic.update(
    camera,
    state.x,
    state.z,
    state.room,
    0,
    settings.reduced,
    world.obstacles,
    { mode: settings.cameraMode, height: player.position.y },
  );
}
function syncMansionThreat() {
  if (state.room !== 0) return;
  const kind = mansionThreatAt(state);
  if (kind === currentThreatKind) return;
  enemy.visible = false;
  corpse.visible = false;
  let entry = mansionActors.get(kind);
  const firstEncounter = !entry;
  if (!entry) {
    const spec = mansionThreats[kind as keyof typeof mansionThreats];
    const actor = createEnemy(kind);
    actor.position.set(...spec.spawn);
    if (kind === "wrongReflection" && state.floor === 0)
      actor.position.set(Math.max(-6.5, state.x - 1.2), 0, state.z - 1.2);
    const fallen = createEnemy(kind);
    fallen.visible = false;
    if (settings.quality === 1) {
      simplifyLowMaterials(actor);
      simplifyLowMaterials(fallen);
    }
    world.scene.add(actor, fallen);
    entry = { actor, corpse: fallen, combat: new Combat(0, kind, spec.id) };
    mansionActors.set(kind, entry);
  }
  enemy = entry.actor;
  corpse = entry.corpse;
  entry.combat.stamina = combat.stamina;
  entry.combat.attackCooldown = Math.max(
    entry.combat.attackCooldown,
    combat.attackCooldown,
  );
  entry.combat.dodge = combat.dodge;
  entry.combat.hurt = combat.hurt;
  combat = entry.combat;
  const spec =
    kind === "shade"
      ? { id: "enemy0", title: "La sombra de los retratos", cue: 90 }
      : mansionThreats[kind as keyof typeof mansionThreats];
  enemy.visible = !state.defeated.includes(spec.id);
  currentThreatKind = kind;
  if (enemy.visible && firstEncounter) {
    audio.directional(
      spec.cue,
      Math.max(-1, Math.min(1, (enemy.position.x - player.position.x) / 5)),
      0.5,
    );
    toast(`${spec.title}: algo se mueve en la mansión.`);
  }
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

let enteringFromTitle = false;
function beginFromMenu(s: State) {
  if (enteringFromTitle) return;
  if (
    started ||
    settings.reduced ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    begin(s);
    return;
  }
  enteringFromTitle = true;
  const curtain = el("title-transition");
  const menuButtons = el("panel").querySelectorAll<HTMLButtonElement>("button");
  menuButtons.forEach((control) => (control.disabled = true));
  el("overlay").classList.add("overlay--departing");
  curtain.classList.add("title-transition--closed");
  window.setTimeout(() => {
    begin(s);
    el("overlay").classList.remove("overlay--departing");
    window.requestAnimationFrame(() =>
      curtain.classList.remove("title-transition--closed"),
    );
    enteringFromTitle = false;
  }, 440);
}

function menu() {
  panel(
    `<div class="menu-kicker"><span>${started && !state.ended ? "PAUSA · PARTIDA EN CURSO" : "MANSIÓN VEYR · FRANCIA"}</span><span>1927</span></div><div class="ornament">UN EXPEDIENTE QUE NO DEBIÓ EXISTIR</div><h1>SANITY<span>—404</span></h1><div class="menu-subtitle">ARCHIVO DE LAS AUSENCIAS · 1927</div><div class="rule"></div><p class="menu-motto">LO QUE OLVIDAS<br>TAMBIÉN TE RECUERDA</p><p class="menu-intro">Una carta de tu hermano desaparecido.<br>Una casa que conoce tu nombre.</p><nav class="actions menu-actions" aria-label="Menú principal"><button id="new" aria-label="Nueva partida">Nueva partida</button><button id="load" aria-label="Continuar" ${readSave() ? "" : "disabled"}>Continuar</button><button id="settings" aria-label="Opciones">Opciones</button></nav><div class="menu-secondary"><button id="load-menu" ${readSave() ? "" : "disabled"}>Cargar partida</button>${started && !state.ended ? '<button id="resume">Volver al juego</button>' : ""}<button id="credits">Créditos</button></div><p class="small menu-footer">DOCE ÉPOCAS · UNA MEMORIA<br>TECLADO, RATÓN Y MANDO · AUDIO ORIGINAL</p>`,
    "menu",
  );
  button("new", () => {
    if (started) {
      panel(
        '<h2>¿Comenzar de nuevo?</h2><p>Se perderá el progreso sin guardar. Tu partida guardada se conserva.</p><div class="actions"><button id="yes">Nueva partida</button><button id="no">Volver</button></div>',
      );
      button("yes", () => beginFromMenu(fresh()));
      button("no", menu);
    } else beginFromMenu(fresh());
  });
  button("load", () => {
    const s = readSave();
    if (s) begin(s);
    else toast("No hay una partida válida.");
  });
  button("load-menu", loadMenu);
  button("settings", options);
  button("credits", credits);
  if (started) button("resume", resume);
}
function loadMenu() {
  const saved = readSave();
  panel(
    `<div class="eyebrow">ARCHIVO DE PARTIDA</div><h2>Cargar partida</h2>${saved ? `<div class="save-slot"><div class="eyebrow">ÚLTIMA MEMORIA GUARDADA</div><strong>${names[saved.room]}</strong><span>${saved.campaign.completed.length}/12 capítulos · ${Math.floor(saved.elapsed / 60)} min · Salud ${Math.ceil(saved.health)}</span></div>` : "<p>No hay una partida guardada válida.</p>"}<div class="actions"><button id="load-confirm" ${saved ? "" : "disabled"}>Cargar memoria</button><button id="back">Volver al título</button></div>`,
    "save",
  );
  button("load-confirm", () => {
    const current = readSave();
    if (current) begin(current);
    else loadMenu();
  });
  button("back", menu);
}
function credits() {
  panel(
    `<div class="eyebrow">SANITY—404 · CRÉDITOS</div><h2>Los nombres que permanecen</h2><p>Una historia interactiva original sobre memoria, pérdida y los lugares que nos recuerdan.</p><div class="credits-lines"><p>DISEÑO, CÓDIGO Y MUNDO<br><strong>Proyecto SANITY—404</strong></p><p>MÚSICA Y SONIDO<br><strong>Síntesis original en tiempo real</strong></p><p>TECNOLOGÍA<br><strong>Three.js · WebGL · TypeScript</strong></p></div><button id="back">Volver al título</button>`,
    "credits",
  );
  button("back", menu);
}
function options() {
  panel(
    `<div class="eyebrow">AJUSTES DE LA EXPERIENCIA</div><h2>Un horror a tu medida</h2><div class="settings-grid"><section class="settings-group"><div class="eyebrow">ACCESIBILIDAD Y ATMÓSFERA</div><label><input type="checkbox" id="large-text" ${settings.largeText ? "checked" : ""}> Texto ampliado en diario, avisos y HUD</label><label><input type="checkbox" id="reduced" ${settings.reduced ? "checked" : ""}> Reducir efectos psicológicos y movimiento de cámara</label><label><input type="checkbox" id="reduce-flashes" ${settings.reduceFlashes ? "checked" : ""}> Reducir variaciones de luz</label><label><input type="checkbox" id="reduce-distortion" ${settings.reduceDistortion ? "checked" : ""}> Reducir distorsiones visuales</label><label><input type="checkbox" id="reduce-audio" ${settings.reduceAudio ? "checked" : ""}> Reducir sonidos intensos y susurros</label><p class="small">Los eventos no bloquean el progreso ni imitan avisos del sistema. No hay destellos rápidos.</p></section><section class="settings-group"><div class="eyebrow">IMAGEN Y SONIDO</div><label>Volumen <input id="volume" type="range" min="0" max="1" step=".05" value="${settings.volume}"></label><label>Calidad gráfica <select id="quality"><option value="1">Baja</option><option value="1.3">Media</option><option value="1.6">Alta</option></select></label><label>Cámara <select id="camera-mode"><option value="classic">Clásica · encuadres por zona</option><option value="modern">Moderna · seguimiento cercano</option></select></label></section></div><details class="controls-help"><summary>Controles de teclado, ratón y mando</summary><p>Movimiento: WASD o stick izquierdo · Interactuar: E / A · Ataque: Espacio / B · Fuerte: J / RB · Defender: F / LB · Esquivar: V / R3 · Tónico: H / X · Inventario: Tab / Y · Mapa: M / Select · Pausa: Esc / Start · Correr: Shift · Ratón: izquierdo atacar, derecho fuerte.</p></details><div class="actions"><button id="back">Aplicar y volver</button></div>`,
    "settings",
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
    settings.largeText = (el("large-text") as HTMLInputElement).checked;
    document.documentElement.classList.toggle("large-text", settings.largeText);
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
  const inventoryLate = lateChapterForRoom(state.room);
  const objective = inventoryLate
    ? lateObjective(state)
    : state.room === 8
      ? romanObjective(state)
      : state.room === 11 || state.room === 12
        ? mosaicObjective(state)
        : state.room === 13 || state.room === 14
          ? coastObjective(state)
          : state.room === 15 || state.room === 16
            ? starsObjective(state)
            : state.room === 17 || state.room === 18
              ? quarryObjective(state)
              : state.room === 19 || state.room === 20
                ? hospitalObjective(state)
                : state.room === 9 || state.room === 10
                  ? abbeyObjective(state)
                  : "El santuario romano inicia la cadena de pruebas; el recuerdo de Isabelle puede explorarse antes.";
  const items = state.items.filter((item) => !item.startsWith("Tónico"));
  const tonics = state.items.length - items.length;
  const witnesses = romanEchoes.filter((echo) =>
    state.campaign.witnessed.includes(echo.id),
  );
  const evidence = lateChapters.flatMap((chapter) =>
    chapter.evidence
      .filter((_, index) =>
        state.campaign.witnessed.includes(`${chapter.id}-evidence-${index}`),
      )
      .map((clue) => `${chapter.year} · ${clue.name}: ${clue.text}`),
  );
  panel(
    `<div class="eyebrow">ARCHIVO PERSONAL · ${names[state.room]}</div><h2>Inventario y diario</h2><div class="inventory-summary"><div><span>ARMA</span><strong>${weaponProfileForRoom(state.room).name}</strong><small>${weaponProfileForRoom(state.room).technique} · sin munición</small></div><div><span>RECURSOS</span><strong>${tonics} tónicos</strong><small>${state.seals.length}/3 sellos · ${state.phase2.solved.length}/4 mecanismos</small></div><div><span>INVESTIGACIONES</span><strong>${state.campaign.completed.filter((id) => id !== "mansion-1927").length}/11</strong><small>épocas concluidas</small></div></div><div class="eyebrow section-label">OBJETOS CONSERVADOS</div><div class="item-grid">${items.length ? items.map((item, index) => `<div class="item-card"><span>${String(index + 1).padStart(2, "0")}</span><strong>${item}</strong></div>`).join("") : "<p>La colección está vacía. Examina la mansión para encontrar pistas.</p>"}</div><div class="actions"><button id="heal" ${tonics && state.health > 0 ? "" : "disabled"}>Beber tónico</button><button id="close">Volver</button></div><div class="eyebrow section-label">DIARIO DE INVESTIGACIÓN</div><p class="journal-lead">${objective}</p><details><summary>Memoria y decisión</summary><p>${legacy(state).clue}</p><p>Memoria de las tres épocas: ${state.items.includes("Memoria reconciliada") ? "reconciliada · pasaje Veyr abierto" : "pendiente"}.</p><p>Decisión histórica: ${chosenMemory(state) ?? "pendiente"}.</p></details><details><summary>Testimonios romanos · ${witnesses.length}/3</summary><p>${witnesses.map((echo) => `${echo.title}: ${echo.text}`).join("<br>") || "Aún no has leído ninguna estela romana."}</p></details><details><summary>La mansión transformada · ${activeMansionEchoes(state.items).length}/12</summary><p>${
      activeMansionEchoes(state.items)
        .map((echo) => `${echo.year} · ${echo.title}: ${echo.text}`)
        .join("<br>") ||
      "Las pruebas históricas todavía no han cambiado la casa."
    }</p></details><details><summary>Pruebas históricas · ${lateChapters.reduce((count, chapter) => count + lateEvidenceCount(state, chapter), 0)}/8</summary><p>${evidence.join("<br>") || "Todavía no has examinado pruebas de estas salas."}</p></details><details><summary>Capítulos concluidos · ${state.campaign.completed.length}/12</summary><p>${
      chapters
        .filter((chapter) => state.campaign.completed.includes(chapter.id))
        .map(
          (chapter) => `${chapter.year} · ${chapter.hero} · ${chapter.place}`,
        )
        .join("<br>") || "Aún no has concluido un capítulo."
    }</p></details><details><summary>Documentos · ${state.read.length}/${notes.length}</summary>${state.read.map((i) => `<p><strong>${notes[Number(i)][0]}</strong><br>${notes[Number(i)][1]}</p>`).join("")}${state.phase2.discoveries.map((id) => `<p><strong>${discoveries[id][0]}</strong><br>${discoveries[id][1]}</p>`).join("")}</details>`,
    "inventory",
  );
  button("close", resume);
  button("heal", () => {
    heal();
    inventory();
  });
}
function heal() {
  const result = drinkTonic(state);
  if (result === "dead") return;
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
function ritualPhrase(id: string, sequence: RitualSign[]) {
  const ritual = rituals.find((entry) => entry.id === id)!;
  const status = ritualStatus(state, id);
  if (status !== "ready") {
    panel(
      `<h2>${ritual.title}</h2><p>${status === "locked" ? "Necesitas la tablilla de Lucius y el códice de Isabelle." : status === "complete" ? "La frase ya está grabada en esta partida." : "No queda cordura suficiente para sostener esta frase."}</p><button id="close">Volver</button>`,
    );
    button("close", resume);
    return;
  }
  panel(
    `<div class="eyebrow">MESA DE LOS TRES SIGNOS · ${sequence.length}/3</div><h2>${ritual.title}</h2><p>${ritual.clue}</p><p>Signos elegidos: ${sequence.join(" · ") || "ninguno"}</p><div class="actions">${ritualSigns.map((sign) => `<button id="sign-${sign}">${sign}</button>`).join("")}<button id="close">Retirar las manos</button></div>`,
  );
  for (const sign of ritualSigns)
    button(`sign-${sign}`, () => {
      const next = [...sequence, sign];
      if (next.length < 3) {
        audio.tone(180 + next.length * 70, 0.18, "triangle");
        ritualPhrase(id, next);
        return;
      }
      const result = invokeRitual(state, id, next);
      if (result === "cast") {
        const kind = id as "veil" | "reading";
        ritualVisual?.dispose();
        ritualVisual = new RitualVisual(
          world.scene,
          state.x,
          state.z,
          kind,
          settings.quality,
        );
        pendingRitualSound = kind;
        panel(
          `<h2>${ritual.title}</h2><p>${id === "veil" ? "El próximo golpe que alcance a Élise romperá el velo en vez de herirla por completo." : "Una inscripción oculta se ha vuelto visible en los sótanos de Veyr."}</p><button id="close">Continuar</button>`,
        );
        button("close", resume);
      } else {
        audio.tone(90, 0.35, "sawtooth");
        panel(
          `<h2>La frase se deshace</h2><p>El orden no sostiene el recuerdo. Pierdes 3 de cordura.</p><button id="retry">Intentar otra vez</button><button id="close">Volver</button>`,
        );
        button("retry", () => ritualPhrase(id, []));
        button("close", resume);
      }
    });
  button("close", resume);
}
function interact(o: Interactable) {
  audio.tone(260);
  if (o.kind === "ritualSecret") {
    panel(
      '<div class="eyebrow">SÓTANO VEYR · NOMBRE RECUPERADO</div><h2>La piedra ya no miente</h2><p>La lectura de Élise revela una inscripción bajo el mortero: «El guardián fue Étienne Veyr. No abrió la puerta: se quedó para impedir que otros fueran borrados».</p><p>El plano de Idris marca esta misma piedra. El códice de Isabelle conserva el nombre.</p><button id="close">Volver</button>',
    );
    button("close", resume);
    return;
  }
  if (o.kind === "ritual") {
    panel(
      `<div class="eyebrow">VESTÍBULO · MESA DE LOS TRES SIGNOS</div><h2>Magia de testimonio</h2><p>Élise puede ordenar piedra, nombre y pausa. Cada frase exige cordura y deja una consecuencia distinta.</p>${rituals.map((ritual) => `<p><strong>${ritual.title}</strong> · ${ritual.clue}<br>Estado: ${ritualStatus(state, ritual.id) === "complete" ? "grabado" : ritualStatus(state, ritual.id) === "locked" ? "faltan la tablilla y el códice" : ritualStatus(state, ritual.id) === "exhausted" ? "cordura insuficiente" : `preparado · ${ritual.cost} de cordura`}</p>`).join("")}<div class="actions"><button id="ritual-veil">Formar el velo</button><button id="ritual-reading">Leer el umbral</button><button id="close">Volver</button></div>`,
    );
    button("ritual-veil", () => ritualPhrase("veil", []));
    button("ritual-reading", () => ritualPhrase("reading", []));
    button("close", resume);
    return;
  }
  if (o.kind === "mansionEcho") {
    const echo = mansionEchoes.find((entry) => entry.id === o.value);
    if (echo) {
      panel(
        `<div class="eyebrow">MANSIÓN VEYR · ${echo.year} EN 1927</div><h2>${echo.title}</h2><p>${echo.text}</p><button id="close">Volver</button>`,
      );
      button("close", resume);
    }
    return;
  }
  if (o.kind === "galleryClue") {
    panel(
      '<div class="eyebrow">GALERÍA VEYR · 1927</div><h2>La bóveda de las cenizas</h2><p>Adrien marcó una estrella apagada sobre el lente. Debajo escribió: «Lo que arde no desaparece. Deja una palabra en la caja astronómica».</p><p>La carta del vestíbulo y este mapa apuntan al mismo recuerdo.</p><button id="close">Volver al rellano</button>',
    );
    button("close", resume);
    return;
  }
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
  if (o.kind === "romanEcho") {
    const echo = romanEchoes.find((entry) => entry.id === o.id);
    if (!echo) return;
    if (!state.campaign.witnessed.includes(echo.id)) {
      state.campaign.witnessed.push(echo.id);
      world.remove(o);
      audio.tone(180, 0.45);
      if (
        romanEchoes.every((entry) =>
          state.campaign.witnessed.includes(entry.id),
        )
      ) {
        state.sanity = clamp(state.sanity + 12);
        toast(
          "Los tres testimonios fijan la memoria de Lucius. Recuperas 12 de cordura.",
        );
      }
    }
    panel(
      `<div class="eyebrow">ROMA · TESTIMONIO ${romanEchoes.indexOf(echo) + 1}/3</div><h2>${echo.title}</h2><p>${echo.text}</p><p>La secuencia permanece en el diario incluso después de salir del santuario.</p><button id="close">Conservar el testimonio</button>`,
    );
    button("close", resume);
    return;
  }
  if (o.kind === "mosaicPuzzle") {
    if (
      !state.read.includes("11") ||
      !state.items.includes("Pigmento de cinabrio")
    ) {
      toast("El registro y el cinabrio de la galería revelan el patrón.");
      return;
    }
    if (state.items.includes("Boceto recompuesto")) {
      toast("El rostro auténtico ya ha quedado fijado en el boceto.");
      return;
    }
    panel(
      '<div class="eyebrow">ROMA · 312 · HORNO</div><h2>El rostro sustraído</h2><p>Las tres capas de teselas esperan la secuencia del registro de Aurelia.</p><div class="actions"><button id="mosaic-answer0">Rojo · Negro · Claro</button><button id="mosaic-answer1">Claro · Rojo · Negro</button><button id="mosaic-answer2">Negro · Claro · Rojo</button><button id="close">Volver</button></div>',
    );
    for (let i = 0; i < 3; i++)
      button("mosaic-answer" + i, () => {
        if (attemptMosaicPattern(state, i) === "solved") {
          const face = world.scene.getObjectByName("mosaic-restored-face");
          if (face) face.visible = true;
          audio.tone(560, 0.55);
          toast(
            "Aurelia recompone el rostro. El custodio revela la cámara del molde.",
          );
        } else {
          toast("Las caras de las teselas cambian. Pierdes 5 de cordura.");
        }
        resume();
      });
    button("close", resume);
    return;
  }
  if (o.kind === "coastLedger") {
    if (
      !state.read.includes("13") ||
      !state.read.includes("14") ||
      !state.items.includes("Tabla de mareas")
    ) {
      toast("Necesitas ambos registros y la tabla de mareas del muelle.");
      return;
    }
    if (state.items.includes("Registro corregido")) {
      toast("La fecha auténtica ya está fijada en el registro.");
      return;
    }
    panel(
      '<div class="eyebrow">COSTA · 537 · DEPÓSITO</div><h2>La nave que no llegó</h2><p>¿Qué fecha y marea abrieron el canal para el barco sin nombre?</p><div class="actions"><button id="coast-answer0">Día doce · pleamar</button><button id="coast-answer1">Día trece · bajamar</button><button id="coast-answer2">Día catorce · pleamar</button><button id="close">Volver</button></div>',
    );
    for (let i = 0; i < 3; i++)
      button("coast-answer" + i, () => {
        if (correctCoastLedger(state, i) === "solved") {
          audio.tone(420, 0.6);
          toast("La tinta falsa se desprende. Ya puedes recuperar la lista.");
        } else
          toast("El mar devuelve nombres equivocados. Pierdes 6 de cordura.");
        resume();
      });
    button("close", resume);
    return;
  }
  if (o.kind === "starAlignment") {
    if (
      !state.read.includes("15") ||
      !state.read.includes("16") ||
      !state.items.includes("Carta astral")
    ) {
      toast("Necesitas la carta y las observaciones de ambas salas.");
      return;
    }
    if (state.items.includes("Patrón de Samira")) {
      toast("Las tres horas ya señalan el astro ausente.");
      return;
    }
    const stage = state.items.includes("Segundo azimut")
      ? 3
      : state.items.includes("Primer azimut")
        ? 2
        : 1;
    panel(
      `<div class="eyebrow">MONTAÑA · 783 · ASTROLABIO</div><h2>La estrella que falta</h2><p>Marca ${stage}/3. Sigue el cuaderno de Samira: su huella, su negación y su lugar vacío.</p><div class="actions"><button id="stars-answer0">Alba · este</button><button id="stars-answer1">Noche · centro</button><button id="stars-answer2">Ocaso · oeste</button><button id="close">Volver</button></div>`,
    );
    for (let i = 0; i < 3; i++)
      button("stars-answer" + i, () => {
        const result = starAlignmentStep(state, i);
        const wheel = world.scene.getObjectByName("astrolabe-wheel");
        if (result === "correct") {
          if (wheel) wheel.rotation.z += Math.PI / 3;
          audio.tone(430 + stage * 70, 0.35);
          interact(o);
        } else if (result === "solved") {
          if (wheel) wheel.rotation.z = Math.PI;
          audio.tone(610, 0.65);
          toast("El astrolabio fija la ausencia. El disco puede recuperarse.");
          resume();
        } else {
          if (wheel) wheel.rotation.z = 0;
          toast(
            "La cúpula cambia de estación. La secuencia vuelve al inicio; pierdes 5 de cordura.",
          );
          resume();
        }
      });
    button("close", resume);
    return;
  }
  if (o.kind === "quarryArch") {
    if (
      !state.read.includes("17") ||
      !state.read.includes("18") ||
      !state.items.includes("Cuña marcada")
    ) {
      toast("La cuña y los dos cuadernos revelan el orden de los sillares.");
      return;
    }
    if (state.items.includes("Arco ensamblado")) {
      toast("El arco auténtico ya está asentado.");
      return;
    }
    const stage = state.items.includes("Clave colocada")
      ? 3
      : state.items.includes("Base asentada")
        ? 2
        : 1;
    panel(
      `<div class="eyebrow">ALPES · 1092 · CÁMARA DEL ARCO</div><h2>La piedra que conserva un nombre</h2><p>Sillar ${stage}/3. Sigue las marcas originales del cuaderno de Idris.</p><div class="actions"><button id="quarry-answer0">Base de piedra</button><button id="quarry-answer1">Cierre de cristal</button><button id="quarry-answer2">Clave de bronce</button><button id="close">Volver</button></div>`,
    );
    for (let i = 0; i < 3; i++)
      button("quarry-answer" + i, () => {
        const result = assembleQuarryArch(state, i);
        if (result === "correct") {
          audio.tone(240 + stage * 80, 0.42);
          interact(o);
        } else if (result === "solved") {
          const arch = world.scene.getObjectByName("quarry-assembled-arch");
          if (arch) arch.visible = true;
          audio.tone(560, 0.65);
          toast("El arco auténtico se sostiene. El plano está al descubierto.");
          resume();
        } else {
          toast(
            "Los sillares cambian de nombre. Empieza de nuevo; pierdes 5 de cordura.",
          );
          resume();
        }
      });
    button("close", resume);
    return;
  }
  if (o.kind === "hospitalRemedy") {
    if (
      !state.read.includes("19") ||
      !state.read.includes("20") ||
      !state.items.includes("Hierbas de serbal")
    ) {
      toast(
        "Lee ambos historiales y recoge el serbal antes de elegir el remedio.",
      );
      return;
    }
    if (state.items.includes("Remedio identificado")) {
      toast("El tratamiento de Bran ya está identificado.");
      return;
    }
    panel(
      '<div class="eyebrow">HOSPITAL · 1217 · BOTIQUÍN</div><h2>Una historia escrita sobre otra</h2><p>Ada recuerda su nombre y tiene fiebre. Bran no tiene fiebre, pero ha olvidado el suyo. ¿Qué remedio corresponde a Bran?</p><div class="actions"><button id="hospital-answer0">Raíz amarga</button><button id="hospital-answer1">Serbal</button><button id="hospital-answer2">Agua de la fuente</button><button id="close">Volver</button></div>',
    );
    for (let i = 0; i < 3; i++)
      button("hospital-answer" + i, () => {
        const result = identifyHospitalRemedy(state, i);
        toast(
          result === "solved"
            ? "El serbal conserva el nombre de Bran. El cuaderno puede abrirse."
            : "La historia cambia de paciente; pierdes 6 de cordura.",
        );
        audio.tone(result === "solved" ? 520 : 90, 0.55);
        resume();
      });
    button("close", resume);
    return;
  }
  if (o.kind === "hospitalChoice") {
    if (!state.items.includes("Cuaderno de Oona")) {
      toast("Salva primero el cuaderno original.");
      return;
    }
    if (
      state.items.includes("Testimonio de Ada") ||
      state.items.includes("Testimonio de Bran")
    ) {
      toast("El testimonio elegido ya está conservado en el cuaderno.");
      return;
    }
    panel(
      '<div class="eyebrow">HOSPITAL · 1217 · TESTIMONIO</div><h2>Una voz debe llegar al futuro</h2><p>Ada puede describir la fiebre y la memoria que resistió. Bran puede contar cómo una vida ajena ocupó la suya. Oona solo dispone de una página a salvo de la falsificación.</p><div class="actions"><button id="hospital-ada">Conservar a Ada</button><button id="hospital-bran">Conservar a Bran</button><button id="close">Volver</button></div>',
    );
    for (const choice of ["Ada", "Bran"] as const)
      button("hospital-" + choice.toLowerCase(), () => {
        if (keepHospitalTestimony(state, choice)) {
          autoSave();
          toast(`El testimonio de ${choice} queda a salvo.`);
        }
        resume();
      });
    button("close", resume);
    return;
  }
  if (o.kind === "lateEvidence") {
    const chapter = lateChapterForRoom(state.room)!;
    const index = Number(o.value);
    const evidence = chapter.evidence[index];
    if (inspectLateEvidence(state, chapter, index)) {
      state.sanity = clamp(state.sanity - 2);
      autoSave();
      audio.tone(185 - index * 35, 0.28, "triangle");
    }
    panel(
      `<div class="eyebrow">PRUEBA MATERIAL · ${chapter.year}</div><h2>${evidence.name}</h2><p>${evidence.text}</p><button id="close">Conservar en el diario</button>`,
    );
    button("close", resume);
    return;
  }
  if (o.kind === "latePuzzle") {
    const chapter = lateChapterForRoom(state.room)!;
    const stage = latePuzzleStage(state, chapter);
    const ready =
      state.read.includes(String(chapter.room)) &&
      state.read.includes(String(chapter.room + 1)) &&
      state.items.includes(chapter.clue) &&
      lateEvidenceCount(state, chapter) === chapter.evidence.length;
    if (stage === chapter.order.length || !ready) {
      panel(
        `<div class="eyebrow">${chapter.year} · ${chapter.inner}</div><h2>${chapter.puzzleTask}</h2><p>${stage === chapter.order.length ? "El mecanismo ya está resuelto." : lateObjective(state)}</p><button id="close">Volver</button>`,
      );
      button("close", resume);
      return;
    }
    panel(
      `<div class="eyebrow">${chapter.year} · ${chapter.inner} · ${stage + 1}/3</div><h2>${chapter.puzzleTask}</h2><p>${chapter.steps[stage]}</p><div class="actions">${chapter.answers.map((answer, index) => `<button id="late-answer${index}">${answer}</button>`).join("")}<button id="close">Volver</button></div>`,
    );
    chapter.answers.forEach((_, index) =>
      button(`late-answer${index}`, () => {
        const result = solveLatePuzzle(state, chapter, index);
        resume();
        toast(
          result === "wrong"
            ? "La prueba se altera. Pierdes 6 de cordura."
            : result === "locked"
              ? lateObjective(state)
              : result === "correct"
                ? `Marca ${stage + 1}/3 conservada. Examina de nuevo el mecanismo.`
                : result === "already"
                  ? "El mecanismo ya está resuelto."
                  : `Resuelto: ${chapter.solution}`,
        );
        if (result !== "locked" && result !== "already") autoSave();
      }),
    );
    button("close", resume);
    return;
  }
  if (o.kind === "item") {
    const lateItem = lateChapterForRoom(state.room);
    if (lateItem && o.id === `${lateItem.id}-artifact`) {
      if (!lateArtifactUnlocked(state, lateItem)) {
        toast(lateObjective(state));
        return;
      }
    }
    if (
      o.id === "hospital-record" &&
      !state.items.includes("Remedio identificado")
    ) {
      toast(
        "El cuaderno usa nombres falsos. Identifica primero el remedio de Bran.",
      );
      return;
    }
    if (o.id === "hospital-record" && !state.defeated.includes("enemy20")) {
      toast("El custodio de salas retiene el cuaderno. Debes apartarlo.");
      return;
    }
    if (o.id === "quarry-plan" && !state.items.includes("Arco ensamblado")) {
      toast("El plano permanece sellado. Ensambla el arco auténtico.");
      return;
    }
    if (o.id === "quarry-plan" && !state.defeated.includes("enemy18")) {
      toast("El obrero petrificado protege el plano. Debes vencerlo.");
      return;
    }
    if (o.id === "stars-disc" && !state.items.includes("Patrón de Samira")) {
      toast("El disco no señala ninguna puerta. Alinea el astrolabio.");
      return;
    }
    if (o.id === "stars-disc" && !state.defeated.includes("enemy16")) {
      toast("El vigilante ciego guarda el disco. Debes apartarlo.");
      return;
    }
    if (o.id === "coast-list" && !state.items.includes("Registro corregido")) {
      toast("La lista está sellada por una fecha falsa. Corrige el registro.");
      return;
    }
    if (o.id === "coast-list" && !state.defeated.includes("enemy14")) {
      toast("El custodio ahogado protege los nombres. Debes vencerlo.");
      return;
    }
    if (o.id === "mosaic-mold" && !state.items.includes("Boceto recompuesto")) {
      toast("El molde está cubierto por un rostro falso. Recompón el mosaico.");
      return;
    }
    if (o.id === "mosaic-mold" && !state.defeated.includes("enemy12")) {
      toast("El custodio de teselas protege el molde. Debes vencerlo.");
      return;
    }
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
    if (o.id === "upper-portraits" || o.id === "upper-observatory") {
      panel(
        o.id === "upper-portraits"
          ? '<div class="eyebrow">SALA DE RETRATOS · 1927</div><h2>Folio de los huéspedes</h2><p>El mayordomo anotó una regla: «Permanece quieto mientras lo miren. Un parpadeo basta para ganar un paso». Bajo la tinta aparece el dibujo de una mujer que desciende la escalera cuando la casa oye pasos.</p><button id="close">Guardar el folio</button>'
          : '<div class="eyebrow">OBSERVATORIO VEYR · 1927</div><h2>Carta de la raíz</h2><p>Las raíces bajo la mansión conservan nombres arrancados de los retratos. La carta marca tres pulsos de crecimiento. Después de cada barrida, el centro queda expuesto un instante.</p><button id="close">Guardar la carta</button>',
      );
      button("close", resume);
    }
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
    if (o.id === "mosaic-mold") {
      panel(
        '<div class="eyebrow">ROMA · 312 · EPÍLOGO</div><h2>Un rostro conservado</h2><p>El molde no muestra a Aurelia: conserva la cara de alguien que aún no ha nacido. En el reverso está el signo de Lucius. Aurelia lo envuelve en lino y lo deja entre los cimientos del taller para la próxima testigo.</p><p>El pórtico de la galería lleva de regreso a 1927.</p><button id="close">Continuar</button>',
      );
      button("close", resume);
    }
    if (o.id === "coast-list") {
      panel(
        '<div class="eyebrow">COSTA · 537 · EPÍLOGO</div><h2>Los pasajeros ausentes</h2><p>Maeve copia los nombres legibles: Livia, Aedan y Mara. Una cuarta línea dice «Adrien Moreau», un niño que aún no ha nacido. La lista queda sellada en una caja de sal; una restauradora podrá abrirla en 1927.</p><p>La escalinata del muelle es la última salida.</p><button id="close">Continuar</button>',
      );
      button("close", resume);
    }
    if (o.id === "stars-disc") {
      panel(
        '<div class="eyebrow">MONTAÑA · 783 · EPÍLOGO</div><h2>El centro vacío</h2><p>Samira descubre que el disco no apunta a una estrella, sino a un umbral construido siglos después. Graba las tres horas en bronce y esconde la pieza bajo la terraza. En 1927, la caja astronómica de Veyr podrá reconocerla.</p><p>Vuelve por la terraza antes de que el vigilante regrese.</p><button id="close">Continuar</button>',
      );
      button("close", resume);
    }
    if (o.id === "quarry-plan") {
      panel(
        '<div class="eyebrow">ALPES · 1092 · EPÍLOGO</div><h2>Un arco para otra casa</h2><p>Idris conserva el plano auténtico. La salida dibujada en él retrocede cada vez que intenta cruzarla; el arco construido, en cambio, permanece. Envuelve el dibujo y lo deja bajo la primera piedra destinada a Veyr.</p><p>La rampa de la cantera conduce de regreso a 1927.</p><button id="close">Continuar</button>',
      );
      button("close", resume);
    }
    if (lateItem && o.id === `${lateItem.id}-artifact`) {
      autoSave();
      panel(
        `<div class="eyebrow">${lateItem.year} · EPÍLOGO</div><h2>${lateItem.artifact}</h2><p>${lateItem.epilogue}</p><button id="close">Continuar</button>`,
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
    button("close", () => {
      resume();
      if (
        state.room === 8 &&
        !state.campaign.witnessed.includes("roman-formation")
      ) {
        state.campaign.witnessed.push("roman-formation");
        state.sanity = clamp(state.sanity - 8);
        toast(
          "Una formación de soldados cruza el santuario sin dejar huellas. Pierdes 8 de cordura.",
        );
        audio.tone(75, 0.8, "sawtooth");
      }
    });
  }
  if (o.kind === "save") {
    toast(
      qaMode
        ? "Modo QA: la partida de diagnóstico no se guarda."
        : writeSave(state)
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
    const lateDoor = lateChapters.find((chapter) =>
      o.id.startsWith(`${chapter.id}-`),
    );
    if (
      lateDoor &&
      o.id === `${lateDoor.id}-inner` &&
      !state.items.includes(lateDoor.clue)
    ) {
      toast(lateDoor.pickup);
      return;
    }
    if (
      lateDoor &&
      o.id === `${lateDoor.id}-return` &&
      !state.campaign.completed.includes(lateDoor.id)
    ) {
      if (!lateExitUnlocked(state, lateDoor)) {
        toast(lateObjective(state));
        return;
      }
      completeChapter(state.campaign, lateDoor.id);
      autoSave();
      panel(
        `<div class="eyebrow">${lateDoor.year} · CAPÍTULO CONCLUIDO</div><h2>${lateDoor.place}</h2><p>${lateDoor.epilogue} La prueba queda en el inventario para la siguiente época.</p><button id="close">Regresar a 1927</button>`,
      );
      button("close", () => {
        state.room = 0;
        state.x = 0;
        state.z = 4.4;
        loadRoom();
        autoSave();
        resume();
      });
      return;
    }
    if (
      o.id === "hospital-ward" &&
      !state.items.includes("Hierbas de serbal")
    ) {
      toast("Recoge el serbal de la sala de camino antes de entrar.");
      return;
    }
    if (
      o.id === "hospital-return" &&
      !state.campaign.completed.includes("hospital-1217")
    ) {
      if (!hospitalObjective(state).startsWith("Regresa")) {
        toast(hospitalObjective(state));
        return;
      }
      completeChapter(state.campaign, "hospital-1217");
      autoSave();
      const witness = state.items.includes("Testimonio de Ada")
        ? "Ada"
        : "Bran";
      panel(
        `<div class="eyebrow">PASO DE MONTAÑA · 1217 · RECORRIDO CONCLUIDO</div><h2>El nombre bajo la fiebre</h2><p>Oona salva el cuaderno y la voz de ${witness}. El hospital queda atrás, pero el registro viajará hasta Isabelle de Montfort.</p><button id="close">Regresar a 1927</button>`,
      );
      button("close", () => {
        state.room = 0;
        state.x = 2.6;
        state.z = -3.3;
        loadRoom();
        autoSave();
        resume();
      });
      return;
    }
    if (o.id === "quarry-chamber" && !state.items.includes("Cuña marcada")) {
      toast("Las marcas de la cuña permiten abrir la cámara del arco.");
      return;
    }
    if (
      o.id === "quarry-return" &&
      !state.campaign.completed.includes("quarry-1092")
    ) {
      if (!quarryObjective(state).startsWith("Sal")) {
        toast(quarryObjective(state));
        return;
      }
      completeChapter(state.campaign, "quarry-1092");
      autoSave();
      panel(
        '<div class="eyebrow">ALPES · 1092 · RECORRIDO CONCLUIDO</div><h2>La forma del umbral</h2><p>Idris abandona la cantera con un plano que la piedra no puede alterar. El arco auténtico queda de pie para quien llegue después.</p><button id="close">Regresar a 1927</button>',
      );
      button("close", () => {
        state.room = 0;
        state.x = -6.2;
        state.z = 0;
        loadRoom();
        autoSave();
        resume();
      });
      return;
    }
    if (o.id === "stars-dome" && !state.items.includes("Carta astral")) {
      toast("La cúpula exige la carta astral de la terraza.");
      return;
    }
    if (
      o.id === "stars-return" &&
      !state.campaign.completed.includes("stars-783")
    ) {
      if (!starsObjective(state).startsWith("Cruza")) {
        toast(starsObjective(state));
        return;
      }
      completeChapter(state.campaign, "stars-783");
      autoSave();
      panel(
        '<div class="eyebrow">MONTAÑA · 783 · RECORRIDO CONCLUIDO</div><h2>Una posición imposible</h2><p>Samira deja el disco oculto. La marca señala el mismo umbral que Lucius vio en piedra, Aurelia conservó en un molde y Maeve encontró entre los nombres perdidos.</p><button id="close">Regresar a 1927</button>',
      );
      button("close", () => {
        state.room = 0;
        state.x = -6.2;
        state.z = -2.5;
        loadRoom();
        autoSave();
        resume();
      });
      return;
    }
    if (o.id === "coast-vault" && !state.items.includes("Tabla de mareas")) {
      toast("La puerta del depósito exige la tabla de mareas del muelle.");
      return;
    }
    if (
      o.id === "coast-return" &&
      !state.campaign.completed.includes("coast-537")
    ) {
      if (!coastObjective(state).startsWith("Evacúa")) {
        toast(coastObjective(state));
        return;
      }
      completeChapter(state.campaign, "coast-537");
      autoSave();
      panel(
        '<div class="eyebrow">COSTA · 537 · RECORRIDO CONCLUIDO</div><h2>La lista que llegó a tierra</h2><p>Maeve sale antes de que el depósito se llene. Su lista conserva nombres que el Intervalo quiso borrar y queda junto a las pruebas de Lucius y Aurelia.</p><button id="close">Regresar a 1927</button>',
      );
      button("close", () => {
        state.room = 0;
        state.x = -6.2;
        state.z = 2.5;
        loadRoom();
        autoSave();
        resume();
      });
      return;
    }
    if (
      o.id === "medieval-return" &&
      !state.campaign.completed.includes("abbey-1348") &&
      abbeyObjective(state).startsWith("Regresa")
    ) {
      completeChapter(state.campaign, "abbey-1348");
      autoSave();
      panel(
        `<div class="eyebrow">FRANCIA · 1348 · RECORRIDO CONCLUIDO</div><h2>El nombre que sobrevivió</h2><p>${state.campaign.completed.includes("hospital-1217") ? "El cuaderno de Oona permite a Isabelle reconocer el nombre cambiado en el códice." : "Isabelle conserva el códice antes de conocer de dónde llegó el nombre cambiado. La investigación de Oona sigue pendiente."} Oculta la copia entre los muros del claustro para que Élise la encuentre en 1927.</p><button id="close">Regresar a 1927</button>`,
      );
      button("close", () => {
        state.room = 0;
        state.x = -5.2;
        state.z = -4.2;
        loadRoom();
        autoSave();
        resume();
      });
      return;
    }
    if (
      o.id === "mosaic-kiln" &&
      !state.items.includes("Pigmento de cinabrio")
    ) {
      toast(
        "Necesitas el cinabrio de la galería para revelar el patrón del horno.",
      );
      return;
    }
    if (
      o.id === "mosaic-return" &&
      !state.campaign.completed.includes("mosaic-312")
    ) {
      if (!mosaicObjective(state).startsWith("Regresa")) {
        toast(mosaicObjective(state));
        return;
      }
      completeChapter(state.campaign, "mosaic-312");
      autoSave();
      panel(
        '<div class="eyebrow">ROMA · 312 · RECORRIDO CONCLUIDO</div><h2>El segundo testigo</h2><p>Aurelia deja el molde en un muro que siglos después formará parte de la casa Veyr. La tablilla de Lucius y su mosaico muestran ahora el mismo rostro ausente.</p><button id="close">Regresar a 1927</button>',
      );
      button("close", () => {
        state.room = 0;
        state.x = 6.2;
        state.z = -0.6;
        loadRoom();
        autoSave();
        resume();
      });
      return;
    }
    const phase2Lock = phase2DoorLocked(o.id, state.phase2);
    if (phase2Lock) {
      toast(phase2Lock);
      return;
    }
    if (
      o.id === "roman-return" &&
      !state.campaign.completed.includes("roman-189")
    ) {
      if (romanObjective(state).startsWith("Regresa")) {
        completeChapter(state.campaign, "roman-189");
        autoSave();
        panel(
          '<div class="eyebrow">ROMA · 189 D. C. · CAPÍTULO CONCLUIDO</div><h2>El primer testigo</h2><p>Lucius deja la tablilla bajo la piedra. El nombre de Élise, aún imposible, permanece grabado junto al suyo. La formación sin rostro se disuelve cuando él cruza el arco. Su prueba espera ahora a quien pueda leerla en 1927.</p><p>La tablilla y el signo quedan conservados en esta partida.</p><button id="close">Regresar a la mansión</button>',
        );
        button("close", () => {
          state.room = 0;
          state.x = 0;
          state.z = -4.2;
          loadRoom();
          autoSave();
          resume();
          toast("1927 · La tablilla ha sobrevivido al Intervalo.");
        });
      } else toast(romanObjective(state));
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
    const arrival = chapters.find(
      (chapter) => chapter.room === o.target && chapter.id !== "mansion-1927",
    );
    const firstArrival =
      arrival !== undefined && !state.campaign.visited.includes(arrival.id);
    state.room = o.target!;
    if (lateDoor) {
      state.x = 0;
      state.z = o.id.endsWith("-back")
        ? -4.2
        : o.id.endsWith("-return")
          ? 4.4
          : 5.2;
    } else if (o.id === "legacy-passage" || o.id === "legacy-back") {
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
    } else if (
      ["mosaic-portal", "mosaic-return", "mosaic-kiln", "mosaic-back"].includes(
        o.id,
      )
    ) {
      state.x = o.id === "mosaic-return" ? 6.2 : 0;
      state.z =
        o.id === "mosaic-kiln" || o.id === "mosaic-portal"
          ? 5.2
          : o.id === "mosaic-return"
            ? -0.6
            : -4.2;
    } else if (
      ["coast-portal", "coast-return", "coast-vault", "coast-back"].includes(
        o.id,
      )
    ) {
      state.x = o.id === "coast-return" ? -6.2 : 0;
      state.z =
        o.id === "coast-portal" || o.id === "coast-vault"
          ? 5.2
          : o.id === "coast-return"
            ? 2.5
            : -4.2;
    } else if (
      ["stars-portal", "stars-return", "stars-dome", "stars-back"].includes(
        o.id,
      )
    ) {
      state.x = o.id === "stars-return" ? -6.2 : 0;
      state.z =
        o.id === "stars-portal" || o.id === "stars-dome"
          ? 5.2
          : o.id === "stars-return"
            ? -2.5
            : -4.2;
    } else if (
      [
        "quarry-portal",
        "quarry-return",
        "quarry-chamber",
        "quarry-back",
      ].includes(o.id)
    ) {
      state.x = o.id === "quarry-return" ? -6.2 : 0;
      state.z =
        o.id === "quarry-portal" || o.id === "quarry-chamber"
          ? 5.2
          : o.id === "quarry-return"
            ? 0
            : -4.2;
    } else if (
      [
        "hospital-portal",
        "hospital-return",
        "hospital-ward",
        "hospital-back",
      ].includes(o.id)
    ) {
      state.x = o.id === "hospital-return" ? 2.6 : 0;
      state.z =
        o.id === "hospital-portal" || o.id === "hospital-ward"
          ? 5.2
          : o.id === "hospital-return"
            ? -3.3
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
    if (arrival && firstArrival && arrival.id !== "mansion-1927") {
      panel(
        `<div class="eyebrow">${arrival.year} · ${arrival.place}</div><h2>${arrival.hero}</h2><p>${chapterIntroductions[arrival.id]}</p><p>Primer objetivo: ${el("objective").textContent}</p><button id="close">Comenzar investigación</button>`,
        "chapter",
      );
      button("close", resume);
    }
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
    offerEnding("basement");
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
      `<div class="eyebrow">EL MECANISMO ${o.target! + 1}</div><h2>Una palabra, una ausencia</h2><p>Tres inscripciones rodean la cerradura. Los documentos explican el orden. ¿Qué palabra corresponde a este sello?</p>${o.id === "mansion-puzzle" && state.items.includes("Disco estelar") ? "<p>El disco de Samira apunta al comienzo: CENIZA.</p>" : ""}<div class="actions">${["Ceniza", "Marea", "Umbral"].map((s, i) => `<button id="answer${i}">${s}</button>`).join("")}<button id="close">Volver</button></div>`,
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
    offerEnding("ruins");
  }
}
function update(dt: number) {
  const c = input.poll();
  if (state.room === 0) {
    const place =
      state.floor === 0
        ? names[0]
        : state.x < -3.45 && state.z > -5.1
          ? "Sala de retratos · planta superior"
          : state.x < 0.65 && state.z > -5.1
            ? "Observatorio Veyr · planta superior"
            : "Galería del rellano · planta superior";
    if (el("location").textContent !== place)
      el("location").textContent = place;
    const objective =
      state.floor === 1
        ? state.items.includes("Folio del rellano") &&
          state.items.includes("Carta de la raíz")
          ? "Las dos pruebas despiertan la raíz en el observatorio. Puedes regresar por la escalera."
          : "Explora las dos salas del rellano y conserva sus documentos."
        : state.seals.length === 3
          ? historicalEndingReadiness(state).ready
            ? "Las once pruebas y tu decisión permiten el final histórico en el umbral."
            : "Puedes cerrar el Intervalo temprano o continuar las investigaciones históricas."
          : !state.items.includes("Llave de latón")
            ? "Lee la carta y busca la llave junto al escritorio del vestíbulo."
            : !state.items.includes("Medallón Veyr")
              ? "Resuelve la caja astronómica del vestíbulo para abrir la biblioteca."
              : "Sigue las pistas de biblioteca, cripta y capilla para reunir tres sellos.";
    if (el("objective").textContent !== objective)
      el("objective").textContent = objective;
  }
  if (input.take("KeyC")) {
    targetZone =
      targetZones[(targetZones.indexOf(targetZone) + 1) % targetZones.length];
    el("target-zone").textContent = `OBJETIVO · ${targetNames[targetZone]}`;
    toast(
      targetZone === "head"
        ? "Cabeza: daño mayor, exige apuntar de frente."
        : targetZone === "arms"
          ? "Brazos: daño menor, retrasa el próximo ataque."
          : "Torso: golpe fiable.",
    );
  }
  if (state.room >= 8) {
    const objective = lateChapterForRoom(state.room)
      ? lateObjective(state)
      : state.room === 8
        ? romanObjective(state)
        : state.room === 9 || state.room === 10
          ? abbeyObjective(state)
          : state.room === 11 || state.room === 12
            ? mosaicObjective(state)
            : state.room === 13 || state.room === 14
              ? coastObjective(state)
              : state.room === 15 || state.room === 16
                ? starsObjective(state)
                : state.room === 17 || state.room === 18
                  ? quarryObjective(state)
                  : hospitalObjective(state);
    if (el("objective").textContent !== objective)
      el("objective").textContent = objective;
  }
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
        "death",
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
  const beforeMove = { x: state.x, z: state.z };
  let p: { x: number; z: number };
  if (state.room === 0) {
    const next = mansionMove(
      state.x,
      state.z,
      dx,
      dz,
      state.floor,
      world.obstacles,
      world.upperObstacles,
    );
    state.floor = next.level;
    p = next;
  } else p = move(state.x, state.z, dx, dz, world.obstacles);
  state.x = p.x;
  state.z = p.z;
  player.position.set(
    p.x,
    state.room === 0 ? mansionFloorHeight(p.x, p.z, state.floor) : 0,
    p.z,
  );
  if (len > 0.1) {
    player.rotation.y = Math.atan2(dx, dz);
    if (
      audibleFootstep(len, beforeMove, p) &&
      state.elapsed - audio.lastStep > 0.43
    ) {
      audio.step(
        state.room,
        c.run,
        state.room === 0 && onMansionStair(p.x, p.z, state.floor),
      );
      audio.lastStep = state.elapsed;
    }
  }
  const threatStart = performance.now();
  syncMansionThreat();
  if (qaMode && qaArchitectureOnly) {
    enemy.visible = false;
    player.visible = false;
  }
  aiCostFrame += performance.now() - threatStart;
  contact[0].position.copy(player.position).setY(player.position.y + 0.025);
  contact[1].position.copy(enemy.position).setY(enemy.position.y + 0.025);
  contact[1].visible = enemy.visible;
  threat.position.copy(enemy.position).setY(enemy.position.y + 0.035);
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
  const combatStart = performance.now();
  combat.update(
    dt,
    state,
    player,
    enemy,
    state.room === 0 && state.floor === 1
      ? world.upperObstacles
      : world.obstacles,
    lightAttack,
    (f, d) => audio.tone(f, d, "triangle"),
    toast,
    c.guard,
    heavyAttack,
    c.run || lightAttack || heavyAttack ? 1 : len > 0.1 ? 0.25 : 0,
    targetZone,
    combat.kind === "guest"
      ? isThreatOnCamera(camera, enemy, world.upperObstacles)
      : isObserved(
          state.x,
          state.z,
          player.rotation.y,
          enemy.position.x,
          enemy.position.z,
        ),
    state.room === 0
      ? { ground: world.obstacles, upper: world.upperObstacles }
      : undefined,
  );
  aiCostFrame += performance.now() - combatStart;
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
  setHudStyle(
    hud.hitFeedback,
    "opacity",
    String(combat.hurt > 0 ? (combat.guarding ? 0.18 : 0.36) : 0),
  );
  hud.hitFeedback.classList.toggle("blocked", combat.guarding);
  audio.ambient(state.elapsed, state.sanity);
  if (pendingRitualSound && audio.ritual(pendingRitualSound))
    pendingRitualSound = undefined;
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
  if (ritualVisual) {
    if (ritualVisual.update(dt))
      animateRitual(player, ritualVisual.elapsed / ritualVisual.duration);
    else {
      ritualVisual.dispose();
      ritualVisual = undefined;
    }
  }
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
  near = world.nearest(state.x, state.z, 1.9, player.position.y, state.floor);
  const inspectionFocus =
    (near &&
      [
        "ritual",
        "ritualSecret",
        "mansionEcho",
        "seal",
        "phase2Puzzle",
        "memoryChoice",
        "legacy",
        "galleryClue",
      ].includes(near.kind)) ||
    near?.level === 1
      ? new T.Vector3(
          near.x,
          near.level === 1 || near.kind === "galleryClue" ? 3.85 : 1.25,
          near.z,
        )
      : undefined;
  cinematic.update(
    camera,
    state.x,
    state.z,
    state.room,
    dt,
    settings.reduced,
    state.room === 0 && state.floor === 1
      ? world.upperObstacles
      : world.obstacles,
    {
      mode: settings.cameraMode,
      height: player.position.y,
      enemy: enemy.position,
      enemyKind: combat.kind,
      combat: enemy.visible && enemy.position.distanceTo(player.position) < 2.8,
      threat:
        enemy.visible &&
        state.room === 0 &&
        state.floor === 1 &&
        ["guest", "widow", "wrongReflection"].includes(combat.kind) &&
        enemy.position.distanceTo(player.position) < 5,
      focus: inspectionFocus,
    },
  );
  world.highlight.visible = Boolean(near);
  if (near)
    world.highlight.position.set(
      near.x,
      near.level === 1 || near.kind === "galleryClue" ? 2.715 : 0.075,
      near.z,
    );
  world.atmosphere.update(dt, state.elapsed, settings.reduced);
  const prompt = el("prompt");
  const promptText = interactionPrompt(near);
  if (prompt.textContent !== promptText) prompt.textContent = promptText;
  const promptDisplay = near ? "block" : "none";
  if (prompt.style.display !== promptDisplay)
    prompt.style.display = promptDisplay;
  if (input.take("KeyE") && near) interact(near);
  state.elapsed += dt;
  setHudStyle(hud.health, "width", state.health + "%");
  setHudStyle(hud.sanity, "width", state.sanity + "%");
  el("hud").classList.toggle("critical", state.health <= 30);
  el("hud").classList.toggle(
    "unstable",
    state.sanity <= 35 && !settings.reduceDistortion,
  );
  setHudText(hud.hptext, String(Math.ceil(state.health)));
  setHudText(hud.sptext, String(Math.ceil(state.sanity)));
  setHudStyle(hud.stamina, "width", combat.stamina + "%");
  setHudText(hud.sttext, String(Math.ceil(combat.stamina)));
  setHudStyle(
    hud.veil,
    "opacity",
    String(
      sanity.update(
        state,
        world,
        settings,
        toast,
        (event) => audio.sanityEvent(event),
        enemy.visible &&
          ["chase", "windup", "attack", "recover"].includes(combat.aiState),
      ),
    ),
  );
  terror.update(
    dt,
    player,
    enemy,
    combat,
    audio,
    settings,
    state.elapsed,
    state.sanity,
    !state.defeated.includes("mansion-widow"),
  );
}
let last = performance.now();
let nextMenuMove = 0;
let aiCostFrame = 0;
function frame(now: number) {
  requestAnimationFrame(frame);
  const interval = now - last;
  const dt = simulationDeltaSeconds(interval);
  last = now;
  aiCostFrame = 0;
  const updateStart = performance.now();
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
    if (input.take("Space") && started && !state.ended && state.health > 0)
      resume();
    if (input.take("Escape") && started && !state.ended && state.health > 0)
      resume();
    if (input.take("KeyE")) {
      const b = el("panel").querySelector<HTMLButtonElement>("button:focus");
      b?.click();
    }
    if (input.take("Tab") && started && !state.ended && state.health > 0)
      resume();
  }
  if (!started && world) {
    camera.position.set(
      settings.reduced || matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : Math.sin(now * 0.00008) * 3,
      3.2,
      6.7,
    );
    camera.lookAt(0, 1, -2);
    if (el("overlay").classList.contains("overlay--title"))
      audio.menuAmbient(now / 1000);
  }
  if (toastTime > 0 && !paused) {
    toastTime -= dt;
    if (toastTime <= 0) el("toast").textContent = "";
  }
  input.end();
  if (world && !graphicsLost) {
    world.shadowBudget.apply(world.shadowLight, now);
    if (qaMode && qaCameraView && started) {
      camera.position.copy(qaCameraView.eye);
      camera.lookAt(qaCameraView.target);
    }
    const start = performance.now();
    gpuTimer?.begin();
    renderer.render(world.scene, camera);
    gpuTimer?.end();
    if (started && !paused)
      metrics.record(
        interval,
        performance.now() - start,
        start - updateStart,
        aiCostFrame,
      );
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
renderer.domElement.addEventListener("webglcontextlost", (event) => {
  event.preventDefault();
  graphicsLost = true;
  gpuTimer?.contextLost();
  if (started)
    panel(
      "<h2>Gráficos interrumpidos</h2><p>Esperando a que se recupere la GPU.</p>",
    );
});
renderer.domElement.addEventListener("webglcontextrestored", () => {
  gpuTimer?.contextRestored();
  applyQuality(renderer, settings.quality);
  world.shadowLight.shadow.needsUpdate = true;
  graphicsLost = false;
  if (started) menu();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && started && !paused) menu();
});
function sceneProfile() {
  const geometries = new Set<T.BufferGeometry>();
  const materials = new Set<T.Material>();
  const textures = new Set<T.Texture>();
  const lights = { hemisphere: 0, directional: 0, spot: 0, point: 0 };
  let meshes = 0;
  let visibleMeshes = 0;
  let transparentMeshes = 0;
  let shadowCastingLights = 0;
  let shadowCastingMeshes = 0;
  let particles = 0;
  let mistMeshes = 0;
  world.scene.traverse((object) => {
    if (object instanceof T.HemisphereLight) lights.hemisphere++;
    if (object instanceof T.DirectionalLight) lights.directional++;
    if (object instanceof T.SpotLight) lights.spot++;
    if (object instanceof T.PointLight) lights.point++;
    if (
      (object instanceof T.DirectionalLight ||
        object instanceof T.SpotLight ||
        object instanceof T.PointLight) &&
      object.castShadow
    )
      shadowCastingLights++;
    if (object instanceof T.Mesh || object instanceof T.Points) {
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material]) {
        materials.add(material);
        if (material.transparent && object instanceof T.Mesh)
          transparentMeshes++;
      }
    }
    if (object instanceof T.Mesh) {
      meshes++;
      if (object.castShadow) shadowCastingMeshes++;
      if (object.name === "Bruma localizada junto a los muros") mistMeshes++;
    }
    if (object instanceof T.Points)
      particles += object.geometry.attributes.position?.count ?? 0;
  });
  world.scene.traverseVisible((object) => {
    if (object instanceof T.Mesh) visibleMeshes++;
  });
  for (const material of materials)
    if (material instanceof T.MeshStandardMaterial)
      for (const texture of [
        material.map,
        material.roughnessMap,
        material.normalMap,
        material.emissiveMap,
      ])
        if (texture) textures.add(texture);
  return {
    meshes,
    visibleMeshes,
    geometries: geometries.size,
    materials: materials.size,
    textures: textures.size,
    transparentMeshes,
    shadowCastingMeshes,
    shadowCastingLights,
    lights,
    particles,
    mistMeshes,
  };
}
export function inspect() {
  return {
    state: structuredClone(state),
    started,
    interaction: near ? { id: near.id, name: near.name } : null,
    paused,
    overlayHidden: el("overlay").hidden,
    titleTransitionClosed: el("title-transition").classList.contains(
      "title-transition--closed",
    ),
    focused: document.activeElement?.tagName ?? null,
    pressedKeys: [...input.keys],
    camera: camera.position.toArray(),
    target: player.position.toArray(),
    combat: {
      enemyHealth: combat.health,
      defeatedId: combat.defeatedId,
      windup: combat.windup,
      guarding: combat.guarding,
      animation: combat.animation,
      kind: combat.kind,
      aiState: combat.aiState,
      route: combat.routeDiagnostic,
      phase: combat.phase,
      vulnerable: combat.vulnerable,
      stamina: combat.stamina,
      dodge: combat.dodge,
      hurt: combat.hurt,
      hitsReceived: combat.hitsReceived,
      lastPlayerHit: combat.lastPlayerHit,
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
    playerY: player.position.y,
    limbPose: player.userData.rig?.leftLeg.rotation.x,
    enemy: {
      name: enemy.name,
      position: enemy.position.toArray(),
      visible: enemy.visible,
      selectedKind: currentThreatKind,
      expectedKind: state.room === 0 ? mansionThreatAt(state) : undefined,
    },
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
  // The benchmark reads this every display frame. Keep it allocation-free so
  // measurement cannot trigger the cloning and sorting in inspect().
  const benchmarkState = {
    paused: true,
    room: 0,
    x: 0,
    z: 0,
    health: 0,
    elapsed: 0,
    enemyX: 0,
    enemyZ: 0,
    enemyVisible: false,
    aiState: "",
    eventCount: 0,
    eventId: "",
    eventActive: false,
  };
  Object.defineProperty(window, "sanityBenchmarkState", {
    value: () => {
      benchmarkState.paused = paused;
      benchmarkState.room = state.room;
      benchmarkState.x = state.x;
      benchmarkState.z = state.z;
      benchmarkState.health = state.health;
      benchmarkState.elapsed = state.elapsed;
      benchmarkState.enemyX = enemy.position.x;
      benchmarkState.enemyZ = enemy.position.z;
      benchmarkState.enemyVisible = enemy.visible;
      benchmarkState.aiState = combat.aiState;
      benchmarkState.eventCount = sanity.eventCount;
      benchmarkState.eventId = sanity.activeId;
      benchmarkState.eventActive = sanity.isEventActive(state.elapsed);
      return benchmarkState;
    },
    configurable: true,
  });
  Object.defineProperty(window, "sanityInspect", {
    value: inspect,
    configurable: true,
  });
  Object.defineProperty(window, "sanityRoomAudit", {
    value: () => ({
      interactables: world.objects.map(
        ({ id, name, kind, target, x, z, level }) => ({
          id,
          name,
          kind,
          target,
          x,
          z,
          level,
        }),
      ),
      obstacles: world.obstacles.length,
      navigationObstacles: (state.room === 0 && state.floor === 1
        ? world.upperObstacles
        : world.obstacles
      ).map(({ id, x, z, w, d, y, height }) => ({ id, x, z, w, d, y, height })),
      upperObstacles: world.upperObstacles.length,
      lights: world.lights.length,
    }),
    configurable: true,
  });

  Object.defineProperty(window, "sanityResetMetrics", {
    value: () => {
      metrics.clear();
      gpuTimer?.reset();
    },
    configurable: true,
  });
  Object.defineProperty(window, "sanitySceneProfile", {
    value: sceneProfile,
    configurable: true,
  });
  if (qaMode) {
    let markers: T.Group | undefined;
    const clearMarkers = () => {
      if (!markers) return;
      markers.parent?.remove(markers);
      markers.traverse((object) => {
        if (!(object instanceof T.LineSegments || object instanceof T.Line))
          return;
        object.geometry.dispose();
        (object.material as T.Material).dispose();
      });
      markers = undefined;
    };
    const markerGroup = () => {
      clearMarkers();
      markers = new T.Group();
      world.scene.add(markers);
      return markers;
    };
    Object.defineProperty(window, "sanityQa", {
      value: {
        openRoom(room: number, floor: 0 | 1 = 0) {
          if (!Number.isInteger(room) || room < 0 || room >= names.length)
            throw new RangeError(`Sala inválida: ${room}`);
          if (floor === 1 && room !== 0)
            throw new RangeError("Solo la mansión tiene galería superior.");
          clearMarkers();
          qaCameraView = undefined;
          qaArchitectureOnly = false;
          if (player) player.visible = true;
          const diagnostic = fresh();
          diagnostic.room = room;
          diagnostic.floor = floor;
          diagnostic.x = floor ? 5.3 : 0;
          diagnostic.z = floor ? -5.8 : 5.2;
          begin(diagnostic);
          return inspect();
        },
        architectureView(
          eye: [number, number, number],
          target: [number, number, number],
        ) {
          if (![...eye, ...target].every(Number.isFinite))
            throw new TypeError("Cámara de diagnóstico no finita.");
          qaArchitectureOnly = true;
          qaCameraView = {
            eye: new T.Vector3(...eye),
            target: new T.Vector3(...target),
          };
          return { eye, target };
        },
        position(x: number, z: number) {
          const obstacles =
            state.room === 0 && state.floor === 1
              ? world.upperObstacles
              : world.obstacles;
          if (
            !Number.isFinite(x) ||
            !Number.isFinite(z) ||
            blocked(x, z, obstacles) ||
            (state.room === 0 && state.floor === 1 && !upperWalkable(x, z))
          )
            throw new RangeError(`Punto de diagnóstico bloqueado: ${x},${z}`);
          state.x = x;
          state.z = z;
          player.position.set(
            x,
            state.room === 0 ? mansionFloorHeight(x, z, state.floor) : 0,
            z,
          );
          return inspect();
        },
        /** Isolated rendering diagnosis only; never available in production. */
        setSanity(value: number) {
          if (!Number.isFinite(value) || value < 0 || value > 100)
            throw new RangeError(`Cordura de diagnóstico inválida: ${value}`);
          state.sanity = value;
          return inspect();
        },
        inspect,
        objects: () =>
          world.objects.map(({ id, kind, x, z, level }) => ({
            id,
            kind,
            x,
            z,
            level,
          })),
        obstacles: () =>
          structuredClone(
            state.room === 0 && state.floor === 1
              ? world.upperObstacles
              : world.obstacles,
          ),
        walkableAt(x: number, z: number, floor: 0 | 1 = state.floor) {
          const obstacles =
            state.room === 0 && floor === 1
              ? world.upperObstacles
              : world.obstacles;
          return (
            Number.isFinite(x) &&
            Number.isFinite(z) &&
            !blocked(x, z, obstacles) &&
            (state.room !== 0 || floor === 0 || upperWalkable(x, z))
          );
        },
        showColliders() {
          const group = markerGroup();
          const obstacles =
            state.room === 0 && state.floor === 1
              ? world.upperObstacles
              : world.obstacles;
          for (const obstacle of obstacles) {
            const bottom = obstacle.y ?? (state.floor ? 2.64 : 0);
            const box = new T.Box3(
              new T.Vector3(
                obstacle.x - obstacle.w / 2,
                bottom,
                obstacle.z - obstacle.d / 2,
              ),
              new T.Vector3(
                obstacle.x + obstacle.w / 2,
                bottom + (obstacle.height ?? 2),
                obstacle.z + obstacle.d / 2,
              ),
            );
            group.add(new T.Box3Helper(box, obstacle.id ? 0xffaa55 : 0x66ccbb));
          }
          return obstacles.length;
        },
        showRoute(points: Array<{ x: number; z: number }>) {
          if (
            !Array.isArray(points) ||
            !points.every(
              (point) => Number.isFinite(point.x) && Number.isFinite(point.z),
            )
          )
            throw new TypeError("La ruta debe contener posiciones finitas.");
          const group = markerGroup();
          const height = state.floor ? 2.75 : 0.12;
          group.add(
            new T.Line(
              new T.BufferGeometry().setFromPoints([
                new T.Vector3(state.x, height, state.z),
                ...points.map(
                  (point) => new T.Vector3(point.x, height, point.z),
                ),
              ]),
              new T.LineBasicMaterial({ color: 0xe5ba77, depthTest: false }),
            ),
          );
          return points.length;
        },
        clear: clearMarkers,
      },
      configurable: true,
    });
  }
}
