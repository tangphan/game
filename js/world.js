import * as THREE from 'three';
import { districtAreas, districtRoads, zones } from './zones.js';

// Lưu reference để animate
export const animated = {
  water: null,
  npcs: [],
  schoolStudents: [],
  schoolVolleyBall: null,
  sheep: [],
  traffic: [],
  scooters: [],
  trafficSignals: [],
  trafficSignal: { northSouth: 'green', eastWest: 'red' }
};

const vegetableMaterial = new THREE.MeshStandardMaterial({ color: 0x829b48, roughness: 0.9 });

export function createWorld(scene) {
  // ===== ÁNH SÁNG =====
  const hemi = new THREE.HemisphereLight(0xffedcf, 0x668746, 1.35);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffd18a, 2.5);
  sun.position.set(300, 240, 260);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 1400;
  sun.shadow.camera.left = -850;
  sun.shadow.camera.right = 850;
  sun.shadow.camera.top = 850;
  sun.shadow.camera.bottom = -850;
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 3;
  scene.add(sun);

  // ===== ĐỊA HÌNH =====
  const groundGeo = new THREE.PlaneGeometry(2400, 2400, 240, 240);
  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = -pos.getY(i);
    pos.setZ(i, terrainHeightAt(x, z));
  }
  groundGeo.computeVertexNormals();

  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshStandardMaterial({
      color: 0xc4d58c,
      map: createGroundTexture(),
      roughness: 1
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  createRoadNetwork(scene);
  createUrbanTownCenter(scene);
  createTrafficSignals(scene);
  createDistrictNetwork(scene);
  createDistrictSettlements(scene);
  createBenHangBridge(scene);
  createSchool(scene);
  createFootballField(scene);
  createRiver(scene);
  createDam(scene);
  createSheepFarm(scene);
  createRiceFields(scene);
  createTrees(scene);
  createNPCs(scene);

  scene.background = new THREE.Color(0xb5d8e5);
  scene.fog = new THREE.Fog(0xb5d8e5, 720, 2050);
}

function createGroundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#9eae70';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 18000; i++) {
    const shade = Math.random() > 0.52 ? 1 : -1;
    const green = 93 + Math.floor(Math.random() * 48);
    ctx.fillStyle = shade > 0
      ? `rgba(211, ${green + 18}, 139, ${Math.random() * 0.18})`
      : `rgba(60, ${green - 20}, 55, ${Math.random() * 0.16})`;
    const size = 1 + Math.random() * 3;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(96, 96);
  texture.anisotropy = 8;
  return texture;
}

function createRoadNetwork(scene) {
  const asphalt = new THREE.MeshStandardMaterial({ color: 0x343b3c, roughness: 0.96 });
  const sidewalk = new THREE.MeshStandardMaterial({ color: 0xb9b5a7, roughness: 0.9 });
  const curb = new THREE.MeshStandardMaterial({ color: 0xddd8c9, roughness: 0.84 });
  const roadLines = new THREE.MeshBasicMaterial({ color: 0xe9e5d7 });
  const roads = [
    { points: [[0, -1050], [0, -700], [0, -350], [0, -120], [0, -45], [0, 20], [0, 55], [0, 120], [0, 350], [0, 700], [0, 1050]], width: 12 },
    { points: [[0, 6], [-17, 12], [-32, 25], [-45, 40]], width: 8 },
    { points: [[0, -55], [28, -55], [51, -50], [74, -66], [96, -91], [120, -119], [145, -145]], width: 8 },
    { points: [[0, -55], [-35, -61], [-76, -69], [-111, -80], [-145, -82]], width: 8 },
    { points: [[0, 76], [-32, 77], [-63, 74], [-90, 70], [-119, 94], [-145, 115]], width: 8 },
    { points: [[0, 80], [42, 84], [91, 89], [145, 92]], width: 8 },
    { points: [[0, -55], [-12, -36], [-24, -15], [-34, 3]], width: 8 },
    { points: [[0, 76], [3, 83], [2, 89], [1, 93]], width: 8 },
    { points: [[0, 0], [-22, -4], [-45, -5]], width: 7 },
    { points: [[0, 0], [40, -5], [82, -10]], width: 7 },
    { points: [[0, 0], [20, -10], [35, -20]], width: 7 },
    { points: [[0, 0], [-60, 5], [-120, 24], [-180, 27]], width: 9 },
    { points: [[0, 0], [65, -10], [125, -24], [180, -10]], width: 9 }
  ];

  roads.forEach(({ points, width }) => {
    const curve = new THREE.CatmullRomCurve3(
      points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
      false,
      'centripetal'
    );
    addRoadRibbon(scene, curve, width, 0, asphalt);
    for (const side of [-1, 1]) {
      const sidewalkOffset = side * (width / 2 + 1.45);
      addRoadRibbon(scene, curve, 2.5, sidewalkOffset, sidewalk);
      addRoadRibbon(scene, curve, 0.28, side * (width / 2 + 0.12), curb, 0.1);
    }

    if (width >= 10) {
      addRoadMarkings(scene, curve, roadLines);
    }
  });

  createRoadsideLights(scene, roads[0].points);
  createRoadsideLights(scene, roads[1].points);
  createRoadsideLights(scene, roads[2].points);
  createRoadsideLights(scene, roads[4].points);
  createTraffic(scene, roads);

  [
    { x: -31, z: 17, rotation: Math.PI / 4 },
    { x: -51, z: 43, rotation: Math.PI / 2 },
    { x: 7, z: -5, rotation: 0 },
    { x: 55, z: -28, rotation: Math.PI / 2 },
    { x: -83, z: 84, rotation: -Math.PI / 2 },
    { x: 7, z: 84, rotation: 0 },
    { x: 138, z: 105, rotation: Math.PI },
    { x: 7, z: -145, rotation: 0 },
    { x: -7, z: -100, rotation: Math.PI },
    { x: -7, z: 143, rotation: Math.PI },
    { x: 102, z: -102, rotation: Math.PI / 4 },
    { x: -54, z: 7, rotation: Math.PI / 4 },
    { x: 7, z: 127, rotation: 0 },
    { x: -137, z: -72, rotation: -Math.PI / 2 },
    { x: -137, z: 107, rotation: -Math.PI / 2 }
  ].forEach(({ x, z, rotation }) => createElectricScooter(scene, x, z, rotation));
}

function createUrbanTownCenter(scene) {
  const avenue = [
    { points: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]], width: 18 },
    { points: [[-118, -84], [-118, 0], [-118, 84]], width: 9 },
    { points: [[118, -84], [118, 0], [118, 84]], width: 9 },
    { points: [[-118, -70], [-60, -70], [0, -70], [60, -70], [118, -70]], width: 9 },
    { points: [[-118, 70], [-60, 70], [0, 70], [60, 70], [118, 70]], width: 9 }
  ];
  const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0xcac5b5, roughness: 0.94 });
  const curbMaterial = new THREE.MeshStandardMaterial({ color: 0xf0ebdc, roughness: 0.86 });
  const avenueLines = new THREE.MeshBasicMaterial({ color: 0xf2eee3 });

  avenue.forEach(({ points, width }) => {
    const curve = new THREE.CatmullRomCurve3(
      points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
      false,
      'centripetal'
    );
    const walkWidth = width >= 18 ? 3.2 : 2.4;
    const walkOffset = width / 2 + walkWidth / 2;
    addRoadRibbon(scene, curve, width, 0, asphaltRoadMaterial, 0.02);
    addRoadMarkings(scene, curve, avenueLines);
    for (const side of [-1, 1]) {
      addRoadRibbon(scene, curve, walkWidth, side * walkOffset, sidewalkMaterial, 0.02);
      addRoadRibbon(scene, curve, 0.32, side * (width / 2 + 0.16), curbMaterial, 0.11);
    }
  });

  createCrosswalk(scene, -13, 0, true);
  createCrosswalk(scene, 13, 0, true);
  createCrosswalk(scene, 0, -13, false);
  createCrosswalk(scene, 0, 13, false);

  const town = districtAreas.find(area => area.name === 'Thị trấn Yên Thành');
  if (!town) return;
  const storefronts = [
    ['SHOP THỜI TRANG', 0x9c4565],
    ['QUÁN ĂN', 0xc75b37],
    ['KARAOKE', 0x6652a3],
    ['NHÀ THUỐC', 0x3f8061],
    ['CÀ PHÊ', 0x9a7045],
    ['TẠP HÓA', 0x43838a]
  ];
  [-1, 1].forEach((side, sideIndex) => {
    storefronts.forEach(([label, color], index) => {
      const x = [-86, -62, -38, -16, 62, 86][index];
      const z = side * 19;
      createCityBuilding(scene, x, z, {
        label,
        color,
        face: side < 0 ? 1 : -1,
        width: index === 3 ? 17 : 19,
        depth: 12,
        commercial: true,
        variation: index + sideIndex
      });
    });
  });

  [-1, 1].forEach(sideX => {
    [-48, -25, 25, 48].forEach((z, index) => {
      createCityBuilding(scene, sideX * 100, z, {
        label: '',
        color: [0xd6c4a6, 0xd8d6c6, 0xe0c7a8, 0xcacbbb][index],
        face: sideX < 0 ? 1 : -1,
        width: 16,
        depth: 12,
        residential: true,
        variation: index
      });
    });
  });

  createCityBuilding(scene, 64, -43, {
    label: 'BỆNH VIỆN YÊN THÀNH',
    color: 0xe8e5d8,
    face: 1,
    width: 25,
    depth: 17,
    hospital: true
  });
}

function createCrosswalk(scene, x, z, acrossX) {
  const stripeMaterial = new THREE.MeshBasicMaterial({ color: 0xf5f2e8 });
  const stopMaterial = new THREE.MeshBasicMaterial({ color: 0xf3dc9c });
  for (let stripe = -4; stripe <= 4; stripe++) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(acrossX ? 0.7 : 9, 0.035, acrossX ? 9 : 0.7),
      stripeMaterial
    );
    bar.position.set(
      x + (acrossX ? 0 : stripe * 1.1),
      roadHeightAt(x, z) + 0.05,
      z + (acrossX ? stripe * 1.1 : 0)
    );
    scene.add(bar);
  }
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(acrossX ? 0.35 : 10, 0.04, acrossX ? 10 : 0.35),
    stopMaterial
  );
  line.position.set(
    x + (acrossX ? (x < 0 ? -2 : 2) : 0),
    roadHeightAt(x, z) + 0.055,
    z + (acrossX ? 0 : z < 0 ? -2 : 2)
  );
  scene.add(line);
}

function createCityBuilding(scene, x, z, options) {
  const {
    label,
    color,
    face,
    width = 18,
    depth = 11,
    residential = false,
    commercial = false,
    hospital = false,
    school = false,
    variation = 0
  } = options;
  const building = new THREE.Group();
  const walls = new THREE.MeshStandardMaterial({ color, roughness: 0.88 });
  const trim = new THREE.MeshStandardMaterial({ color: 0xf1dfbd, roughness: 0.84 });
  const roof = new THREE.MeshStandardMaterial({
    color: hospital || school ? 0x9a5142 : residential ? 0xd5d3c7 : 0x574b43,
    roughness: 0.86
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x508090,
    roughness: 0.26,
    metalness: 0.08
  });
  const balconyMetal = new THREE.MeshStandardMaterial({
    color: 0x52676a,
    metalness: 0.45,
    roughness: 0.48
  });
  const height = hospital ? 22 : commercial ? 14 : school ? 18 : residential ? 11 : 7;
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(width + 0.6, 0.35, depth + 0.5), trim);
  foundation.position.y = 0.18;
  building.add(foundation);
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), walls);
  body.position.y = height / 2 + 0.35;
  body.castShadow = true;
  body.receiveShadow = true;
  building.add(body);
  const roofSlab = new THREE.Mesh(
    new THREE.BoxGeometry(width + 1.1, 0.65, depth + 1),
    roof
  );
  roofSlab.position.y = height + 0.55;
  roofSlab.castShadow = true;
  building.add(roofSlab);
  if (commercial || hospital || school || residential) {
    const parapetHeight = hospital ? 1.3 : 1;
    const parapetY = height + 0.9 + parapetHeight / 2;
    [
      [width + 1.1, parapetHeight, 0.32, 0, parapetY, -depth / 2],
      [width + 1.1, parapetHeight, 0.32, 0, parapetY, depth / 2],
      [0.32, parapetHeight, depth, -width / 2, parapetY, 0],
      [0.32, parapetHeight, depth, width / 2, parapetY, 0]
    ].forEach(([railWidth, railHeight, railDepth, railX, railY, railZ]) => {
      const parapet = new THREE.Mesh(
        new THREE.BoxGeometry(railWidth, railHeight, railDepth),
        trim
      );
      parapet.position.set(railX, railY, railZ);
      parapet.castShadow = true;
      building.add(parapet);
    });

    const facadeBandMaterial = new THREE.MeshStandardMaterial({ color: 0xf6e8c8, roughness: 0.78 });
    for (let floor = 1; floor < Math.floor(height / 5); floor++) {
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.3, 0.28, depth + 0.3),
        facadeBandMaterial
      );
      band.position.y = floor * 5 + 0.35;
      building.add(band);
    }
  }

  const frontZ = face * (depth / 2 + 0.075);
  const windowCount = Math.max(2, Math.floor(width / 5));
  const windowRows = hospital ? [3.25, 8.5, 13.75, 18.75]
    : school ? [3.25, 8.5, 13.75]
      : commercial ? [3.25, 8.5]
        : [3.25, 8.2];
  for (let index = 0; index < windowCount; index++) {
    const windowX = -width / 2 + (index + 0.5) * width / windowCount;
    if (!residential && index === Math.floor(windowCount / 2)) continue;
    windowRows.forEach(rowY => {
      const windowFrame = new THREE.Mesh(
        new THREE.BoxGeometry(2.7, 2.35, 0.2),
        trim
      );
      windowFrame.position.set(windowX, rowY, frontZ);
      building.add(windowFrame);
      const windowPane = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.95), glass);
      windowPane.position.set(windowX, rowY, frontZ + face * 0.12);
      if (face < 0) windowPane.rotation.y = Math.PI;
      building.add(windowPane);
      if (commercial || hospital || school || residential) {
        const sill = new THREE.Mesh(
          new THREE.BoxGeometry(3.1, 0.24, 0.5),
          trim
        );
        sill.position.set(windowX, rowY - 1.25, face * (depth / 2 + 0.22));
        building.add(sill);
        if (rowY > 3.5 && index === 0) {
          const balconyFloor = new THREE.Mesh(
            new THREE.BoxGeometry(3.2, 0.18, 1.1),
            trim
          );
          balconyFloor.position.set(windowX, rowY - 1.55, face * (depth / 2 + 0.65));
          building.add(balconyFloor);
          const balconyRail = new THREE.Mesh(
            new THREE.BoxGeometry(3.2, 0.75, 0.12),
            balconyMetal
          );
          balconyRail.position.set(windowX, rowY - 1.1, face * (depth / 2 + 1.15));
          building.add(balconyRail);
        }
      }
    });
  }

  if (!residential) {
    if (!school) {
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.78, 0.45, 1.3),
        new THREE.MeshStandardMaterial({
          color: hospital ? 0x3f8b81 : [0xc94739, 0xe0a63e, 0x347b94][variation % 3],
          roughness: 0.8
        })
      );
      awning.position.set(0, 5.2, face * (depth / 2 + 0.72));
      building.add(awning);
    }
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 2.8, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x573d30, roughness: 0.84 })
    );
    door.position.set(0, 1.75, frontZ + face * 0.03);
    building.add(door);
    if (school) {
      const entranceCanopy = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, 0.38, 2.4),
        new THREE.MeshStandardMaterial({ color: 0xd4c9ad, roughness: 0.86 })
      );
      entranceCanopy.position.set(0, 3.3, face * (depth / 2 + 0.95));
      building.add(entranceCanopy);
    }
    if (label) {
      const sign = createLabel(label, hospital || school ? 0x287a68 : color, 0xfff3d9);
      sign.scale.set(width * 0.88 / 10.5, 2.25 / 2, 1);
      sign.position.set(0, height - 0.45, face * (depth / 2 + 0.16));
      if (face < 0) sign.rotation.y = Math.PI;
      building.add(sign);
      const locationMarker = createFloatingLabel(
        label,
        hospital || school ? 0x287a68 : color
      );
      locationMarker.position.set(0, height + 3, 0);
      building.add(locationMarker);
    }
  } else {
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 2.7, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x644832, roughness: 0.86 })
    );
    door.position.set(0, 1.7, frontZ + face * 0.03);
    building.add(door);
  }

  building.position.set(x, roadHeightAt(x, z), z);
  scene.add(building);
}

