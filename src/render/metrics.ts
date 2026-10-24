export class FrameMetrics {
  private times: number[] = [];
  private render: number[] = [];
  private update: number[] = [];
  private ai: number[] = [];
  record(interval: number, cpu: number, updateCpu = 0, aiCpu = 0) {
    if (interval <= 0 || !Number.isFinite(interval)) return;
    this.times.push(interval);
    this.render.push(cpu);
    this.update.push(updateCpu);
    this.ai.push(aiCpu);
    if (this.times.length > 600) {
      this.times.shift();
      this.render.shift();
      this.update.shift();
      this.ai.shift();
    }
  }
  clear() {
    this.times = [];
    this.render = [];
    this.update = [];
    this.ai = [];
  }
  snapshot() {
    const sorted = [...this.times].sort((a, b) => a - b),
      cpu = [...this.render].sort((a, b) => a - b),
      update = [...this.update].sort((a, b) => a - b),
      ai = [...this.ai].sort((a, b) => a - b);
    const at = (a: number[], p: number) =>
      a[Math.min(a.length - 1, Math.floor(a.length * p))] ?? 0;
    const mean =
      this.times.reduce((a, b) => a + b, 0) / Math.max(1, this.times.length);
    return {
      samples: this.times.length,
      frameMedianMs: at(sorted, 0.5),
      frameP95Ms: at(sorted, 0.95),
      renderMedianMs: at(cpu, 0.5),
      renderP95Ms: at(cpu, 0.95),
      updateMedianMs: at(update, 0.5),
      updateP95Ms: at(update, 0.95),
      aiMedianMs: at(ai, 0.5),
      aiP95Ms: at(ai, 0.95),
      averageFps: mean ? 1000 / mean : 0,
    };
  }
}
