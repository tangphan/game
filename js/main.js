import * as THREE from 'three';
import { createElectricScooter, createWorld, roadHeightAt, updateWorld } from './world.js';
import { createPlayer, createRemoteCharacter, updateDialog, updateLocationUI } from './player.js';
import { MultiplayerClient } from './multiplayer.js';
import { districtAreas, districtRoads, zones } from './zones.js';

// ===== KHỞI TẠO =====
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2600);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.14;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Thế giới
createWorld(scene);

// Người chơi
const {
  controls,
  update: updatePlayer,
  activateAudio,
  setName: setPlayerName,
  playerPosition,
  setPosition: setPlayerPosition,
  getRidingState,
  setTouchActive,
  setTouchMovement,
  lookByTouch,
  touchAction,
  getTouchActive,
  answerTeacher
} = createPlayer(camera, document.body, scene);

const remotePlayers = new Map();
const roomPlayers = new Map();
const multiplayer = new MultiplayerClient(handleNetworkEvent);
let soloMode = false;

// UI khóa chuột
const blocker = document.getElementById('blocker');
const roomSetup = document.getElementById('room-setup');
const playerNameInput = document.getElementById('player-name');
const roomCodeInput = document.getElementById('room-code-input');
const resumeButton = document.getElementById('resume-game');
const connectionStatus = document.getElementById('connection-status');
const socialPanel = document.getElementById('social-panel');
const roomCodeDisplay = document.getElementById('room-code-display');
const playerCount = document.getElementById('player-count');
const playerList = document.getElementById('player-list');
const chatMessages = document.getElementById('chat-messages');
const touchInterface = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
if (touchInterface) document.body.classList.add('touch-device');

const invitedRoom = new URLSearchParams(window.location.hash.slice(1)).get('room');
if (invitedRoom) roomCodeInput.value = invitedRoom.toUpperCase().slice(0, 6);

document.getElementById('create-room').addEventListener('click', () => startRoom());
document.getElementById('play-solo').addEventListener('click', startSolo);
document.getElementById('join-room').addEventListener('click', () => {
  if (!roomCodeInput.value.trim()) {
    setConnectionStatus('Hãy nhập mã phòng bạn bè gửi.');
    roomCodeInput.focus();
    return;
  }
  startRoom(roomCodeInput.value);
});
roomCodeInput.addEventListener('input', () => {
  roomCodeInput.value = roomCodeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
});
resumeButton.addEventListener('click', () => {
  if (!multiplayer.connected && !soloMode) {
    roomSetup.hidden = false;
    resumeButton.hidden = true;
    return;
  }
  startGameControls();
});

document.getElementById('copy-invite').addEventListener('click', async () => {
  const inviteUrl = new URL(window.location.href);
  inviteUrl.hash = `room=${roomCodeDisplay.textContent}`;
  try {
    await navigator.clipboard.writeText(inviteUrl.href);
    setConnectionStatus('Đã sao chép liên kết mời. Gửi cho bạn bè để họ vào phòng.');
  } catch (error) {
    setConnectionStatus('Không sao chép được liên kết. Hãy gửi mã phòng ' + roomCodeDisplay.textContent + ' cho bạn bè.');
    console.warn('Không thể sao chép lời mời:', error);
  }
});

document.getElementById('chat-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const chatInput = document.getElementById('chat-input');
  if (multiplayer.sendChat(chatInput.value)) chatInput.value = '';
});

document.addEventListener('keydown', (event) => {
  if (event.code === 'Escape' && getTouchActive()) {
    setTouchActive(false);
    blocker.style.display = 'flex';
    return;
  }
  if (event.code !== 'Enter' || !controls.isLocked) return;
  controls.unlock();
  window.setTimeout(() => document.getElementById('chat-input').focus(), 0);
});

controls.addEventListener('lock', () => { blocker.style.display = 'none'; });
controls.addEventListener('unlock', () => { blocker.style.display = 'flex'; });

