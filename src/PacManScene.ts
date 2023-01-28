import * as THREE from "three";
import * as YUKA from "yuka";

export default class PacManScene extends THREE.Scene {
  private readonly camera: THREE.PerspectiveCamera;

  private spotLight?: THREE.SpotLight;

  private readonly time = new YUKA.Time();
  private readonly entityManager = new YUKA.EntityManager();

  private readonly KeyDown = new Set<string>();
  private pacMan?: THREE.Mesh;
  private keys: any = {};

  private PACMAN_SPEED = 2;
  private PACMAN_RADIUS = 0.25;
  private GHOST_SPEED = 1.5;
  private GHOST_RADIUS = this.PACMAN_RADIUS * 1.25;
  private DOT_RADIUS = 0.05;
  private PELLET_RADIUS = this.DOT_RADIUS * 2;

  private readonly UP = new THREE.Vector3(0, 0, 1);
  private readonly LEFT = new THREE.Vector3(-1, 0, 0);
  private readonly TOP = new THREE.Vector3(0, 1, 0);
  private readonly RIGHT = new THREE.Vector3(1, 0, 0);
  private readonly BOTTOM = new THREE.Vector3(0, -1, 0);

  private map: {
    centerY: number;
    centerX: number;
    bottom: number;
    top: number;
    left: number;
    right: number;
    numDots: number;
    pacManSpawn: THREE.Vector3;
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
    "            .       #     G P     #       .            ",
    "# # # # # # . # #   #             #   # # . # # # # # #",
    "          # . # #   # # # # # # # #   # # . #          ",
    "          # . # #                     # # . #          ",
    "          # . # #   # # # # # # # #   # # . #          ",
    "# # # # # # . # #   # # # # # # # #   # # . # # # # # #",
    "# . . . . . . . . . . . . # # . . . . . . . . . . . . #",
    "# . # # # # . # # # # # . # # . # # # # # . # # # # . #",
    "# . # # # # . # # # # # . # # . # # # # # . # # # # . #",
    "# o . . # # . . . . . . .     . . . . . . . # # . . o #",
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

    // Camera
    this.camera.up.copy(this.UP);
    this.camera.targetPosition = new THREE.Vector3();
    this.camera.targetLookAt = new THREE.Vector3();
    this.camera.lookAt = new THREE.Vector3();

    //#region Test
    this.keys = this.createKeyState();
    this.map = this.createMap(this, this.LEVEL);
    let numDotsEaten = 0;
    this.pacMan = this.createPacMan(this, this.map.pacManSpawn);

    const hudCamera = this.createHudCamera(this.map);

    //#endregion

    //#region Yuka
    // const sync = (
    //   entity: { worldMatrix: any },
    //   renderComponent: { matrix: { copy: (arg0: any) => void } }
    // ) => {
    //   renderComponent.matrix.copy(entity.worldMatrix);
    // };

    // const pursuer = new YUKA.Vehicle();
    // pursuer.setRenderComponent(ghost, sync);
    // this.entityManager.add(pursuer);
    // pursuer.position.set(-2, 0, -3);
    // pursuer.maxSpeed = 3;

    // const evader = new YUKA.Vehicle();
    // evader.setRenderComponent(this.pacMan, sync);
    // this.entityManager.add(evader);
    // // evader.position.set(2, 4, -3);
    // // evader.maxSpeed = 5;

    // const pursuitBehavior = new YUKA.PursuitBehavior(evader, 5);
    // pursuer.steering.add(pursuitBehavior);

    // // const evaderTarget = new YUKA.Vector3();
    // // const seekBehavior = new YUKA.SeekBehavior(evaderTarget);
    // // evader.steering.add(seekBehavior);
    //#endregion
  }

