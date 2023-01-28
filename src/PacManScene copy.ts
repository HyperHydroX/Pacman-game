import * as THREE from "three";
import * as YUKA from "yuka";

export default class PacManScene extends THREE.Scene {
  private readonly camera: THREE.PerspectiveCamera;

  private spotLight?: THREE.SpotLight;

  private readonly time = new YUKA.Time();
  private readonly entityManager = new YUKA.EntityManager();

  private pacMan?: THREE.Mesh;
  private map: {
    centerY: number;
    centerX: number;
    bottom: number;
    top: number;
    left: number;
    right: number;
    numDots: number;
    pacManSpwan: THREE.Vector3;
    ghostSpawn: THREE.Vector3;
  } = {};

  private LEVEL = [
    "# # # # # # # # # # # # # # # # # # # # # # # # # # # #",
    "# . . . . . . . . . . . . # # . . . . . . . . . . . . #",
    "# . # # # # . # # # # # . # # . # # # # # . # # # # . #",
    "# o # # # # . # # # # # . # # . # # # # # . # # # # o #",
    "# . # # # # . # # # # # . # # . # # # # # . # # # # . #",
    "# . . . . . . . . . . . . . . . . . . . . . . . . . . #",
    "# . # # # # . # # . # # # # # # # # . # # . # # # # . #",
    "# . # # # # . # # . # # # # # # # # . # # . # # # # . #",
    "# . . . . . . # # . . . . # # . . . . # # . . . . . . #",
    "# # # # # # . # # # # #   # #   # # # # # . # # # # # #",
    "          # . # # # # #   # #   # # # # # . #          ",
    "          # . # #                     # # . #          ",
    "          # . # #   # # #     # # #   # # . #          ",
    "# # # # # # . # #   #             #   # # . # # # # # #",
    "            .       #     G       #       .            ",
    "# # # # # # . # #   #             #   # # . # # # # # #",
    "          # . # #   # # # # # # # #   # # . #          ",
    "          # . # #                     # # . #          ",
    "          # . # #   # # # # # # # #   # # . #          ",
    "# # # # # # . # #   # # # # # # # #   # # . # # # # # #",
    "# . . . . . . . . . . . . # # . . . . . . . . . . . . #",
    "# . # # # # . # # # # # . # # . # # # # # . # # # # . #",
    "# . # # # # . # # # # # . # # . # # # # # . # # # # . #",
    "# o . . # # . . . . . . . P   . . . . . . . # # . . o #",
    "# # # . # # . # # . # # # # # # # # . # # . # # . # # #",
    "# # # . # # . # # . # # # # # # # # . # # . # # . # # #",
    "# . . . . . . # # . . . . # # . . . . # # . . . . . . #",
    "# . # # # # # # # # # # . # # . # # # # # # # # # # . #",
    "# . # # # # # # # # # # . # # . # # # # # # # # # # . #",
    "# . . . . . . . . . . . . . . . . . . . . . . . . . . #",
    "# # # # # # # # # # # # # # # # # # # # # # # # # # # #",
  ];

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
    planeMesh.position.y = -1;
    planeMesh.receiveShadow = true;

