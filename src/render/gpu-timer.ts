/** Optional development-only GPU timing; asynchronous queries never wait for the GPU. */
export class GpuTimer {
  private gl: WebGL2RenderingContext;
  private ext: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null;
  private pending: WebGLQuery[] = [];
  private active: WebGLQuery | null = null;
  private times: number[] = [];
  constructor(canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext("webgl2")!;
    this.ext = this.gl.getExtension("EXT_disjoint_timer_query_webgl2");
  }
  begin() {
    const { gl, ext } = this;
    if (!ext) return;
    while (this.pending.length) {
      const oldest = this.pending[0];
      if (!gl.getQueryParameter(oldest, gl.QUERY_RESULT_AVAILABLE)) break;
      this.pending.shift();
      if (!gl.getParameter(ext.GPU_DISJOINT_EXT)) {
        this.times.push(gl.getQueryParameter(oldest, gl.QUERY_RESULT) / 1e6);
        if (this.times.length > 600) this.times.shift();
      }
      gl.deleteQuery(oldest);
    }
    if (this.pending.length >= 4) return;
    const query = gl.createQuery();
    if (!query) return;
    gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
    this.active = query;
  }
  end() {
    if (!this.active || !this.ext) return;
    this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
    this.pending.push(this.active);
    this.active = null;
  }
  reset() {
    this.times = [];
  }
  snapshot() {
    const sorted = [...this.times].sort((a, b) => a - b);
    return {
      available: !!this.ext,
      samples: sorted.length,
      medianMs: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
      p95Ms: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
    };
  }
}
