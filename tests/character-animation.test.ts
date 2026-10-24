import { describe, expect, it } from "vitest";
import {
  animateCharacter,
  animateDeath,
  animateRitual,
  character,
  type Rig,
} from "../src/world/character";

const rigOf = (actor: ReturnType<typeof character>) =>
  actor.userData.rig as Rig;

describe("animación articulada Fase 3", () => {
  it("conserva la fase al alternar caminar y correr", () => {
    const actor = character();
    animateCharacter(actor, 1, true, 0, false, 0, false, 1 / 60);
    const phase = actor.userData.stepPhase as number;
    animateCharacter(actor, 1 + 1 / 60, true, 0, false, 0, true, 1 / 60);
    const next = actor.userData.stepPhase as number;
    expect(next).toBeGreaterThan(phase);
    expect(next - phase).toBeLessThan(0.25);
    expect(actor.userData.runWeight).toBeGreaterThan(0);
    expect(actor.userData.runWeight).toBeLessThan(1);
  });

  it("suaviza la entrada y salida de la postura defensiva", () => {
    const actor = character();
    const rig = rigOf(actor);
    animateCharacter(actor, 0, false, 0, true, 0, false, 1 / 60);
    expect(actor.userData.defenceWeight).toBeGreaterThan(0);
    expect(actor.userData.defenceWeight).toBeLessThan(1);
    expect(rig.leftArm.rotation.z).toBeGreaterThan(0);
    const before = actor.userData.defenceWeight as number;
    animateCharacter(actor, 1 / 60, false, 0, false, 0, false, 1 / 60);
    expect(actor.userData.defenceWeight).toBeLessThan(before);
    expect(actor.userData.defenceWeight).toBeGreaterThan(0);
  });

  it("anima los faldones del abrigo sin afectar a la pose de reposo", () => {
    const actor = character();
    const rig = rigOf(actor);
    // The renderer batches both rigid tails into one draw call.
    expect(rig.coatTails.children.length).toBeGreaterThan(0);
    animateCharacter(actor, 0.2, false, 0, false, 0, false, 1 / 60);
    expect(rig.coatTails.rotation.x).toBeCloseTo(0);
    animateCharacter(actor, 0.4, true, 0, false, 0, true, 1 / 60);
    expect(rig.coatTails.rotation.x).toBeLessThan(0);
    animateDeath(actor, 0.9);
    expect(Number.isFinite(rig.coatTails.rotation.x)).toBe(true);
  });

  it("muestra una reacción de impacto que desaparece al recuperarse", () => {
    const actor = character();
    const rig = rigOf(actor);
    animateCharacter(actor, 0.1, false, 0, false, 0.3, false, 1 / 60);
    expect(rig.hips.rotation.x).toBeLessThan(0);
    expect(Number.isFinite(rig.head.rotation.z)).toBe(true);
    animateCharacter(actor, 0.2, false, 0, false, 0, false, 1 / 60);
    expect(rig.hips.rotation.x).toBeCloseTo(0);
    expect(rig.head.rotation.z).toBeCloseTo(0);
  });
  it("superpone un gesto ritual reversible y conserva su herramienta distintiva", () => {
    const actor = character();
    const rig = rigOf(actor);
    expect(actor.getObjectByName("elise-restoration-lens")).toBeDefined();
    animateCharacter(actor, 0, false);
    const before = rig.leftArm.rotation.x;
    animateRitual(actor, 0.5);
    expect(rig.leftArm.rotation.x).toBeLessThan(before);
    expect(rig.rightArm.rotation.x).toBeLessThan(before);
    animateCharacter(actor, 1, false);
    animateRitual(actor, 1);
    expect(rig.leftArm.rotation.x).toBeCloseTo(before);
  });
});