function createTrafficSignals(scene) {
  createTrafficSignal(scene, 9.5, 10.5, Math.PI, 'northSouth');
  createTrafficSignal(scene, -9.5, -10.5, 0, 'northSouth');
  createTrafficSignal(scene, -10.5, 9.5, Math.PI / 2, 'eastWest');
  createTrafficSignal(scene, 10.5, -9.5, -Math.PI / 2, 'eastWest');
  createTrafficOfficer(scene, 13.5, 13.5);
}

function createTrafficSignal(scene, x, z, rotation, axis) {
  const signal = new THREE.Group();
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x3b4141, roughness: 0.68 });
  const housingMaterial = new THREE.MeshStandardMaterial({ color: 0x22292a, roughness: 0.62 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 6.5, 8), poleMaterial);
  pole.position.y = 3.25;
  pole.castShadow = true;
  signal.add(pole);
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.5, 0.72), housingMaterial);
  housing.position.set(0, 6.7, 0.12);
  housing.castShadow = true;
  signal.add(housing);

  const colors = {
    red: { color: 0xff2a1c, emissive: 0xd61509 },
    yellow: { color: 0xffce36, emissive: 0xc88709 },
    green: { color: 0x43f06d, emissive: 0x139b36 }
  };
  const lamps = {};
  ['red', 'yellow', 'green'].forEach((name, index) => {
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.27, 12, 10),
      new THREE.MeshStandardMaterial({
        ...colors[name],
        emissiveIntensity: 0.08,
        roughness: 0.32
      })
    );
    lamp.position.set(0, 7.45 - index * 0.72, 0.52);
    signal.add(lamp);
    lamps[name] = { material: lamp.material, ...colors[name] };
  });
  signal.rotation.y = rotation;
  signal.position.set(x, roadHeightAt(x, z), z);
  signal.userData = { axis, lamps };
  scene.add(signal);
  animated.trafficSignals.push(signal);
}

function createTrafficOfficer(scene, x, z) {
  const officer = new THREE.Group();
  const uniform = new THREE.MeshStandardMaterial({ color: 0x253c53, roughness: 0.84 });
  const reflective = new THREE.MeshStandardMaterial({ color: 0xd9e4dc, roughness: 0.65 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc98e69, roughness: 0.92 });
  const capMaterial = new THREE.MeshStandardMaterial({ color: 0x183a50, roughness: 0.75 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.43, 0.75, 5, 10), uniform);
  torso.position.y = 1.63;
  torso.castShadow = true;
  officer.add(torso);
  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.42, 0.54), reflective);
  vest.position.set(0, 1.7, 0.08);
  officer.add(vest);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), skin);
  head.position.y = 2.55;
  officer.add(head);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.39, 0.2, 12), capMaterial);
  cap.position.y = 2.83;
  officer.add(cap);
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.42), capMaterial);
  brim.position.set(0, 2.77, 0.18);
  officer.add(brim);
  [-0.19, 0.19].forEach(side => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.66, 4, 8), uniform);
    leg.position.set(side, 0.61, 0);
    officer.add(leg);
  });
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.65, 4, 8), uniform);
  arm.position.set(0.55, 2.05, 0.08);
  arm.rotation.z = -0.75;
  arm.rotation.x = -0.22;
  officer.add(arm);
  officer.position.set(x, roadHeightAt(x, z), z);
  officer.rotation.y = -Math.PI / 4;
  officer.userData.role = 'traffic-police';
  scene.add(officer);
}

function createDistrictNetwork(scene) {
  const asphalt = new THREE.MeshStandardMaterial({ color: 0x454947, roughness: 0.96 });
  const sidewalk = new THREE.MeshStandardMaterial({ color: 0xc3bca9, roughness: 0.94 });
  const curb = new THREE.MeshStandardMaterial({ color: 0xe2ddcf, roughness: 0.88 });
  const districtRoadLines = new THREE.MeshBasicMaterial({ color: 0xf2eee3 });
  districtRoads.forEach(points => {
    const curve = new THREE.CatmullRomCurve3(
      points.map(({ x, z }) => new THREE.Vector3(x, 0, z)),
      false,
      'centripetal'
    );
    const connector = points[points.length - 1].x === 0;
    const roadWidth = connector ? 9 : 7;
    const walkWidth = connector ? 2.4 : 2;
    const walkOffset = roadWidth / 2 + walkWidth / 2;
    addRoadRibbon(scene, curve, roadWidth, 0, asphalt, 0.015);
    for (const side of [-1, 1]) {
      addRoadRibbon(scene, curve, walkWidth, side * walkOffset, sidewalk, 0.015);
      addRoadRibbon(
        scene,
        curve,
        0.28,
        side * (roadWidth / 2 + 0.12),
        curb,
        0.1
      );
    }
    if (connector) addRoadMarkings(scene, curve, districtRoadLines);
  });

  createDistrictTraffic(scene);
}

function createDistrictTraffic(scene) {
  const routes = districtRoads
    .filter((_, index) => index % 7 === 0)
    .map((points, index) => ({
      points: points.map(point => [point.x, point.z]),
      type: index % 2 === 0 ? 'car' : 'motorbike',
      speed: 9 + index % 3,
      offset: index % 2 === 0 ? -1.7 : 1.7,
      progress: (index * 0.173) % 0.8
    }));

  routes.forEach((route, index) => {
    const curve = new THREE.CatmullRomCurve3(
      route.points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
      false,
      'centripetal'
    );
    const vehicle = route.type === 'car'
      ? createTrafficCar(index + 11)
      : createTrafficMotorbike(index + 11);
    scene.add(vehicle.group);
    animated.traffic.push({
      group: vehicle.group,
      wheels: vehicle.wheels,
      curve,
      progress: route.progress,
      speed: route.speed,
      direction: 1,
      offset: route.offset,
      length: Math.max(100, curve.getLength()),
      time: index * 0.9
    });
  });
}

function createDistrictSettlements(scene) {
  const wallMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xe7d9bd, roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: 0xd8d7c6, roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: 0xe3c9a8, roughness: 0.9 })
  ];
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x76483a, roughness: 0.9 });
  const gateStone = new THREE.MeshStandardMaterial({ color: 0xd8c9a8, roughness: 0.85 });

  districtAreas.forEach((area, index) => {
    createWelcomeGate(scene, area, gateStone);
    createDistrictLandmark(scene, area, index);
    createDistrictServices(scene, area, index);
    if (['Thị trấn Yên Thành', 'Đông Thành', 'Đồng Thành', 'Bảo Thành'].includes(area.name)) {
      createVillageLanes(scene, area, asphaltRoadMaterial, shoulderRoadMaterial);
      return;
    }

    const houseOffsets = [
      [-35, -18],
      [35, -18],
      [-35, 18],
      [35, 18]
    ];
    houseOffsets.forEach(([offsetX, offsetZ], houseIndex) => {
      createDistrictHouse(
        scene,
        area.x + offsetX,
        area.z + offsetZ,
        wallMaterials[(index + houseIndex) % wallMaterials.length],
        roofMaterial,
        (index + houseIndex) % 2 === 0
      );
    });

    createDistrictPaddies(scene, area, index);
    createVillageLanes(scene, area, asphaltRoadMaterial, shoulderRoadMaterial);
  });
}

function createDistrictServices(scene, area, index) {
  const serviceZ = area.name === 'Bảo Thành'
    ? area.z - 39
    : area.name === 'Thị trấn Yên Thành'
      ? area.z - 97
      : area.z + 43;
  const streetZ = serviceZ + 16;
  const townColors = [0xc75b37, 0x9b6b3f, 0x4c8067];
  const marketColor = townColors[index % townColors.length];
  const services = [
    {
      label: `QUÁN BÚN ${area.name.toLocaleUpperCase('vi-VN')}`,
      x: area.x - 26,
      width: 19,
      color: 0xb85a3b,
      variation: index
    },
    {
      label: `CHỢ ${area.name.toLocaleUpperCase('vi-VN')}`,
      x: area.x,
      width: 22,
      color: marketColor,
      variation: index + 1
    }
  ];

  services.forEach(service => {
    createCityBuilding(scene, service.x, serviceZ, {
      ...service,
      face: 1,
      depth: 12,
      commercial: true,
      variation: service.variation
    });
  });

  const road = new THREE.MeshStandardMaterial({ color: 0x555650, roughness: 0.96 });
  const sidewalk = new THREE.MeshStandardMaterial({ color: 0xc3bca9, roughness: 0.94 });
  const curb = new THREE.MeshStandardMaterial({ color: 0xe2ddcf, roughness: 0.88 });
  const serviceRoads = [
    [[area.x, area.z], [area.x + 43, area.z]],
    [[area.x + 43, area.z], [area.x + 43, streetZ]],
    [[area.x - 48, streetZ], [area.x, streetZ], [area.x + 48, streetZ]]
  ];
  serviceRoads.forEach(points => {
    const curve = new THREE.CatmullRomCurve3(
      points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
      false,
      'centripetal'
    );
    addRoadRibbon(scene, curve, 7, 0, road, 0.02);
    for (const side of [-1, 1]) {
      addRoadRibbon(scene, curve, 2.2, side * 4.6, sidewalk, 0.02);
      addRoadRibbon(scene, curve, 0.25, side * 3.62, curb, 0.1);
    }
  });
}

function createBenHangBridge(scene) {
  const area = districtAreas.find(candidate => candidate.name === 'Phúc Thành');
  if (!area) return;

  const centerX = area.x + 52;
  const centerZ = area.z + 20;
  const groundY = roadHeightAt(centerX, centerZ);
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 15),
    new THREE.MeshStandardMaterial({
      color: 0x4d9eae,
      roughness: 0.22,
      metalness: 0.08,
      transparent: true,
      opacity: 0.88
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(centerX, groundY + 0.12, centerZ);
  scene.add(water);

  const bridge = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0xb9b5a5, roughness: 0.86 });
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(38, 0.65, 9),
    new THREE.MeshStandardMaterial({ color: 0x70695c, roughness: 0.92 })
  );
  deck.position.y = 0.8;
  deck.castShadow = true;
  deck.receiveShadow = true;
  bridge.add(deck);

  const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xe3d8ba, roughness: 0.84 });
  [-4.25, 4.25].forEach(z => {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(38, 0.45, 0.35), edgeMaterial);
    curb.position.set(0, 1.15, z);
    bridge.add(curb);
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(38, 0.18, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x51483c, roughness: 0.78 })
    );
    rail.position.set(0, 2.35, z);
    bridge.add(rail);
    for (let x = -17; x <= 17; x += 5.5) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.8, 0.35), stone);
      post.position.set(x, 1.85, z);
      post.castShadow = true;
      bridge.add(post);
    }
  });
  [-1, 1].forEach(side => {
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(7, 0.35, 8.8), stone);
    ramp.position.set(side * 21.5, 0.37, 0);
    ramp.rotation.z = side * -0.07;
    bridge.add(ramp);
  });
  bridge.position.set(centerX, groundY, centerZ);
  scene.add(bridge);

  const sign = new THREE.Group();
  const signMaterial = new THREE.MeshStandardMaterial({ color: 0x8b3c2d, roughness: 0.82 });
  [-7.2, 7.2].forEach(x => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 4.7, 0.42), stone);
    post.position.set(x, 2.35, 0);
    sign.add(post);
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(15, 2.1, 0.5), signMaterial);
  board.position.y = 4.1;
  sign.add(board);
  const boardText = createLabel('CẦU BẾN HÀNG', 0x8b3c2d, 0xfff1d0);
  boardText.scale.set(13.5 / 10.5, 1.8 / 2, 1);
  boardText.position.set(0, 4.1, 0.28);
  sign.add(boardText);
  sign.position.set(centerX, groundY + 0.05, centerZ - 12);
  scene.add(sign);

  const stallColors = [0xe8a04a, 0x4e8d70];
  [-1, 1].forEach((side, index) => {
    const stall = new THREE.Group();
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 1.1, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x8a5838, roughness: 0.9 })
    );
    counter.position.y = 0.65;
    counter.castShadow = true;
    stall.add(counter);

    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.25, 3.2),
      new THREE.MeshStandardMaterial({ color: stallColors[index], roughness: 0.86 })
    );
    canopy.position.set(0, 3.5, 0);
    canopy.castShadow = true;
    stall.add(canopy);
    [-2.3, 2.3].forEach(x => {
      const support = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 3.4, 8),
        stone
      );
      support.position.set(x, 1.8, 0);
      stall.add(support);
    });

    const produceColors = [0xd9533d, 0xeab64b, 0x6da84f, 0xb65d36];
    for (let item = 0; item < 8; item++) {
      const produce = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 8, 7),
        new THREE.MeshStandardMaterial({ color: produceColors[(item + index) % produceColors.length], roughness: 0.78 })
      );
      produce.position.set(-1.6 + (item % 4) * 1.05, 1.35, item < 4 ? -0.55 : 0.55);
      stall.add(produce);
    }

    stall.position.set(centerX + side * 9, groundY, centerZ + side * 9);
    stall.rotation.y = side > 0 ? Math.PI : 0;
    scene.add(stall);

    const seller = makeNPC(index === 0 ? 0x477765 : 0x8c5841, index + 2);
    seller.position.set(centerX + side * 9, groundY, centerZ + side * 6.7);
    seller.rotation.y = side > 0 ? Math.PI : 0;
    scene.add(seller);
  });
}