    // PacMan
    const SphereGeometry = new THREE.SphereGeometry(1, 50, 50);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xfeff00,
      wireframe: false,
    });
    this.pacMan = new THREE.Mesh(SphereGeometry, sphereMaterial);
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
    this.add(ghost);

    ghost.castShadow = true;

    // Bounding box
    let ghostBB = new THREE.Sphere(ghost.position, 1);
    console.log(ghostBB);
    //#endregion

    //#region Test
    this.map = this.createMap(this, this.LEVEL);
    let numDotsEaten = 0;

    const hudCamera = this.createHudCamera(this.map);

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
    pursuer.position.set(-2, 0, -3);
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

  private createMap = (scene: any, level: any[]) => {
    this.map.bottom = -(level.length - 1);

    let x, y: any;

    for (let row = 0; row < level.length; row++) {
      // Set coordinates of the map so that they match the coordinate system for objects
      y = -row;

      this.map[y] = {};

      // Get length of the longest row
      const length = Math.floor(level[row].length / 2);

      this.map.right = Math.max(this.map.right, length);

      // Skip every second element, which is used as space
      for (let column = 0; column < level[row].length; column += 2) {
        x = Math.floor(column / 2);

        const cell = level[row][column];
        let object = null;

        // Wall
        if (cell === "#") {
          object = this.createWall();
        }
        // Dot
        else if (cell === ".") {
          object = this.createDot();
          this.map.numDots += 1;
        }
        // Power pellet
        else if (cell === "O") {
          object = this.createPowerPellet();
        }
        // Pac Man
        else if (cell === "P") {
          this.map.pacManSpwan = new THREE.Vector3(x, y, 0);
        }
        // Ghost
        else if (cell === "G") {
          this.map.ghostSpawn = new THREE.Vector3(x, y, 0);
        }

        if (object !== null) {
          object.position.set(x, y, 0);
          this.map[y][x] = object;
          scene.add(object);
        }
      }
    }

    this.map.centerX = (this.map.left + this.map.right) / 2;
    this.map.centerY = (this.map.top + this.map.bottom) / 2;

    return this.map;
  };

  private getAt = (map: any[][], position: { x: number; y: number }) => {
    const x = Math.floor(position.x);
    const y = Math.floor(position.y);

    return map[y] && map[y][x];
  };

  private isWall = (map: any[][], position: { x: number; y: number }) => {
    const cell = this.getAt(map, position);
    return cell && cell.isWall === true;
  };

  private removeAt = (map: any[][], position: { x: number; y: number }) => {
    const x = Math.floor(position.x);
    const y = Math.floor(position.y);

    if (map[y] && map[y][x]) {
      // map[y][x].dispose();
      map[y][x].visible = false;
    }
  };

  private createWall = () => {
    const wallMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshLambertMaterial({ color: "blue" })
    );
    return wallMesh;
  };

  private createDot = () => {
    const dotMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.2),
      new THREE.MeshPhongMaterial({ color: "0xffdab9" })
    );
    return dotMesh;
  };

  private createPowerPellet = () => {
    const powerPelletMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.4),
      new THREE.MeshPhongMaterial({ color: "0xffdab9" })
    );
    return powerPelletMesh;
  };

  private createHudCamera = (map: {
    right: any;
    left: any;
    top: any;
    bottom: any;
    centerX: number | undefined;
    centerY: number | undefined;
  }) => {
    const halfWidth = (map.right = map.left) / 2;
    const halfHeight = (map.top = map.bottom) / 2;

    const hudCamera = new THREE.OrthographicCamera(
      -halfWidth,
      halfWidth,
      halfHeight,
      -halfHeight,
      1,
      100
    );
    hudCamera.position.copy(new THREE.Vector3(map.centerX, map.centerY, 10));
    hudCamera.lookAt(new THREE.Vector3(map.centerX, map.centerY, 0));

    return hudCamera;
  };

  private renderHud = (renderer: any, hudCamera: any, scene: any) => {
    // Increase the size of PacMan and dots in HUD to make them easier to see.
    scene.children.forEach((object: any) => {
      if (object.isWall) object.scale.set(2.5, 2.5, 2.5);
    });

    // Only render in the bottom left 200x200px
    renderer.enableScissorTest(true);
    renderer.setScissor(10, 10, 200, 200);
    renderer.setViewport(10, 10, 200, 200);
    renderer.render(scene, hudCamera);
    renderer.enableScissorTest(false);

    // Reset scales after rendering HUD
    scene.children.forEach((object: any) => {
      object.scale.set(1, 1, 1);
    });
  };

  private createGhost = () => {
    // Ghost
    const ghost = new THREE.Mesh(
      new THREE.SphereGeometry(1, 50, 50),
      new THREE.MeshPhongMaterial({ color: 0xff0000 })
    );
    ghost.matrixAutoUpdate = false;
    this.add(ghost);

    ghost.castShadow = true;

    // Bounding box
    let ghostBB = new THREE.Sphere(ghost.position, 1);
    console.log(ghostBB);

    return { ghost, ghostBB };
  };

  private wrapObject = (
    object: { position: { x: number; y: number } },
    map: { left: number; right: number; top: number; bottom: number }
  ) => {
    if (object.position.x < map.left) object.position.x = map.right;
    else if (object.position.x > map.right) object.position.x = map.left;

    if (object.position.y > map.top) object.position.y = map.bottom;
    else if (object.position.y < map.bottom) object.position.y = map.top;
  };

  private distance = () => {
    const difference = new THREE.Vector3();
    return (a: any, b: any) => {
      difference.copy(a.position).sub(b.position);

      return difference.length();
    };
  };

  update() {
    const delta = this.time.update().getDelta();
    this.entityManager.update(delta);
  }
}
