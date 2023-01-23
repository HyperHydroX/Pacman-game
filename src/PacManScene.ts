import * as THREE from "three";
import * as YUKA from "yuka";

export default class PacManScene extends THREE.Scene {
  private readonly camera: THREE.PerspectiveCamera;

  private spotLight?: THREE.SpotLight;

  private readonly time = new YUKA.Time();
  private readonly entityManager = new YUKA.EntityManager();

  private pacMan?: THREE.Mesh;

  constructor(camera: THREE.PerspectiveCamera) {
    super();
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

    // const sLightHelper = new THREE.SpotLightHelper(this.spotLight);
    // this.add(sLightHelper);

    // Plane
    const planeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({
        color: 0x333333,
        side: THREE.DoubleSide,
      })
    );
    this.add(planeMesh);
    planeMesh.rotation.x = Math.PI * 0.5;
    planeMesh.receiveShadow = true;

    // PacMan
    const SphereGeometry = new THREE.SphereGeometry(1, 50, 50);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0x0000ff,
      wireframe: false,
    });
    this.pacMan = new THREE.Mesh(SphereGeometry, sphereMaterial);
    this.pacMan.position.y = 1;
    this.add(this.pacMan);

    this.pacMan.receiveShadow = true;
    this.pacMan.castShadow = true;

    // Bounding box
    // let pacManBB = new THREE.Sphere(pacMan.position, 1);
    // console.log(pacManBB);

    let pacManBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
    // Get values from your mesh
    pacManBB.setFromObject(this.pacMan);
    console.log(pacManBB);

    // Ghost
    const ghost = new THREE.Mesh(
      new THREE.SphereGeometry(1, 50, 50),
      new THREE.MeshPhongMaterial({ color: 0xff0000 })
    );
    ghost.matrixAutoUpdate = false;
    ghost.position.y = 1;
    this.add(ghost);

    ghost.castShadow = true;

    // Bounding box
    let ghostBB = new THREE.Sphere(ghost.position, 1);
    console.log(ghostBB);
    //#endregion

    //#region Yuka
    const sync = (
      entity: { worldMatrix: any },
      renderComponent: { matrix: { copy: (arg0: any) => void } }
    ) => {
      renderComponent.matrix.copy(entity.worldMatrix);
    };

    const pursuer = new YUKA.Vehicle();
    pursuer.setRenderComponent(ghost, sync);
    this.entityManager.add(pursuer);
    pursuer.position.set(-2, 4, -3);
    pursuer.maxSpeed = 3;

    const evader = new YUKA.Vehicle();
    evader.setRenderComponent(this.pacMan, sync);
    this.entityManager.add(evader);
    // evader.position.set(2, 4, -3);
    // evader.maxSpeed = 5;

    const pursuitBehavior = new YUKA.PursuitBehavior(evader, 5);
    pursuer.steering.add(pursuitBehavior);

    // const evaderTarget = new YUKA.Vector3();
    // const seekBehavior = new YUKA.SeekBehavior(evaderTarget);
    // evader.steering.add(seekBehavior);
    //#endregion

    //#region Keyboardinput
    document.onkeydown = (e) => {
      if (e.key === "ArrowUp") {
        this.pacMan.position.z -= 1;
        evader.position.z -= 1;
      }
      if (e.key === "ArrowDown") {
        this.pacMan.position.z += 1;
        evader.position.z += 1;
      }
      if (e.key === "ArrowRight") {
        this.pacMan.position.x += 1;
        evader.position.x += 1;
      }
      if (e.key === "ArrowLeft") {
        this.pacMan.position.x -= 1;
        evader.position.x -= 1;
      }
    };
    //#endregion
  }

  update() {
    const delta = this.time.update().getDelta();
    this.entityManager.update(delta);
  }
}
