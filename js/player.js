import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { getCurrentZone, interactables, zones } from './zones.js';
import { animated, getTrafficSignalState, roadHeightAt } from './world.js';

let footstepTimer = 0;
let currentZoneName = '';
const schoolZone = zones.find(zone => zone.id === 'school');

function crossesSchoolBoundary(previousPosition, nextPosition) {
  if (!schoolZone) return false;
  const startX = previousPosition.x - schoolZone.x;
  const startZ = previousPosition.z - schoolZone.z;
  const endX = nextPosition.x - schoolZone.x;
  const endZ = nextPosition.z - schoolZone.z;
  const crossingFraction = (start, end, boundary) => {
    if ((start < boundary && end >= boundary) || (start > boundary && end <= boundary)) {
      return (boundary - start) / (end - start);
    }
    return null;
  };

  for (const boundaryX of [-87.5, 87.5]) {
    const fraction = crossingFraction(startX, endX, boundaryX);
    if (fraction === null) continue;
    const crossingZ = startZ + (endZ - startZ) * fraction;
    if (crossingZ >= -82.5 && crossingZ <= 82.5) return true;
  }

  for (const boundaryZ of [-82.5, 82.5]) {
    const fraction = crossingFraction(startZ, endZ, boundaryZ);
    if (fraction === null) continue;
    const crossingX = startX + (endX - startX) * fraction;
    if (crossingX < -87.5 || crossingX > 87.5) continue;
    if (boundaryZ === 82.5 && Math.abs(crossingX) < 11.25) continue;
    return true;
  }

  return false;
}