function createDistrictLandmark(scene, area, index) {
  if (!area.landmark) return;
  const x = area.x - 42;
  const z = area.z + 18;
  const landmarkName = area.landmark.split(';')[0];
  const sign = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x684a34, roughness: 0.88 });
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.8, 0.28), wood);
  post.position.y = 1.4;
  sign.add(post);
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(11, 1.8, 0.28),
    new THREE.MeshStandardMaterial({ color: 0x315e4b, roughness: 0.8 })
  );
  board.position.y = 2.75;
  sign.add(board);
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 160;
  const context = canvas.getContext('2d');
  context.fillStyle = '#315e4b';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#fff2d2';
  context.font = 'bold 42px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(landmarkName, canvas.width / 2, canvas.height / 2, 960);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(10.5, 1.55),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) })
  );
  label.position.set(0, 2.75, 0.16);
  sign.add(label);
  sign.position.set(x, roadHeightAt(x, z), z);
  scene.add(sign);

  if (/(núi|lèn|rú|rừng|đồi|vùng cao|bán sơn địa)/i.test(area.landmark)) {
    const hills = new THREE.Group();
    const hillColors = [0x526d49, 0x657d4d, 0x758253];
    for (let peak = 0; peak < 3; peak++) {
      const height = 12 + ((index + peak) % 4) * 3;
      const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(10 + peak * 2, height, 7, 3),
        new THREE.MeshStandardMaterial({ color: hillColors[(index + peak) % hillColors.length], roughness: 1 })
      );
      mountain.position.set((peak - 1) * 12, height / 2 - 1, -8 - (peak % 2) * 5);
      mountain.castShadow = true;
      mountain.receiveShadow = true;
      hills.add(mountain);
    }
    hills.position.set(x + 4, roadHeightAt(x + 4, z - 10), z - 10);
    scene.add(hills);

    for (let treeIndex = 0; treeIndex < 9; treeIndex++) {
      const angle = treeIndex * Math.PI * 2 / 9;
      const tree = makeTree(0.65 + (treeIndex % 3) * 0.12);
      tree.position.set(
        x + 20 + Math.cos(angle) * 13,
        roadHeightAt(x + 20 + Math.cos(angle) * 13, z - 10 + Math.sin(angle) * 12),
        z - 10 + Math.sin(angle) * 12
      );
      scene.add(tree);
    }
  }

  if (/(hồ|đập|sông|cống|bãi ven sông)/i.test(area.landmark)) {
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(10, 28),
      new THREE.MeshStandardMaterial({
        color: 0x6da6a0,
        roughness: 0.24,
        metalness: 0.08,
        transparent: true,
        opacity: 0.88
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.scale.set(1.5, 1, 0.8);
    water.position.set(x - 15, roadHeightAt(x - 15, z + 15) + 0.18, z + 15);
    scene.add(water);
    const shore = new THREE.Mesh(
      new THREE.TorusGeometry(13, 0.65, 5, 32),
      new THREE.MeshStandardMaterial({ color: 0x9a8b61, roughness: 1 })
    );
    shore.rotation.x = -Math.PI / 2;
    shore.scale.set(1.5, 1, 0.8);
    shore.position.set(x - 15, water.position.y - 0.05, z + 15);
    scene.add(shore);
  }

  if (/(đền|chùa|đình|thiền viện)/i.test(area.landmark)) {
    const shrine = new THREE.Group();
    const stone = new THREE.MeshStandardMaterial({ color: 0xd4c5a6, roughness: 0.94 });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x75463b, roughness: 0.84 });
    const platform = new THREE.Mesh(new THREE.BoxGeometry(11, 0.7, 9), stone);
    platform.position.y = 0.35;
    platform.receiveShadow = true;
    shrine.add(platform);
    for (let step = 0; step < 3; step++) {
      const stair = new THREE.Mesh(
        new THREE.BoxGeometry(5.2, 0.2, 1.1),
        stone
      );
      stair.position.set(0, 0.22 + step * 0.18, 5 + step * 0.75);
      shrine.add(stair);
    }
    const hall = new THREE.Mesh(new THREE.BoxGeometry(8, 4.8, 6), stone);
    hall.position.y = 3;
    hall.castShadow = true;
    shrine.add(hall);
    [-2.8, 2.8].forEach(columnX => {
      const column = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.24, 3.8, 10),
        new THREE.MeshStandardMaterial({ color: 0xc6a873, roughness: 0.82 })
      );
      column.position.set(columnX, 2.4, 3.2);
      column.castShadow = true;
      shrine.add(column);
    });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(6.7, 2.5, 4), roofMaterial);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 6.5;
    roof.castShadow = true;
    shrine.add(roof);
    const ridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.36, 10.4),
      new THREE.MeshStandardMaterial({ color: 0x9b563d, roughness: 0.85 })
    );
    ridge.position.set(0, 7.72, 0);
    shrine.add(ridge);
    shrine.position.set(x + 2, roadHeightAt(x + 2, z + 24), z + 24);
    scene.add(shrine);
  }

  if (/nhà thờ|giáo xứ/i.test(area.landmark)) {
    const church = new THREE.Group();
    const walls = new THREE.MeshStandardMaterial({ color: 0xe7e0cf, roughness: 0.82 });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x5b6470, roughness: 0.74 });
    const nave = new THREE.Mesh(new THREE.BoxGeometry(10, 7, 15), walls);
    nave.position.y = 3.5;
    nave.castShadow = true;
    church.add(nave);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(8, 3.5, 4), roofMaterial);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 8.5, 0);
    church.add(roof);
    [-3.6, 3.6].forEach(towerX => {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(2.2, 11, 2.2), walls);
      tower.position.set(towerX, 5.5, 7);
      tower.castShadow = true;
      church.add(tower);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 6), roofMaterial);
      spire.position.set(towerX, 12.5, 7);
      church.add(spire);
    });
    const entrance = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 3.8, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x58463a, roughness: 0.8 })
    );
    entrance.position.set(0, 1.9, 7.62);
    church.add(entrance);
    [-3, 3].forEach(windowX => {
      const windowMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 3.1),
        new THREE.MeshStandardMaterial({
          color: 0x627f92,
          emissive: 0x172b37,
          emissiveIntensity: 0.12,
          roughness: 0.36
        })
      );
      windowMesh.position.set(windowX, 3.8, 7.63);
      church.add(windowMesh);
    });
    const crossMaterial = new THREE.MeshStandardMaterial({ color: 0xd5c8a9, roughness: 0.82 });
    const crossPost = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.8, 0.3), crossMaterial);
    crossPost.position.set(0, 12.7, 8);
    church.add(crossPost);
    const crossBar = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.3, 0.3), crossMaterial);
    crossBar.position.set(0, 13.2, 8);
    church.add(crossBar);
    church.position.set(x + 4, roadHeightAt(x + 4, z + 25), z + 25);
    scene.add(church);
  }
}

const asphaltRoadMaterial = new THREE.MeshStandardMaterial({ color: 0x555650, roughness: 1 });
const shoulderRoadMaterial = new THREE.MeshStandardMaterial({ color: 0xb9ad8f, roughness: 1 });

function createWelcomeGate(scene, area, material) {
  const gate = new THREE.Group();
  const pillarGeometry = new THREE.BoxGeometry(1.25, 6.4, 1.2);
  [-7.1, 7.1].forEach(x => {
    const pillar = new THREE.Mesh(pillarGeometry, material);
    pillar.position.set(x, 3.2, 0);
    pillar.castShadow = true;
    gate.add(pillar);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.45, 1.6), material);
    cap.position.set(x, 6.55, 0);
    gate.add(cap);
  });

  const arch = new THREE.Mesh(
    new THREE.BoxGeometry(16.5, 1.15, 1.25),
    new THREE.MeshStandardMaterial({ color: 0xb54635, roughness: 0.72 })
  );
  arch.position.set(0, 6.15, 0);
  arch.castShadow = true;
  gate.add(arch);

  const signCanvas = document.createElement('canvas');
  signCanvas.width = 768;
  signCanvas.height = 192;
  const context = signCanvas.getContext('2d');
  context.fillStyle = '#b83f30';
  context.fillRect(0, 0, signCanvas.width, signCanvas.height);
  context.strokeStyle = '#f2d58a';
  context.lineWidth = 10;
  context.strokeRect(8, 8, signCanvas.width - 16, signCanvas.height - 16);
  context.fillStyle = '#fff4d6';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = 'bold 42px sans-serif';
  context.fillText('CHÀO MỪNG ĐẾN', signCanvas.width / 2, 65);
  context.font = 'bold 56px sans-serif';
  context.fillText(area.name.toLocaleUpperCase('vi-VN'), signCanvas.width / 2, 135);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(12.4, 1.9),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(signCanvas) })
  );
  sign.position.set(0, 6.25, 0.68);
  gate.add(sign);

  gate.position.set(area.x, roadHeightAt(area.x, area.z - 50), area.z - 50);
  scene.add(gate);
}

function createDistrictHouse(scene, x, z, wallMaterial, roofMaterial, hasGarden) {
  const house = new THREE.Group();
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xf3ead5, roughness: 0.82 });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x526d7a,
    roughness: 0.24,
    metalness: 0.16
  });
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.42, 6.8),
    new THREE.MeshStandardMaterial({ color: 0x918a78, roughness: 0.96 })
  );
  foundation.position.y = 0.21;
  foundation.receiveShadow = true;
  house.add(foundation);
  const body = new THREE.Mesh(new THREE.BoxGeometry(7.5, 7.2, 6.2), wallMaterial);
  body.position.y = 3.8;
  body.castShadow = true;
  body.receiveShadow = true;
  house.add(body);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.45, 6.9), roofMaterial);
  roof.position.y = 7.6;
  roof.castShadow = true;
  house.add(roof);
  const parapet = new THREE.MeshStandardMaterial({ color: 0xe6e1d3, roughness: 0.84 });
  [
    [8.2, 0.85, 0.3, 0, 8.15, -3.25],
    [8.2, 0.85, 0.3, 0, 8.15, 3.25],
    [0.3, 0.85, 6.2, -3.95, 8.15, 0],
    [0.3, 0.85, 6.2, 3.95, 8.15, 0]
  ].forEach(([width, height, depth, px, py, pz]) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), parapet);
    wall.position.set(px, py, pz);
    house.add(wall);
  });

  const floorBand = new THREE.Mesh(new THREE.BoxGeometry(7.85, 0.32, 6.5), trimMaterial);
  floorBand.position.y = 4.05;
  house.add(floorBand);
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 2.55, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x573b29, roughness: 0.86 })
  );
  door.position.set(0, 1.45, 3.2);
  door.castShadow = true;
  house.add(door);

  [-2.35, 2.35].forEach(windowX => {
    [2.4, 5.55].forEach(windowY => {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.75, 0.24), trimMaterial);
      frame.position.set(windowX, windowY, 3.18);
      house.add(frame);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.35), glassMaterial);
      pane.position.set(windowX, windowY, 3.32);
      house.add(pane);
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.35, 0.1), trimMaterial);
      mullion.position.set(windowX, windowY, 3.39);
      house.add(mullion);
      if (windowY > 4) {
        const balcony = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 1.1), trimMaterial);
        balcony.position.set(windowX, 4.62, 3.75);
        house.add(balcony);
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 0.8, 0.12),
          new THREE.MeshStandardMaterial({ color: 0x455b60, metalness: 0.42, roughness: 0.5 })
        );
        rail.position.set(windowX, 5.05, 4.28);
        house.add(rail);
      }
    });
  });

  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(4.7, 0.22, 1.65),
    new THREE.MeshStandardMaterial({ color: 0x337b79, roughness: 0.78 })
  );
  awning.position.set(0, 3.12, 4.05);
  awning.rotation.x = -0.07;
  house.add(awning);
  [-1.9, 1.9].forEach(columnX => {
    const column = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 2.85, 0.18),
      trimMaterial
    );
    column.position.set(columnX, 1.55, 4.15);
    house.add(column);
  });
  const porch = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.25, 1.25),
    new THREE.MeshStandardMaterial({ color: 0xb9a686, roughness: 0.9 })
  );
  porch.position.set(0, 0.26, 3.55);
  house.add(porch);
  const step = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.18, 0.75),
    new THREE.MeshStandardMaterial({ color: 0xb9a686, roughness: 0.9 })
  );
  step.position.set(0, 0.1, 4.35);
  house.add(step);

  const courtyardMaterial = new THREE.MeshStandardMaterial({ color: 0xd5d0c3, roughness: 0.93 });
  const fenceHeight = 1.35;
  const fenceSegments = [
    [0.35, fenceHeight, 0.35, -11, fenceHeight / 2, 0],
    [0.35, fenceHeight, 0.35, 11, fenceHeight / 2, 0],
    [22, fenceHeight, 0.35, 0, fenceHeight / 2, -6.5],
    [7.6, fenceHeight, 0.35, -5.3, fenceHeight / 2, 6.5],
    [7.6, fenceHeight, 0.35, 5.3, fenceHeight / 2, 6.5]
  ];
  fenceSegments.forEach(([width, height, depth, px, py, pz]) => {
    const fence = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), courtyardMaterial);
    fence.position.set(px, py, pz);
    fence.castShadow = true;
    house.add(fence);
  });
  [-11, -1.6, 1.6, 11].forEach(postX => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.8, 0.55), trimMaterial);
    post.position.set(postX, 0.9, 6.5);
    house.add(post);
  });

  house.position.set(x, roadHeightAt(x, z), z);
  scene.add(house);

  if (hasGarden) {
    const garden = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 4),
      new THREE.MeshStandardMaterial({ color: 0x68844b, roughness: 1 })
    );
    garden.rotation.x = -Math.PI / 2;
    garden.position.set(x + 4.8, roadHeightAt(x + 4.8, z + 1), z + 1);
    garden.receiveShadow = true;
    scene.add(garden);
    const vegetables = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.25, 6, 5),
      vegetableMaterial,
      12
    );
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3(1, 0.45, 1);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        position.set(x + 3.3 + col * 0.9, garden.position.y + 0.3, z - 0.2 + row);
        matrix.compose(position, new THREE.Quaternion(), scale);
        vegetables.setMatrixAt(row * 4 + col, matrix);
      }
    }
    vegetables.instanceMatrix.needsUpdate = true;
    scene.add(vegetables);
  }
}

function createVillageLanes(scene, area, roadMaterial, shoulderMaterial) {
  const offsets = [
    [[-9, -17], [-10, -5], [-8, 7], [-8, 17]],
    [[10, -15], [12, -5], [10, 7], [9, 17]]
  ];
  offsets.forEach(points => {
    const curve = new THREE.CatmullRomCurve3(
      points.map(([x, z]) => new THREE.Vector3(area.x + x, 0, area.z + z)),
      false,
      'centripetal'
    );
    addRoadRibbon(scene, curve, 3.2, 0, roadMaterial);
    for (const side of [-1, 1]) {
      addRoadRibbon(scene, curve, 1.4, side * 2.5, shoulderMaterial, 0.02);
      addRoadRibbon(
        scene,
        curve,
        0.24,
        side * 1.72,
        new THREE.MeshStandardMaterial({ color: 0xe2ddcf, roughness: 0.88 }),
        0.1
      );
    }
  });

  const entrance = new THREE.CatmullRomCurve3([
    new THREE.Vector3(area.x, 0, area.z - 65),
    new THREE.Vector3(area.x, 0, area.z - 35),
    new THREE.Vector3(area.x, 0, area.z)
  ], false, 'centripetal');
  addRoadRibbon(scene, entrance, 3.2, 0, roadMaterial);

  if (area.name === 'Bảo Thành') {
    const farmRoad = new THREE.CatmullRomCurve3([
      new THREE.Vector3(area.x, 0, area.z),
      new THREE.Vector3(area.x, 0, area.z + 24),
      new THREE.Vector3(area.x, 0, area.z + 38)
    ], false, 'centripetal');
    addRoadRibbon(scene, farmRoad, 3.2, 0, roadMaterial);
  }
}

