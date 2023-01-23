import * as THREE from "three";
import * as dat from "dat.gui";
import * as YUKA from "yuka";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// import PacManScene from "./PacManScene";

const width = window.innerWidth;
const height = window.innerHeight;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("app") as HTMLCanvasElement,
  antialias: true,
});
renderer.setSize(width, height);
renderer.setClearColor(0x111111);

const scene = new THREE.Scene();

// const scene = new PacManScene(camera);
// scene.initialize();

const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
camera.position.set(-10, 30, 30);
camera.lookAt(scene.position);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.update();

const exesHelper = new THREE.AxesHelper(3);
scene.add(exesHelper);

//#region Lighting
const light = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(light);

const spotLight = new THREE.SpotLight(0xffffff);
scene.add(spotLight);
spotLight.position.set(-100, 100, 0);
spotLight.castShadow = true;
spotLight.angle = 0.2;

const sLightHelper = new THREE.SpotLightHelper(spotLight);
scene.add(sLightHelper);
//#endregion

//#region Meshes

// Plane
const planeMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  })
);
scene.add(planeMesh);
planeMesh.rotation.x = -Math.PI * 0.5;
planeMesh.receiveShadow = true;

const gridHelper = new THREE.GridHelper(30);
scene.add(gridHelper);

// Walls

// Right
const wallRight = new THREE.Mesh(
  new THREE.BoxGeometry(1, 10, 31),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
wallRight.position.set(15, 5, 0);
scene.add(wallRight);

// Bounding box
let wallRightBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
// Get values from your mesh
wallRightBB.setFromObject(wallRight);
console.log(wallRightBB);

// Left
const wallLeft = new THREE.Mesh(
  new THREE.BoxGeometry(1, 10, 31),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
wallLeft.position.set(-15, 5, 0);
scene.add(wallLeft);

// Bounding box
let wallLeftBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
// Get values from your mesh
wallLeftBB.setFromObject(wallLeft);
console.log(wallLeftBB);

// Top
const wallTop = new THREE.Mesh(
  new THREE.BoxGeometry(30, 10, 1),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
wallTop.position.set(0, 5, 15);
scene.add(wallTop);

// Bounding box
let wallTopBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
// Get values from your mesh
wallTopBB.setFromObject(wallTop);
console.log(wallTopBB);

// Bottom
const wallBottom = new THREE.Mesh(
  new THREE.BoxGeometry(30, 10, 1),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
wallBottom.position.set(0, 5, -15);
scene.add(wallBottom);

// Bounding box
let wallBottomBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
// Get values from your mesh
wallBottomBB.setFromObject(wallBottom);
console.log(wallBottomBB);

// PacMan
const PacManGeometry = new THREE.BoxGeometry(2, 2, 2);
const PacmanMaterial = new THREE.MeshStandardMaterial({
  color: 0xfeff00,
  wireframe: false,
});
const pacMan = new THREE.Mesh(PacManGeometry, PacmanMaterial);
// pacMan.matrixAutoUpdate = false;
pacMan.position.y = 1;
scene.add(pacMan);

pacMan.receiveShadow = true;
pacMan.castShadow = true;

// Bounding box
// let pacManBB = new THREE.Sphere(pacMan.position, 1);
// console.log(pacManBB);

let pacManBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
// Get values from your mesh
pacManBB.setFromObject(pacMan);
console.log(pacManBB);

// Ghost
const ghost = new THREE.Mesh(
  new THREE.SphereGeometry(1, 50, 50),
  new THREE.MeshPhongMaterial({ color: 0xff0000 })
);
ghost.matrixAutoUpdate = false;
ghost.position.y = 1;
scene.add(ghost);

ghost.castShadow = true;

// Bounding box
let ghostBB = new THREE.Sphere(ghost.position, 1);
console.log(ghostBB);
//#endregion

//#region GUI
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
  pacMan.material.color.set(e);
});

gui.add(options, "wireframe").onChange((e) => {
  pacMan.material.wireframe = e;
});

gui.add(options, "speed", 0, 0.1);

gui.add(options, "angle", 0, 1);
gui.add(options, "penumbra", 0, 1);
gui.add(options, "intensity", 0, 1);
//#endregion

//#region Yuka
const entityManager = new YUKA.EntityManager();

const sync = (
  entity: { worldMatrix: any },
  renderComponent: { matrix: { copy: (arg0: any) => void } }
) => {
  renderComponent.matrix.copy(entity.worldMatrix);
};

const pursuer = new YUKA.Vehicle();
pursuer.setRenderComponent(ghost, sync);
entityManager.add(pursuer);
pursuer.position.set(-2, 4, -3);
pursuer.maxSpeed = 3;

const evader = new YUKA.Vehicle();
evader.setRenderComponent(pacMan, sync);
entityManager.add(evader);
// evader.position.set(2, 4, -3);
// evader.maxSpeed = 5;

const pursuitBehavior = new YUKA.PursuitBehavior(evader, 5);
pursuer.steering.add(pursuitBehavior);

// const evaderTarget = new YUKA.Vector3();
// const seekBehavior = new YUKA.SeekBehavior(evaderTarget);
// evader.steering.add(seekBehavior);

const time = new YUKA.Time();

//#endregion

//#region Keyboardinput

document.onkeydown = (e) => {
  if (e.key === "ArrowUp") {
    pacMan.position.z -= 1;
    evader.position.z -= 1;
  }
  if (e.key === "ArrowDown") {
    pacMan.position.z += 1;
    evader.position.z += 1;
  }
  if (e.key === "ArrowRight") {
    pacMan.position.x += 1;
    evader.position.x += 1;
  }
  if (e.key === "ArrowLeft") {
    pacMan.position.x -= 1;
    evader.position.x -= 1;
  }
};
//#endregion

const checkCollisions = () => {
  if (pacManBB.intersectsBox(wallLeftBB)) {
    console.log("Collision with wallLeft");
    pacMan.position.x += 1;
    evader.position.x += 1;
  }
  if (pacManBB.intersectsBox(wallRightBB)) {
    console.log("Collision with wallRight");
    pacMan.position.x -= 1;
    evader.position.x -= 1;
  }
  if (pacManBB.intersectsBox(wallTopBB)) {
    console.log("Collision with wall bottom");
    pacMan.position.z -= 1;
    evader.position.z -= 1;
  }
  if (pacManBB.intersectsBox(wallBottomBB)) {
    console.log("Collision with wall top");
    pacMan.position.z += 1;
    evader.position.z += 1;
  }
};

console.log(ghost.position);

const animate = () => {
  const delta = time.update().getDelta();
  entityManager.update(delta);

  //@ts-ignore
  // Update postion of pacMan Mesh and copying it into the bounding box
  pacManBB.copy(pacMan.geometry.boundingBox).applyMatrix4(pacMan.matrixWorld);
  // ghostBB.copy(ghost.geometry.boundingSphere).applyMatrix4(ghost.matrixWorld);

  // For some reason the bounding sphere is not working
  // pacManBB.copy(pacMan.geometry.boundingSphere).applyMatrix4(pacMan.matrixWorld);

  checkCollisions();

  // const elapsed = time.getElapsed();
  // evaderTarget.x = Math.cos(elapsed) * Math.sin(elapsed * 0.2) * 6;
  // evaderTarget.z = Math.sin(elapsed * 0.8) * 6;

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