export function createPlayer(camera, domElement, scene) {
  const controls = new PointerLockControls(camera, domElement);
  const spawnPosition = new THREE.Vector3(schoolZone.x, 0, schoolZone.z + 92);
  const playerPosition = spawnPosition.clone();
  const cameraForward = new THREE.Vector3();
  const cameraRight = new THREE.Vector3();
  camera.rotation.order = 'YXZ';
  camera.rotation.set(-0.3, 0, 0);
  camera.position.set(spawnPosition.x, 4.8, spawnPosition.z + 9);
  const soundscape = createSoundscape();

  // Tốc độ nhanh hơn
  const speed = 62;
  const runSpeed = 110;
  const scooterSpeed = 155;

  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();
  let ridingScooter = false;
  let activeScooter = null;
  let walkTime = 0;
  let trafficStopTime = 0;
  let greetingTimer = 0;
  let greetingFacing = 0;
  let teacherConversation = null;
  const greetedTeachers = new Set();
  const schoolGreetingPoints = [
    { name: 'thầy Nguyễn Đức Hiền', x: schoolZone.x - 7, z: schoolZone.z + 91 },
    { name: 'thầy Phan Văn Cường', x: schoolZone.x + 7, z: schoolZone.z + 91 },
    { name: 'cô Vân Anh', x: schoolZone.x - 11.25, z: schoolZone.z + 58.75 },
    { name: 'cô Hồng', x: schoolZone.x + 11.25, z: schoolZone.z + 58.75 }
  ];

  let moveForward = false;
  let moveBackward = false;
  let moveLeft = false;
  let moveRight = false;
  let isRunning = false;

  // Nhân vật visible (third-person body)
  const character = createCharacterModel();
  character.position.copy(playerPosition);
  scene.add(character);

  const onKeyDown = (e) => {
    if (e.target instanceof HTMLElement && e.target.matches('input, textarea, button')) return;
    if (teacherConversation) {
      if (e.repeat) return;
      e.preventDefault();
      if (e.code === 'KeyQ') {
        closeTeacherConversation();
      } else if (teacherConversation.awaitingChoice && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
        answerTeacherConversation(Number(e.code.slice(-1)));
      } else if (!teacherConversation.awaitingChoice && e.code === 'KeyE') {
        showTeacherQuestion();
      }
      return;
    }
    switch (e.code) {
      case 'KeyW': moveForward = true; break;
      case 'KeyS': moveBackward = true; break;
      case 'KeyA': moveLeft = true; break;
      case 'KeyD': moveRight = true; break;
      case 'ShiftLeft':
      case 'ShiftRight': isRunning = true; break;
      case 'KeyF':
        if (controls.isLocked && !e.repeat) toggleScooter();
        break;
      case 'KeyE':
        if (controls.isLocked && !ridingScooter && !startTeacherConversation()) {
          tryInteract(playerPosition, soundscape);
        }
        break;
    }
  };

  const onKeyUp = (e) => {
    switch (e.code) {
      case 'KeyW': moveForward = false; break;
      case 'KeyS': moveBackward = false; break;
      case 'KeyA': moveLeft = false; break;
      case 'KeyD': moveRight = false; break;
      case 'ShiftLeft':
      case 'ShiftRight': isRunning = false; break;
    }
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  function startTeacherConversation() {
    const teacherPosition = new THREE.Vector3(schoolZone.x - 7, 0, schoolZone.z + 90);
    if (playerPosition.distanceTo(teacherPosition) > 11.5) return false;

    teacherConversation = { awaitingChoice: true };
    document.getElementById('teacher-dialog').hidden = false;
    showTeacherQuestion();
    return true;
  }

  function showTeacherQuestion() {
    teacherConversation.awaitingChoice = true;
    document.getElementById('teacher-dialog-text').textContent =
      'Thầy Hiền mỉm cười: “Chào em! Em muốn hỏi thầy điều gì?”';
    document.getElementById('teacher-dialog-choices').textContent =
      '1 — Hỏi về trường  ·  2 — Hỏi lời khuyên học tập  ·  3 — Chào tạm biệt';
  }

  function answerTeacherConversation(choice) {
    const replies = {
      1: 'Thầy Hiền: “Trường mình có khuôn viên rộng, nhiều cây xanh và các sân thể thao. Em hãy cùng các bạn giữ gìn trường lớp nhé!”',
      2: 'Thầy Hiền: “Em hãy chăm chỉ, chủ động hỏi thầy cô khi chưa hiểu bài và luôn giúp đỡ bạn bè. Mỗi ngày tiến bộ một chút là rất đáng quý.”',
      3: 'Thầy Hiền: “Tạm biệt em, chúc em có một ngày học tập thật vui!”'
    };
    teacherConversation.awaitingChoice = false;
    document.getElementById('teacher-dialog-text').textContent = replies[choice];
    document.getElementById('teacher-dialog-choices').textContent =
      choice === 3 ? 'Q — Kết thúc trò chuyện' : 'E — Hỏi tiếp  ·  Q — Kết thúc trò chuyện';
    soundscape.playInteraction(false);
  }

  function closeTeacherConversation() {
    teacherConversation = null;
    document.getElementById('teacher-dialog').hidden = true;
  }

  function toggleScooter() {
    const position = playerPosition;
    if (ridingScooter && activeScooter) {
      activeScooter.userData.occupied = false;
      activeScooter.userData.speed = 0;
      activeScooter.position.set(position.x, roadHeightAt(position.x, position.z), position.z);
      activeScooter.rotation.y = character.rotation.y;
      activeScooter.visible = true;
      if (activeScooter.userData.rider) activeScooter.userData.rider.visible = false;
      activeScooter = null;
      ridingScooter = false;
      velocity.set(0, 0, 0);
      character.visible = true;
      document.getElementById('hint').textContent =
        'WASD di chuyển · E khám phá · F lên xe máy · Shift chạy';
      showDialog('Bạn đã xuống xe máy. Nhấn F gần xe để đi tiếp.');
      return;
    }

    let nearestScooter = null;
    let nearestDistance = Infinity;
    animated.scooters.forEach((scooter) => {
      if (scooter.userData.occupied) return;
      const distance = position.distanceTo(scooter.position);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestScooter = scooter;
      }
    });

    if (!nearestScooter || nearestDistance > 9) {
      showDialog('Đến gần một chiếc xe máy ven đường rồi nhấn F để lên xe.');
      return;
    }

    activeScooter = nearestScooter;
    activeScooter.userData.occupied = true;
    activeScooter.visible = true;
    if (activeScooter.userData.rider) activeScooter.userData.rider.visible = true;
    ridingScooter = true;
    velocity.set(0, 0, 0);
    character.visible = false;
    document.getElementById('hint').textContent =
      'WASD lái xe máy · Dừng đèn đỏ · F xuống xe · Enter chat';
    showDialog('Đã lên xe máy. Dùng WASD để lái, nhấn F để xuống xe.');
  }

  function update(delta) {
    if (!controls.isLocked) return;

    soundscape.update(playerPosition, delta);
    if (!ridingScooter && greetingTimer <= 0) {
      const teacher = schoolGreetingPoints.find(candidate =>
        !greetedTeachers.has(candidate.name) &&
        Math.hypot(playerPosition.x - candidate.x, playerPosition.z - candidate.z) < 14
      );
      if (teacher) {
        greetedTeachers.add(teacher.name);
        greetingTimer = 2.4;
        greetingFacing = Math.atan2(teacher.x - playerPosition.x, teacher.z - playerPosition.z);
        showDialog(`Bạn vui vẻ chào ${teacher.name}.`);
        soundscape.playInteraction(false);
      }
    } else {
      greetingTimer = Math.max(0, greetingTimer - delta);
    }

    const isMoving = moveForward || moveBackward || moveLeft || moveRight;
    if (trafficStopTime > 0) {
      trafficStopTime = Math.max(0, trafficStopTime - delta);
      velocity.set(0, 0, 0);
    } else {
      const currentSpeed = ridingScooter ? scooterSpeed : isRunning ? runSpeed : speed;
      const previousPosition = playerPosition.clone();
      velocity.x -= velocity.x * 12.0 * delta;
      velocity.z -= velocity.z * 12.0 * delta;
      direction.z = Number(moveForward) - Number(moveBackward);
      direction.x = Number(moveRight) - Number(moveLeft);
      direction.normalize();

      if (moveForward || moveBackward) velocity.z -= direction.z * currentSpeed * delta;
      if (moveLeft || moveRight) velocity.x -= direction.x * currentSpeed * delta;
      if (isMoving && !ridingScooter) walkTime += delta * (isRunning ? 13 : 8);

      cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
      cameraRight.y = 0;
      cameraRight.normalize();
      cameraForward.set(cameraRight.z, 0, -cameraRight.x);
      playerPosition.addScaledVector(cameraRight, -velocity.x * delta);
      playerPosition.addScaledVector(cameraForward, -velocity.z * delta);
      playerPosition.x = THREE.MathUtils.clamp(playerPosition.x, -1140, 1140);
      playerPosition.z = THREE.MathUtils.clamp(playerPosition.z, -1140, 1140);

      if (crossesSchoolBoundary(previousPosition, playerPosition)) {
        playerPosition.copy(previousPosition);
        velocity.set(0, 0, 0);
      }

      if (ridingScooter && crossedRedLight(previousPosition, playerPosition)) {
        playerPosition.copy(previousPosition);
        velocity.set(0, 0, 0);
        trafficStopTime = 4;
        showDialog('Cảnh sát giao thông đã dừng xe bạn vì vượt đèn đỏ. Hãy chấp hành tín hiệu đèn nhé!');
      }
    }

    cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    cameraRight.y = 0;
    cameraRight.normalize();
    cameraForward.set(cameraRight.z, 0, -cameraRight.x);

    camera.position.set(
      playerPosition.x - cameraForward.x * 9,
      playerPosition.y + 4.8 + (isMoving && !ridingScooter ? Math.abs(Math.sin(walkTime)) * 0.08 : 0),
      playerPosition.z - cameraForward.z * 9
    );
    character.position.copy(playerPosition);
    const stride = isMoving && !ridingScooter ? Math.sin(walkTime) * (isRunning ? 0.62 : 0.4) : 0;
    character.position.y = roadHeightAt(playerPosition.x, playerPosition.z) - 0.2
      + (isMoving && !ridingScooter ? Math.abs(Math.sin(walkTime)) * 0.09 : 0);
    character.rotation.y = greetingTimer > 0
      ? greetingFacing
      : Math.atan2(cameraForward.x, cameraForward.z);
    character.userData.armMeshes.forEach((arm, index) => {
      arm.rotation.x = index === 0
        ? stride
        : greetingTimer > 0
          ? Math.sin((2.4 - greetingTimer) * 11) * 0.45
          : -stride;
      arm.rotation.z = index === 1 && greetingTimer > 0
        ? 2.25 + Math.sin((2.4 - greetingTimer) * 11) * 0.18
        : index === 1
          ? -0.12
          : 0.12;
    });
    character.userData.legMeshes.forEach((leg, index) => {
      leg.rotation.x = index === 0 ? -stride : stride;
    });

    if (ridingScooter && activeScooter) {
      activeScooter.position.set(
        playerPosition.x,
        roadHeightAt(playerPosition.x, playerPosition.z) + 0.2,
        playerPosition.z
      );
      activeScooter.rotation.y = character.rotation.y;
      activeScooter.userData.speed = Math.abs(velocity.z);
    }

    // Footstep sound
    if (isMoving && !ridingScooter) {
      footstepTimer -= delta;
      if (footstepTimer <= 0) {
        soundscape.playFootstep();
        footstepTimer = isRunning ? 0.28 : 0.42;
      }
    } else {
      footstepTimer = 0;
    }
  }

  return {
    controls,
    update,
    character,
    playerPosition,
    setPosition: (x, z) => {
      playerPosition.set(x, 0, z);
      velocity.set(0, 0, 0);
    },
    activateAudio: soundscape.activate,
    setName: (name) => setCharacterName(character, name),
    getRidingState: () => ridingScooter
  };
}