function createDistrictPaddies(scene, area, index) {
  if (index % 2 !== 0 || Math.abs(area.z - 55) < 24) return;
  const x = area.x + 56;
  const z = area.z + 38;
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x84a99a,
    roughness: 0.34,
    metalness: 0.04
  });
  const cropMaterial = new THREE.MeshStandardMaterial({ color: 0x819d47, roughness: 0.9 });
  const bundMaterial = new THREE.MeshStandardMaterial({ color: 0x9b8654, roughness: 1 });
  const paddies = [
    { x: x - 6.5, z, width: 12.5, depth: 13 },
    { x: x + 6.5, z, width: 12.5, depth: 13 }
  ];

  paddies.forEach(paddyData => {
    const paddy = new THREE.Mesh(
      new THREE.PlaneGeometry(paddyData.width, paddyData.depth),
      waterMaterial
    );
    paddy.rotation.x = -Math.PI / 2;
    paddy.position.set(
      paddyData.x,
      roadHeightAt(paddyData.x, paddyData.z) + 0.08,
      paddyData.z
    );
    paddy.receiveShadow = true;
    scene.add(paddy);

    const crop = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.14, 0.9, 4),
      cropMaterial,
      32
    );
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3(1, 1, 1);
    const rotation = new THREE.Quaternion();
    let instance = 0;
    for (let row = 0; row < 4; row++) {
      for (let column = 0; column < 6; column++) {
        position.set(
          paddyData.x - 4.8 + column * 1.9,
          paddy.position.y + 0.45,
          paddyData.z - 4.8 + row * 3.1
        );
        rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (index + row + column) % 4);
        matrix.compose(position, rotation, scale);
        crop.setMatrixAt(instance++, matrix);
      }
    }
    crop.instanceMatrix.needsUpdate = true;
    crop.castShadow = true;
    scene.add(crop);
  });

  const berm = new THREE.Mesh(
    new THREE.BoxGeometry(28, 0.28, 1.2),
    bundMaterial
  );
  berm.position.set(x, roadHeightAt(x, z) + 0.14, z - 7);
  scene.add(berm);
  const irrigation = new THREE.Mesh(
    new THREE.BoxGeometry(28, 0.12, 0.75),
    new THREE.MeshStandardMaterial({ color: 0x739c91, roughness: 0.25 })
  );
  irrigation.position.set(x, roadHeightAt(x, z) + 0.1, z + 7);
  scene.add(irrigation);
}

function terrainHeightAt(x, z) {
  const noise = Math.sin(x * 0.025) * Math.cos(z * 0.025) * 0.75 + Math.sin(x * 0.08) * 0.2;
  const schoolEdge = Math.max(Math.abs(x - 60) / 68, Math.abs(z - 45) / 64);
  return noise * THREE.MathUtils.smoothstep(schoolEdge, 0.92, 1.12);
}

export function roadHeightAt(x, z) {
  const bridgeDistance = Math.abs(z - 55);
  const bridgeSideDistance = Math.abs(x);
  if (bridgeSideDistance <= 15 && bridgeDistance <= 14) return 1.5;
  if (bridgeSideDistance <= 15 && bridgeDistance < 27) {
    const ramp = Math.max(0, 1 - (bridgeDistance - 14) / 13);
    return terrainHeightAt(x, z) + 0.2 + ramp * 1.3;
  }
  return terrainHeightAt(x, z) + 0.2;
}

function addRoadRibbon(scene, curve, width, offset, material, extraHeight = 0) {
  const segments = Math.max(32, curve.points.length * 18);
  const positions = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const sideX = tangent.z;
    const sideZ = -tangent.x;
    const centerX = point.x + sideX * offset;
    const centerZ = point.z + sideZ * offset;
    const height = roadHeightAt(centerX, centerZ) + extraHeight;
    positions.push(
      centerX - sideX * width / 2, height, centerZ - sideZ * width / 2,
      centerX + sideX * width / 2, height, centerZ + sideZ * width / 2
    );

    if (i < segments) {
      const index = i * 2;
      indices.push(index, index + 2, index + 1, index + 1, index + 2, index + 3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const roadMesh = new THREE.Mesh(geometry, material);
  roadMesh.receiveShadow = true;
  roadMesh.frustumCulled = false;
  scene.add(roadMesh);
}

function addRoadMarkings(scene, curve, material) {
  const dashCount = Math.max(46, Math.ceil(curve.getLength() / 14));
  const dashes = [];
  for (let dash = 0; dash < dashCount; dash++) {
    const start = dash / dashCount;
    if (start > 0.08 && start < 0.22) continue;
    if (start > 0.42 && start < 0.58) continue;
    if (start > 0.78 && start < 0.9) continue;
    const point = curve.getPointAt(start);
    const tangent = curve.getTangentAt(start);
    dashes.push({
      x: point.x,
      y: roadHeightAt(point.x, point.z) + 0.035,
      z: point.z,
      angle: Math.atan2(tangent.x, tangent.z)
    });
  }
  const markings = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.18, 2.2),
    material,
    dashes.length
  );
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  dashes.forEach((dash, index) => {
    position.set(dash.x, dash.y, dash.z);
    rotation.setFromEuler(new THREE.Euler(-Math.PI / 2, dash.angle, 0));
    matrix.compose(position, rotation, scale);
    markings.setMatrixAt(index, matrix);
  });
  markings.instanceMatrix.needsUpdate = true;
  scene.add(markings);
}

function createRoadsideLights(scene, points) {
  const lampMaterial = new THREE.MeshStandardMaterial({ color: 0x33403e, roughness: 0.65 });
  const lampGlowMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe6a8,
    emissive: 0xc28b3c,
    emissiveIntensity: 0.3,
    roughness: 0.35
  });
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    'centripetal'
  );

  const lampCount = Math.max(12, Math.ceil(curve.getLength() / 90));
  for (let i = 1; i < lampCount; i++) {
    const progress = i / lampCount;
    const point = curve.getPointAt(progress);
    const tangent = curve.getTangentAt(progress);
    const sideX = tangent.z;
    const sideZ = -tangent.x;
    const pole = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 7, 8), lampMaterial);
    post.position.y = 3.5;
    post.castShadow = true;
    pole.add(post);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.14), lampMaterial);
    arm.position.set(-0.65, 6.8, 0);
    pole.add(arm);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.22, 0.52), lampGlowMaterial);
    lamp.position.set(-1.35, 6.72, 0);
    pole.add(lamp);
    pole.position.set(point.x + sideX * 8, roadHeightAt(point.x, point.z), point.z + sideZ * 8);
    scene.add(pole);
  }
}

function createTraffic(scene, roads) {
  const mainRoute = roads[0].points;
  const townRoute = roads[2].points;
  const routes = [
    { points: mainRoute, type: 'car', speed: 11, offset: -2.2, progress: 0.05 },
    { points: [...mainRoute].reverse(), type: 'motorbike', speed: 9, offset: 2.2, progress: 0.18 },
    { points: townRoute, type: 'car', speed: 10, offset: -1.8, progress: 0.38 },
    { points: [...townRoute].reverse(), type: 'motorbike', speed: 8, offset: 1.8, progress: 0.52 },
    { points: roads[3].points, type: 'motorbike', speed: 8, offset: 1.8, progress: 0.26 },
    { points: [...roads[4].points].reverse(), type: 'car', speed: 9, offset: 1.8, progress: 0.63 },
    { points: roads[5].points, type: 'motorbike', speed: 7, offset: -1.8, progress: 0.2 }
  ];

  routes.forEach((route, index) => {
    const curve = new THREE.CatmullRomCurve3(
      route.points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
      false,
      'centripetal'
    );
    const vehicle = route.type === 'car'
      ? createTrafficCar(index)
      : createTrafficMotorbike(index);
    scene.add(vehicle.group);
    animated.traffic.push({
      group: vehicle.group,
      wheels: vehicle.wheels,
      curve,
      progress: route.progress,
      speed: route.speed,
      direction: 1,
      offset: route.offset,
      length: Math.max(100, curve.getLength()),
      time: index * 0.9
    });
  });
}

function createTrafficCar(index) {
  const group = new THREE.Group();
  const colors = [0x536d78, 0xb45d46, 0xc6b990, 0x455b4c];
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: colors[index % colors.length],
    roughness: 0.42,
    metalness: 0.18
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x344c55,
    roughness: 0.25,
    metalness: 0.16
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.05, 4.25), bodyMaterial);
  body.position.y = 1.05;
  body.castShadow = true;
  group.add(body);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.26, 1.2), bodyMaterial);
  hood.position.set(0, 1.56, 1.38);
  group.add(hood);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.94, 2.05), glass);
  cabin.position.set(0, 1.94, -0.2);
  cabin.castShadow = true;
  group.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.22, 1.55), bodyMaterial);
  roof.position.set(0, 2.49, -0.28);
  roof.castShadow = true;
  group.add(roof);

  const windshield = new THREE.Mesh(
    new THREE.PlaneGeometry(1.55, 0.72),
    new THREE.MeshStandardMaterial({ color: 0x9ab8bd, transparent: true, opacity: 0.74, roughness: 0.22 })
  );
  windshield.position.set(0, 2.04, 0.84);
  windshield.rotation.x = -0.2;
  group.add(windshield);
  const bumpers = new THREE.MeshStandardMaterial({ color: 0xc3c7c3, metalness: 0.55, roughness: 0.44 });
  [-1, 1].forEach(end => {
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.22, 0.2), bumpers);
    bumper.position.set(0, 0.68, end * 2.13);
    group.add(bumper);
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.2, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xf0eee4, roughness: 0.5 })
    );
    plate.position.set(0, 0.9, end * 2.14);
    if (end < 0) plate.rotation.y = Math.PI;
    group.add(plate);
  });
  [-1, 1].forEach(side => {
    const sideWindow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.52, 0.56),
      new THREE.MeshStandardMaterial({ color: 0x85a4ad, transparent: true, opacity: 0.72, roughness: 0.24 })
    );
    sideWindow.position.set(side * 0.918, 2.02, -0.2);
    sideWindow.rotation.y = side * Math.PI / 2;
    group.add(sideWindow);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.3), bodyMaterial);
    mirror.position.set(side * 1.08, 1.78, 0.74);
    group.add(mirror);
  });

  const wheels = [];
  const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x202323, roughness: 0.95 });
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.28, 12), tireMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 1.17, 0.48, end * 1.42);
      wheel.castShadow = true;
      group.add(wheel);
      wheels.push(wheel);
      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.3, 14),
        new THREE.MeshStandardMaterial({ color: 0xb9c0bb, metalness: 0.72, roughness: 0.38 })
      );
      rim.rotation.z = Math.PI / 2;
      rim.position.copy(wheel.position);
      group.add(rim);
    }
  }

  const headlight = new THREE.MeshStandardMaterial({
    color: 0xfff0c2,
    emissive: 0xe8c878,
    emissiveIntensity: 0.6
  });
  [-0.78, 0.78].forEach(side => {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.32, 0.08), headlight);
    lamp.position.set(side, 1.12, 2.18);
    group.add(lamp);
    const tailLamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.18, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xc43e31, emissive: 0x83231d, emissiveIntensity: 0.22 })
    );
    tailLamp.position.set(side * 0.55, 1.14, -2.18);
    group.add(tailLamp);
  });
  return { group, wheels };
}

function createTrafficMotorbike(index) {
  const group = new THREE.Group();
  const colors = [0x263e49, 0x803e32, 0x4b6446, 0xb49b55];
  const bikeMaterial = new THREE.MeshStandardMaterial({
    color: colors[index % colors.length],
    roughness: 0.52,
    metalness: 0.2
  });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x202323, roughness: 0.92 });
  const wheels = [];
  [-1, 1].forEach(z => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.22, 14), rubber);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0, 0.53, z * 1.13);
    wheel.castShadow = true;
    group.add(wheel);
    wheels.push(wheel);
  });

  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.62, 1.45), bikeMaterial);
  frame.position.set(0, 1.06, 0);
  frame.castShadow = true;
  group.add(frame);
  const fairing = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.95, 0.42), bikeMaterial);
  fairing.position.set(0, 1.55, 0.82);
  fairing.castShadow = true;
  group.add(fairing);
  const rearPanel = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.65, 1.1), bikeMaterial);
  rearPanel.position.set(0, 1.2, -0.5);
  group.add(rearPanel);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.2, 0.85), rubber);
  seat.position.set(0, 1.57, -0.2);
  group.add(seat);
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xfff0c2, emissive: 0xe8c878, emissiveIntensity: 0.45 })
  );
  lamp.position.set(0, 1.83, 1.06);
  group.add(lamp);
  [-1, 1].forEach(side => {
    const mirrorStem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.62, 7), rubber);
    mirrorStem.position.set(side * 0.38, 2.38, 0.82);
    mirrorStem.rotation.z = side * 0.42;
    group.add(mirrorStem);
    const mirror = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xd8dedb, metalness: 0.7, roughness: 0.28 })
    );
    mirror.scale.set(1.3, 0.72, 0.35);
    mirror.position.set(side * 0.55, 2.63, 0.82);
    group.add(mirror);
  });
  const rider = createScooterRider();
  rider.scale.setScalar(0.72);
  group.add(rider);

  return { group, wheels };
}

export function createElectricScooter(scene, x, z, rotation = 0, register = true) {
  const scooter = new THREE.Group();
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0xe36a32,
    roughness: 0.36,
    metalness: 0.12
  });
  const rubberMaterial = new THREE.MeshStandardMaterial({ color: 0x232727, roughness: 0.92 });
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0xb6c1b9,
    roughness: 0.35,
    metalness: 0.68
  });
  const wheels = [];

  [-1, 1].forEach(end => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.26, 24), rubberMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0, 0.52, end * 1.15);
    wheel.castShadow = true;
    scooter.add(wheel);
    wheels.push(wheel);

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.29, 20),
      metalMaterial
    );
    rim.rotation.z = Math.PI / 2;
    rim.position.copy(wheel.position);
    scooter.add(rim);

    const brake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.31, 16),
      new THREE.MeshStandardMaterial({ color: 0xb9c0bb, metalness: 0.72, roughness: 0.38 })
    );
    brake.rotation.z = Math.PI / 2;
    brake.position.copy(wheel.position);
    scooter.add(brake);
  });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.22, 1.65), metalMaterial);
  deck.position.set(0, 0.92, -0.05);
  deck.castShadow = true;
  scooter.add(deck);
  const frontFairing = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 1.35, 0.42),
    frameMaterial
  );
  frontFairing.position.set(0, 1.55, 0.72);
  frontFairing.rotation.x = -0.12;
  frontFairing.castShadow = true;
  scooter.add(frontFairing);
  const rearBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 16, 12),
    frameMaterial
  );
  rearBody.scale.set(0.72, 0.75, 1.15);
  rearBody.position.set(0, 1.26, -0.58);
  rearBody.castShadow = true;
  scooter.add(rearBody);
  const sidePanel = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 0.62, 1.2),
    frameMaterial
  );
  sidePanel.position.set(0, 1.18, -0.55);
  scooter.add(sidePanel);
  const engineCover = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.48, 0.28, 18),
    metalMaterial
  );
  engineCover.rotation.z = Math.PI / 2;
  engineCover.position.set(0.47, 0.85, -0.62);
  scooter.add(engineCover);
  const fender = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
    frameMaterial
  );
  fender.scale.set(1, 0.48, 1.3);
  fender.position.set(0, 0.91, 1.15);
  fender.rotation.x = Math.PI;
  scooter.add(fender);

  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.32, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x252729, roughness: 0.72 })
  );
  seat.position.set(0, 1.82, -0.42);
  seat.rotation.x = -0.06;
  seat.castShadow = true;
  scooter.add(seat);
  const footboardStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.06, 1.25),
    new THREE.MeshStandardMaterial({ color: 0xd9d5c9, metalness: 0.58, roughness: 0.42 })
  );
  footboardStripe.position.set(0, 1.045, -0.04);
  scooter.add(footboardStripe);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.17, 1.35, 12), metalMaterial);
  stem.position.set(0, 1.85, 0.83);
  stem.rotation.x = -0.12;
  stem.castShadow = true;
  scooter.add(stem);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.38, 12), metalMaterial);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0, 2.52, 0.84);
  scooter.add(handle);
  [-1, 1].forEach(side => {
    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 0.32, 10),
      rubberMaterial
    );
    grip.rotation.z = Math.PI / 2;
    grip.position.set(side * 0.78, 2.52, 0.84);
    scooter.add(grip);

    const mirrorStem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.88, 8), metalMaterial);
    mirrorStem.position.set(side * 0.48, 2.91, 0.76);
    mirrorStem.rotation.z = side * 0.42;
    scooter.add(mirrorStem);
    const mirror = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 14, 10),
      new THREE.MeshStandardMaterial({ color: 0xdde2df, metalness: 0.78, roughness: 0.24 })
    );
    mirror.scale.set(1.25, 0.74, 0.3);
    mirror.position.set(side * 0.66, 3.28, 0.73);
    scooter.add(mirror);

    const indicator = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xffc15d, emissive: 0xe7852c, emissiveIntensity: 0.25 })
    );
    indicator.position.set(side * 0.52, 1.38, 0.99);
    scooter.add(indicator);
  });

  const headlamp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 0.18, 24),
    new THREE.MeshStandardMaterial({ color: 0xfff0c2, emissive: 0xe8c878, emissiveIntensity: 0.65 })
  );
  headlamp.rotation.x = Math.PI / 2;
  headlamp.position.set(0, 2.05, 0.96);
  scooter.add(headlamp);
  const tailLamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.18, 0.1),
    new THREE.MeshStandardMaterial({ color: 0xd94736, emissive: 0x94251d, emissiveIntensity: 0.2 })
  );
  tailLamp.position.set(0, 1.45, -1.32);
  scooter.add(tailLamp);

  const rider = createScooterRider();
  rider.visible = false;
  scooter.add(rider);

  scooter.position.set(x, terrainHeightAt(x, z) + 0.2, z);
  scooter.rotation.y = rotation;
  scooter.userData.wheels = wheels;
  scooter.userData.occupied = false;
  scooter.userData.parked = true;
  scooter.userData.rider = rider;
  scooter.visible = true;
  scene.add(scooter);
  if (register) animated.scooters.push(scooter);
  return scooter;
}

