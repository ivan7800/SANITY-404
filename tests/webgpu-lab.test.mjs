import {readFileSync} from "node:fs";
import {test} from "node:test";
import assert from "node:assert/strict";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("experimental HTML points to isolated entry",()=>{
 assert.match(read("webgpu-lab.html"),/src\/experiments\/webgpu-lab\.ts/);
});
test("backend initializes WebGPU and falls back to WebGL2",()=>{
 const src=read("src/experiments/webgpu-renderer.ts");
 assert.match(src,/await candidate\.init\(\)/);
 assert.match(src,/new T\.WebGLRenderer/);
 assert.match(src,/candidate\?\.dispose\(\)/);
});
test("production entry remains WebGL2",()=>{
 assert.match(read("src/main.ts"),/new T\.WebGLRenderer/);
 assert.doesNotMatch(read("src/main.ts"),/createExperimentalRenderer/);
});
test("experimental scene never touches save system",()=>{
 const src=read("src/experiments/webgpu-lab.ts");
 assert.doesNotMatch(src,/localStorage|writeSave|readSave/);
});
