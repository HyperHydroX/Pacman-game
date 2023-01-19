import dat from "dat.gui";
import * as THREE from "three";

export default class PacManScene extends THREE.Scene {
  private readonly camera: THREE.PerspectiveCamera;

  private spotLight?: THREE.SpotLight;

  constructor(camera: THREE.PerspectiveCamera) {
    super();
    // ...
    this.camera = camera;
  }

  async initialize() {
    // Lighting
    const light = new THREE.AmbientLight(0xffffff, 0.5);
    this.add(light);

    this.spotLight = new THREE.SpotLight(0xffffff);
    this.add(this.spotLight);
    this.spotLight.position.set(-100, 100, 0);
    this.spotLight.castShadow = true;
    this.spotLight.angle = 0.2;

    const sLightHelper = new THREE.SpotLightHelper(this.spotLight);
    this.add(sLightHelper);

    // PlaneMesh
    const planeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({
        color: 0xeaff00,
        side: THREE.DoubleSide,
      })
    );
    this.add(planeMesh);
    planeMesh.rotation.x = Math.PI * 0.5;
    planeMesh.receiveShadow = true;

    const gridHelper = new THREE.GridHelper(30);
    this.add(gridHelper);

    //#region Sphere
    const SphereGeometry = new THREE.SphereGeometry(4, 50, 50);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0x0000ff,
      wireframe: false,
    });
    const sphere = new THREE.Mesh(SphereGeometry, sphereMaterial);
    this.add(sphere);

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
  }

  update() {
    // ...
  }
}