const soundToggle = document.getElementById('sound-toggle');
soundToggle.addEventListener('click', (event) => {
  event.stopPropagation();
  const muted = soundToggle.dataset.muted === 'true';
  soundToggle.dataset.muted = String(!muted);
  soundToggle.setAttribute('aria-pressed', String(muted));
  soundToggle.textContent = muted ? '🔊 Âm thanh: bật' : '🔇 Âm thanh: tắt';
  window.dispatchEvent(new CustomEvent('game-audio-toggle', { detail: { muted: !muted } }));
});

function startGameControls() {
  activateAudio();
  if (touchInterface) {
    setTouchActive(true);
    blocker.style.display = 'none';
    return;
  }
  controls.lock();
}

function setupTouchControls() {
  const joystick = document.getElementById('move-stick');
  const knob = document.getElementById('move-stick-knob');
  let joystickPointer = null;
  let lookPointer = null;
  let previousLookPoint = null;

  const updateJoystick = event => {
    const bounds = joystick.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const maxDistance = bounds.width * 0.34;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const distance = Math.min(Math.hypot(dx, dy), maxDistance);
    const angle = Math.atan2(dy, dx);
    const knobX = Math.cos(angle) * distance;
    const knobY = Math.sin(angle) * distance;
    knob.style.transform = `translate(${knobX}px, ${knobY}px)`;
    setTouchMovement(knobX / maxDistance, knobY / maxDistance);
  };

  joystick.addEventListener('pointerdown', event => {
    event.preventDefault();
    joystickPointer = event.pointerId;
    joystick.setPointerCapture(event.pointerId);
    updateJoystick(event);
  });
  joystick.addEventListener('pointermove', event => {
    if (event.pointerId === joystickPointer) updateJoystick(event);
  });
  const releaseJoystick = event => {
    if (event.pointerId !== joystickPointer) return;
    joystickPointer = null;
    knob.style.transform = 'translate(0, 0)';
    setTouchMovement(0, 0);
  };
  joystick.addEventListener('pointerup', releaseJoystick);
  joystick.addEventListener('pointercancel', releaseJoystick);

  renderer.domElement.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || event.clientX < window.innerWidth * 0.38) return;
    event.preventDefault();
    lookPointer = event.pointerId;
    previousLookPoint = { x: event.clientX, y: event.clientY };
    renderer.domElement.setPointerCapture(event.pointerId);
  });
  renderer.domElement.addEventListener('pointermove', event => {
    if (event.pointerId !== lookPointer || !previousLookPoint) return;
    lookByTouch(event.clientX - previousLookPoint.x, event.clientY - previousLookPoint.y);
    previousLookPoint = { x: event.clientX, y: event.clientY };
  });
  const releaseLook = event => {
    if (event.pointerId !== lookPointer) return;
    lookPointer = null;
    previousLookPoint = null;
  };
  renderer.domElement.addEventListener('pointerup', releaseLook);
  renderer.domElement.addEventListener('pointercancel', releaseLook);

  document.querySelectorAll('[data-touch-action]').forEach(button => {
    const action = button.dataset.touchAction;
    if (action === 'run') {
      button.addEventListener('pointerdown', event => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        touchAction('run');
      });
      ['pointerup', 'pointercancel'].forEach(type => {
        button.addEventListener(type, () => touchAction('stop-run'));
      });
      return;
    }
    button.addEventListener('click', () => {
      if (action === 'pause') {
        setTouchActive(false);
        blocker.style.display = 'flex';
      } else {
        touchAction(action);
      }
    });
  });

  document.querySelectorAll('[data-teacher-choice]').forEach(button => {
    button.addEventListener('click', () => {
      const choice = button.dataset.teacherChoice;
      answerTeacher(choice === 'continue' || choice === 'close' ? choice : Number(choice));
    });
  });
}

setupTouchControls();

