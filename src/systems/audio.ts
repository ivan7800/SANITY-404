export class Audio {
  ctx?: AudioContext;
  gain?: GainNode;
  volume = 0.35;
  lastStep = 0;
  room = 0;
  reduceAudio = false;
  private windLevel?: GainNode;
  private rainLevel?: GainNode;
  private ambientBus?: GainNode;
  private nextAmbient = 7;
  private nextMenuTick = 0;
  private nextMenuCreak = 0;
  private menuAmbientStarted = false;
  private silenceUntil = 0;
  private activeTones = 0;
  get activeVoices() {
    return this.activeTones;
  }
  async start() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.gain = this.ctx.createGain();
      this.gain.gain.value = this.volume;
      this.gain.connect(this.ctx.destination);
      this.ambientBus = this.ctx.createGain();
      this.ambientBus.connect(this.gain);
      // Original filtered wind, generated once; no external audio assets.
      const buffer = this.ctx.createBuffer(
        1,
        this.ctx.sampleRate * 2,
        this.ctx.sampleRate,
      );
      const samples = buffer.getChannelData(0);
      let seed = 404;
      for (let i = 0; i < samples.length; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        samples[i] = seed / 2147483648 - 1;
      }
      const wind = this.ctx.createBufferSource(),
        filter = this.ctx.createBiquadFilter(),
        level = this.ctx.createGain();
      wind.buffer = buffer;
      wind.loop = true;
      filter.type = "lowpass";
      filter.frequency.value = 260;
      level.gain.value = 0.035;
      this.windLevel = level;
      wind.connect(filter);
      filter.connect(level);
      level.connect(this.ambientBus);
      wind.start();
      const rain = this.ctx.createBufferSource(),
        rainFilter = this.ctx.createBiquadFilter(),
        rainLevel = this.ctx.createGain();
      rain.buffer = buffer;
      rain.loop = true;
      rainFilter.type = "highpass";
      rainFilter.frequency.value = 900;
      rainLevel.gain.value = 0;
      rain.connect(rainFilter);
      rainFilter.connect(rainLevel);
      rainLevel.connect(this.ambientBus);
      rain.start();
      this.rainLevel = rainLevel;
      for (const f of [55, 82.41, 110.3]) {
        const o = this.ctx.createOscillator(),
          g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = f;
        g.gain.value = 0.035;
        o.connect(g);
        g.connect(this.ambientBus);
        o.start();
      }
    }
    this.setRoom(this.room);
    await this.ctx.resume();
  }
  tone(f = 180, d = 0.15, type: OscillatorType = "sine") {
    if (
      !this.ctx ||
      !this.gain ||
      this.ctx.state !== "running" ||
      this.activeTones >= 12
    )
      return;
    this.activeTones++;
    const o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      f * 0.55,
      this.ctx.currentTime + d,
    );
    g.gain.setValueAtTime(
      this.reduceAudio ? 0.055 : 0.15,
      this.ctx.currentTime,
    );
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d);
    o.connect(g);
    g.connect(this.gain);
    o.start();
    o.stop(this.ctx.currentTime + d);
    o.onended = () => {
      this.activeTones--;
      o.disconnect();
      g.disconnect();
    };
  }
  directional(frequency: number, pan: number, duration = 0.45, delay = 0) {
    if (
      !this.ctx ||
      !this.gain ||
      this.ctx.state !== "running" ||
      this.activeTones >= 12 ||
      this.reduceAudio
    )
      return;
    this.activeTones++;
    const oscillator = this.ctx.createOscillator();
    const level = this.ctx.createGain();
    const stereo = this.ctx.createStereoPanner();
    const now = this.ctx.currentTime + delay;
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      frequency * 0.76,
      now + duration,
    );
    level.gain.setValueAtTime(0.001, now);
    level.gain.linearRampToValueAtTime(0.09, now + 0.05);
    level.gain.exponentialRampToValueAtTime(0.001, now + duration);
    stereo.pan.value = Math.max(-1, Math.min(1, pan));
    oscillator.connect(level);
    level.connect(stereo);
    stereo.connect(this.gain);
    oscillator.start(now);
    oscillator.stop(now + duration);
    oscillator.onended = () => {
      this.activeTones--;
      oscillator.disconnect();
      level.disconnect();
      stereo.disconnect();
    };
  }
  /** A layered lament. Distance attenuates the source before it reaches the stair. */
  lament(pan: number, distance = 0) {
    if (
      !this.ctx ||
      !this.gain ||
      this.ctx.state !== "running" ||
      this.activeTones > 9 ||
      this.reduceAudio
    )
      return false;
    this.activeTones++;
    const now = this.ctx.currentTime;
    const stereo = this.ctx.createStereoPanner();
    stereo.pan.value = Math.max(-1, Math.min(1, pan));
    stereo.connect(this.gain);
    let ended = 0;
    for (const [frequency, level] of [
      [196, 0.042],
      [294, 0.019],
    ] as const) {
      const voice = this.ctx.createOscillator();
      const envelope = this.ctx.createGain();
      voice.type = "sine";
      voice.frequency.setValueAtTime(frequency, now);
      voice.frequency.linearRampToValueAtTime(frequency * 1.24, now + 0.65);
      voice.frequency.linearRampToValueAtTime(frequency * 0.73, now + 1.5);
      envelope.gain.setValueAtTime(0.001, now);
      envelope.gain.linearRampToValueAtTime(
        level / (1 + Math.max(0, distance) * 0.38),
        now + 0.23,
      );
      envelope.gain.exponentialRampToValueAtTime(0.001, now + 1.55);
      voice.connect(envelope);
      envelope.connect(stereo);
      voice.start(now);
      voice.stop(now + 1.55);
      voice.onended = () => {
        voice.disconnect();
        envelope.disconnect();
        if (++ended === 2) {
          this.activeTones--;
          stereo.disconnect();
        }
      };
    }
    return true;
  }
  silence(time: number, seconds: number) {
    this.silenceUntil = Math.max(this.silenceUntil, time + seconds);
    if (!this.ctx || !this.ambientBus) return;
    const now = this.ctx.currentTime;
    const gain = this.ambientBus.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.setTargetAtTime(0.015, now, 0.18);
    gain.setTargetAtTime(1, now + seconds, 0.5);
  }
  ambient(time: number, sanity: number) {
    if (time < this.nextAmbient || time < this.silenceUntil) return;
    this.nextAmbient = time + 9 + Math.sin(time) * 2;
    // Slow wood creak; interval and pitch respond to sanity without sudden peaks.
    this.tone(
      (this.room >= 27
        ? 72
        : this.room >= 25
          ? 174
          : this.room >= 23
            ? 118
            : this.room >= 21
              ? 142
              : this.room === 20
                ? 84
                : this.room === 19
                  ? 132
                  : this.room === 18
                    ? 64
                    : this.room === 17
                      ? 96
                      : this.room === 16
                        ? 108
                        : this.room === 15
                          ? 156
                          : this.room === 14
                            ? 72
                            : this.room === 13
                              ? 138
                              : this.room === 12
                                ? 92
                                : this.room === 11
                                  ? 164
                                  : this.room === 7
                                    ? 82
                                    : this.room === 6
                                      ? 155
                                      : 125) +
        sanity * 0.35,
      0.65,
      "triangle",
    );
  }
  /** Sparse title cues; existing wind and drone provide the continuous bed. */
  menuAmbient(time: number) {
    if (!this.ctx || this.ctx.state !== "running" || this.volume === 0) return;
    if (!this.menuAmbientStarted) {
      this.menuAmbientStarted = true;
      this.nextMenuTick = time + 2.4;
      this.nextMenuCreak = time + 7;
      return;
    }
    if (time >= this.nextMenuTick) {
      this.nextMenuTick = time + 2.4;
      this.tone(210, 0.07, "triangle");
    }
    if (time >= this.nextMenuCreak) {
      this.nextMenuCreak = time + 12.5 + Math.sin(time * 0.31) * 2;
      this.tone(69, 0.52, "triangle");
    }
  }
  setRoom(room: number) {
    this.room = room;
    this.menuAmbientStarted = false;
    this.nextAmbient = 7;
    this.silenceUntil = 0;
    if (!this.ctx) return;
    this.windLevel?.gain.setTargetAtTime(
      room === 6 ? 0.055 : room === 7 ? 0.016 : 0.035,
      this.ctx.currentTime,
      0.5,
    );
    this.rainLevel?.gain.setTargetAtTime(
      room === 6 ? 0.045 : 0,
      this.ctx.currentTime,
      0.5,
    );
  }
  setReduceAudio(value: boolean) {
    this.reduceAudio = value;
  }
  step(room: number, running: boolean, onWoodStairs = false) {
    this.tone(
      onWoodStairs ? 63 : room === 6 ? 100 : room === 7 ? 58 : 75,
      onWoodStairs ? 0.15 : running ? 0.045 : 0.07,
      "triangle",
    );
  }
  cue(kind: "door" | "mechanism" | "enemy" | "whisper") {
    const frequency = { door: 105, mechanism: 305, enemy: 62, whisper: 190 }[
      kind
    ];
    this.tone(
      frequency,
      kind === "whisper" ? 0.7 : 0.22,
      kind === "enemy" ? "sawtooth" : "triangle",
    );
    if (kind === "mechanism" || kind === "whisper")
      this.tone(frequency * 1.48, 0.34, "sine");
  }
  /** Three ascending, slightly detuned notes distinguish the house's two rites. */
  ritual(kind: "veil" | "reading") {
    if (
      !this.ctx ||
      !this.gain ||
      this.ctx.state !== "running" ||
      this.activeTones > 8
    )
      return false;
    const base = kind === "veil" ? 164.81 : 146.83;
    for (let i = 0; i < 3; i++) {
      const oscillator = this.ctx.createOscillator();
      const level = this.ctx.createGain();
      const start = this.ctx.currentTime + i * 0.18;
      oscillator.type = i === 1 ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(base * [1, 1.25, 1.5][i], start);
      oscillator.frequency.linearRampToValueAtTime(
        base * [1.06, 1.32, 1.6][i],
        start + 0.42,
      );
      level.gain.setValueAtTime(0.001, start);
      level.gain.linearRampToValueAtTime(
        this.reduceAudio ? 0.025 : 0.075,
        start + 0.04,
      );
      level.gain.exponentialRampToValueAtTime(0.001, start + 0.48);
      oscillator.connect(level);
      level.connect(this.gain);
      this.activeTones++;
      oscillator.start(start);
      oscillator.stop(start + 0.5);
      oscillator.onended = () => {
        this.activeTones--;
        oscillator.disconnect();
        level.disconnect();
      };
    }
    return true;
  }
  sanityEvent(id: string) {
    if (id.startsWith("upper-")) {
      this.directional(
        id.includes("widow") ? 118 : id.includes("root") ? 62 : 192,
        id.includes("gallery") ? -0.7 : 0.7,
        0.8,
      );
      this.tone(id.includes("root") ? 55 : 140, 0.55, "triangle");
    } else if (id.startsWith("press-")) {
      this.tone(132, 0.45, "square");
      this.tone(88, 0.75, "triangle");
    } else if (id.startsWith("veyr-")) {
      this.tone(185, 0.7, "sine");
      this.tone(92, 0.5, "triangle");
    } else if (id.startsWith("theatre-")) {
      this.tone(220, 0.28, "sine");
      this.tone(330, 0.6, "sine");
    } else if (id.startsWith("photo-")) {
      this.tone(110, 0.85, "sawtooth");
    } else if (id === "abbey-bell") {
      this.tone(196, 1.1, "sine");
      this.tone(294, 0.8, "sine");
    } else if (id === "roman-ritual") {
      this.tone(110, 0.9, "triangle");
      this.tone(165, 0.65, "sine");
    } else if (id === "mosaic-false-face") {
      this.tone(174, 0.7, "triangle");
      this.tone(261, 0.48, "sine");
    } else if (id === "scriptorium-margin") {
      this.tone(245, 0.5, "triangle");
    } else {
      this.cue(
        id.includes("door") || id.includes("aisle") ? "door" : "whisper",
      );
    }
  }
  setVolume(v: number) {
    this.volume = v;
    if (this.gain && this.ctx)
      this.gain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
  }
  pause() {
    void this.ctx?.suspend();
  }
  resume() {
    void this.ctx?.resume();
  }
  dispose() {
    void this.ctx?.close();
    this.ctx = undefined;
    this.gain = undefined;
    this.ambientBus = undefined;
  }
}
