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
      if (e.buttons === 2) this.mouse -= e.movementX * 0.005;
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
    const axis = (n: number) =>
      p && Math.abs(p.axes[n] ?? 0) > 0.16 ? p.axes[n] : 0;
    const x =
        Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) -
        Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft")) +
        axis(0);
    const z =
        Number(this.keys.has("KeyS") || this.keys.has("ArrowDown")) -
        Number(this.keys.has("KeyW") || this.keys.has("ArrowUp")) +
        axis(1);
    const magnitude = Math.hypot(x, z);
    const moveScale = magnitude > 1 ? 1 / magnitude : 1;
    return {
      x: x * moveScale,
      z: z * moveScale,
      turn:
        (Number(this.keys.has("KeyQ")) -
          Number(this.keys.has("KeyR")) -
          axis(2)) *
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