async function startRoom(roomCode = '') {
  if (multiplayer.connected) {
    startGameControls();
    return;
  }

  const name = playerNameInput.value.trim();
  if (!name) {
    setConnectionStatus('Hãy nhập tên nhân vật trước khi vào phòng.');
    playerNameInput.focus();
    return;
  }

  soloMode = false;
  const createButton = document.getElementById('create-room');
  const joinButton = document.getElementById('join-room');
  createButton.disabled = true;
  joinButton.disabled = true;
  setConnectionStatus('Đang kết nối máy chủ...');

  try {
    const result = await multiplayer.connect(name, roomCode);
    if (result.spawn) {
      setPlayerPosition(result.spawn.x, result.spawn.z);
    }
    setPlayerName(name.slice(0, 18));
    upsertPlayer({
      id: multiplayer.playerId,
      name: name.slice(0, 18),
      position: { x: result.spawn?.x ?? 35, y: 0, z: result.spawn?.z ?? -20, rotationY: 0 }
    });
    roomCodeDisplay.textContent = result.roomCode;
    playerNameInput.hidden = true;
    document.getElementById('player-name-label').hidden = true;
    roomSetup.hidden = true;
    resumeButton.hidden = false;
    socialPanel.hidden = false;
    renderPlayerList();
    setConnectionStatus(`Đã vào phòng ${result.roomCode}. Chia sẻ mã mời cho bạn bè.`);
    startGameControls();
  } catch (error) {
    setConnectionStatus(error.message);
    createButton.disabled = false;
    joinButton.disabled = false;
  }
}

function startSolo() {
  const name = playerNameInput.value.trim();
  if (!name) {
    setConnectionStatus('Hãy nhập tên nhân vật trước khi chơi.');
    playerNameInput.focus();
    return;
  }

  soloMode = true;
  setPlayerName(name.slice(0, 18));
  playerNameInput.hidden = true;
  document.getElementById('player-name-label').hidden = true;
  roomSetup.hidden = true;
  resumeButton.hidden = false;
  socialPanel.hidden = true;
  setConnectionStatus(touchInterface
    ? 'Bạn đang chơi một mình. Dùng nút Tạm dừng trên màn hình để nghỉ.'
    : 'Bạn đang chơi một mình. Có thể nhấn Esc để tạm dừng.');
  startGameControls();
}

function setConnectionStatus(message) {
  connectionStatus.textContent = message;
  document.getElementById('social-status').textContent = message;
}

function handleNetworkEvent(message) {
  switch (message.type) {
    case 'room-ready':
      roomPlayers.clear();
      chatMessages.replaceChildren();
      message.players.forEach(upsertPlayer);
      break;
    case 'player-joined':
    case 'player-update':
      upsertPlayer(message.player);
      break;
    case 'player-left':
      roomPlayers.delete(message.playerId);
      removeRemotePlayer(message.playerId);
      renderPlayerList();
      break;
    case 'chat':
      appendChatMessage(message.name, message.text);
      break;
    case 'error':
      setConnectionStatus(message.message);
      break;
    case 'disconnected':
      if (!message.hadRoom) break;
      soloMode = false;
      roomPlayers.clear();
      for (const id of remotePlayers.keys()) removeRemotePlayer(id);
      renderPlayerList();
      document.getElementById('create-room').disabled = false;
      document.getElementById('join-room').disabled = false;
      playerNameInput.hidden = false;
      document.getElementById('player-name-label').hidden = false;
      roomCodeDisplay.textContent = '------';
      playerCount.textContent = 'Đã mất kết nối với máy chủ.';
      setConnectionStatus('Mất kết nối. Nhấn Esc để thử vào lại phòng.');
      roomSetup.hidden = false;
      resumeButton.hidden = true;
      break;
  }
}