function crossedRedLight(previous, current) {
  const insideNorthSouthLane = Math.abs(current.x) < 8;
  if (
    insideNorthSouthLane &&
    ((previous.z > 15 && current.z <= 15) || (previous.z < -15 && current.z >= -15)) &&
    getTrafficSignalState('northSouth') === 'red'
  ) return true;

  const insideEastWestLane = Math.abs(current.z) < 8;
  return insideEastWestLane &&
    ((previous.x < -15 && current.x >= -15) || (previous.x > 15 && current.x <= 15)) &&
    getTrafficSignalState('eastWest') === 'red';
}

export function createRemoteCharacter(name) {
  return createCharacterModel(name);
}

function createCharacterModel(name = '') {
  const g = new THREE.Group();
  const armMeshes = [];
  const legMeshes = [];
  const skin = new THREE.MeshStandardMaterial({ color: 0xe7a77e, roughness: 0.88 });
  const shirt = new THREE.MeshStandardMaterial({
    map: createPlaidTexture(),
    roughness: 0.92
  });
  const shorts = new THREE.MeshStandardMaterial({ color: 0x2878c7, roughness: 0.88 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x59321f, roughness: 0.96 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.46, 0.9, 6, 12), shirt);
  torso.position.y = 1.72;
  torso.castShadow = true;
  g.add(torso);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.3, 10), skin);
  neck.position.y = 2.4;
  g.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.47, 20, 16), skin);
  head.scale.set(1.05, 1.08, 0.98);
  head.position.y = 2.84;
  head.castShadow = true;
  g.add(head);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hair
  );
  hairCap.position.y = 3.02;
  g.add(hairCap);
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 10), hair);
  hairBack.scale.set(1, 0.72, 0.76);
  hairBack.position.set(0, 2.79, -0.24);
  g.add(hairBack);

  for (let curl = 0; curl < 9; curl++) {
    const angle = (curl / 9) * Math.PI * 2;
    const lock = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), hair);
    lock.scale.set(1, 0.9, 0.95);
    lock.position.set(
      Math.sin(angle) * 0.33,
      3.13 + (curl % 3) * 0.035,
      Math.cos(angle) * 0.3
    );
    lock.castShadow = true;
    g.add(lock);
  }
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xfff8e9, roughness: 0.42 });
  const iris = new THREE.MeshStandardMaterial({ color: 0x60391f, roughness: 0.5 });
  const pupil = new THREE.MeshStandardMaterial({ color: 0x211b17, roughness: 0.4 });
  const sparkle = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const brow = new THREE.MeshStandardMaterial({ color: 0x59321f, roughness: 0.9 });
  [-0.14, 0.14].forEach(x => {
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 10), eyeWhite);
    white.scale.set(0.85, 1.18, 0.62);
    white.position.set(x, 2.88, 0.411);
    g.add(white);
    const irisMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), iris);
    irisMesh.position.set(x, 2.875, 0.474);
    g.add(irisMesh);
    const pupilMesh = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), pupil);
    pupilMesh.position.set(x, 2.878, 0.515);
    g.add(pupilMesh);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), sparkle);
    glint.position.set(x - 0.018, 2.9, 0.54);
    g.add(glint);

    const eyebrow = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 6), brow);
    eyebrow.scale.set(1.2, 0.28, 0.35);
    eyebrow.position.set(x, 3.045, 0.43);
    g.add(eyebrow);
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), skin);
  nose.scale.set(0.7, 0.8, 0.7);
  nose.position.set(0, 2.75, 0.48);
  g.add(nose);
  const smile = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.09, 2.64, 0.45),
        new THREE.Vector3(0, 2.61, 0.475),
        new THREE.Vector3(0.09, 2.64, 0.45)
      ]),
      8,
      0.018,
      6,
      false
    ),
    new THREE.MeshBasicMaterial({ color: 0x713b35 })
  );
  g.add(smile);
  const blush = new THREE.MeshBasicMaterial({ color: 0xe98e79, transparent: true, opacity: 0.55 });
  [-1, 1].forEach(side => {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), blush);
    cheek.scale.set(1.3, 0.65, 0.3);
    cheek.position.set(side * 0.29, 2.7, 0.39);
    g.add(cheek);
  });

  [-1, 1].forEach(side => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.57, 2.1, 0);
    arm.rotation.z = side * -0.12;
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.6, 4, 8), shirt);
    sleeve.position.y = -0.28;
    sleeve.castShadow = true;
    arm.add(sleeve);
    g.add(arm);
    armMeshes.push(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), skin);
    hand.position.set(side * 0.02, -0.73, 0.02);
    arm.add(hand);

    const shortLeg = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.5), shorts);
    shortLeg.position.set(side * 0.2, 0.68, 0.02);
    g.add(shortLeg);

    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.35, 4, 8), skin);
    leg.position.set(side * 0.21, 0.35, 0);
    leg.castShadow = true;
    g.add(leg);
    legMeshes.push(leg);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), skin);
    foot.scale.set(0.72, 0.42, 1.35);
    foot.position.set(side * 0.21, 0.075, 0.13);
    g.add(foot);
    for (let toe = 0; toe < 3; toe++) {
      const toeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), skin);
      toeMesh.scale.set(0.8, 0.8, 1.3);
      toeMesh.position.set(side * 0.21 + (toe - 1) * 0.085, 0.065, 0.29);
      g.add(toeMesh);
    }
  });

  g.userData.armMeshes = armMeshes;
  g.userData.legMeshes = legMeshes;
  g.scale.setScalar(1.1);
  if (name) setCharacterName(g, name);
  return g;
}

function createPlaidTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = '#e7bf83';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(147, 51, 42, 0.86)';
  for (let offset = 0; offset < 128; offset += 32) {
    context.fillRect(offset, 0, 8, 128);
    context.fillRect(0, offset, 128, 8);
  }
  context.fillStyle = 'rgba(47, 83, 112, 0.75)';
  for (let offset = 16; offset < 128; offset += 32) {
    context.fillRect(offset, 0, 4, 128);
    context.fillRect(0, offset, 128, 4);
  }
  context.fillStyle = 'rgba(255, 242, 210, 0.62)';
  for (let offset = 8; offset < 128; offset += 32) {
    context.fillRect(offset, 0, 2, 128);
    context.fillRect(0, offset, 128, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.anisotropy = 4;
  return texture;
}

function setCharacterName(character, name) {
  if (character.userData.nameLabel) {
    character.remove(character.userData.nameLabel);
    character.userData.nameLabel.material.map.dispose();
    character.userData.nameLabel.material.dispose();
    character.userData.nameLabel.geometry.dispose();
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  context.font = 'bold 42px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineWidth = 9;
  context.lineJoin = 'round';
  context.strokeStyle = 'rgba(20, 28, 29, 0.9)';
  context.strokeText(name, canvas.width / 2, canvas.height / 2);
  context.fillStyle = '#fff8e9';
  context.fillText(name, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  }));
  label.position.y = 4.4;
  label.scale.set(5.5, 1.05, 1);
  label.userData.name = name;
  character.add(label);
  character.userData.nameLabel = label;
}

