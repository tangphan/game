const MAP_SCALE = 2.1;
const mapCoordinates = (imageX, imageY) => ({
  x: (imageX - 456) * MAP_SCALE,
  z: (imageY - 446) * MAP_SCALE
});

const landmarkByArea = {
  'Thị trấn Yên Thành': 'Đền Rẫy (Đền Trung); công viên hồ sinh thái trung tâm',
  'Hợp Thành': 'Nhà thờ Giáo họ Hợp Thành; chợ Hợp Thành; đình làng',
  'Bảo Thành': 'Nhà thờ đá Bảo Nham; lèn đá Bảo Nham và Hang đá Đức Mẹ Lộ Đức',
  'Bắc Thành': 'Khu sinh thái Rú Gám; Thiền viện Trúc Lâm Yên Thành',
  'Công Thành': 'Đền Đức Hoàng; chùa Gám (Xuân Lục Tự)',
  'Đô Thành': 'Làng Phú Vinh; khu phố thương mại và làng nghề',
  'Đại Thành': 'Đường làng, vườn cây và cánh đồng phía nam',
  'Đông Thành': 'Hồ chứa nước Đông Thành; vùng lúa chất lượng cao',
  'Đồng Thành': 'Đập Vệ Vừng; hồ sinh thái và điểm cắm trại',
  'Đức Thành': 'Lèn đá vôi Đức Thành; hang động tự nhiên',
  'Hậu Thành': 'Đình làng Hậu Thành; nhà thờ các dòng họ cổ',
  'Hòa Thành': 'Cánh đồng lúa và những vườn cây ven xóm',
  'Hoa Thành': 'Chùa Lập Thạch; cánh đồng và kênh thủy lợi sông Dinh',
  'Hồng Thành': 'Nhà thờ Giáo xứ Hồng Thành; cống sông Bùng',
  'Hùng Thành': 'Rừng phòng hộ Hùng Thành; hồ đập sinh thái',
  'Khánh Thành': 'Đền Cả Khánh Thành; bãi ven sông Dinh',
  'Kim Thành': 'Đồi chè Kim Thành; hồ đập sinh thái',
  'Lăng Thành': 'Đền Lăng Thành (Đền Hữu); núi Lăng',
  'Liên Thành': 'Chợ Vãng; dòng sông Bùng',
  'Long Thành': 'Đình Long Thành; cánh đồng lúa',
  'Lý Thành': 'Đồi lâm nghiệp; vườn cây ăn trái và hồ thủy lợi',
  'Mã Thành': 'Lèn đá Mã Thành; trang trại sinh thái',
  'Minh Thành': 'Khu tâm linh Đền Chùa Minh Thành; rừng bán sơn địa',
  'Mỹ Thành': 'Đền Bạch Ma; đồi thông Mỹ Thành',
  'Nam Thành': 'Làng nghề truyền thống; đình làng Nam Thành',
  'Nhân Thành': 'Nhà thờ Giáo xứ Nhân Thành; cánh đồng lúa',
  'Phú Thành': 'Đền Phú Thành; bãi lúa công nghệ cao',
  'Phúc Thành': 'Cầu Bến Hàng; Rừng Trập Dọc; đền Phúc Thành',
  'Quang Thành': 'Hồ Sông Sào; đồi cây công nghiệp',
  'Sơn Thành': 'Nhà thờ Giáo xứ Sơn Thành; làng nông thôn mới',
  'Tăng Thành': 'Đền Tăng Thành; sông Dinh',
  'Tân Thành': 'Đồi gò sinh thái; trang trại tổng hợp',
  'Tây Thành': 'Hồ chứa nước Tây Thành; rừng trồng bán sơn địa',
  'Thịnh Thành': 'Căn cứ cách mạng; đền Cổ Thịnh Thành',
  'Thọ Thành': 'Chợ Thọ Thành; đền Thọ Thành',
  'Tiến Thành': 'Vùng cao Tiến Thành; trang trại cây ăn quả',
  'Trung Thành': 'Chùa Trung Thành; đình làng',
  'Văn Thành': 'Đền Văn Thành; hệ thống kênh tưới Đập Bavia',
  'Viên Thành': 'Cống Viên Thành; làng nghề bánh đa vừng',
  'Vĩnh Thành': 'Nhà thờ Giáo xứ Vĩnh Thành; đình Vĩnh Thành',
  'Xuân Thành': 'Đền Xuân Thành; bãi bồi trồng ngô ven sông'
};

