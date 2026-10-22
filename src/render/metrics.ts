export class FrameMetrics {
  private times: number[] = [];
  private render: number[] = [];
  record(interval: number, cpu: number) {
    if (interval <= 0 || !Number.isFinite(interval)) return;
    this.times.push(interval);
    this.render.push(cpu);
    if (this.times.length > 600) {
      this.times.shift();
      this.render.shift();
    }
  }
  clear() {
    this.times = [];
    this.render = [];
  }
  snapshot() {
    const sorted = [...this.times].sort((a, b) => a - b),
      cpu = [...this.render].sort((a, b) => a - b);
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
      averageFps: mean ? 1000 / mean : 0,
    };
  }
}