function tryInteract(playerPos, soundscape) {
  for (const obj of interactables) {
    const dist = playerPos.distanceTo(new THREE.Vector3(obj.pos.x, 0, obj.pos.z));
    if (dist < obj.radius) {
      showDialog(obj.text);
      soundscape.playInteraction(obj.text.includes('cừu'));
      return;
    }
  }
  showDialog('Không có gì đặc biệt ở gần đây...');
  soundscape.playInteraction(false);
}

function createSoundscape() {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) {
    return {
      activate() {},
      update() {},
      playFootstep() {},
      playInteraction() {}
    };
  }

  const context = new AudioContextConstructor();
  const master = context.createGain();
  master.gain.value = 0.55;
  master.connect(context.destination);
  let started = false;
  let nextBirdAt = 0;
  let muted = false;
  let resumeAttempted = false;
  let riverGain;

  window.addEventListener('game-audio-toggle', (event) => {
    muted = event.detail.muted;
    master.gain.setTargetAtTime(muted ? 0 : 0.55, context.currentTime, 0.08);
    if (!muted) {
      resumeAttempted = false;
      resume();
    }
  });

  function resume() {
    if (context.state === 'suspended' && !resumeAttempted) {
      resumeAttempted = true;
      context.resume().catch((error) => console.warn('Không thể bật âm thanh:', error));
    }
  }

  function startAmbience() {
    if (started) return;
    started = true;
    const sampleCount = context.sampleRate * 3;
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      samples[i] = (Math.random() * 2 - 1) * 0.18;
    }

    const wind = context.createBufferSource();
    wind.buffer = buffer;
    wind.loop = true;
    const windFilter = context.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 420;
    const windVolume = context.createGain();
    windVolume.gain.value = 0.12;
    wind.connect(windFilter);
    windFilter.connect(windVolume);
    windVolume.connect(master);
    wind.start();

    const river = context.createBufferSource();
    river.buffer = buffer;
    river.loop = true;
    const riverFilter = context.createBiquadFilter();
    riverFilter.type = 'bandpass';
    riverFilter.frequency.value = 650;
    riverFilter.Q.value = 0.45;
    riverGain = context.createGain();
    riverGain.gain.value = 0;
    river.connect(riverFilter);
    riverFilter.connect(riverGain);
    riverGain.connect(master);
    river.start();
  }

  function playBird() {
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1900 + Math.random() * 500, now);
    oscillator.frequency.exponentialRampToValueAtTime(1250 + Math.random() * 350, now + 0.16);
    volume.gain.setValueAtTime(0.0001, now);
    volume.gain.exponentialRampToValueAtTime(0.035, now + 0.025);
    volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    oscillator.connect(volume);
    volume.connect(master);
    oscillator.start(now);
    oscillator.stop(now + 0.21);
  }

  function playSheep() {
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(430, now);
    oscillator.frequency.exponentialRampToValueAtTime(250, now + 0.18);
    oscillator.frequency.exponentialRampToValueAtTime(330, now + 0.36);
    volume.gain.setValueAtTime(0.0001, now);
    volume.gain.exponentialRampToValueAtTime(0.045, now + 0.04);
    volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    oscillator.connect(volume);
    volume.connect(master);
    oscillator.start(now);
    oscillator.stop(now + 0.41);
  }

  return {
    activate() {
      resume();
      startAmbience();
    },
    update(position, delta) {
      resume();
      startAmbience();
      const now = context.currentTime;
      const riverDistance = Math.abs(position.z - 55);
      const riverLevel = Math.max(0, 1 - riverDistance / 70);
      riverGain.gain.setTargetAtTime(riverLevel * 0.12, now, 0.8);

      nextBirdAt -= delta;
      if (nextBirdAt <= 0) {
        if (Math.random() > 0.2) playBird();
        nextBirdAt = 5 + Math.random() * 8;
      }
    },
    playFootstep() {
      resume();
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const volume = context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(115 + Math.random() * 35, now);
      oscillator.frequency.exponentialRampToValueAtTime(55, now + 0.12);
      volume.gain.setValueAtTime(0.055, now);
      volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
      oscillator.connect(volume);
      volume.connect(master);
      oscillator.start(now);
      oscillator.stop(now + 0.14);
    },
    playInteraction(isSheep) {
      resume();
      if (isSheep) {
        playSheep();
        return;
      }
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const volume = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(660, now);
      oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      volume.gain.setValueAtTime(0.0001, now);
      volume.gain.exponentialRampToValueAtTime(0.04, now + 0.025);
      volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      oscillator.connect(volume);
      volume.connect(master);
      oscillator.start(now);
      oscillator.stop(now + 0.21);
    }
  };
}

let dialogTimer = 0;
function showDialog(text) {
  const dialogEl = document.getElementById('dialog');
  dialogEl.style.display = 'block';
  dialogEl.textContent = text;
  dialogTimer = 240;
}

export function updateDialog() {
  if (dialogTimer > 0) {
    dialogTimer--;
    if (dialogTimer <= 0) {
      document.getElementById('dialog').style.display = 'none';
    }
  }
}

export function updateLocationUI(position) {
  const zone = getCurrentZone(position);
  if (zone.name !== currentZoneName) {
    currentZoneName = zone.name;
    document.getElementById('location').textContent = zone.name;
    document.getElementById('zone-description').textContent = zone.desc;
  }
}