const townCenter = mapCoordinates(456, 446);
const dongThanhCenter = mapCoordinates(310, 391);
const baoThanhCenter = mapCoordinates(386, 505);

// Dữ liệu các khu vực khám phá
export const zones = [
  {
    id: 'school',
    name: 'THPT Phan Đăng Lưu',
    x: townCenter.x - 180,
    z: townCenter.z - 35,
    w: 210,
    d: 200,
    desc: 'Trường THPT Phan Đăng Lưu nằm trong thị trấn Yên Thành. Khuôn viên rộng có khối lớp học chính, phòng bảo vệ, nhà xe, sân bóng, cây dừa ven tường và các thầy cô thân thiện.'
  },
  {
    id: 'football',
    name: 'Sân bóng Phong Liên',
    x: townCenter.x + 180,
    z: townCenter.z - 35,
    w: 76,
    d: 60,
    desc: 'Sân bóng Phong Liên thuộc thị trấn Yên Thành, có khán đài nhỏ, đường biên và khung thành lưới. Tiếng cổ vũ thường vang lên vào những buổi chiều.'
  },
  {
    id: 'river',
    name: 'Sông Dinh',
    x: 0,
    z: 55,
    w: 200,
    d: 40,
    desc: 'Sông Dinh lấp lánh giữa bờ lau và bãi đá. Cây cầu gỗ nhỏ là nơi ngắm dòng nước và nghe tiếng chim ven sông.'
  },
  {
    id: 'dam',
    name: 'Đập Vệ Vừng',
    x: mapCoordinates(335, 400).x,
    z: mapCoordinates(335, 400).z,
    w: 74,
    d: 72,
    desc: 'Đập Vệ Vừng nằm ở xã Đồng Thành, với mặt hồ, tuyến đập và nhà vận hành. Đây là điểm dã ngoại bên hồ giữa vùng đồi xanh.'
  },
  {
    id: 'sheep',
    name: 'Trại cừu Bảo Thành',
    x: baoThanhCenter.x - 16,
    z: baoThanhCenter.z + 27,
    w: 82,
    d: 82,
    desc: 'Trại cừu ở xã Bảo Thành, gần danh thắng Lèn đá Bảo Nham và nhà thờ đá Bảo Nham.'
  },
  {
    id: 'rice',
    name: 'Cánh đồng lúa Yên Thành',
    x: -145,
    z: -82,
    w: 55,
    d: 55,
    desc: 'Những thửa ruộng nước phản chiếu trời chiều, lúa non mọc thành hàng thẳng tắp. Bờ ruộng dẫn tới con đường làng.'
  },
  {
    id: 'village',
    name: 'Xóm quê Yên Thành',
    x: 145,
    z: 92,
    w: 55,
    d: 55,
    desc: 'Một góc xóm quê yên bình với mái ngói cũ, vườn rau và bóng cây trước hiên nhà.'
  },
  {
    id: 'shrine',
    name: 'Đình làng',
    x: 145,
    z: -145,
    w: 55,
    d: 55,
    desc: 'Ngôi đình nhỏ nép bên đường làng, nền đá và mái ngói nâu gợi nhớ kiến trúc truyền thống.'
  }
];

const mapPoint = (name, imageX, imageY) => ({
  name,
  ...mapCoordinates(imageX, imageY),
  w: name === 'Thị trấn Yên Thành' ? 125 : 88,
  d: name === 'Thị trấn Yên Thành' ? 125 : 82,
  landmark: landmarkByArea[name] || ''
});

