/** Clamp mixed keyboard/gamepad movement to a unit circle. */
export function normalizeMovement(x: number, z: number) {
  const length = Math.hypot(x, z);
  const scale = length > 1 ? 1 / length : 1;
  return { x: x * scale, z: z * scale };
}

/** Radial dead zone keeps diagonal gamepad movement even. */
export function radialStick(x: number, z: number, deadZone = 0.16) {
  const length = Math.min(1, Math.hypot(x, z));
  if (length <= deadZone) return { x: 0, z: 0 };
  const gain = (length - deadZone) / ((1 - deadZone) * Math.hypot(x, z));
  return { x: x * gain, z: z * gain };
}

/** Translate WASD into camera-relative ground movement for the Modern view. */
export function cameraRelativeMovement(
  x: number,
  z: number,
  forwardX: number,
  forwardZ: number,
) {
  const length = Math.hypot(forwardX, forwardZ);
  if (length < 0.0001) return normalizeMovement(x, z);
  const fx = forwardX / length;
  const fz = forwardZ / length;
  return normalizeMovement(fz * -x - fx * z, fx * x - fz * z);
}

export class Input {
  keys = new Set<string>();
  pressed = new Set<string>();
  yaw = 0;
  mouse = 0;
  private previous = new Set<string>();
  constructor(canvas: HTMLCanvasElement) {
    addEventListener("keydown", (e) => {
      if (e.code === "Tab" && !document.getElementById("overlay")?.hidden)
        return;
      if (
        [
          "Space",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Tab",
        ].includes(e.code)
      )
        e.preventDefault();
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
    });
    addEventListener("keyup", (e) => this.keys.delete(e.code));
    addEventListener("blur", () => this.clear());
    canvas.addEventListener("pointerdown", (e) => {
      if (e.button === 0) this.pressed.add("Space");
      if (e.button === 2) this.pressed.add("KeyJ");
    });
    canvas.addEventListener("pointermove", (e) => {
      // Middle-button drag rotates the Modern camera without triggering attacks.
      if ((e.buttons & 4) !== 0) this.mouse -= e.movementX * 0.005;
    });
    canvas.addEventListener("auxclick", (e) => {
      if (e.button === 1) e.preventDefault();
    });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    (typeof document === "undefined"
      ? []
      : document.querySelectorAll<HTMLButtonElement>("[data-touch-key]")
    ).forEach((button) => {
      const key = button.dataset.touchKey!;
      const release = (event: PointerEvent) => {
        event.preventDefault();
        this.keys.delete(key);
      };
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        if (!this.keys.has(key)) this.pressed.add(key);
        this.keys.add(key);
      });
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("lostpointercapture", release);
    });
  }
  clear() {
    this.keys.clear();
    this.pressed.clear();
    this.mouse = 0;
  }
  poll() {
    const p = navigator.getGamepads?.()[0];
    if (p) {
      const map = [
        "KeyE",
        "Space",
        "KeyH",
        "Tab",
        null,
        "KeyJ",
        null,
        null,
        "KeyM",
        "Escape",
        null,
        "KeyV",
      ];
      p.buttons.forEach((b, i) => {
        const key = map[i];
        if (key && b.pressed && !this.previous.has(key)) this.pressed.add(key);
        if (key) {
          if (b.pressed) this.previous.add(key);
          else this.previous.delete(key);
        }
      });
    }
    const stick = radialStick(p?.axes[0] ?? 0, p?.axes[1] ?? 0);
    const movement = normalizeMovement(
      Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) -
        Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft")) +
        stick.x,
      Number(this.keys.has("KeyS") || this.keys.has("ArrowDown")) -
        Number(this.keys.has("KeyW") || this.keys.has("ArrowUp")) +
        stick.z,
    );
    const look = p && Math.abs(p.axes[2] ?? 0) > 0.16 ? p.axes[2] : 0;
    return {
      ...movement,
      turn:
        (Number(this.keys.has("KeyQ")) - Number(this.keys.has("KeyR")) - look) *
        1.8,
      guard: this.keys.has("KeyF") || Boolean(p?.buttons[4]?.pressed),
      run: this.keys.has("ShiftLeft") || Boolean(p?.buttons[10]?.pressed),
    };
  }
  take(key: string) {
    const yes = this.pressed.has(key);
    this.pressed.delete(key);
    return yes;
  }
  end() {
    this.pressed.clear();
    this.mouse = 0;
  }
}