function createScooterRider() {
  const rider = new THREE.Group();
  const shirt = new THREE.MeshStandardMaterial({ color: 0x375d73, roughness: 0.88 });
  const trousers = new THREE.MeshStandardMaterial({ color: 0x343b43, roughness: 0.92 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc98e69, roughness: 0.9 });
  const helmet = new THREE.MeshStandardMaterial({ color: 0xf0c24f, roughness: 0.42 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.72, 5, 12), shirt);
  torso.position.set(0, 2.12, -0.38);
  torso.rotation.x = -0.16;
  torso.castShadow = true;
  rider.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.37, 16, 12), skin);
  head.position.set(0, 2.92, -0.23);
  head.castShadow = true;
  rider.add(head);
  const helmetShell = new THREE.Mesh(new THREE.SphereGeometry(0.41, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.56), helmet);
  helmetShell.position.set(0, 3.04, -0.23);
  rider.add(helmetShell);
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.1, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x45535a, metalness: 0.3, roughness: 0.35 })
  );
  visor.position.set(0, 2.98, 0.11);
  rider.add(visor);

  const addLimb = (start, end, radius, material) => {
    const startPoint = new THREE.Vector3(...start);
    const endPoint = new THREE.Vector3(...end);
    const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
    const limb = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.82, radius, direction.length(), 10),
      material
    );
    limb.position.copy(startPoint).add(endPoint).multiplyScalar(0.5);
    limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    limb.castShadow = true;
    rider.add(limb);
  };
  [-1, 1].forEach(side => {
    addLimb([side * 0.28, 2.38, -0.28], [side * 0.58, 2.48, 0.72], 0.15, shirt);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), skin);
    hand.position.set(side * 0.6, 2.48, 0.76);
    rider.add(hand);
    addLimb([side * 0.2, 1.83, -0.4], [side * 0.34, 1.12, 0.4], 0.19, trousers);
    addLimb([side * 0.34, 1.12, 0.4], [side * 0.34, 0.68, 0.92], 0.16, trousers);
    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.18, 0.46),
      new THREE.MeshStandardMaterial({ color: 0x292724, roughness: 0.9 })
    );
    shoe.position.set(side * 0.34, 0.65, 0.98);
    rider.add(shoe);
  });
  return rider;
}

function createSchool(scene) {
  const group = new THREE.Group();
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xe9e5d8, roughness: 0.82 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xd4c9ad, roughness: 0.86 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x9b5140, roughness: 0.82 });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x315b70,
    roughness: 0.26,
    metalness: 0.12
  });
  const courtyardTexture = createSchoolCourtyardTexture();
  const yard = new THREE.Mesh(
    new THREE.PlaneGeometry(132, 124),
    new THREE.MeshStandardMaterial({
      color: 0xe2dfd3,
      map: courtyardTexture,
      roughness: 0.94
    })
  );
  yard.rotation.x = -Math.PI / 2;
  yard.position.y = 0.08;
  yard.receiveShadow = true;
  group.add(yard);

  const boundaryMaterial = new THREE.MeshStandardMaterial({ color: 0xd8d1bd, roughness: 0.88 });
  const boundaryTrimMaterial = new THREE.MeshStandardMaterial({ color: 0x9b5140, roughness: 0.82 });
  const boundaryHeight = 4.2;
  const boundaryThickness = 1.2;
  const sideLength = 132;
  const boundaryWall = (width, depth, x, z) => {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(width, boundaryHeight, depth),
      boundaryMaterial
    );
    wall.position.set(x, boundaryHeight / 2, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);
  };
  boundaryWall(boundaryThickness, sideLength, -70, 0);
  boundaryWall(boundaryThickness, sideLength, 70, 0);
  boundaryWall(140, boundaryThickness, 0, -66);
  boundaryWall(58, boundaryThickness, -40.5, 66);
  boundaryWall(58, boundaryThickness, 40.5, 66);

  const boundaryPillarPositions = [];
  for (let z = -66; z <= 66; z += 14) {
    boundaryPillarPositions.push([-70, z], [70, z]);
  }
  for (let x = -70; x <= 70; x += 14) {
    boundaryPillarPositions.push([x, -66]);
  }
  for (let x = -70; x <= -12; x += 14) {
    boundaryPillarPositions.push([x, 66]);
  }
  for (let x = 12; x <= 70; x += 14) {
    boundaryPillarPositions.push([x, 66]);
  }
  boundaryPillarPositions.forEach(([x, z]) => {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 5, 1.8),
      boundaryMaterial
    );
    pillar.position.set(x, 2.5, z);
    pillar.castShadow = true;
    group.add(pillar);
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.35, 2.1),
      boundaryTrimMaterial
    );
    cap.position.set(x, 5.15, z);
    group.add(cap);
  });
  const wallPanelMaterial = new THREE.MeshStandardMaterial({ color: 0xf0e9d8, roughness: 0.86 });
  const wallPanelTrim = new THREE.MeshStandardMaterial({ color: 0xb99c70, roughness: 0.8 });
  for (const side of [-1, 1]) {
    for (let x = 17; x <= 59; x += 14) {
      const panelX = side * x;
      const panel = new THREE.Mesh(new THREE.BoxGeometry(10.2, 2.7, 0.18), wallPanelMaterial);
      panel.position.set(panelX, 2.2, 66.68);
      group.add(panel);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(10.8, 3.25, 0.14), wallPanelTrim);
      frame.position.set(panelX, 2.2, 66.54);
      frame.material = wallPanelTrim;
      frame.castShadow = false;
      group.add(frame);
      const inset = new THREE.Mesh(new THREE.BoxGeometry(9.9, 2.4, 0.12), wallPanelMaterial);
      inset.position.set(panelX, 2.2, 66.78);
      group.add(inset);
    }
  }

  const schoolWallMaterial = new THREE.MeshStandardMaterial({ color: 0xe7c94f, roughness: 0.86 });
  const buildings = [
    { x: -35, z: -43, width: 45, depth: 19, isMain: true },
    { x: 20, z: -43, width: 27, depth: 17 },
    { x: 49, z: -43, width: 17, depth: 17 },
    { x: -53, z: -5, width: 17, depth: 20 },
    { x: 53, z: -5, width: 17, depth: 20 },
    { x: -47, z: 34, width: 22, depth: 16 }
  ];
  buildings.forEach((building, index) => {
    createSchoolBuilding(group, {
      ...building,
      hasEntrance: building.isMain
    }, {
      wallMaterial: building.isMain ? schoolWallMaterial : wallMaterial,
      trimMaterial,
      roofMaterial,
      glassMaterial
    });
  });

  createSchoolFootballCourt(group, -24, 22);
  createSchoolVolleyballCourt(group, 34, 24);
  createSchoolStudents(group);
  createSchoolStudentLine(group);
  createSchoolFountain(group, 0, -4);
  createSchoolFlag(group, 0, -25);
  createSchoolFlowerBed(group, -22, -9, 15, 7);
  createSchoolFlowerBed(group, 22, -9, 15, 7);

  const centralWalk = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 50),
    new THREE.MeshStandardMaterial({ color: 0xc3bba5, roughness: 0.9 })
  );
  centralWalk.rotation.x = -Math.PI / 2;
  centralWalk.position.set(0, 0.14, 38);
  centralWalk.receiveShadow = true;
  group.add(centralWalk);

  const palmPositions = [];
  for (const z of [-52, -26, 26, 52]) palmPositions.push([-64, z], [64, z]);
  for (const x of [-46, -18, 18, 46]) palmPositions.push([x, -58]);
  palmPositions.forEach(([x, z]) => {
    const palm = createSchoolPalm();
    palm.position.set(x, 0, z);
    group.add(palm);
  });
  for (const x of [-26, 0, 26]) {
    const tree = makeTree(0.82);
    tree.position.set(x, 0, 5);
    group.add(tree);
  }
  for (let i = 0; i < 7; i++) {
    const bench = makeBench();
    bench.position.set(-24 + i * 8, 0, -16);
    group.add(bench);
  }

  const gateStone = new THREE.MeshStandardMaterial({ color: 0xcbb58e, roughness: 0.82 });
  const gateWood = new THREE.MeshStandardMaterial({ color: 0x70472e, roughness: 0.78 });
  const gateWoodLight = new THREE.MeshStandardMaterial({ color: 0x8c5a37, roughness: 0.76 });
  [-11, 11].forEach(x => {
    const stoneBase = new THREE.Mesh(new THREE.BoxGeometry(2.5, 4.1, 2.3), gateStone);
    stoneBase.position.set(x, 2.05, 63.4);
    stoneBase.castShadow = true;
    group.add(stoneBase);
    const capital = new THREE.Mesh(new THREE.BoxGeometry(3, 0.42, 2.8), wallPanelMaterial);
    capital.position.set(x, 4.25, 63.4);
    group.add(capital);
    const timberPost = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.4, 0.9), gateWood);
    timberPost.position.set(x, 6.15, 63.4);
    timberPost.castShadow = true;
    group.add(timberPost);
    const postBand = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.22, 1.2), gateWoodLight);
    postBand.position.set(x, 7.65, 63.4);
    group.add(postBand);
  });

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(23.5, 0.75, 1.1), gateWood);
  lintel.position.set(0, 8, 63.4);
  lintel.castShadow = true;
  group.add(lintel);
  const banner = new THREE.Mesh(
    new THREE.BoxGeometry(16.2, 2.15, 0.28),
    new THREE.MeshStandardMaterial({ color: 0xa92d27, roughness: 0.82 })
  );
  banner.position.set(0, 6.55, 64.05);
  group.add(banner);
  const bannerText = createLabel('TRƯỜNG THPT PHAN ĐĂNG LƯU', 0xa92d27, 0xffe6a8);
  bannerText.scale.set(1.48, 0.9, 1);
  bannerText.position.set(0, 6.55, 64.22);
  group.add(bannerText);
  const bannerSubtext = createLabel('THI ĐUA DẠY TỐT - HỌC TỐT', 0x85251f, 0xfff1d0);
  bannerSubtext.scale.set(1.05, 0.45, 1);
  bannerSubtext.position.set(0, 5.72, 64.23);
  group.add(bannerSubtext);

  const roofMaterialGate = new THREE.MeshStandardMaterial({ color: 0x5b4636, roughness: 0.88 });
  const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(13, 0.48, 5.2), roofMaterialGate);
  roofLeft.position.set(-6.3, 9.1, 63.3);
  roofLeft.rotation.z = -0.18;
  roofLeft.castShadow = true;
  group.add(roofLeft);
  const roofRight = new THREE.Mesh(new THREE.BoxGeometry(13, 0.48, 5.2), roofMaterialGate);
  roofRight.position.set(6.3, 9.1, 63.3);
  roofRight.rotation.z = 0.18;
  roofRight.castShadow = true;
  group.add(roofRight);
  const roofRidge = new THREE.Mesh(new THREE.BoxGeometry(1, 0.45, 5.4), gateWood);
  roofRidge.position.set(0, 10.22, 63.3);
  group.add(roofRidge);
  const roofEdge = new THREE.Mesh(new THREE.BoxGeometry(25, 0.28, 5.8), gateWood);
  roofEdge.position.set(0, 8.55, 63.3);
  group.add(roofEdge);

  [-8, -4, 4, 8].forEach(x => {
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.1, 0.32), gateWoodLight);
    brace.position.set(x, 8.75, 63.3);
    brace.rotation.z = x < 0 ? 0.58 : -0.58;
    group.add(brace);
  });
  const schoolMarker = createFloatingLabel('THPT PHAN ĐĂNG LƯU', 0x1f4960);
  schoolMarker.position.set(0, 33, 0);
  group.add(schoolMarker);

  createSchoolGuardRoom(group);
  createSchoolParking(group);
  createSchoolTeachers(group);

  const schoolZone = zones.find(zone => zone.id === 'school');
  group.position.set(schoolZone.x, 0, schoolZone.z);
  group.scale.setScalar(1.25);
  scene.add(group);
}

function createSchoolPalm() {
  const palm = new THREE.Group();
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x80552f, roughness: 0.94 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.68, 9.5, 9), trunkMaterial);
  trunk.position.set(0.3, 4.75, 0);
  trunk.rotation.z = -0.07;
  trunk.castShadow = true;
  palm.add(trunk);

  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x397144, roughness: 0.9 });
  for (let index = 0; index < 9; index++) {
    const angle = index * Math.PI * 2 / 9;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.42, 6.4, 5), leafMaterial);
    leaf.position.set(Math.cos(angle) * 2.45, 8.9, Math.sin(angle) * 2.45);
    leaf.rotation.z = Math.cos(angle) * 1.12;
    leaf.rotation.x = Math.sin(angle) * 1.12;
    leaf.rotation.y = -angle;
    leaf.castShadow = true;
    palm.add(leaf);
  }
  const coconuts = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 9, 7),
    new THREE.MeshStandardMaterial({ color: 0x6f4a27, roughness: 0.92 })
  );
  coconuts.position.set(0.3, 8.6, 0);
  palm.add(coconuts);
  return palm;
}