export const districtAreas = [
  mapPoint('Tây Thành', 103, 360),
  mapPoint('Quang Thành', 200, 310),
  mapPoint('Kim Thành', 294, 260),
  mapPoint('Lăng Thành', 335, 150),
  mapPoint('Tiến Thành', 442, 140),
  mapPoint('Hùng Thành', 408, 251),
  mapPoint('Tân Thành', 561, 112),
  mapPoint('Đức Thành', 646, 195),
  mapPoint('Đô Thành', 704, 280),
  mapPoint('Thọ Thành', 635, 301),
  mapPoint('Mã Thành', 570, 244),
  mapPoint('Hậu Thành', 490, 325),
  mapPoint('Phúc Thành', 427, 349),
  mapPoint('Hồng Thành', 599, 336),
  mapPoint('Phú Thành', 570, 375),
  mapPoint('Đông Thành', 310, 391),
  mapPoint('Văn Thành', 463, 410),
  mapPoint('Tăng Thành', 408, 426),
  mapPoint('Thị trấn Yên Thành', 456, 446),
  mapPoint('Hòa Thành', 506, 443),
  mapPoint('Hợp Thành', 580, 434),
  mapPoint('Xuân Thành', 397, 461),
  mapPoint('Đồng Thành', 335, 400),
  mapPoint('Bắc Thành', 384, 607),
  mapPoint('Hoa Thành', 482, 580),
  mapPoint('Bảo Thành', 386, 505),
  mapPoint('Nhân Thành', 548, 501),
  mapPoint('Trung Thành', 320, 518),
  mapPoint('Minh Thành', 236, 562),
  mapPoint('Lý Thành', 330, 574),
  mapPoint('Nam Thành', 409, 563),
  mapPoint('Long Thành', 477, 549),
  mapPoint('Vĩnh Thành', 545, 587),
  mapPoint('Đại Thành', 249, 633),
  mapPoint('Liên Thành', 365, 617),
  mapPoint('Khánh Thành', 454, 620),
  mapPoint('Viên Thành', 547, 647),
  mapPoint('Mỹ Thành', 300, 680),
  mapPoint('Công Thành', 394, 674),
  mapPoint('Sơn Thành', 518, 700)
];

const districtAt = name => districtAreas.find(area => area.name === name);
const dongThanhArea = districtAt('Đồng Thành');
const baoThanhArea = districtAt('Bảo Thành');
const phucThanhArea = districtAt('Phúc Thành');
const schoolZone = zones.find(zone => zone.id === 'school');

const minimumAreaSpacing = 155;
for (let pass = 0; pass < 100; pass++) {
  for (let first = 0; first < districtAreas.length; first++) {
    for (let second = first + 1; second < districtAreas.length; second++) {
      const a = districtAreas[first];
      const b = districtAreas[second];
      let dx = b.x - a.x;
      let dz = b.z - a.z;
      const distance = Math.hypot(dx, dz);
      const requiredSpacing =
        a.name === 'Thị trấn Yên Thành' || b.name === 'Thị trấn Yên Thành'
          ? 300
          : minimumAreaSpacing;
      if (distance >= requiredSpacing) continue;

      if (distance < 0.001) {
        dx = 1;
      }
      const directionX = dx / Math.max(distance, 0.001);
      const directionZ = dz / Math.max(distance, 0.001);
      const displacement = (requiredSpacing - distance) * 0.51;
      const aIsTown = a.name === 'Thị trấn Yên Thành';
      const bIsTown = b.name === 'Thị trấn Yên Thành';

      if (aIsTown) {
        b.x += directionX * displacement * 2;
        b.z += directionZ * displacement * 2;
      } else if (bIsTown) {
        a.x -= directionX * displacement * 2;
        a.z -= directionZ * displacement * 2;
      } else {
        a.x -= directionX * displacement;
        a.z -= directionZ * displacement;
        b.x += directionX * displacement;
        b.z += directionZ * displacement;
      }
    }
  }
}

