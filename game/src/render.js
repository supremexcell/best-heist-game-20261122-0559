// Drawing only: the world's state and the current screen in, pixels out. The
// 1280x720 playfield is scaled to fit the window and centred, the margin
// filled with the backdrop colour. All art is procedural canvas shapes: a
// night museum in deep blue and gold, red carpet, glass cases, amber vision
// cones and a glowing emerald. Text that holds a number is rebuilt only when
// the number changes, so a frame allocates nothing.

import { FIELD, FONT, PALETTE } from './config.js';
import { GUARD_CHASE, GUARD_INVESTIGATE } from './guards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_LEVEL = 'level';
export const SCREEN_WON = 'won';

const PANEL = { width: 640, top: 150, line: 32, bottom: 76 };

function cachedLabel(prefix) {
  let value = null;
  let text = '';
  return function label(next) {
    if (next !== value) {
      value = next;
      text = prefix + next;
    }
    return text;
  };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const scoreLabel = cachedLabel('LOOT ');
  const alarmLabel = cachedLabel('');
  const bestLabel = cachedLabel('Terbaik ');
  const finalLabel = cachedLabel('LOOT ');
  const toolsLabel = cachedLabel('');

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function drawFloor() {
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 16; col += 1) {
        context.fillStyle = (row + col) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
        context.fillRect(col * 80, 64 + row * 72, 80, 72);
      }
    }
    context.fillStyle = PALETTE.carpet;
    context.fillRect(0, 660, FIELD.width, 40);
    context.fillStyle = PALETTE.carpetEdge;
    context.fillRect(0, 660, FIELD.width, 3);
    context.fillRect(0, 697, FIELD.width, 3);
  }

  function drawWalls(walls) {
    for (let index = 0; index < walls.length; index += 1) {
      const rect = walls[index];
      context.fillStyle = PALETTE.wall;
      context.fillRect(rect.x, rect.y, rect.w, rect.h);
      context.fillStyle = PALETTE.wallTop;
      context.fillRect(rect.x, rect.y, rect.w, 4);
      context.fillStyle = PALETTE.wallTrim;
      if (rect.h >= 16 && rect.w >= 16) context.fillRect(rect.x, rect.y + rect.h - 3, rect.w, 3);
    }
  }

  function drawCase(x, y, w, h) {
    context.fillStyle = PALETTE.caseBase;
    context.fillRect(x, y, w, h);
    context.fillStyle = 'rgba(159, 216, 232, 0.25)';
    context.fillRect(x + 4, y + 4, w - 8, h - 8);
    context.strokeStyle = PALETTE.caseGlass;
    context.lineWidth = 2;
    context.strokeRect(x + 4, y + 4, w - 8, h - 8);
  }

  function drawGem(x, y, size, color, glow) {
    if (glow) {
      const gradient = context.createRadialGradient(x, y, 2, x, y, size * 2.2);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, size * 2.2, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(x, y - size);
    context.lineTo(x + size * 0.7, y);
    context.lineTo(x, y + size);
    context.lineTo(x - size * 0.7, y);
    context.closePath();
    context.fill();
    context.fillStyle = 'rgba(255,255,255,0.65)';
    context.beginPath();
    context.moveTo(x, y - size);
    context.lineTo(x + size * 0.35, y - size * 0.2);
    context.lineTo(x - size * 0.35, y - size * 0.2);
    context.closePath();
    context.fill();
  }

  function drawCone(x, y, angle, range, halfAngle, alert) {
    context.fillStyle = alert ? PALETTE.coneAlert : PALETTE.cone;
    context.beginPath();
    context.moveTo(x, y);
    context.arc(x, y, range, angle - halfAngle, angle + halfAngle);
    context.closePath();
    context.fill();
    context.strokeStyle = alert ? PALETTE.coneAlertEdge : PALETTE.coneEdge;
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + Math.cos(angle - halfAngle) * range, y + Math.sin(angle - halfAngle) * range);
    context.moveTo(x, y);
    context.lineTo(x + Math.cos(angle + halfAngle) * range, y + Math.sin(angle + halfAngle) * range);
    context.stroke();
  }

  function drawExit(exit, open) {
    context.fillStyle = open ? PALETTE.exit : PALETTE.exitLocked;
    context.fillRect(exit.x, exit.y, exit.w, exit.h);
    context.strokeStyle = PALETTE.gold;
    context.lineWidth = 3;
    context.strokeRect(exit.x + 2, exit.y + 2, exit.w - 4, exit.h - 4);
    text(open ? 'KABUR!' : 'TERKUNCI', exit.x + exit.w / 2, exit.y + exit.h / 2 + 5, 13, '#0a0d16', 'center');
  }

  function drawField(state) {
    drawFloor();
    const level = state.level;
    drawWalls(level.walls);
    for (let index = 0; index < level.walls.length; index += 1) {
      const rect = level.walls[index];
      if (rect.w >= 100 && rect.h >= 60 && rect.y > 80 && rect.y + rect.h < 700 && rect.x > 16 && rect.x + rect.w < 1264) {
        drawCase(rect.x, rect.y, rect.w, rect.h);
      }
    }

    // Vision cones first, so people and loot stand on top of them.
    for (let index = 0; index < state.cameras.length; index += 1) {
      const camera = state.cameras[index];
      drawCone(camera.x, camera.y, camera.angle, 265, 0.44, camera.seesThief);
    }
    for (let index = 0; index < state.guards.length; index += 1) {
      const guard = state.guards[index];
      drawCone(guard.x, guard.y, guard.angle, 225, 0.61, guard.mode !== 0 || guard.seesThief);
    }

    for (let index = 0; index < state.gems.length; index += 1) {
      const gem = state.gems[index];
      if (!gem.taken) drawGem(gem.x, gem.y, 11, PALETTE.gem, false);
    }
    if (!state.emeraldTaken) {
      const emerald = level.emerald;
      const glow = context.createRadialGradient(emerald.x, emerald.y, 4, emerald.x, emerald.y, 90);
      glow.addColorStop(0, 'rgba(53, 224, 161, 0.35)');
      glow.addColorStop(1, 'rgba(53, 224, 161, 0)');
      context.fillStyle = glow;
      context.beginPath();
      context.arc(emerald.x, emerald.y, 90, 0, Math.PI * 2);
      context.fill();
      drawGem(emerald.x, emerald.y, 20, PALETTE.emerald, true);
      text(emerald.label.toUpperCase(), emerald.x, emerald.y - 34, 15, PALETTE.emerald, 'center');
    }

    drawExit(level.exit, state.emeraldTaken);

    for (let index = 0; index < state.smokes.length; index += 1) {
      const cloud = state.smokes[index];
      context.fillStyle = PALETTE.smoke;
      context.beginPath();
      context.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = 'rgba(220, 228, 240, 0.35)';
      context.beginPath();
      context.arc(cloud.x - 24, cloud.y - 12, cloud.radius * 0.55, 0, Math.PI * 2);
      context.arc(cloud.x + 26, cloud.y + 14, cloud.radius * 0.5, 0, Math.PI * 2);
      context.fill();
    }

    if (state.coin !== null) {
      context.fillStyle = PALETTE.gold;
      context.beginPath();
      context.arc(state.coin.x, state.coin.y, 8, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#8a6d1f';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(state.coin.x, state.coin.y, 8, 0, Math.PI * 2);
      context.stroke();
    }

    for (let index = 0; index < state.guards.length; index += 1) {
      const guard = state.guards[index];
      context.fillStyle = guard.seesThief ? PALETTE.guardAlert : PALETTE.guard;
      context.beginPath();
      context.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = PALETTE.guardCap;
      context.beginPath();
      context.arc(guard.x, guard.y - 4, guard.radius * 0.62, Math.PI, 0);
      context.fill();
      context.fillRect(guard.x - guard.radius * 0.62, guard.y - 5, guard.radius * 1.24, 4);
      context.strokeStyle = '#dfe6f2';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(guard.x, guard.y);
      context.lineTo(guard.x + Math.cos(guard.angle) * (guard.radius + 8), guard.y + Math.sin(guard.angle) * (guard.radius + 8));
      context.stroke();
      if (guard.seesThief) {
        text('!', guard.x, guard.y - guard.radius - 8, 26, PALETTE.danger, 'center');
      } else if (guard.mode === GUARD_INVESTIGATE) {
        text('?', guard.x, guard.y - guard.radius - 8, 24, PALETTE.gold, 'center');
      }
      text(guard.name, guard.x, guard.y + guard.radius + 15, 12, PALETTE.muted, 'center');
    }

    for (let index = 0; index < state.cameras.length; index += 1) {
      const camera = state.cameras[index];
      context.fillStyle = PALETTE.camera;
      context.fillRect(camera.x - 9, camera.y - 7, 18, 14);
      context.save();
      context.translate(camera.x, camera.y);
      context.rotate(camera.angle);
      context.fillStyle = '#3a4152';
      context.fillRect(0, -5, 22, 10);
      context.fillStyle = Math.floor(camera.blink * 2) % 2 === 0 ? PALETTE.cameraEye : '#7a2020';
      context.beginPath();
      context.arc(22, 0, 4, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    const player = state.player;
    context.fillStyle = PALETTE.thief;
    context.beginPath();
    context.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = PALETTE.thiefScarf;
    context.lineWidth = 4;
    context.beginPath();
    context.arc(player.x, player.y, player.radius - 3, player.facing + 2.2, player.facing + 4.1);
    context.stroke();
    context.fillStyle = '#e8ecf4';
    context.beginPath();
    context.arc(player.x + Math.cos(player.facing) * 5, player.y + Math.sin(player.facing) * 5, 4, 0, Math.PI * 2);
    context.fill();
    if (player.sneaking) text('...', player.x, player.y - player.radius - 6, 16, PALETTE.muted, 'center');
    text('RAKA', player.x, player.y + player.radius + 15, 12, PALETTE.text, 'center');
  }

  function drawHud(state) {
    context.fillStyle = '#0d1120';
    context.fillRect(0, 0, FIELD.width, FIELD.hudHeight);
    context.fillStyle = PALETTE.wallTrim;
    context.fillRect(0, FIELD.hudHeight - 2, FIELD.width, 2);
    context.textBaseline = 'top';
    text(state.level.name.toUpperCase(), 20, 12, 22, PALETTE.text, 'left');
    text(`Ruangan ${state.levelIndex + 1}/3  •  ${state.emeraldTaken ? 'Zamrud didapat — ke pintu!' : 'Ambil ' + state.level.emerald.label}`, 20, 38, 14, PALETTE.muted, 'left');

    const alarmX = 470;
    text('ALARM', alarmX, 12, 15, state.spotted ? PALETTE.danger : PALETTE.muted, 'left');
    context.fillStyle = '#232a42';
    context.fillRect(alarmX, 32, 320, 18);
    const fraction = state.alarm / 100;
    context.fillStyle = fraction < 0.4 ? PALETTE.emerald : fraction < 0.7 ? PALETTE.gold : PALETTE.danger;
    context.fillRect(alarmX, 32, 320 * fraction, 18);
    context.strokeStyle = PALETTE.wallTrim;
    context.lineWidth = 1;
    context.strokeRect(alarmX, 32, 320, 18);
    text(alarmLabel(Math.round(state.alarm) + '%'), alarmX + 330, 32, 16, PALETTE.text, 'left');
    if (state.spotted) text('TERLIHAT!', alarmX + 160, 12, 15, PALETTE.danger, 'center');

    text(scoreLabel(state.score), 1100, 12, 22, PALETTE.gold, 'left');
    text(toolsLabel(`KOIN x${state.coinsLeft} [1]   ASAP x${state.smokesLeft} [2]`), 1100, 38, 14, PALETTE.muted, 'left');
    context.textBaseline = 'alphabetic';
    text('WASD / panah gerak  •  Shift mengendap  •  klik = jalan ke sana  •  P jeda', FIELD.width / 2, 655, 13, 'rgba(154,163,184,0.75)', 'center');
  }

  function drawPanel(title, lines, prompt, accent) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = 'rgba(5, 7, 12, 0.72)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.panel;
    context.fillRect(x, y, PANEL.width, height);
    context.strokeStyle = PALETTE.panelEdge;
    context.lineWidth = 2;
    context.strokeRect(x, y, PANEL.width, height);
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 72, 44, accent || PALETTE.text, 'center');
    for (let index = 0; index < lines.length; index += 1) {
      text(lines[index], FIELD.width / 2, y + PANEL.top + index * PANEL.line, 20, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 36, 22, PALETTE.gold, 'center');
  }

  /** Paint one frame: the field, then the HUD or a panel for the screen the game is on. */
  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawField(state);
    if (screen === SCREEN_TITLE) {
      drawPanel('MALAM DI MUSEUM GARUDA', [
        'Raka "Bayang" menyelinap ke museum di malam hari.',
        'Ambil Zamrud Garuda, lalu kabur lewat pintu hijau.',
        'Penjaga dan kamera mengawasi — baca kerucut pandang mereka.',
        'Koin [1] memancing penjaga. Asap [2] menutupi pandangan.',
        'Shift = mengendap pelan. Alarm penuh = tertangkap.',
        bestLabel(best),
      ], 'Tekan Spasi atau klik untuk mulai', PALETTE.gold);
      return;
    }
    drawHud(state);
    if (screen === SCREEN_PAUSED) {
      drawPanel('Jeda', ['Penjaga menunggu. Zamrud juga.'], 'Tekan P untuk lanjut');
    } else if (screen === SCREEN_OVER) {
      drawPanel('TERTANGKAP!', [
        state.caughtReason,
        finalLabel(state.score),
        bestLabel(best),
      ], 'Tekan Spasi atau klik untuk coba lagi', PALETTE.danger);
    } else if (screen === SCREEN_LEVEL) {
      drawPanel('RUANGAN BERSIH!', [
        `${state.level.name} selesai.`,
        finalLabel(state.score),
        'Ruangan berikut lebih dijaga. Hati-hati.',
      ], 'Tekan Spasi untuk ruangan berikut', PALETTE.emerald);
    } else if (screen === SCREEN_WON) {
      drawPanel('KABUR!', [
        'Raka lolos dengan Zamrud Garuda sebelum fajar.',
        finalLabel(state.score),
        bestLabel(best),
        'Tiga ruangan, nol alarm penuh. Kerja bersih.',
      ], 'Tekan Spasi atau klik untuk main lagi', PALETTE.emerald);
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