function createSchoolGuardRoom(group) {
  const booth = new THREE.Group();
  const wall = new THREE.MeshStandardMaterial({ color: 0xf0dfbb, roughness: 0.9 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x9e3529, roughness: 0.84 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(12, 6.5, 9), wall);
  body.position.y = 3.25;
  body.castShadow = true;
  body.receiveShadow = true;
  booth.add(body);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(13, 0.65, 10), trim);
  roof.position.y = 6.8;
  roof.castShadow = true;
  booth.add(roof);
  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x6d9db0,
    roughness: 0.24,
    metalness: 0.1
  });
  for (const x of [-3.6, 3.6]) {
    const window = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2, 0.18), windowMaterial);
    window.position.set(x, 4.4, 4.58);
    booth.add(window);
  }
  const sign = createLabel('PHÒNG BẢO VỆ', 0x9e3529, 0xfff0d2);
  sign.scale.set(6.6, 1.25, 1);
  sign.position.set(0, 6, 4.7);
  booth.add(sign);
  booth.position.set(22, 0, 50);
  group.add(booth);
}

function createSchoolParking(group) {
  const parking = new THREE.Group();
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(31, 0.18, 20),
    new THREE.MeshStandardMaterial({ color: 0xb9b5a8, roughness: 0.95 })
  );
  floor.position.y = 0.1;
  floor.receiveShadow = true;
  parking.add(floor);
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x557c78, roughness: 0.86 });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(32, 0.65, 21), roofMaterial);
  roof.position.y = 6.1;
  roof.castShadow = true;
  parking.add(roof);
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0xeee4cf, roughness: 0.88 });
  for (const x of [-14.5, 14.5]) {
    for (const z of [-9, 9]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.7, 6, 0.7), postMaterial);
      post.position.set(x, 3, z);
      post.castShadow = true;
      parking.add(post);
    }
  }
  const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffe6a1, roughness: 0.9 });
  for (const x of [-9, -3, 3, 9]) {
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 16), lineMaterial);
    marker.position.set(x, 0.22, 0);
    parking.add(marker);
  }
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x242424, roughness: 0.95 });
  const bikeColors = [0x9e3529, 0x315e86, 0x697b43];
  [-6, 0, 6].forEach((x, index) => {
    const bike = new THREE.Group();
    const wheelZ = [-2, 2];
    wheelZ.forEach(z => {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.12, 8, 14), wheelMaterial);
      wheel.rotation.y = Math.PI / 2;
      wheel.position.set(0, 0.62, z);
      bike.add(wheel);
    });
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.62, 1.65),
      new THREE.MeshStandardMaterial({ color: bikeColors[index], roughness: 0.76 })
    );
    body.position.set(0, 1.05, 0);
    bike.add(body);
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.18, 0.85),
      new THREE.MeshStandardMaterial({ color: 0x292724, roughness: 0.9 })
    );
    seat.position.set(0, 1.52, -0.3);
    bike.add(seat);
    const handlebar = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.12, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x343434, metalness: 0.22, roughness: 0.68 })
    );
    handlebar.position.set(0, 1.72, 1.45);
    bike.add(handlebar);
    bike.position.x = x;
    bike.traverse(part => {
      if (part.isMesh) part.castShadow = true;
    });
    parking.add(bike);
  });
  const sign = createLabel('NHÀ XE HỌC SINH', 0x315e53, 0xfff0c6);
  sign.scale.set(12, 2, 1);
  sign.position.set(0, 5.2, 10.65);
  parking.add(sign);
  parking.position.set(45, 0, -22);
  group.add(parking);
}

function createSchoolTeachers(group) {
  const teachers = [
    { name: 'Thầy Nguyễn Đức Hiền', x: -5.6, z: 72, color: 0x315d86, variation: 0 },
    { name: 'Thầy Phan Văn Cường', x: 5.6, z: 72, color: 0x3f7058, variation: 1 },
    { name: 'Cô Vân Anh', x: -9, z: 47, color: 0x9b4c54, variation: 2 },
    { name: 'Cô Hồng', x: 9, z: 47, color: 0x805b92, variation: 3 }
  ];
  teachers.forEach((teacher, index) => {
    const npc = makeNPC(teacher.color, teacher.variation);
    npc.position.set(teacher.x, 0, teacher.z);
    npc.scale.setScalar(0.88);
    npc.rotation.y = index < 2 ? Math.PI : 0;
    const nameLabel = createFloatingLabel(teacher.name, 0x24485b);
    nameLabel.position.set(0, 3.6, 0);
    nameLabel.scale.set(4.4, 0.78, 1);
    npc.add(nameLabel);
    group.add(npc);
  });
}

function createSchoolStudents(group) {
  const students = [
    { x: 28, z: 19, color: 0x315d86, phase: 0 },
    { x: 40, z: 19, color: 0x3f7058, phase: Math.PI / 2 },
    { x: 28, z: 29, color: 0x9b4c54, phase: Math.PI },
    { x: 40, z: 29, color: 0x805b92, phase: Math.PI * 1.5 }
  ];
  students.forEach(student => {
    const npc = makeNPC(student.color, Math.round(student.phase));
    npc.position.set(student.x, 0, student.z);
    npc.scale.setScalar(0.88);
    group.add(npc);
    animated.schoolStudents.push({
      npc,
      x: student.x,
      z: student.z,
      phase: student.phase
    });
  });

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xf2d548, roughness: 0.72 })
  );
  ball.position.set(34, 1.3, 24);
  ball.castShadow = true;
  group.add(ball);
  animated.schoolVolleyBall = ball;
}

function createSchoolStudentLine(group) {
  const names = [
    'Thịnh', 'Anh Thư', 'Minh Thư', 'Nha Trang', 'Quang', 'Khánh', 'Bảo',
    'Hùng', 'Mạnh', 'Vi', 'Mai', 'Tân', 'Phát', 'Phúc', 'Hưng', 'Dũng',
    'Giang', 'Kiệt', 'Nghĩa', 'Hiển', 'Sang', 'Hiếu', 'Duy', 'Thọ',
    'Mai Ngọc', 'Tiến', 'Quý', 'Thùy Linh', 'Lê Linh', 'Vương', 'Quân',
    'Trà My', 'Công', 'Huy', 'Đạt', 'Ứng', 'Huy'
  ];
  const uniforms = [0x315d86, 0x3f7058, 0x9b4c54, 0x805b92, 0x8a6d4d];
  const positions = [];
  let seed = 20261105;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  let attempts = 0;
  while (positions.length < names.length && attempts < 3000) {
    attempts++;
    const position = {
      x: -56 + random() * 112,
      z: -5 + random() * 60
    };
    if (positions.some(existing =>
      Math.hypot(position.x - existing.x, position.z - existing.z) < 9.5
    )) continue;
    positions.push(position);
  }
  if (positions.length !== names.length) {
    positions.length = 0;
    for (let row = 0; row < 7; row++) {
      for (let column = 0; column < 6; column++) {
        positions.push({
          x: -46.25 + column * 18.5 + (row % 2) * 9.25,
          z: -3 + row * 8.2
        });
      }
    }
    for (let index = positions.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(random() * (index + 1));
      [positions[index], positions[swapIndex]] = [positions[swapIndex], positions[index]];
    }
  }

  names.forEach((name, index) => {
    const student = makeNPC(uniforms[index % uniforms.length], index);
    student.position.set(positions[index].x, 0, positions[index].z);
    student.rotation.y = Math.PI;
    student.scale.setScalar(0.88);

    const nameLabel = createFloatingLabel(name, 0x24485b);
    nameLabel.position.set(0, 4.4, 0);
    nameLabel.scale.set(5.8, 1.15, 1);
    student.add(nameLabel);
    group.add(student);
    animated.schoolStudents.push({
      npc: student,
      x: positions[index].x,
      z: positions[index].z,
      phase: random() * Math.PI * 2,
      speed: 0.85 + random() * 0.4,
      rangeX: 3.5 + random() * 2,
      rangeZ: 1.5 + random() * 1.8
    });
  });
}

function createSchoolBuilding(group, building, materials) {
  const { x, z, width, depth, isMain = false } = building;
  const height = isMain ? 26 : 18;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    materials.wallMaterial
  );
  body.position.set(x, height / 2, z);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width + 1.6, 0.8, depth + 1.6),
    isMain ? new THREE.MeshStandardMaterial({ color: 0xf3e7c7, roughness: 0.86 }) : materials.roofMaterial
  );
  roof.position.set(x, height + 0.4, z);
  roof.castShadow = true;
  group.add(roof);

  (isMain ? [7, 16, 25] : [6, 12, 17]).forEach(y => {
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.15, 0.35, depth + 0.15),
      materials.trimMaterial
    );
    band.position.set(x, y, z);
    group.add(band);
  });

  const windowRows = isMain ? [5, 13, 21] : [4, 10, 16];
  const windowColumns = Math.max(3, Math.floor(width / 5));
  const windowWidth = 2.1;
  const spacing = width / (windowColumns + 1);
  for (const face of [-1, 1]) {
    for (const rowY of windowRows) {
      for (let col = 0; col < windowColumns; col++) {
        const windowX = x - width / 2 + spacing * (col + 1);
        if (building.hasEntrance && face > 0 && Math.abs(windowX - x) < 3) continue;

        const windowFrame = new THREE.Mesh(
          new THREE.BoxGeometry(windowWidth + 0.55, isMain ? 3.2 : 2.7, 0.32),
          isMain ? new THREE.MeshStandardMaterial({ color: 0xffe98a, roughness: 0.78 }) : materials.trimMaterial
        );
        windowFrame.position.set(windowX, rowY, z + face * (depth / 2 + 0.08));
        group.add(windowFrame);

        const glass = new THREE.Mesh(
          new THREE.PlaneGeometry(windowWidth, isMain ? 2.72 : 2.35),
          materials.glassMaterial
        );
        glass.position.set(windowX, rowY, z + face * (depth / 2 + 0.22));
        if (face < 0) glass.rotation.y = Math.PI;
        group.add(glass);
      }
    }
  }

  if (building.hasEntrance) {
    const redAccentMaterial = new THREE.MeshStandardMaterial({ color: 0x9e3026, roughness: 0.82 });
    const entranceAccent = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.34, 24, 0.65),
      redAccentMaterial
    );
    entranceAccent.position.set(x - width * 0.27, 13, z + depth / 2 + 0.28);
    entranceAccent.castShadow = true;
    group.add(entranceAccent);

    const lowerFacade = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.54, 6, 0.55),
      redAccentMaterial
    );
    lowerFacade.position.set(x, 3.2, z + depth / 2 + 0.26);
    group.add(lowerFacade);

    const entranceGlass = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.43, 4.8, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x315b70, roughness: 0.24, metalness: 0.16 })
    );
    entranceGlass.position.set(x + width * 0.05, 2.95, z + depth / 2 + 0.59);
    group.add(entranceGlass);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 4.4, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x302a2a, roughness: 0.48 })
    );
    door.position.set(x + width * 0.05, 2.55, z + depth / 2 + 0.72);
    group.add(door);

    const entranceStep = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.45, 3.4),
      materials.trimMaterial
    );
    entranceStep.position.set(x, 0.32, z + depth / 2 + 1.4);
    entranceStep.receiveShadow = true;
    group.add(entranceStep);

    const roofCanopy = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.5, 0.5, 2.7),
      new THREE.MeshStandardMaterial({ color: 0x8f3027, roughness: 0.78 })
    );
    roofCanopy.position.set(x, 5.65, z + depth / 2 + 1.05);
    roofCanopy.castShadow = true;
    group.add(roofCanopy);

    const schoolName = createLabel('THPT PHAN ĐĂNG LƯU', 0x9e3026, 0xffedb5);
    schoolName.scale.set(12 / 10.5, 1.5 / 2, 1);
    schoolName.position.set(x - width * 0.23, 23.1, z + depth / 2 + 0.24);
    group.add(schoolName);
  }
}

function createSchoolCourtyardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = '#d5d2c8';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#bbb9b0';
  context.lineWidth = 2;
  for (let position = 0; position <= 128; position += 32) {
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, 128);
    context.stroke();
    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(128, position);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 15);
  texture.anisotropy = 8;
  return texture;
}

function createSchoolFootballCourt(group, x, z) {
  const width = 46;
  const depth = 28;
  const court = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({ color: 0x47834b, roughness: 0.88 })
  );
  court.rotation.x = -Math.PI / 2;
  court.position.set(x, 0.16, z);
  court.receiveShadow = true;
  group.add(court);

  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xf2eee0 });
  const addLine = (lineX, lineZ, lineWidth, lineDepth) => {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(lineWidth, lineDepth), lineMaterial);
    line.rotation.x = -Math.PI / 2;
    line.position.set(x + lineX, 0.18, z + lineZ);
    group.add(line);
  };
  addLine(0, -depth / 2, width, 0.35);
  addLine(0, depth / 2, width, 0.35);
  addLine(-width / 2, 0, 0.35, depth);
  addLine(width / 2, 0, 0.35, depth);
  addLine(0, 0, 0.25, depth);

  const circle = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.45, 32), lineMaterial);
  circle.rotation.x = -Math.PI / 2;
  circle.position.set(x, 0.19, z);
  group.add(circle);

  const goalMaterial = new THREE.MeshStandardMaterial({ color: 0xe9e8dc, roughness: 0.42 });
  [-1, 1].forEach(side => {
    const goalX = x + side * (width / 2 - 0.5);
    [-3, 3].forEach(goalZ => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3, 8), goalMaterial);
      post.position.set(goalX, 1.5, z + goalZ);
      post.castShadow = true;
      group.add(post);
    });
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 6.2), goalMaterial);
    crossbar.position.set(goalX, 3, z);
    group.add(crossbar);
  });
}

function createSchoolVolleyballCourt(group, x, z) {
  const width = 25;
  const depth = 15;
  const court = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({ color: 0xc59b63, roughness: 0.94 })
  );
  court.rotation.x = -Math.PI / 2;
  court.position.set(x, 0.17, z);
  court.receiveShadow = true;
  group.add(court);

  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xfff5dc });
  const addLine = (lineX, lineZ, lineWidth, lineDepth) => {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(lineWidth, lineDepth), lineMaterial);
    line.rotation.x = -Math.PI / 2;
    line.position.set(x + lineX, 0.19, z + lineZ);
    group.add(line);
  };
  addLine(0, -depth / 2, width, 0.25);
  addLine(0, depth / 2, width, 0.25);
  addLine(-width / 2, 0, 0.25, depth);
  addLine(width / 2, 0, 0.25, depth);
  addLine(0, 0, width, 0.2);

  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x334b50, roughness: 0.55 });
  [-1, 1].forEach(side => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 3, 8), postMaterial);
    post.position.set(x + side * (width / 2 - 0.7), 1.5, z);
    post.castShadow = true;
    group.add(post);
  });
  const net = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 1, 1.5),
    new THREE.MeshStandardMaterial({
      color: 0xe6e1d3,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide
    })
  );
  net.position.set(x, 2.25, z);
  group.add(net);
}

function createSchoolFountain(group, x, z) {
  const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0xbcb9a9, roughness: 0.72 });
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x70b9c3,
    roughness: 0.2,
    metalness: 0.08,
    transparent: true,
    opacity: 0.88
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.6, 0.6, 40), stoneMaterial);
  base.position.set(x, 0.36, z);
  base.receiveShadow = true;
  group.add(base);

  const water = new THREE.Mesh(new THREE.CircleGeometry(4.75, 40), waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.set(x, 0.7, z);
  group.add(water);

  const center = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 1.05, 2.4, 16), stoneMaterial);
  center.position.set(x, 1.65, z);
  center.castShadow = true;
  group.add(center);
  const upperBasin = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 0.8, 0.38, 24), stoneMaterial);
  upperBasin.position.set(x, 2.85, z);
  group.add(upperBasin);
  const upperWater = new THREE.Mesh(new THREE.CircleGeometry(1.45, 24), waterMaterial);
  upperWater.rotation.x = -Math.PI / 2;
  upperWater.position.set(x, 3.06, z);
  group.add(upperWater);
  const jet = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 1.25, 12),
    new THREE.MeshStandardMaterial({ color: 0x91d5dc, transparent: true, opacity: 0.72 })
  );
  jet.position.set(x, 3.75, z);
  group.add(jet);
}

