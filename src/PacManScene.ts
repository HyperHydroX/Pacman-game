import * as THREE from "three";
import * as YUKA from "yuka";

export default class PacManScene extends THREE.Scene {
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;

  private spotLight?: THREE.SpotLight;

  private readonly time = new YUKA.Time();
  private readonly entityManager = new YUKA.EntityManager();
  private directionVector = new THREE.Vector3();
  private readonly KeyDown = new Set<string>();
  private now: number | undefined;
  private hudCamera: any;

  private pacMan?: THREE.Mesh;
  private ghost?: THREE.Mesh;
  private numGhosts: number = 0;
  private lives: number = 0;
  private foodAmount: number = 0;
  private ghostSpawnTime: number | undefined;
  private won: boolean = false;
  private lost: boolean = false;
  private wonTime: number | undefined;
  private lostTime: number | undefined;
  private removeItems: any = [];
  private numDotsEaten: number = 0;
  private livesContainer: any;

  private PACMAN_SPEED = 0.04;
  private PACMAN_RADIUS = 0.25;
  private GHOST_SPEED = 1.5;
  private GHOST_RADIUS = this.PACMAN_RADIUS * 1.25;
  private DOT_RADIUS = 0.05;
  private PELLET_RADIUS = this.DOT_RADIUS * 2;

  private readonly chompSound = new Audio("assets/sounds/pacman_chomp.mp3");
  private readonly levelStartSound = new Audio(
    "assets/sounds/pacman_beginning.mp3"
  );
  private readonly deathSound = new Audio("assets/sounds/pacman_death.mp3");
  private readonly killSound = new Audio("assets/sounds/pacman_eatghost.mp3");

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
    "#           .       #     G       #       .           #",
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

  constructor(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    super();
    this.camera = camera;
    this.renderer = renderer;
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

    // Map
    this.map = this.createMap(this, this.LEVEL);

    //PacMan
    this.pacMan = this.createPacMan(this, this.map.pacManSpawn);
    this.pacMan.add(this.camera);

    this.pacMan.rotateX(Math.PI / 2);
    this.pacMan.direction.set(this.LEFT);
    // this.pacMan.rotation.x = Math.PI * 2;
    this.pacMan.rotateY(Math.PI / 2);

    this.camera.position.y = 1;
    this.camera.position.z = 2;

    // Ghost
    this.ghostSpawnTime = -8;

    this.hudCamera = this.createHudCamera(this.map);

    // Lives
    this.lives = 3;
    this.livesContainer = document.getElementById("lives");
    for (let i = 0; i < this.lives; i++) {
      const life = document.createElement("img");
      life.src = "assets/img/pacman.png";
      life.className = "life";

      this.livesContainer?.appendChild(life);
    }

    // Level start sound
    this.levelStartSound.preload = "auto";
    this.levelStartSound.autoplay = true;

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

    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.KeyDown.add(e.key.toLocaleLowerCase());
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.KeyDown.delete(e.key.toLocaleLowerCase());
  };

  private createMap(scene: any, level: any[]) {
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
  }

  private getAt(map: any, position: any) {
    const x = Math.round(position.x);
    const y = Math.round(position.y);

    return map[y] && map[y][x];
  }

  private isWall(map: any, position: any) {
    const cell = this.getAt(map, position);
    return cell && cell.isWall === true;
  }

  private removeAt(map: any, position: any) {
    const x = Math.round(position.x);
    const y = Math.round(position.y);

    if (map[y] && map[y][x]) {
      // map[y][x].dispose();
      map[y][x].visible = false;
    }
  }

