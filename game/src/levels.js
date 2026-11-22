// The three rooms of the heist, hand-placed: walls, display cases, guards on
// patrol, sweeping cameras, loot and the getaway door. Every room offers more
// than one route to the prize: around the top of a partition, under it, or
// straight through the middle while a cone sweeps away.

function wall(x, y, w, h) {
  return { x, y, w, h };
}

function borderWalls() {
  return [
    wall(0, 64, 1280, 16),
    wall(0, 704, 1280, 16),
    wall(0, 64, 16, 656),
    wall(1264, 64, 16, 656),
  ];
}

export const LEVELS = [
  {
    name: 'Galeri Batik',
    subtitle: 'Ruang pameran kain — dua penjaga, satu kamera.',
    start: { x: 80, y: 620 },
    exit: { x: 1150, y: 630, w: 70, h: 56 },
    emerald: { x: 1000, y: 130, label: 'Zamrud Garuda' },
    gems: [
      { x: 250, y: 150 },
      { x: 560, y: 600 },
      { x: 900, y: 500 },
      { x: 1150, y: 200 },
    ],
    walls: [
      ...borderWalls(),
      wall(420, 180, 16, 300),
      wall(840, 240, 16, 300),
      wall(600, 150, 160, 80),
      wall(950, 420, 140, 70),
    ],
    guards: [
      { waypoints: [[300, 250], [300, 580]], name: 'Pak Darma' },
      { waypoints: [[620, 120], [1080, 120]], name: 'Bu Sari' },
    ],
    cameras: [{ x: 300, y: 80, base: Math.PI / 2, sweep: 0.9 }],
    coverWaypoints: [[200, 620], [560, 600], [560, 520], [560, 380], [700, 380]],
    winWaypoints: [[200, 620], [520, 620], [520, 520], [520, 380], [700, 260], [1000, 130], [1150, 200], [1185, 658]],
  },
  {
    name: 'Ruang Pusaka',
    subtitle: 'Keris dan mahkota — tiga penjaga, dua kamera.',
    start: { x: 80, y: 620 },
    exit: { x: 1180, y: 620, w: 70, h: 56 },
    emerald: { x: 640, y: 440, label: 'Mahkota Pusaka' },
    gems: [
      { x: 200, y: 150 },
      { x: 640, y: 130 },
      { x: 1100, y: 150 },
      { x: 200, y: 620 },
      { x: 1100, y: 620 },
    ],
    walls: [
      ...borderWalls(),
      wall(320, 180, 16, 360),
      wall(960, 180, 16, 360),
      wall(480, 200, 320, 16),
      wall(480, 500, 320, 16),
      wall(580, 300, 120, 90),
    ],
    guards: [
      { waypoints: [[180, 250], [180, 580]], name: 'Pak Darma' },
      { waypoints: [[480, 140], [800, 140]], name: 'Bu Sari' },
      { waypoints: [[1100, 250], [1100, 580]], name: 'Mas Joko' },
    ],
    cameras: [
      { x: 180, y: 80, base: Math.PI / 2, sweep: 0.8 },
      { x: 1100, y: 80, base: Math.PI / 2, sweep: 0.8 },
    ],
    coverWaypoints: [[250, 620], [250, 150], [430, 150], [430, 420], [640, 440], [430, 440], [430, 620]],
    winWaypoints: [[250, 620], [250, 150], [430, 150], [430, 420], [640, 440], [430, 440], [430, 620], [1215, 648]],
  },
  {
    name: 'Brankas Garuda',
    subtitle: 'Ruang brankas — penjaga di dalam, kamera di mana-mana.',
    start: { x: 80, y: 120 },
    exit: { x: 1180, y: 630, w: 70, h: 56 },
    emerald: { x: 1120, y: 180, label: 'Zamrud Garuda' },
    gems: [
      { x: 250, y: 150 },
      { x: 700, y: 620 },
      { x: 1100, y: 620 },
      { x: 250, y: 620 },
      { x: 700, y: 150 },
    ],
    walls: [
      ...borderWalls(),
      wall(880, 80, 16, 130),
      wall(880, 260, 16, 60),
      wall(880, 320, 120, 16),
      wall(1050, 320, 214, 16),
      wall(420, 200, 16, 320),
      wall(560, 480, 300, 16),
      wall(600, 150, 140, 70),
      wall(140, 420, 90, 70),
    ],
    guards: [
      { waypoints: [[330, 300], [330, 600]], name: 'Pak Darma' },
      { waypoints: [[700, 250], [700, 420]], name: 'Bu Sari' },
      { waypoints: [[1000, 140], [1180, 140]], name: 'Mas Joko' },
    ],
    cameras: [
      { x: 480, y: 80, base: Math.PI / 2, sweep: 0.8 },
      { x: 880, y: 80, base: Math.PI * 0.75, sweep: 0.7 },
      { x: 640, y: 704, base: -Math.PI / 2, sweep: 0.8 },
    ],
    coverWaypoints: [[80, 300], [300, 300], [300, 650], [500, 650], [500, 420], [600, 420]],
    winWaypoints: [[80, 300], [300, 300], [300, 650], [500, 650], [500, 200], [850, 235], [1025, 235], [1120, 180], [1025, 235], [850, 235], [850, 460], [1180, 460], [1215, 658]],
  },
];
