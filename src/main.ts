import * as THREE from "three";
import Stats from "stats.js";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import PacManScene from "./PacManScene";

const width = window.innerWidth;
const height = window.innerHeight;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("app") as HTMLCanvasElement,
  antialias: true,
});
renderer.setSize(width, height);
renderer.setClearColor(0x000000, 1.0);

const mainCamera = new THREE.PerspectiveCamera(65, width / height, 0.1, 100);
// camera.position.set(-10, 10, 30);

// const orbitControls = new OrbitControls(camera, renderer.domElement);
// orbitControls.update();

const scene = new PacManScene(mainCamera);
scene.initialize();

const stats = new Stats();
stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

const animate = () => {
  stats.begin();
  scene.update();
  renderer.render(scene, mainCamera);
  stats.end();
  requestAnimationFrame(animate);
};

requestAnimationFrame(animate);

// Make the canvas responsive
window.addEventListener("resize", () => {
  mainCamera.aspect = window.innerWidth / window.innerHeight;
  mainCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
