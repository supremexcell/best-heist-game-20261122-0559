# Malam di Museum Garuda — Heist Game

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/supremexcell/best-heist-game-20261122-0559/rank.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/supremexcell/best-heist-game-20261122-0559/reward.svg)](https://make.fun/c/best-heist-game-20261122-0559)

A complete, original top-down 2D heist game that runs offline in a desktop
browser from its own static files. Entry for the make.fun bounty
[Make the best heist game](https://make.fun/c/best-heist-game-20261122-0559).

## The game

Raka "Bayang" slips into a Jakarta museum after dark to steal the Garuda
Emerald — then the Pusaka Crown, then the vault itself. Three rooms of
escalating security stand between him and the getaway door:

- **Galeri Batik** — two guards, one sweeping camera.
- **Ruang Pusaka** — three guards, two cameras, a walled-in crown.
- **Brankas Garuda** — a guard inside the vault, cameras everywhere.

Guards patrol with amber vision cones, investigate thrown coins, and chase
when the alarm runs hot. Cameras sweep their cones in a rhythm you have to
read before crossing. The alarm meter rises while you are seen and falls
while you are hidden — fill it and the museum locks down. A coin toss
(3 per room, costs loot) lures a guard away; a smoke bomb (2 per room,
costs loot) blinds every watcher for a few seconds. Hold Shift to sneak
slower and harder to spot.

## How to play

Serve `game/` and open it in desktop Chrome:

```sh
node serve.ts
# open http://localhost:8080
```

- **WASD / arrow keys** — move (or click anywhere to walk there)
- **Shift** — sneak
- **1** — throw a coin lure (costs 25 loot)
- **2** — smoke bomb (costs 50 loot)
- **P** — pause, **M** — mute, **Space / click** — start and restart

Collect the glowing emerald, then reach the green getaway door. Grab the
small blue gems on the way for extra loot.

## Layout

- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to `/output`
  and writes `dossier.json` (Node 22, standard library only).
- `game/index.html` — the playable game.
- `game/src/config.js` — every tuning number and colour.
- `game/src/random.js` — the seeded RNG (repeatable screenshots).
- `game/src/levels.js` — the three hand-designed rooms.
- `game/src/vision.js` — vision cones and line of sight.
- `game/src/player.js` — the thief: movement and wall sliding.
- `game/src/guards.js` — patrol, investigate and chase.
- `game/src/cameras.js` — the sweeping security cameras.
- `game/src/world.js` — the rules: alarm, loot, tools, win and caught.
- `game/src/audio.js` — synthesised WebAudio sounds, no audio files.
- `game/src/render.js` — all procedural canvas art and the HUD.
- `game/src/shots.js` — the staged screenshot scenes.
- `game/src/main.js` — boot, the fixed-step loop and the screens.
- `game/src/input.js` — keyboard and mouse input.
- `screenshots/` — four real renders of the game's own code.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

Everything is original: own idea, art, sounds and names. No network
requests, no external assets — all art is drawn on canvas and all sound is
synthesised in the browser.

## License

MIT — see [LICENSE](LICENSE).