  private createMap = (scene: any, level: any[]) => {
    const map: any = {};
    map.bottom = -(level.length - 1);
    map.top = 0;
    map.left = 0;
    map.right = 0;
    map.numDots = 0;
    map.pacManSpawn = null;
    map.ghostSpawn = null;

    let x, y: any;

    for (let row = 0; row < level.length; row++) {
      // Set coordinates of the map so that they match the coordinate system for objects
      y = -row;

      //@ts-ignore
      map[y] = {};
      // console.log((map[y] = {}));

      // Get length of the longest row
      const length = Math.floor(level[row].length / 2);

      map.right = Math.max(map.right, length);

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
          map.numDots += 1;
        }
        // Power pellet
        else if (cell === "o") {
          object = this.createPowerPellet();
        }
        // Pac Man
        else if (cell === "P") {
          map.pacManSpawn = new THREE.Vector3(x, y, 0);
        }
        // Ghost
        else if (cell === "G") {
          map.ghostSpawn = new THREE.Vector3(x, y, 0);
        }

        if (object !== null) {
          object.position.set(x, y, 0);
          //@ts-ignore
          map[y][x] = object;
          // console.log((map[y][x] = object));
          scene.add(object);
        }
      }
    }

    map.centerX = (map.left + map.right) / 2;
    map.centerY = (map.top + map.bottom) / 2;

    return map;
  };

  private getAt = (map: any[][], position: { x: number; y: number }) => {
    const x = Math.round(position.x);
    const y = Math.round(position.y);

    return map[y] && map[y][x];
  };

  private isWall = (map: any[][], position: { x: number; y: number }) => {
    const cell = this.getAt(map, position);
    return cell && cell.isWall === true;
  };

  private removeAt = (map: any[][], position: { x: number; y: number }) => {
    const x = Math.round(position.x);
    const y = Math.round(position.y);

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
      new THREE.SphereGeometry(this.DOT_RADIUS),
      new THREE.MeshPhongMaterial({ color: "0xffdab9" })
    );
    return dotMesh;
  };

  private createPowerPellet = () => {
    const powerPelletMesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.PELLET_RADIUS, 12, 8),
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

  private createPacMan = (scene: this, position: THREE.Vector3) => {
    // const SphereGeometry = new THREE.SphereGeometry(this.PACMAN_RADIUS, 16, 16);

    // Create spheres with decreasingly small horizontal sweeps, in order
    // to create pacman "death" animation.
    let pacmanGeometries = [];
    let numFrames = 40;
    let offset;
    for (var i = 0; i < numFrames; i++) {
      offset = (i / (numFrames - 1)) * Math.PI;
      pacmanGeometries.push(
        new THREE.SphereGeometry(
          this.PACMAN_RADIUS,
          16,
          16,
          offset,
          Math.PI * 2 - offset * 2
        )
      );
      pacmanGeometries[i].rotateX(Math.PI / 2);
    }
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xfeff00,
      wireframe: false,
      side: THREE.DoubleSide,
    });
    const pacMan = new THREE.Mesh(pacmanGeometries[0], sphereMaterial);

    //@ts-ignore
    pacMan.isPacman = true;
    //@ts-ignore
    pacMan.isWrapper = true;
    //@ts-ignore
    pacMan.atePellet = false;
    //@ts-ignore
    pacMan.distanceMoved = 0;

    pacMan.receiveShadow = true;
    pacMan.castShadow = true;

    pacMan.position.copy(position);
    //@ts-ignore
    pacMan.direction = new THREE.Vector3(-1, 0, 0);

    scene.add(pacMan);

    return pacMan;
  };

  private createGhost = (scene: this, position: THREE.Vector3) => {
    // Ghost
    const ghost = new THREE.Mesh(
      new THREE.SphereGeometry(this.GHOST_RADIUS, 16, 16),
      new THREE.MeshPhongMaterial({ color: 0xff0000 })
    );
    ghost.matrixAutoUpdate = false;

    ghost.castShadow = true;
    //@ts-ignore
    ghost.isGhost = true;
    //@ts-ignore
    ghost.isWrapper = true;
    //@ts-ignore
    ghost.isAfraid = false;

    ghost.position.copy(position);
    //@ts-ignore
    ghost.direction = new THREE.Vector3(-1, 0, 0);

    scene.add(ghost);

    return ghost;
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

  private createKeyState = () => {
    let keyState: any = {};

    document.body.addEventListener("keydown", (e) => {
      keyState[e.key] = true;
    });

    document.body.addEventListener("keyup", (e) => {
      keyState[e.key] = false;
    });

    document.body.addEventListener("blur", (e) => {
      // Keys become unpressed when window loses focus
      for (let key in keyState) {
        if (keyState.hasOwnProperty(key)) keyState[key] = false;
      }
    });

    console.log(keyState);

    return keyState;
  };

  private movePacMan = (delta: number, keys: any) => {
    // Let PacMan face the right way when he moves
    const _lookAt = new THREE.Vector3();

    // Movevement of PacMan
    this.pacMan?.up
      .copy(this.pacMan.direction)
      .applyAxisAngle(this.UP, -Math.PI / 2);
    this.pacMan?.lookAt(_lookAt.copy(this.pacMan.position).add(this.UP));

    document.onkeydown = (e) => {
      // Z - move forward
      if (keys["z"]) {
        this.pacMan.translateOnAxis(this.LEFT, this.PACMAN_SPEED * delta);
        this.pacMan.distanceMoved += this.PACMAN_SPEED * delta;
      }
      // S - move backward
      if (keys["s"]) {
        this.pacMan.translateOnAxis(this.LEFT, -this.PACMAN_SPEED * delta);
        this.pacMan.distanceMoved += this.PACMAN_SPEED * delta;
      }
      // Q - rotate left
      if (keys["q"]) {
        this.pacMan.direction.applyAxisAngle(this.UP, (Math.PI / 2) * delta);
      }
      // D - rotate right
      if (keys["d"]) {
        this.pacMan.direction.applyAxisAngle(this.UP, (-Math.PI / 2) * delta);
      }
    };

    // Check collisions with walls
    const leftSide = this.pacMan?.position
      .clone()
      .addScaledVector(this.LEFT, this.PACMAN_RADIUS)
      .round();
    const rightSide = this.pacMan?.position;
  };

  private updateGame = (delta: number) => {};

  private updateCamera = (delta: number) => {
    this.camera.position
      .copy(this.pacMan.position)
      .addScaledVector(this.UP, 1.5)
      .addScaledVector(this.pacMan.direction, -1);
    this.camera.targetLookAt
      .copy(this.pacMan.position)
      .add(this.pacMan.direction);

    // this.camera.lookAt(this.camera.targetLookAt);
  };

  update() {
    const delta = this.time.update().getDelta();
    this.movePacMan(delta, this.keys);
    this.updateCamera(delta);
    this.entityManager.update(delta);
  }
}