function upsertPlayer(player) {
  if (!player || typeof player.id !== 'string' || typeof player.name !== 'string') return;
  roomPlayers.set(player.id, player);
  if (player.id !== multiplayer.playerId) {
    let remote = remotePlayers.get(player.id);
    if (!remote) {
      const character = createRemoteCharacter(player.name);
      scene.add(character);
      remote = {
        character,
        scooter: null,
        targetPosition: new THREE.Vector3(),
        targetRotation: 0,
        initialized: false
      };
      remotePlayers.set(player.id, remote);
    }

    remote.character.userData.nameLabel && setRemoteName(remote.character, player.name);
    const riding = player.riding === true;
    remote.character.visible = !riding;
    if (riding && !remote.scooter) {
      remote.scooter = createElectricScooter(scene, 0, 0, 0, false);
    } else if (!riding && remote.scooter) {
      disposeObject(remote.scooter);
      remote.scooter = null;
    }

    if (player.position) {
      remote.targetPosition.set(player.position.x, 0, player.position.z);
      remote.targetRotation = player.position.rotationY || 0;
      if (!remote.initialized) {
        remote.character.position.copy(remote.targetPosition);
        remote.character.rotation.y = remote.targetRotation;
        remote.initialized = true;
      }
    }
  }
  renderPlayerList();
}

function setRemoteName(character, name) {
  const label = character.userData.nameLabel;
  if (!label || label.userData.name === name) return;
  label.userData.name = name;
  const context = label.material.map.image.getContext('2d');
  context.clearRect(0, 0, 512, 96);
  context.font = 'bold 42px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineWidth = 9;
  context.lineJoin = 'round';
  context.strokeStyle = 'rgba(20, 28, 29, 0.9)';
  context.strokeText(name, 256, 48);
  context.fillStyle = '#fff8e9';
  context.fillText(name, 256, 48);
  label.material.map.needsUpdate = true;
}

function removeRemotePlayer(id) {
  const remote = remotePlayers.get(id);
  if (!remote) return;
  if (remote.scooter) disposeObject(remote.scooter);
  scene.remove(remote.character);
  disposeObject(remote.character);
  remotePlayers.delete(id);
}

function disposeObject(object) {
  scene.remove(object);
  object.traverse((child) => {
    if (!child.isMesh && !child.isSprite) return;
    child.geometry?.dispose();
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material.dispose());
    } else {
      child.material?.map?.dispose();
      child.material?.dispose();
    }
  });
}

function renderPlayerList() {
  playerList.replaceChildren();
  const players = Array.from(roomPlayers.values()).sort((a, b) => a.name.localeCompare(b.name));
  playerCount.textContent = `${players.length} người trong phòng`;
  players.forEach((player) => {
    const item = document.createElement('li');
    item.textContent = player.id === multiplayer.playerId
      ? `${player.name} (Bạn)`
      : player.name;
    playerList.appendChild(item);
  });
}

