// Every tuning number and colour for Malam di Museum Garuda, in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720, hudHeight: 64 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 14,
  walkSpeed: 205,
  sneakSpeed: 105,
  /** While sneaking, a guard or camera only notices the thief at this fraction of its range. */
  sneakVisibility: 0.55,
};

export const GUARD = {
  radius: 15,
  patrolSpeed: 72,
  investigateSpeed: 110,
  chaseSpeed: 138,
  viewRange: 225,
  viewHalfAngle: 0.61, // about 35 degrees each side
  catchDistance: 26,
  /** Alarm points a second while a guard has the thief in sight. */
  spotRate: 55,
  /** Alarm at which a guard leaves patrol and investigates the last seen spot. */
  suspiciousAt: 25,
  /** Alarm at which a guard runs at the thief instead of investigating. */
  chaseAt: 55,
};

export const CAMERA = {
  viewRange: 265,
  viewHalfAngle: 0.44, // about 25 degrees each side
  spotRate: 40,
  sweepSpeed: 0.55, // radians a second, sinusoidal
};

export const ALARM = {
  max: 100,
  /** Points a second the alarm falls while nobody sees the thief. */
  decay: 20,
  /** Caught the moment the meter fills. */
  caughtAt: 100,
};

export const LOOT = { gemValue: 100, emeraldValue: 500, levelBonus: 200 };

export const TOOLS = {
  coin: { uses: 3, cost: 25, lureRadius: 280, investigateSeconds: 3.5 },
  smoke: { uses: 2, cost: 50, radius: 95, seconds: 4 },
};

export const LEVELS = 3;

/** Score shown to the player is plain points; the fiction calls them rupiah in the HUD. */
export const BEST_KEY = 'garuda-night-heist.best';

export const PALETTE = {
  backdrop: '#0a0d16',
  floorA: '#171d2e',
  floorB: '#141a29',
  carpet: '#7a1f2b',
  carpetEdge: '#c9a227',
  wall: '#2c3350',
  wallTop: '#3d4666',
  wallTrim: '#c9a227',
  caseGlass: '#9fd8e8',
  caseBase: '#232a42',
  text: '#f2ead8',
  muted: '#9aa3b8',
  gold: '#f2c94c',
  emerald: '#35e0a1',
  gem: '#7dd3fc',
  guard: '#4a5d8a',
  guardCap: '#2e3a5c',
  guardAlert: '#e5534b',
  camera: '#8b93a3',
  cameraEye: '#ff5a4e',
  thief: '#1c2733',
  thiefScarf: '#2ec4b6',
  exit: '#35e0a1',
  exitLocked: '#5a6274',
  cone: 'rgba(242, 201, 76, 0.16)',
  coneEdge: 'rgba(242, 201, 76, 0.45)',
  coneAlert: 'rgba(229, 83, 75, 0.22)',
  coneAlertEdge: 'rgba(229, 83, 75, 0.6)',
  smoke: 'rgba(180, 190, 205, 0.55)',
  panel: '#1a2033',
  panelEdge: '#c9a227',
  danger: '#e5534b',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