  private createWall() {
    const wallMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshLambertMaterial({ color: "blue" })
    );
    //@ts-ignore
    wallMesh.isWall = true;
    return wallMesh;
  }

  private createDot() {
    const dotMesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.DOT_RADIUS),
      new THREE.MeshPhongMaterial({ color: "0xffdab9" })
    );
    //@ts-ignorez
    dotMesh.isDot = true;
    this.foodAmount++;
    return dotMesh;
  }

  private createPowerPellet() {
    const powerPelletMesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.PELLET_RADIUS, 12, 8),
      new THREE.MeshPhongMaterial({ color: "0xffdab9" })
    );
    //@ts-ignore
    powerPelletMesh.isPowerPellet = true;
    return powerPelletMesh;
  }

  private createHudCamera(map: any) {
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
  }

  private renderHud(renderer: any, hudCamera: any, scene: any) {
    // Increase the size of PacMan and dots in HUD to make them easier to see.
    scene.children.forEach(function (child: any) {
      if (child.isWall !== true) child.scale.set(2.5, 2.5, 2.5);
    });

    // Only render in the bottom left 200x200 square of the screen.
    renderer.setScissorTest(true);
    renderer.setScissor(10, 10, 200, 200);
    renderer.setViewport(10, 10, 200, 200);
    renderer.render(scene, hudCamera);
    renderer.setScissorTest(false);

    // Reset scales after rendering HUD.
    scene.children.forEach(function (child: any) {
      child.scale.set(1, 1, 1);
    });
  }

  private createPacMan(scene: this, position: THREE.Vector3) {
    // const SphereGeometry = new THREE.SphereGeometry(this.PACMAN_RADIUS, 16, 16);

    // Create spheres with decreasingly small horizontal sweeps, in order to create pacman animations.
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
      side: THREE.DoubleSide,
    });
    const pacMan = new THREE.Mesh(pacmanGeometries[0], sphereMaterial);
    //@ts-ignore
    pacMan.frames = pacmanGeometries;
    //@ts-ignore
    pacMan.currentFrame = 0;
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
    pacMan.direction = this.LEFT;

    scene.add(pacMan);

    return pacMan;
  }

  private createGhost(scene: this, position: THREE.Vector3) {
    // Ghost
    this.ghost = new THREE.Mesh(
      new THREE.SphereGeometry(this.GHOST_RADIUS, 16, 16),
      new THREE.MeshPhongMaterial({
        color: 0xff0000,
      })
    );
    // ghost.matrixAutoUpdate = false;
    this.ghost.castShadow = true;
    //@ts-ignore
    this.ghost.isGhost = true;
    //@ts-ignore
    this.ghost.isWrapper = true;
    //@ts-ignore
    this.ghost.isAfraid = false;

    this.ghost.position.copy(position);
    //@ts-ignore
    this.ghost.direction = new THREE.Vector3(-1, 0, 0);

    scene.add(this.ghost);
  }

  private wrapObject(object: any, map: any) {
    if (object.position.x < map.left) object.position.x = map.right;
    else if (object.position.x > map.right) object.position.x = map.left;

    if (object.position.y > map.top) object.position.y = map.bottom;
    else if (object.position.y < map.bottom) object.position.y = map.top;
  }

  private distance(a: any, b: any) {
    const difference = new THREE.Vector3();

    difference.copy(a.position).sub(b.position);
    return difference.length();
  }

  private showText(message: string, size: any, now: any) {
    const textMaterial = new THREE.MeshPhongMaterial({ color: "red" });

    // Show 3D text banner.
    const textGeometry = new THREE.TextGeometry(message, {
      size: size,
      height: 0.05,
      font: "Helvetiker",
    });

    const text = new THREE.Mesh(textGeometry, textMaterial);

    // Position text just above pacman.
    text.position.copy(this.pacMan.position).add(this.UP);

    // Rotate text so that it faces same direction as pacman.
    text.up.copy(this.pacMan.direction);
    text.lookAt(text.position.clone().add(this.UP));

    // Remove after 3 seconds.
    //@ts-ignore
    text.isTemporary = true;
    //@ts-ignore
    text.removeAfter = now + 3;

    this.add(text);

    return text;
  }

  // private movePacMan(delta: number, keys: any) {
  //   // Let PacMan face the right way when he moves
  //   const _lookAt = new THREE.Vector3();

  //   // Movevement of PacMan
  //   this.pacMan?.up
  //     .copy(this.pacMan.direction)
  //     .applyAxisAngle(this.UP, -Math.PI / 2);
  //   this.pacMan?.lookAt(_lookAt.copy(this.pacMan.position).add(this.UP));

  //   document.onkeydown = (e) => {
  //     // Z - move forward
  //     if (keys["z"]) {
  //       this.pacMan.translateOnAxis(this.LEFT, this.PACMAN_SPEED * delta);
  //       this.pacMan.distanceMoved += this.PACMAN_SPEED * delta;
  //     }
  //     // S - move backward
  //     if (keys["s"]) {
  //       this.pacMan.translateOnAxis(this.LEFT, -this.PACMAN_SPEED * delta);
  //       this.pacMan.distanceMoved += this.PACMAN_SPEED * delta;
  //     }
  //     // Q - rotate left
  //     if (keys["q"]) {
  //       this.pacMan.direction.applyAxisAngle(this.UP, (Math.PI / 2) * delta);
  //     }
  //     // D - rotate right
  //     if (keys["d"]) {
  //       this.pacMan.direction.applyAxisAngle(this.UP, (-Math.PI / 2) * delta);
  //     }
  //   };
  // }

  private animatePacman() {
    if (this.lost) {
      // If pacman got eaten, show dying animation.
      let angle = ((this.now - this.lostTime) * Math.PI) / 2;
      let frame = Math.min(
        this.pacMan.frames.length - 1,
        Math.floor((angle / Math.PI) * this.pacMan.frames.length)
      );

      this.pacMan.geometry = this.pacMan.frames[frame];
    } else {
      // If pacman is alive, show eating animation.
      const maxAngle = Math.PI / 4;
      // console.log(this.pacMan.distanceMoved);
      let angle = (this.pacMan.distanceMoved * 2) % (maxAngle * 2);
      if (angle > maxAngle) angle = maxAngle * 2 - angle;
      const frame = Math.floor((angle / Math.PI) * this.pacMan.frames.length);

      this.pacMan.geometry = this.pacMan.frames[frame];
    }
  }

  private updateInput() {
    if (!this.pacMan) return;

    if (this.KeyDown.has("q") || this.KeyDown.has("arrowleft")) {
      this.pacMan?.rotateY(0.03);
    } else if (this.KeyDown.has("d") || this.KeyDown.has("arrowright")) {
      this.pacMan?.rotateY(-0.03);
    }

    const direction = this.directionVector;

    this.camera.getWorldDirection(direction);

    if (this.KeyDown.has("z") || this.KeyDown.has("arrowup")) {
      this.pacMan?.position.add(direction.multiplyScalar(this.PACMAN_SPEED));
      this.pacMan.distanceMoved += this.PACMAN_SPEED * 0.55;
    } else if (this.KeyDown.has("s") || this.KeyDown.has("arrowdown")) {
      this.pacMan?.position.add(direction.multiplyScalar(-this.PACMAN_SPEED));
      this.pacMan.distanceMoved += this.PACMAN_SPEED * 0.55;
      this.chompSound.play();
    }

    // Only play sound while moving
    if (
      (!this.won && !this.lost && this.KeyDown.has("z")) ||
      this.KeyDown.has("arrowup") ||
      this.KeyDown.has("s") ||
      this.KeyDown.has("arrowdown")
    ) {
      this.chompSound.play();
    } else {
      this.chompSound.pause();
    }

    // Check for win.
    if (!this.won && this.numDotsEaten === this.map.numDots) {
      this.won = true;
      this.wonTime = this.now;

      // this.showText("You won =D", 1, this.now);

      this.levelStartSound.play();
    }

    // Go to next level 4 seconds after winning.
    if (this.won && this.now - this.wonTime > 3) {
      // Reset PacMan position and direction.
      this.pacMan.position.copy(this.map.pacManSpawn);
      // this.pacMan.direction.copy(this.LEFT);
      this.pacMan.distanceMoved = 0;

      // Reset dots, power pellets and ghosts.
      this.children.forEach((child) => {
        if (child.isDot || child.isPowerPellet) child.visible = true;
        if (child.isGhost) this.removeItems.push(child);
      });

      // Increase speed of PacMan and Ghosts
      this.PACMAN_SPEED += 0.1;
      this.GHOST_SPEED += 0.1;

      this.won = false;
      this.numDotsEaten = 0;
      this.numGhosts = 0;
    }

    // Reset PacMan 4 seconds after dying.
    if (this.lives > 0 && this.lost && this.now - this.lostTime > 3) {
      this.lost = false;
      this.pacMan.position.copy(this.map.pacManSpawn);
      this.pacMan.direction.copy(this.LEFT);
      this.pacMan.distanceMoved = 0;
    }

    // Check collisions with walls

    // Create an invisible box around PacMan
    const leftSide = this.pacMan.position
      .clone()
      .addScaledVector(this.LEFT, this.PACMAN_RADIUS)
      .round();
    const rightSide = this.pacMan.position
      .clone()
      .addScaledVector(this.RIGHT, this.PACMAN_RADIUS)
      .round();
    const topSide = this.pacMan.position
      .clone()
      .addScaledVector(this.TOP, this.PACMAN_RADIUS)
      .round();
    const bottomSide = this.pacMan.position
      .clone()
      .addScaledVector(this.BOTTOM, this.PACMAN_RADIUS)
      .round();

    // console.log(this.pacMan.position.x);
    // console.log(this.pacMan.position.y);

    // console.log(leftSide);
    // console.log(rightSide);
    // console.log(topSide);
    // console.log(bottomSide);

    // Check the box collision with the walls
    if (this.isWall(this.map, leftSide)) {
      this.pacMan.position.x = leftSide.x + 0.5 + this.PACMAN_RADIUS;
    }
    if (this.isWall(this.map, rightSide)) {
      this.pacMan.position.x = rightSide.x - 0.5 - this.PACMAN_RADIUS;
    }
    if (this.isWall(this.map, topSide)) {
      this.pacMan.position.y = topSide.y - 0.5 - this.PACMAN_RADIUS;
    }
    if (this.isWall(this.map, bottomSide)) {
      this.pacMan.position.y = bottomSide.y + 0.5 + this.PACMAN_RADIUS;
    }

    const cell = this.getAt(this.map, this.pacMan.position);
    // console.log(cell);

    // Make PacMan eat dots
    if (cell && cell.isDot && cell.visible) {
      this.removeAt(this.map, this.pacMan.position);
      this.numDotsEaten++;
      this.foodAmount--;
    }

    // Make PacMan eat power dots
    this.pacMan.atePellet = false;
    if (cell && cell.isPowerPellet && cell.visible) {
      this.removeAt(this.map, this.pacMan.position);
      this.pacMan.atePellet = true;

      this.killSound.play();
    }
  }

  private updateGhost(ghost: any, delta: any, now: number) {
    // Make all ghosts afraid when PacMan eats a power pellet
    if (this.pacMan.atePellet) {
      ghost.isAfraid = true;
      ghost.afraidTime = now;

      ghost.material.color.setStyle("#ffffff");
    }

    // Make ghosts go back to normal after 10 seconds
    if (ghost.isAfraid && now - ghost.afraidTime > 10) {
      ghost.isAfraid = false;

      ghost.material.color.setStyle("#ff0000");
    }

    this.moveGhost(ghost, delta);

    // Check for collisions with PacMan

    if (
      !this.lost &&
      !this.won &&
      this.distance(this.pacMan, ghost) < this.PACMAN_RADIUS + this.GHOST_RADIUS
    ) {
      if (ghost.isAfraid) {
        this.removeItems.push(ghost);
        this.numGhosts -= 1;

        this.killSound.play();
      } else {
        this.lives -= 1;
        // Unshow life
        document.getElementsByClassName("life")[this.lives].style.display =
          "none";

        // if (this.lives > 0) this.showText("You died =/", 0.1, now);
        // else this.showText("Game over =(", 0.1, now);

        this.lost = true;
        this.lostTime = now;

        this.deathSound.play();
      }
    }
  }

  private moveGhost(ghost: any, delta: any) {
    const previousPosition = new THREE.Vector3();
    const currentPosition = new THREE.Vector3();
    const leftTurn = new THREE.Vector3();
    const rightTurn = new THREE.Vector3();

    previousPosition
      .copy(ghost.position)
      .addScaledVector(ghost.direction, 0.5)
      .round();

    ghost.translateOnAxis(ghost.direction, delta, this.GHOST_SPEED);
    currentPosition
      .copy(ghost.position)
      .addScaledVector(ghost.direction, 0.5)
      .round();

    // If the ghost is on a corner, check if it can turn
    if (!currentPosition.equals(previousPosition)) {
      leftTurn.copy(ghost.direction).applyAxisAngle(this.UP, Math.PI / 2);
      rightTurn.copy(ghost.direction).applyAxisAngle(this.UP, -Math.PI / 2);

      const forwardWall = this.isWall(this.map, currentPosition);
      const leftWall = this.isWall(
        this.map,
        currentPosition.copy(ghost.position).add(leftTurn)
      );
      const rightWall = this.isWall(
        this.map,
        currentPosition.copy(ghost.position).add(rightTurn)
      );

      if (!leftWall || !rightWall) {
        let possibleTurns = [];
        if (!forwardWall) possibleTurns.push(ghost.direction);
        if (!leftWall) possibleTurns.push(leftTurn);
        if (!rightWall) possibleTurns.push(rightTurn);

        if (possibleTurns.length === 0) {
          throw new Error("A ghost got stuck!");
        }

        // console.log(possibleTurns.length);

        let newDirection =
          possibleTurns[Math.floor(Math.random() * possibleTurns.length)];

        // console.log(newDirection);

        ghost.direction.copy(newDirection);

        // Snap ghost to center of current cell and start moving in new direction.
        ghost.position.round().addScaledVector(ghost.direction, delta);
      }
    }
  }

  // private updateCamera = (delta: number) => {
  //   if (this.won) {
  //     // After winning, pan camera out to show whole level.
  //     this.camera.targetPosition.set(this.map.centerX, this.map.centerY, 30);
  //     this.camera.targetLookAt.set(this.map.centerX, this.map.centerY, 0);
  //   } else if (this.lost) {
  //     // After losing, move camera to look down at pacman's body from above.
  //     this.camera.targetPosition = this.pacMan.position
  //       .clone()
  //       .addScaledVector(this.UP, 4);
  //     this.camera.targetLookAt = this.pacMan.position
  //       .clone()
  //       .addScaledVector(this.pacMan.direction, 0.01);
  //   } else {
  //     // Place camera above and behind pacman, looking towards direction of pacman.
  //     this.camera.targetPosition
  //       .copy(this.pacMan.position)
  //       .addScaledVector(this.UP, 1.5)
  //       .addScaledVector(this.pacMan.direction, -1);
  //     this.camera.targetLookAt
  //       .copy(this.pacMan.position)
  //       .add(this.pacMan.direction);
  //   }

  //   // Move camera slowly during win/lose animations.
  //   let cameraSpeed = this.lost || this.won ? 1 : 10;
  //   this.camera.position.lerp(this.camera.targetPosition, delta * cameraSpeed);
  //   this.camera.lookAtPosition.lerp(
  //     this.camera.targetLookAt,
  //     delta * cameraSpeed
  //   );
  //   this.camera.lookAt(this.camera.lookAtPosition);
  // };

  private updateFood() {
    document.getElementById("foodAmount").textContent =
      this.foodAmount.toString();
  }

  update() {
    this.now = window.performance.now() / 1000;
    const delta = this.time.update().getDelta();
    this.updateInput();
    this.updateFood();
    this.animatePacman();
    // this.renderHud(this.renderer, this.hudCamera, this);
    this.entityManager.update(delta);

    // console.log(this.now);
    if (this.numGhosts < 4 && this.now - this.ghostSpawnTime > 8) {
      // console.log(this.map.ghostSpawn);
      this.createGhost(this, this.map.ghostSpawn);
      this.numGhosts += 1;
      this.ghostSpawnTime = this.now;
    }

    this.children.forEach((child) => {
      //@ts-ignore
      if (child.isGhost) this.updateGhost(child, delta, this.now);
      //@ts-ignore
      // Kinda buggy
      // if (child.isWrapper) this.wrapObject(child, this.map);
      //@ts-ignore
      if (child.isTemporary && this.now > child.removeAfter)
        this.removeItems.push(child);
    });

    // Cannot remove items from scene.children while iterating
    // through it, so remove them after the forEach loop.
    this.removeItems.forEach(this.remove, this);
    for (let item in this.removeItems) {
      if (this.removeItems.hasOwnProperty(item)) {
        this.remove(this.removeItems[item]);
        delete this.removeItems[item];
      }
    }
  }
}
