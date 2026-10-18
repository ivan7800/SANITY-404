export class Audio {
  ctx?: AudioContext;
  gain?: GainNode;
  volume = 0.35;
  lastStep = 0;
  room = 0;
  reduceAudio = false;
  private windLevel?: GainNode;
  private rainLevel?: GainNode;
  private nextAmbient = 7;
  async start() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.gain = this.ctx.createGain();
      this.gain.gain.value = this.volume;
      this.gain.connect(this.ctx.destination);
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
      level.connect(this.gain);
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
      rainLevel.connect(this.gain);
      rain.start();
      this.rainLevel = rainLevel;
      for (const f of [55, 82.41, 110.3]) {
        const o = this.ctx.createOscillator(),
          g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = f;
        g.gain.value = 0.035;
        o.connect(g);
        g.connect(this.gain);
        o.start();
      }
    }
    this.setRoom(this.room);
    await this.ctx.resume();
  }
  tone(f = 180, d = 0.15, type: OscillatorType = "sine") {
    if (!this.ctx || !this.gain) return;
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
      o.disconnect();
      g.disconnect();
    };
  }
  ambient(time: number, sanity: number) {
    if (time < this.nextAmbient) return;
    this.nextAmbient = time + 9 + Math.sin(time) * 2;
    // Slow wood creak; interval and pitch respond to sanity without sudden peaks.
    this.tone(
      (this.room === 7 ? 82 : this.room === 6 ? 155 : 125) + sanity * 0.35,
      0.65,
      "triangle",
    );
  }
  setRoom(room: number) {
    this.room = room;
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
  step(room: number, running: boolean) {
    this.tone(
      room === 6 ? 100 : room === 7 ? 58 : 75,
      running ? 0.045 : 0.07,
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
  sanityEvent(id: string) {
    this.cue(id.includes("door") || id.includes("aisle") ? "door" : "whisper");
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
}