zones.find(zone => zone.id === 'dam').x = dongThanhArea.x;
zones.find(zone => zone.id === 'dam').z = dongThanhArea.z;
zones.find(zone => zone.id === 'sheep').x = baoThanhArea.x - 16;
zones.find(zone => zone.id === 'sheep').z = baoThanhArea.z + 27;
zones.find(zone => zone.id === 'rice').x = districtAt('Long Thành').x;
zones.find(zone => zone.id === 'rice').z = districtAt('Long Thành').z;
zones.find(zone => zone.id === 'village').x = districtAt('Hợp Thành').x;
zones.find(zone => zone.id === 'village').z = districtAt('Hợp Thành').z;
zones.find(zone => zone.id === 'shrine').x = districtAt('Hậu Thành').x;
zones.find(zone => zone.id === 'shrine').z = districtAt('Hậu Thành').z;

export const districtRoads = [];
[
  districtAreas.filter(area => area.z < 55),
  districtAreas.filter(area => area.z >= 55)
].forEach(areas => {
  if (areas.length < 2) return;
  const connected = new Set([areas[0]]);
  const unconnected = new Set(areas.slice(1));

  while (unconnected.size > 0) {
    let closestPair = null;
    let closestDistance = Infinity;
    connected.forEach(from => {
      unconnected.forEach(to => {
        const distance = Math.hypot(to.x - from.x, to.z - from.z);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPair = { from, to };
        }
      });
    });

    const { from, to } = closestPair;
    districtRoads.push([
      from,
      { x: (from.x + to.x) / 2, z: (from.z + to.z) / 2 },
      to
    ]);
    connected.add(to);
    unconnected.delete(to);
  }

  const hub = areas.reduce((closest, area) =>
    Math.abs(area.x) < Math.abs(closest.x) ? area : closest
  );
  districtRoads.push([hub, { x: 0, z: hub.z }]);
});