function appendChatMessage(name, text) {
  const item = document.createElement('p');
  const sender = document.createElement('strong');
  sender.textContent = `${name}: `;
  item.append(sender, document.createTextNode(text));
  chatMessages.appendChild(item);
  while (chatMessages.childElementCount > 80) {
    chatMessages.firstElementChild.remove();
  }
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ===== MINIMAP =====
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');
const MINIMAP_SIZE = 180;
const WORLD_SIZE = 2400; // -1200 đến 1200
const mapRoads = [
  [[0, -1050], [0, -700], [0, -350], [0, -120], [0, -45], [0, 20], [0, 55], [0, 120], [0, 350], [0, 700], [0, 1050]],
  [[0, 6], [-17, 12], [-32, 25], [-45, 40]],
  [[0, -55], [28, -55], [51, -50], [74, -66], [96, -91], [120, -119], [145, -145]],
  [[0, -55], [-35, -61], [-76, -69], [-111, -80], [-145, -82]],
  [[0, 76], [-32, 77], [-63, 74], [-90, 70], [-119, 94], [-145, 115]],
  [[0, 80], [42, 84], [91, 89], [145, 92]],
  [[0, -55], [-12, -36], [-24, -15], [-34, 3]],
  [[0, 76], [3, 83], [2, 89], [1, 93]],
  [[1, 55], [1, 79], [1, 93]],
  [[0, 0], [20, -10], [35, -20]],
  [[0, 0], [-22, -4], [-45, -5]],
  [[0, 0], [40, -5], [82, -10]],
  [[0, 0], [-60, 5], [-120, 24], [-180, 27]],
  [[0, 0], [65, -10], [125, -24], [180, -10]]
];

function drawMinimap(playerPos) {
  const ctx = minimapCtx;
  ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

  // Nền
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

  // Viền
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, MINIMAP_SIZE - 2, MINIMAP_SIZE - 2);

  const scale = MINIMAP_SIZE / WORLD_SIZE;
  const toMap = (x, z) => ({
    x: (x + WORLD_SIZE / 2) * scale,
    y: (z + WORLD_SIZE / 2) * scale
  });

  // Vẽ các khu vực
  const zoneColors = {
    'THPT Phan Đăng Lưu': '#f87171',
    'Sân bóng Phong Liên': '#4ade80',
    'Sông Dinh': '#38bdf8',
    'Đập Vệ Vừng': '#60a5fa',
    'Trại cừu Bảo Thành': '#facc15',
    'Cánh đồng lúa Yên Thành': '#a3e635',
    'Xóm quê Yên Thành': '#d6a86b',
    'Đình làng': '#c084fc'
  };

  zones.forEach(z => {
    const p = toMap(z.x - z.w / 2, z.z - z.d / 2);
    ctx.fillStyle = zoneColors[z.name] || '#94a3b8';
    ctx.globalAlpha = 0.7;
    ctx.fillRect(p.x, p.y, z.w * scale, z.d * scale);
    ctx.globalAlpha = 1;
  });

  ctx.strokeStyle = '#d9d2bc';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  mapRoads.forEach((road) => {
    ctx.beginPath();
    road.forEach(([x, z], index) => {
      const point = toMap(x, z);
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  });

  ctx.strokeStyle = '#c9b991';
  ctx.lineWidth = 1.25;
  districtRoads.forEach(road => {
    ctx.beginPath();
    road.forEach(({ x, z }, index) => {
      const point = toMap(x, z);
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  });

  districtAreas.forEach(area => {
    const point = toMap(area.x, area.z);
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  });

  // Người chơi
  const pp = toMap(playerPos.x, playerPos.z);
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(pp.x, pp.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Chữ "Bạn"
  ctx.fillStyle = '#fff';
  ctx.font = '10px sans-serif';
  ctx.fillText('Bạn', pp.x + 7, pp.y + 3);
}

// ===== VÒNG LẶP =====
const clock = new THREE.Clock();
let time = 0;

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);
  time += delta;

  updatePlayer(delta);
  const playerWorldPosition = playerPosition;
  multiplayer.sendPosition(playerWorldPosition, camera.rotation.y, getRidingState());
  remotePlayers.forEach((remote) => {
    const blend = 1 - Math.exp(-10 * delta);
    remote.character.position.lerp(remote.targetPosition, blend);
    const rotationDelta = THREE.MathUtils.euclideanModulo(
      remote.targetRotation - remote.character.rotation.y + Math.PI,
      Math.PI * 2
    ) - Math.PI;
    remote.character.rotation.y += rotationDelta * blend;
    if (remote.scooter) {
      remote.scooter.position.set(
        remote.character.position.x,
        roadHeightAt(remote.character.position.x, remote.character.position.z),
        remote.character.position.z
      );
      remote.scooter.rotation.y = remote.character.rotation.y;
    }
  });
  updateWorld(time, delta);
  updateDialog();
  updateLocationUI(playerWorldPosition);
  drawMinimap(playerWorldPosition);

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Hướng dẫn
setTimeout(() => {
  const dialog = document.getElementById('dialog');
  dialog.style.display = 'block';
  dialog.textContent = 'Chào mừng đến huyện Yên Thành 3D! WASD di chuyển • Shift chạy • E tương tác • Có minimap góc phải.';
  setTimeout(() => { dialog.style.display = 'none'; }, 5000);
}, 700);