function createSchoolFlag(group, x, z) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.24, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xd7d8d1, metalness: 0.65, roughness: 0.32 })
  );
  pole.position.set(x, 8, z);
  pole.castShadow = true;
  group.add(pole);

  const finial = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xc8a959, metalness: 0.55, roughness: 0.3 })
  );
  finial.position.set(x, 16.25, z);
  group.add(finial);

  const flagCanvas = document.createElement('canvas');
  flagCanvas.width = 300;
  flagCanvas.height = 200;
  const context = flagCanvas.getContext('2d');
  context.fillStyle = '#da251d';
  context.fillRect(0, 0, flagCanvas.width, flagCanvas.height);
  context.fillStyle = '#ffdf00';
  context.beginPath();
  for (let point = 0; point < 10; point++) {
    const angle = -Math.PI / 2 + point * Math.PI / 5;
    const radius = point % 2 === 0 ? 52 : 22;
    const starX = 150 + Math.cos(angle) * radius;
    const starY = 100 + Math.sin(angle) * radius;
    if (point === 0) context.moveTo(starX, starY);
    else context.lineTo(starX, starY);
  }
  context.closePath();
  context.fill();

  const flagTexture = new THREE.CanvasTexture(flagCanvas);
  flagTexture.colorSpace = THREE.SRGBColorSpace;
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 3.45),
    new THREE.MeshBasicMaterial({ map: flagTexture, side: THREE.DoubleSide })
  );
  flag.position.set(x + 2.8, 13.8, z);
  group.add(flag);
}

function createSchoolFlowerBed(group, x, z, width, depth) {
  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.3, depth),
    new THREE.MeshStandardMaterial({ color: 0x4c6437, roughness: 0.96 })
  );
  soil.position.set(x, 0.3, z);
  soil.receiveShadow = true;
  group.add(soil);

  const flowerColors = [0xe47b81, 0xf3d275, 0xc18bd0, 0xf0f0d7];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 6; col++) {
      const flowerX = x - width / 2 + 1.5 + col * (width - 3) / 5;
      const flowerZ = z - depth / 2 + 1.2 + row * (depth - 2.4) / 2;
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.1, 0.8, 6),
        new THREE.MeshStandardMaterial({ color: 0x4d713e, roughness: 0.9 })
      );
      stem.position.set(flowerX, 0.85, flowerZ);
      group.add(stem);

      const blossom = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 8, 8),
        new THREE.MeshStandardMaterial({
          color: flowerColors[(row * 2 + col) % flowerColors.length],
          roughness: 0.7
        })
      );
      blossom.position.set(flowerX, 1.3, flowerZ);
      group.add(blossom);
    }
  }
}

function createFootballField(scene) {
  const group = new THREE.Group();

  const field = new THREE.Mesh(
    new THREE.PlaneGeometry(58, 40),
    new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.82 })
  );
  field.rotation.x = -Math.PI / 2;
  field.position.y = 0.12;
  field.receiveShadow = true;
  group.add(field);

  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [[0, 18.5, 54, 0.4], [0, -18.5, 54, 0.4], [27, 0, 0.4, 37], [-27, 0, 0.4, 37], [0, 0, 0.4, 37]].forEach(([x, z, w, d]) => {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lineMat);
    l.rotation.x = -Math.PI / 2;
    l.position.set(x, 0.14, z);
    group.add(l);
  });

  const circle = new THREE.Mesh(new THREE.RingGeometry(8, 8.5, 40), lineMat);
  circle.rotation.x = -Math.PI / 2;
  circle.position.y = 0.15;
  group.add(circle);

  const goalMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc });
  [-25.5, 25.5].forEach(x => {
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4, 0.4), goalMat);
    p1.position.set(x, 2, -7.5);
    p1.castShadow = true;
    group.add(p1);
    const p2 = p1.clone();
    p2.position.z = 7.5;
    group.add(p2);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 15.4), goalMat);
    cross.position.set(x, 4, 0);
    group.add(cross);
    const netMat = new THREE.LineBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.65 });
    for (let i = 1; i < 7; i++) {
      const z = -7.5 + i * 2.15;
      const netLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, 0.25, z),
          new THREE.Vector3(x, 3.8, z)
        ]),
        netMat
      );
      group.add(netLine);
    }
  });

  const stand = new THREE.Mesh(
    new THREE.BoxGeometry(42, 5, 7),
    new THREE.MeshStandardMaterial({ color: 0x64748b })
  );
  stand.position.set(0, 2.5, -24);
  stand.castShadow = true;
  group.add(stand);

  for (let i = 0; i < 5; i++) {
    const bench = makeBench();
    bench.position.set(-16 + i * 8, 5.1, -24);
    bench.rotation.y = Math.PI;
    group.add(bench);
  }

  const footballZone = zones.find(zone => zone.id === 'football');
  group.position.set(footballZone.x, 0, footballZone.z);
  scene.add(group);
}

function createRiver(scene) {
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    transparent: true,
    opacity: 0.87,
    roughness: 0.12,
    metalness: 0.15
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(230, 38), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.18, 55);
  scene.add(water);
  animated.water = water;

  const bankMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.9 });
  const bank1 = new THREE.Mesh(new THREE.PlaneGeometry(230, 7), bankMat);
  bank1.rotation.x = -Math.PI / 2;
  bank1.position.set(0, 0.2, 34);
  scene.add(bank1);
  const bank2 = bank1.clone();
  bank2.position.z = 76;
  scene.add(bank2);

  const bridge = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x71533b, roughness: 0.84 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(32, 0.45, 28), wood);
  deck.position.y = 1.25;
  deck.castShadow = true;
  deck.receiveShadow = true;
  bridge.add(deck);
  [-15.5, 15.5].forEach(x => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.25, 28), wood);
    rail.position.set(x, 1.9, 0);
    bridge.add(rail);
    for (let z = -12; z <= 12; z += 6) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.8, 0.32), wood);
      post.position.set(x, 2, z);
      post.castShadow = true;
      bridge.add(post);
    }
  });
  bridge.position.set(0, 0, 55);
  scene.add(bridge);

  const reedMat = new THREE.MeshStandardMaterial({ color: 0x809047, roughness: 0.9 });
  for (let i = 0; i < 36; i++) {
    const x = -108 + Math.random() * 216;
    if (Math.abs(x) < 8) continue;
    const z = Math.random() > 0.5 ? 32 + Math.random() * 3 : 75 + Math.random() * 3;
    const reed = new THREE.Group();
    for (let blade = 0; blade < 4; blade++) {
      const stem = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.8 + Math.random(), 5), reedMat);
      stem.position.set((Math.random() - 0.5) * 0.6, 0.9, (Math.random() - 0.5) * 0.6);
      stem.rotation.z = (Math.random() - 0.5) * 0.25;
      reed.add(stem);
    }
    reed.position.set(x, 0.2, z);
    scene.add(reed);
  }

  const rockMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.95 });
  for (let i = 0; i < 16; i++) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.1 + Math.random() * 1.8, 0),
      rockMat
    );
    rock.position.set(-100 + i * 13, 0.9, 33 + (i % 4) * 2.5);
    rock.rotation.set(Math.random() * 2, Math.random(), Math.random());
    rock.castShadow = true;
    scene.add(rock);
  }
}

function createDam(scene) {
  const group = new THREE.Group();

  const lake = new THREE.Mesh(
    new THREE.PlaneGeometry(58, 50),
    new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.9,
      roughness: 0.18
    })
  );
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(0, 0.22, -12);
  group.add(lake);

  const dam = new THREE.Mesh(
    new THREE.BoxGeometry(60, 11, 9),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.65 })
  );
  dam.position.set(0, 5.5, 15);
  dam.castShadow = true;
  dam.receiveShadow = true;
  group.add(dam);

  for (let i = 0; i < 8; i++) {
    const s = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 6.5, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x475569 })
    );
    s.position.set(-26 + i * 7.5, 4.5, 18.5);
    group.add(s);
  }

  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(60, 1.3, 0.55),
    new THREE.MeshStandardMaterial({ color: 0x334155 })
  );
  rail.position.set(0, 11.3, 15);
  group.add(rail);

  const road = new THREE.Mesh(
    new THREE.BoxGeometry(60, 0.28, 7),
    new THREE.MeshStandardMaterial({ color: 0x777a72, roughness: 0.9 })
  );
  road.position.set(0, 11.1, 15);
  road.receiveShadow = true;
  group.add(road);

  const house = new THREE.Mesh(
    new THREE.BoxGeometry(11, 6.5, 9),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0 })
  );
  house.position.set(30, 3.25, 8);
  house.castShadow = true;
  group.add(house);

  const dongThanh = districtAreas.find(area => area.name === 'Đồng Thành');
  group.position.set(dongThanh.x, 0, dongThanh.z);
  scene.add(group);
}

function createSheepFarm(scene) {
  const group = new THREE.Group();

  const hill = new THREE.Mesh(
    new THREE.CircleGeometry(34, 48),
    new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.88 })
  );
  hill.rotation.x = -Math.PI / 2;
  hill.position.y = 0.14;
  hill.receiveShadow = true;
  group.add(hill);

  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
  for (let i = -30; i <= 30; i += 3.5) {
    [[i, -30], [i, 30], [-30, i], [30, i]].forEach(([x, z], side) => {
      if (side === 0 && i >= 12 && i <= 20) return;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.5, 0.5), fenceMat);
      post.position.set(x, 1.25, z);
      post.castShadow = true;
      group.add(post);
    });
  }
  [-30, 30].forEach(z => {
    [0.85, 1.7].forEach(y => {
      const sections = z === -30
        ? [{ x: -9, width: 42 }, { x: 25, width: 10 }]
        : [{ x: 0, width: 60 }];
      sections.forEach(({ x, width }) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(width, 0.28, 0.28), fenceMat);
        rail.position.set(x, y, z);
        group.add(rail);
      });
    });
  });
  [-30, 30].forEach(x => {
    [0.85, 1.7].forEach(y => {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 60), fenceMat);
      r.position.set(x, y, 0);
      group.add(r);
    });
  });

  const barn = new THREE.Mesh(
    new THREE.BoxGeometry(15, 7.5, 11),
    new THREE.MeshStandardMaterial({ color: 0xb45309 })
  );
  barn.position.set(-20, 3.75, -20);
  barn.castShadow = true;
  group.add(barn);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(11, 4.5, 4),
    new THREE.MeshStandardMaterial({ color: 0x7c2d12 })
  );
  roof.position.set(-20, 9.5, -20);
  roof.rotation.y = Math.PI / 4;
  group.add(roof);

  for (let i = 0; i < 26; i++) {
    const sheep = makeSheep();
    sheep.position.set((Math.random() - 0.5) * 52, 0, (Math.random() - 0.5) * 52);
    sheep.rotation.y = Math.random() * Math.PI * 2;
    sheep.userData = {
      baseX: sheep.position.x,
      baseZ: sheep.position.z,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.5
    };
    group.add(sheep);
    animated.sheep.push(sheep);
  }

  const sheepZone = zones.find(zone => zone.id === 'sheep');
  group.position.set(sheepZone.x, 0, sheepZone.z);
  scene.add(group);
}

function createRiceFields(scene) {
  const riceAreas = ['Đông Thành', 'Long Thành', 'Nhân Thành', 'Phú Thành']
    .map(name => districtAreas.find(area => area.name === name));
  const patches = [
    { x: riceAreas[0].x - 30, z: riceAreas[0].z + 32, width: 58, depth: 44 },
    { x: riceAreas[1].x + 25, z: riceAreas[1].z + 25, width: 58, depth: 46 },
    { x: riceAreas[2].x + 27, z: riceAreas[2].z - 20, width: 56, depth: 42 },
    { x: riceAreas[3].x - 27, z: riceAreas[3].z + 25, width: 55, depth: 42 }
  ];
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x809f8d,
    roughness: 0.3,
    metalness: 0.05
  });
  const cropMaterial = new THREE.MeshStandardMaterial({
    color: 0x829b48,
    roughness: 0.88
  });

  patches.forEach(({ x, z, width, depth }) => {
    const paddy = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), waterMaterial);
    paddy.rotation.x = -Math.PI / 2;
    paddy.position.set(x, 0.17, z);
    paddy.receiveShadow = true;
    scene.add(paddy);

    const crop = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.16, 1.3, 4),
      cropMaterial,
      240
    );
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    let index = 0;
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 20; col++) {
        position.set(
          x - width / 2 + 1.5 + col * 1.9,
          0.85,
          z - depth / 2 + 1.6 + row * 3.3
        );
        scale.set(0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.6, 0.8 + Math.random() * 0.4);
        rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI);
        matrix.compose(position, rotation, scale);
        crop.setMatrixAt(index++, matrix);
      }
    }
    crop.instanceMatrix.needsUpdate = true;
    crop.castShadow = true;
    crop.receiveShadow = true;
    scene.add(crop);
  });
}

function createLabel(text, background, foreground) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = `#${background.toString(16).padStart(6, '0')}`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = `#${foreground.toString(16).padStart(6, '0')}`;
  ctx.font = 'bold 42px sans-serif';
  const fontSize = Math.min(42, (canvas.width - 24) * 42 / ctx.measureText(text).width);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width - 24);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(10.5, 2),
    new THREE.MeshBasicMaterial({ map: texture })
  );
}

function createFloatingLabel(text, background) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 144;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = `#${background.toString(16).padStart(6, '0')}`;
  ctx.globalAlpha = 0.94;
  ctx.beginPath();
  ctx.roundRect(6, 6, canvas.width - 12, canvas.height - 12, 24);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#fff3d9';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = '#fff3d9';
  ctx.font = 'bold 52px sans-serif';
  const fontSize = Math.min(52, (canvas.width - 48) * 52 / ctx.measureText(text).width);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width - 48);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    depthWrite: false
  }));
  label.scale.set(24, 4.5, 1);
  return label;
}