export const interactables = [
  {
    pos: { x: schoolZone.x, y: 0, z: schoolZone.z + 62 },
    radius: 14,
    text: 'Cổng trường THPT Phan Đăng Lưu ở thị trấn Yên Thành. Bên trong là khuôn viên rộng với sáu tòa nhà và sân trường rợp bóng cây.'
  },
  {
    pos: { x: schoolZone.x, y: 0, z: schoolZone.z - 25 },
    radius: 11,
    text: 'Lá cờ đỏ sao vàng tung bay giữa sân trường. Đây là nơi học sinh tập trung trong lễ chào cờ đầu tuần.'
  },
  {
    pos: { x: schoolZone.x, y: 0, z: schoolZone.z - 4 },
    radius: 12,
    text: 'Đài phun nước nằm giữa sân trường. Những bồn hoa hai bên tạo thành góc nghỉ mát yên bình dưới bóng cây.'
  },
  {
    pos: { x: schoolZone.x - 24, y: 0, z: schoolZone.z + 22 },
    radius: 18,
    text: 'Sân bóng đá trong trường có khung thành và vạch sân rõ ràng, là nơi các lớp tập luyện sau giờ học.'
  },
  {
    pos: { x: schoolZone.x + 34, y: 0, z: schoolZone.z + 24 },
    radius: 14,
    text: 'Sân bóng chuyền của trường có lưới và vạch kẻ riêng. Đây là điểm hẹn cho những trận đấu giao hữu giờ ra chơi.'
  },
  {
    pos: { x: schoolZone.x - 22, y: 0, z: schoolZone.z - 9 },
    radius: 10,
    text: 'Vườn hoa nhỏ được chăm sóc dọc lối đi giữa các dãy lớp học.'
  },
  {
    pos: { x: zones.find(zone => zone.id === 'football').x, y: 0, z: zones.find(zone => zone.id === 'football').z },
    radius: 20,
    text: 'Sân bóng Phong Liên ở thị trấn Yên Thành. Một nhóm thanh niên đang đá bóng, tiếng cười nói vang vọng.'
  },
  {
    pos: { x: 0, y: 0, z: 55 },
    radius: 25,
    text: 'Cầu gỗ ven sông Dinh. Từ lan can, bạn có thể ngắm dòng nước trôi qua những bụi lau và bãi đá. Bác câu cá gần đó mỉm cười: “Hôm nay cá cắn câu khá đấy cháu ạ.”'
  },
  {
    pos: { x: dongThanhArea.x, y: 0, z: dongThanhArea.z },
    radius: 20,
    text: 'Đập Vệ Vừng ở xã Đồng Thành. Hồ nước nhân tạo rộng, thích hợp ngắm cảnh và dã ngoại bên hồ.'
  },
  {
    pos: { x: baoThanhArea.x - 16, y: 0, z: baoThanhArea.z + 27 },
    radius: 14,
    text: 'Trại cừu Bảo Thành. Chú bảo vệ mỉm cười: “Cừu ở đây rất hiền, đi nhẹ thôi kẻo chúng sợ.”'
  },
  {
    pos: { x: baoThanhArea.x, y: 0, z: baoThanhArea.z + 35 },
    radius: 14,
    text: 'Một đàn cừu đang gặm cỏ. Con cừu trắng to nhất nhìn bạn và kêu “beeee~”.'
  },
  {
    pos: { x: phucThanhArea.x + 52, y: 0, z: phucThanhArea.z + 20 },
    radius: 24,
    text: 'Cầu Bến Hàng ở Phúc Thành. Người dân dựng những quầy hàng nhỏ bên cầu, bán rau quả và thức ăn quê.'
  },
  {
    pos: { x: zones.find(zone => zone.id === 'rice').x, y: 0, z: zones.find(zone => zone.id === 'rice').z },
    radius: 24,
    text: 'Bờ ruộng Yên Thành. Những hàng lúa non xanh mướt đang lớn lên trên mặt ruộng còn đọng nước.'
  },
  {
    pos: { x: zones.find(zone => zone.id === 'village').x, y: 0, z: zones.find(zone => zone.id === 'village').z },
    radius: 24,
    text: 'Hiên nhà trong xóm. Vườn rau nhỏ và bóng cây là nơi người dân nghỉ ngơi sau một ngày làm đồng.'
  },
  {
    pos: { x: zones.find(zone => zone.id === 'shrine').x, y: 0, z: zones.find(zone => zone.id === 'shrine').z },
    radius: 24,
    text: 'Đình làng Yên Thành. Nền đá vững chãi và mái ngói trầm màu là điểm dừng chân yên tĩnh bên đường quê.'
  },
  ...districtAreas
    .filter(area => area.landmark)
    .map(area => ({
      pos: { x: area.x - 42, y: 0, z: area.z + 18 },
      radius: 11,
      text: `${area.name === 'Thị trấn Yên Thành' ? 'Thị trấn' : `Xã ${area.name}`} — ${area.landmark}.`
    }))
];

export function getCurrentZone(position) {
  for (const z of zones) {
    if (
      position.x > z.x - z.w / 2 &&
      position.x < z.x + z.w / 2 &&
      position.z > z.z - z.d / 2 &&
      position.z < z.z + z.d / 2
    ) {
      return z;
    }
  }
  const district = districtAreas
    .filter(area =>
      Math.abs(position.x - area.x) < area.w / 2 &&
      Math.abs(position.z - area.z) < area.d / 2
    )
    .reduce((nearest, area) =>
      !nearest || Math.hypot(position.x - area.x, position.z - area.z) <
        Math.hypot(position.x - nearest.x, position.z - nearest.z)
        ? area
        : nearest,
    null);
  if (district) {
    const areaName = district.name === 'Thị trấn Yên Thành'
      ? district.name
      : `Xã ${district.name}`;
    return {
      name: areaName,
      desc: district.landmark
        ? `Khám phá ${district.landmark}. Đường liên xã nối khu dân cư, nhà vườn và đồng ruộng quanh ${district.name}.`
        : `Khu dân cư ${district.name} với nhà vườn, quầy nông sản và những thửa ruộng được nối với đường liên xã.`
    };
  }
  return {
    name: 'Vùng nông thôn Yên Thành',
    desc: 'Cánh đồng lúa và đường làng yên bình của huyện Yên Thành.'
  };
}
