import * as T from "three";
import { WebGPURenderer } from "three/webgpu";
import { createExperimentalRenderer, type Backend } from "./webgpu-renderer";

const viewport = document.querySelector<HTMLElement>("#viewport")!;
const status = document.querySelector<HTMLElement>("#status")!;
const error = document.querySelector<HTMLElement>("#error")!;
const toggle = document.querySelector<HTMLButtonElement>("#toggle")!;
let renderer: WebGPURenderer | T.WebGLRenderer | undefined;
let running = true;
const scene = new T.Scene();
scene.background = new T.Color(0x090f16);
scene.fog = new T.FogExp2(0x101a24, 0.045);
const camera = new T.PerspectiveCamera(62, 1, 0.1, 100);
camera.position.set(0, 2.8, 9);
camera.lookAt(0, 1.4, 0);
const geometry = new T.BoxGeometry(1, 1, 1);
const stone = new T.MeshStandardMaterial({color:0x53616a,roughness:0.92});
const brass = new T.MeshStandardMaterial({color:0xa78c55,metalness:0.65,roughness:0.35});
const floor = new T.Mesh(new T.BoxGeometry(18,0.25,24),stone);
floor.position.y = -0.15;scene.add(floor);
for (const x of [-7,7]) for (let z=-10;z<=10;z+=2) {
 const pillar = new T.Mesh(geometry,stone);
 pillar.position.set(x,2,z);pillar.scale.set(0.9,4,0.9);scene.add(pillar);
}
const altar = new T.Mesh(geometry,brass);
altar.position.set(0,1.1,-3);altar.scale.set(2,2.2,1.2);scene.add(altar);
scene.add(new T.AmbientLight(0x718399,0.55));
const lamp = new T.PointLight(0xffba75,38,18,2);
lamp.position.set(0,4,0);scene.add(lamp);
toggle.addEventListener("click",()=>{lamp.visible=!lamp.visible;});
function resize(){
 if(!renderer)return;
 const w=Math.max(1,viewport.clientWidth),h=Math.max(1,viewport.clientHeight);
 camera.aspect=w/h;camera.updateProjectionMatrix();
 renderer.setSize(w,h);
}
async function start(){
 try{
  const result=await createExperimentalRenderer();
  renderer=result.renderer;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  viewport.append(renderer.domElement);
  status.textContent="Backend: "+result.backend+" · escena de prueba";
  window.addEventListener("resize",resize);resize();
  renderer.setAnimationLoop(()=>{if(running)renderer?.render(scene,camera);});
 }catch(e){status.textContent="No se pudo iniciar";error.textContent=String(e);}
}
window.addEventListener("pagehide",()=>{
 running=false;renderer?.setAnimationLoop(null);renderer?.dispose();
 floor.geometry.dispose();geometry.dispose();stone.dispose();brass.dispose();
});
void start();
