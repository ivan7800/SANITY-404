import * as T from "three";
import { WebGPURenderer } from "three/webgpu";

export type Backend = "webgpu" | "webgl2";
export type ExperimentalRenderer = WebGPURenderer | T.WebGLRenderer;

/** Isolated backend negotiation. The production game stays on WebGL2. */
export async function createExperimentalRenderer(): Promise<{
  renderer: ExperimentalRenderer;
  backend: Backend;
}> {
  if (typeof navigator !== "undefined" && "gpu" in navigator) {
    let candidate: WebGPURenderer | undefined;
    try {
      candidate = new WebGPURenderer({
        antialias: false,
        powerPreference: "high-performance",
        forceWebGL: false,
      });
      await candidate.init();
      return { renderer: candidate, backend: "webgpu" };
    } catch (error) {
      candidate?.dispose();
      console.warn("SANITY WebGPU unavailable, falling back to WebGL2", error);
    }
  }
  const renderer = new T.WebGLRenderer({
    antialias: false,
    powerPreference: "high-performance",
  });
  return { renderer, backend: "webgl2" };
}