function createTrees(scene) {
  const trunks = [];
  const canopies = [];
  for (let i = 0; i < 4200; i++) {
    const x = (Math.random() - 0.5) * 2240;
    const z = (Math.random() - 0.5) * 2240;

    if (districtAreas.some(area =>
      Math.abs(x - area.x) < area.w / 2 + 20 &&
      Math.abs(z - area.z) < area.d / 2 + 20
    )) continue;
    if (zones.some(zone =>
      Math.abs(x - zone.x) < zone.w / 2 + 12 &&
      Math.abs(z - zone.z) < zone.d / 2 + 12
    )) continue;
    if (Math.abs(z - 55) < 34 || isNearRoad(x, z, 18)) continue;

    const scale = 0.85 + Math.random() * 1.3;
    const baseY = roadHeightAt(x, z);
    const color = new THREE.Color(
      [0x4f8d4b, 0x68a84e, 0x82b45a, 0x3f7948][Math.floor(Math.random() * 4)]
    );
    trunks.push({ x, z, baseY, scale, color });
    canopies.push({ x, z, baseY, scale, color, dx: 0, dy: 5.8, dz: 0, size: 2.35 });
    canopies.push({ x, z, baseY, scale, color, dx: -1.45, dy: 5.15, dz: 0.7, size: 1.9 });
    canopies.push({ x, z, baseY, scale, color, dx: 1.3, dy: 5.4, dz: -0.6, size: 1.8 });
    canopies.push({ x, z, baseY, scale, color, dx: -0.2, dy: 6.9, dz: -0.9, size: 1.45 });
  }

  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x80502f, roughness: 0.92 });
  const trunkMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.32, 0.48, 4.8, 7),
    trunkMaterial,
    trunks.length
  );
  const canopyMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88 }),
    canopies.length
  );
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scaleVector = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  trunks.forEach((tree, index) => {
    position.set(tree.x, tree.baseY + 2.4 * tree.scale, tree.z);
    scaleVector.set(tree.scale, tree.scale, tree.scale);
    matrix.compose(position, rotation, scaleVector);
    trunkMesh.setMatrixAt(index, matrix);
  });
  canopies.forEach((leaf, index) => {
    position.set(
      leaf.x + leaf.dx * leaf.scale,
      leaf.baseY + leaf.dy * leaf.scale,
      leaf.z + leaf.dz * leaf.scale
    );
    scaleVector.set(
      leaf.size * leaf.scale,
      leaf.size * leaf.scale * (leaf.dy > 6 ? 0.9 : 1),
      leaf.size * leaf.scale * 0.92
    );
    matrix.compose(position, rotation, scaleVector);
    canopyMesh.setMatrixAt(index, matrix);
    canopyMesh.setColorAt(index, leaf.color);
  });
  trunkMesh.instanceMatrix.needsUpdate = true;
  canopyMesh.instanceMatrix.needsUpdate = true;
  if (canopyMesh.instanceColor) canopyMesh.instanceColor.needsUpdate = true;
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  canopyMesh.castShadow = true;
  canopyMesh.receiveShadow = true;
  scene.add(trunkMesh, canopyMesh);
}

function isNearRoad(x, z, clearance) {
  const routes = [
    [[0, -1050], [0, 1050]],
    [[0, 6], [-17, 12], [-32, 25], [-45, 40]],
    [[0, -55], [28, -55], [51, -50], [74, -66], [96, -91], [120, -119], [145, -145]],
    [[0, -55], [-35, -61], [-76, -69], [-111, -80], [-145, -82]],
    [[0, 76], [-32, 77], [-63, 74], [-90, 70], [-119, 94], [-145, 115]],
    [[0, 80], [42, 84], [91, 89], [145, 92]],
    [[0, 0], [-22, -4], [-45, -5]],
    [[0, 0], [40, -5], [82, -10]],
    [[0, 0], [20, -10], [35, -20]],
    [[0, 0], [-60, 5], [-120, 24], [-180, 27]],
    [[0, 0], [65, -10], [125, -24], [180, -10]],
    ...districtRoads.map(road => road.map(point => [point.x, point.z]))
  ];

  return routes.some(route => {
    for (let i = 1; i < route.length; i++) {
      const [x1, z1] = route[i - 1];
      const [x2, z2] = route[i];
      const dx = x2 - x1;
      const dz = z2 - z1;
      const lengthSquared = dx * dx + dz * dz;
      const progress = lengthSquared === 0
        ? 0
        : THREE.MathUtils.clamp(((x - x1) * dx + (z - z1) * dz) / lengthSquared, 0, 1);
      if (Math.hypot(x - x1 - progress * dx, z - z1 - progress * dz) < clearance) {
        return true;
      }
    }
    return false;
  });
}

function createNPCs(scene) {
  const people = [
    { area: 'Thị trấn Yên Thành', dx: -23, dz: 8, color: 0x3c6580 },
    { area: 'Thị trấn Yên Thành', dx: 19, dz: 15, color: 0x815b43 },
    { area: 'Thị trấn Yên Thành', dx: 10, dz: -22, color: 0x56794e },
    { area: 'Hợp Thành', dx: -8, dz: 8, color: 0x6d597e },
    { area: 'Bảo Thành', dx: 10, dz: -7, color: 0x39716b },
    { area: 'Đồng Thành', dx: 9, dz: -7, color: 0x8a6d4d },
    { area: 'Đông Thành', dx: -7, dz: 8, color: 0x7d5550 },
    { area: 'Quang Thành', dx: 7, dz: 5, color: 0x526d7d },
    { area: 'Lăng Thành', dx: -5, dz: 5, color: 0x5c7951 },
    { area: 'Hồng Thành', dx: 6, dz: -5, color: 0x6b5b8a },
    { area: 'Mỹ Thành', dx: -6, dz: 7, color: 0x866148 },
    { area: 'Xuân Thành', dx: 5, dz: -5, color: 0x53756b },
    { area: 'Công Thành', dx: -6, dz: -5, color: 0x8a6253 },
    { area: 'Nhân Thành', dx: 5, dz: 6, color: 0x4e6f84 }
  ];
  const populatedAreas = new Set(people.map(person => person.area));
  const residentColors = [0x59744d, 0x805a46, 0x526d7d, 0x75634b];
  districtAreas.forEach((area, index) => {
    if (populatedAreas.has(area.name)) return;
    people.push({
      area: area.name,
      dx: 0,
      dz: -30,
      color: residentColors[index % residentColors.length]
    });
  });

  people.forEach((person, index) => {
    const area = districtAreas.find(candidate => candidate.name === person.area);
    const data = {
      x: area.x + person.dx,
      z: area.z + person.dz,
      range: 2.5 + index % 3,
      color: person.color
    };
    const npc = makeNPC(data.color, index);
    npc.position.set(data.x, 0, data.z);
    npc.userData = {
      originX: data.x,
      originZ: data.z,
      range: data.range,
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 0.55,
      angle: Math.random() * Math.PI * 2
    };
    scene.add(npc);
    animated.npcs.push(npc);
  });
}

function makeTree(scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32 * scale, 0.48 * scale, 4.8 * scale, 8),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
  );
  trunk.position.y = 2.4 * scale;
  trunk.castShadow = true;
  g.add(trunk);

  const leafPalette = [0x365f39, 0x426b3b, 0x587a42, 0x31583a];
  const leafMat = new THREE.MeshStandardMaterial({
    color: leafPalette[Math.floor(Math.random() * leafPalette.length)],
    roughness: 0.88
  });
  const l1 = new THREE.Mesh(new THREE.SphereGeometry(2.35 * scale, 10, 8), leafMat);
  l1.scale.set(1, 0.9, 0.95);
  l1.position.y = 5.8 * scale;
  l1.castShadow = true;
  g.add(l1);
  const l2 = new THREE.Mesh(new THREE.SphereGeometry(1.9 * scale, 9, 8), leafMat);
  l2.scale.set(1.05, 0.9, 0.92);
  l2.position.set(-1.45 * scale, 5.15 * scale, 0.7 * scale);
  l2.castShadow = true;
  g.add(l2);
  const l3 = new THREE.Mesh(new THREE.SphereGeometry(1.8 * scale, 9, 8), leafMat);
  l3.scale.set(0.95, 1.05, 0.9);
  l3.position.set(1.3 * scale, 5.4 * scale, -0.6 * scale);
  l3.castShadow = true;
  g.add(l3);
  const l4 = new THREE.Mesh(new THREE.SphereGeometry(1.45 * scale, 8, 7), leafMat);
  l4.scale.set(1, 0.92, 0.85);
  l4.position.set(-0.2 * scale, 6.9 * scale, -0.9 * scale);
  g.add(l4);
  return g;
}

function makeBench() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x92400e });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.28, 0.95), wood);
  seat.position.y = 0.75;
  g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.95, 0.22), wood);
  back.position.set(0, 1.25, -0.38);
  g.add(back);
  [-1.4, 1.4].forEach(x => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.75, 0.22), wood);
    leg.position.set(x, 0.38, 0.28);
    g.add(leg);
    const leg2 = leg.clone();
    leg2.position.z = -0.28;
    g.add(leg2);
  });
  return g;
}

function makeSheep() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.88 })
  );
  body.scale.set(1.4, 1, 1.15);
  body.position.y = 1.35;
  body.castShadow = true;
  g.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.58, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x1e293b })
  );
  head.position.set(1.35, 1.6, 0);
  g.add(head);

  const legMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
  [[-0.55, 0.55], [0.55, 0.55], [-0.55, -0.55], [0.55, -0.55]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.15, 6), legMat);
    leg.position.set(x, 0.58, z);
    g.add(leg);
  });
  return g;
}

function makeNPC(color, variation = 0) {
  const g = new THREE.Group();
  const skinTones = [0xb97859, 0xc98e69, 0xa96f52, 0xd09a74];
  const skin = new THREE.MeshStandardMaterial({
    color: skinTones[variation % skinTones.length],
    roughness: 0.92
  });
  const cloth = new THREE.MeshStandardMaterial({ color, roughness: 0.88 });
  const trousers = new THREE.MeshStandardMaterial({
    color: [0x303b43, 0x4c4940, 0x374b40][variation % 3],
    roughness: 0.94
  });
  const hair = new THREE.MeshStandardMaterial({ color: 0x211d19, roughness: 0.98 });
  const shoes = new THREE.MeshStandardMaterial({ color: 0x292724, roughness: 0.92 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.72, 5, 10), cloth);
  torso.position.y = 1.72;
  torso.castShadow = true;
  g.add(torso);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.32, 8), skin);
  neck.position.y = 2.35;
  g.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.37, 16, 12), skin);
  head.position.y = 2.77;
  head.castShadow = true;
  g.add(head);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.385, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hair
  );
  hairCap.position.y = 2.9;
  g.add(hairCap);
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), hair);
  hairBack.scale.set(1, 0.6, 0.7);
  hairBack.position.set(0, 2.67, -0.22);
  g.add(hairBack);

  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x211b17, roughness: 0.8 });
  [-0.13, 0.13].forEach(eyeX => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), eyeMaterial);
    eye.position.set(eyeX, 2.8, 0.33);
    g.add(eye);
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), skin);
  nose.scale.set(0.68, 0.8, 0.7);
  nose.position.set(0, 2.68, 0.37);
  g.add(nose);

  const armMeshes = [];
  const legMeshes = [];
  [-1, 1].forEach(side => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.56, 2.08, 0);
    arm.rotation.z = side * -0.12;
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.52, 4, 8), cloth);
    sleeve.position.y = -0.26;
    sleeve.castShadow = true;
    arm.add(sleeve);
    g.add(arm);
    armMeshes.push(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), skin);
    hand.position.set(side * 0.02, -0.7, 0.02);
    arm.add(hand);

    const leg = new THREE.Group();
    leg.position.set(side * 0.2, 0.98, 0);
    const trousersLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.55, 4, 8), trousers);
    trousersLeg.position.y = -0.3;
    trousersLeg.castShadow = true;
    leg.add(trousersLeg);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.48), shoes);
    shoe.position.set(0, -0.85, 0.09);
    leg.add(shoe);
    g.add(leg);
    legMeshes.push(leg);
  });

  g.userData.armMeshes = armMeshes;
  g.userData.legMeshes = legMeshes;
  return g;
}

export function getTrafficSignalState(axis) {
  return animated.trafficSignal[axis] || 'red';
}

export function updateWorld(time, delta) {
  const phaseTime = time % 24;
  animated.trafficSignal.northSouth = phaseTime < 9 ? 'green' : phaseTime < 11 ? 'yellow' : 'red';
  animated.trafficSignal.eastWest = phaseTime < 12
    ? 'red'
    : phaseTime < 21
      ? 'green'
      : phaseTime < 23
        ? 'yellow'
        : 'red';
  animated.trafficSignals.forEach(signal => {
    const activeColor = animated.trafficSignal[signal.userData.axis];
    Object.entries(signal.userData.lamps).forEach(([name, lamp]) => {
      const active = name === activeColor;
      lamp.material.color.setHex(active ? lamp.color : 0x303637);
      lamp.material.emissive.setHex(active ? lamp.emissive : 0x090c0c);
      lamp.material.emissiveIntensity = active ? 0.9 : 0.04;
    });
  });

  if (animated.water) {
    animated.water.position.y = 0.18 + Math.sin(time * 1.5) * 0.08;
    animated.water.material.opacity = 0.82 + Math.sin(time * 2) * 0.06;
  }

  animated.sheep.forEach(s => {
    const d = s.userData;
    s.position.x = d.baseX + Math.sin(time * d.speed + d.phase) * 4;
    s.position.z = d.baseZ + Math.cos(time * d.speed * 0.8 + d.phase) * 4;
    s.rotation.y = Math.atan2(
      Math.cos(time * d.speed + d.phase),
      -Math.sin(time * d.speed * 0.8 + d.phase)
    );
  });

  animated.npcs.forEach(npc => {
    const d = npc.userData;
    d.angle += d.speed * delta * 0.25;
    npc.position.x = d.originX + Math.cos(d.angle) * d.range;
    npc.position.z = d.originZ + Math.sin(d.angle) * d.range;
    npc.position.y = Math.abs(Math.sin(time * 2 + d.phase)) * 0.04;
    npc.rotation.y = -d.angle + Math.PI / 2;
  });

  animated.schoolStudents.forEach(({ npc, x, z, phase, speed, rangeX, rangeZ }) => {
    const runTime = time * speed + phase;
    npc.position.x = x + Math.cos(runTime) * rangeX;
    npc.position.z = z + Math.sin(runTime) * rangeZ;
    npc.position.y = Math.abs(Math.sin(runTime * 3)) * 0.14;
    npc.rotation.y = Math.atan2(-Math.sin(runTime) * rangeX, Math.cos(runTime) * rangeZ);
    const stride = Math.sin(runTime * 5) * 0.62;
    npc.userData.armMeshes.forEach((arm, index) => {
      arm.rotation.x = index === 0 ? stride : -stride;
      arm.rotation.z = (index === 0 ? -1 : 1) * (0.12 + Math.abs(stride) * 0.1);
    });
    npc.userData.legMeshes.forEach((leg, index) => {
      leg.rotation.x = index === 0 ? -stride : stride;
    });
  });
  if (animated.schoolVolleyBall) {
    animated.schoolVolleyBall.position.y = 1.2 + Math.abs(Math.sin(time * 2.4)) * 2.2;
  }

  animated.traffic.forEach(vehicle => {
    vehicle.progress += vehicle.direction * vehicle.speed * delta / vehicle.length;
    if (vehicle.progress >= 1) {
      vehicle.progress = 2 - vehicle.progress;
      vehicle.direction = -1;
    } else if (vehicle.progress <= 0) {
      vehicle.progress = -vehicle.progress;
      vehicle.direction = 1;
    }
    const point = vehicle.curve.getPointAt(vehicle.progress);
    const tangent = vehicle.curve.getTangentAt(vehicle.progress).multiplyScalar(vehicle.direction);
    const sideX = tangent.z;
    const sideZ = -tangent.x;
    const x = point.x + sideX * vehicle.offset;
    const z = point.z + sideZ * vehicle.offset;
    vehicle.group.position.set(x, roadHeightAt(x, z), z);
    vehicle.group.rotation.y = Math.atan2(tangent.x, tangent.z);
    vehicle.wheels.forEach(wheel => {
      wheel.rotation.x -= vehicle.speed * delta / 0.48;
    });
  });

  animated.scooters.forEach(scooter => {
    if (!scooter.userData.occupied) return;
    scooter.userData.wheels.forEach(wheel => {
      wheel.rotation.x -= scooter.userData.speed * delta / 0.42;
    });
  });
}
