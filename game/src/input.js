// Keyboard and pointer input. Held keys give a steering vector; one-shot
// presses (start, pause, tools) are queued as bit flags and taken once by the
// loop, so a press between two frames is never lost and never counted twice.
// A mouse click sets a move target the thief walks toward; clicking a tool
// button is not needed, tools are keys 1 and 2.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_COIN = 4;
export const ACTION_SMOKE = 8;
export const ACTION_MUTE = 16;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const SNEAK = new Set(['ShiftLeft', 'ShiftRight']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const COIN = new Set(['Digit1', 'KeyQ']);
const SMOKE = new Set(['Digit2', 'KeyE']);
const MUTE = new Set(['KeyM']);

export function createInput(canvas) {
  const keys = { up: false, down: false, left: false, right: false, sneak: false };
  let actions = 0;
  /** Where the mouse last clicked, in logical field coordinates, or null. */
  let clickTarget = null;
  let mouse = { x: 0, y: 0 };

  function setKey(code, value) {
    if (UP.has(code)) keys.up = value;
    else if (DOWN.has(code)) keys.down = value;
    else if (LEFT.has(code)) keys.left = value;
    else if (RIGHT.has(code)) keys.right = value;
    else if (SNEAK.has(code)) keys.sneak = value;
  }

  window.addEventListener('keydown', (event) => {
    if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (COIN.has(event.code)) {
      if (!event.repeat) actions |= ACTION_COIN;
    } else if (SMOKE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_SMOKE;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (UP.has(event.code) || DOWN.has(event.code) || LEFT.has(event.code) || RIGHT.has(event.code) || SNEAK.has(event.code)) {
      setKey(event.code, true);
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    setKey(event.code, false);
  });
  window.addEventListener('blur', () => {
    keys.up = false;
    keys.down = false;
    keys.left = false;
    keys.right = false;
    keys.sneak = false;
  });

  function toField(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / 1280, rect.height / 720);
    const offsetX = (rect.width - 1280 * scale) / 2;
    const offsetY = (rect.height - 720 * scale) / 2;
    return { x: (event.clientX - rect.left - offsetX) / scale, y: (event.clientY - rect.top - offsetY) / scale };
  }

  canvas.addEventListener('pointerdown', (event) => {
    const point = toField(event);
    mouse = point;
    clickTarget = point;
    actions |= ACTION_CONFIRM;
  });
  canvas.addEventListener('pointermove', (event) => {
    mouse = toField(event);
  });

  return {
    /** Normalised steering vector from held keys, or toward the click target. */
    steering(player) {
      let x = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      let y = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      if (x === 0 && y === 0 && clickTarget !== null) {
        const dx = clickTarget.x - player.x;
        const dy = clickTarget.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 10) {
          clickTarget = null;
        } else {
          x = dx / distance;
          y = dy / distance;
        }
      } else if (x !== 0 || y !== 0) {
        clickTarget = null;
      }
      const length = Math.sqrt(x * x + y * y);
      if (length > 1) {
        x /= length;
        y /= length;
      }
      return { x, y, sneak: keys.sneak };
    },
    mouse() {
      return mouse;
    },
    clearClickTarget() {
      clickTarget = null;
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
