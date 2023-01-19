import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as dat from "dat.gui";

// import PacManScene from "./PacManScene";

const width = window.innerWidth;
const height = window.innerHeight;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("app") as HTMLCanvasElement,
});
renderer.setSize(width, height);

const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
camera.position.set(-10, 30, 30);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.update();

const scene = new THREE.Scene();

// const scene = new PacManScene(camera);
// scene.initialize();

const exesHelper = new THREE.AxesHelper(3);
scene.add(exesHelper);

// Lighting
const light = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(light);

const spotLight = new THREE.SpotLight(0xffffff);
scene.add(spotLight);
spotLight.position.set(-100, 100, 0);
spotLight.castShadow = true;
spotLight.angle = 0.2;

const sLightHelper = new THREE.SpotLightHelper(spotLight);
scene.add(sLightHelper);

// PlaneMesh
const planeMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({
    color: 0xeaff00,
    side: THREE.DoubleSide,
  })
);
scene.add(planeMesh);
planeMesh.rotation.x = Math.PI * 0.5;
planeMesh.receiveShadow = true;

const gridHelper = new THREE.GridHelper(30);
scene.add(gridHelper);

//#region Sphere
const SphereGeometry = new THREE.SphereGeometry(4, 50, 50);
const sphereMaterial = new THREE.MeshStandardMaterial({
  color: 0x0000ff,
  wireframe: false,
});
const sphere = new THREE.Mesh(SphereGeometry, sphereMaterial);
scene.add(sphere);

sphere.position.set(-7.5, 0, 0);
sphere.position.y = 4;
sphere.castShadow = true;
//#endregion

// #region GUI
const gui = new dat.GUI();

const options = {
  sphereColor: "#ffea00",
  wireframe: false,
  speed: 0.01,
  angle: 0.2,
  penumbra: 0,
  intensity: 1,
};

gui.addColor(options, "sphereColor").onChange((e) => {
  sphere.material.color.set(e);
});

gui.add(options, "wireframe").onChange((e) => {
  sphere.material.wireframe = e;
});

gui.add(options, "speed", 0, 0.1);

gui.add(options, "angle", 0, 1);
gui.add(options, "penumbra", 0, 1);
gui.add(options, "intensity", 0, 1);
//#endregion

// tick();

const animate = () => {
  spotLight.angle = options.angle;
  spotLight.penumbra = options.penumbra;
  spotLight.intensity = options.intensity;
  sLightHelper.update();
  renderer.render(scene, camera);
};

renderer.setAnimationLoop(animate);

// Make the canvas responsive
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
