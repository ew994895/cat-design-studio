# Cat Design Studio — Living Widget Prototype

This is the first standalone prototype of the autonomous widget cat. It does not depend on Witty Games or any external service.

## Run it

Double-click `index.html`. The standalone build works directly from the folder with no server or installation.

For a local web preview, you can also run:

```bash
python3 -m http.server 5501
```

Then open `http://127.0.0.1:5501`.

No installation or package download is required.

After changing the source modules, regenerate the double-clickable build with `npm run build`.

## What is alive already

- Eight selectable cats across common, rare, epic, and legendary tiers
- Six internal drives: energy, curiosity, affection, playfulness, confidence, and anger
- Per-cat instinct weights, movement speed, jump power, toy force, temper, and favorite toys
- Special behaviors including Marmalade's turbo sprint, Glitch's teleport, Root's mega jump, and Patches' deep sleep
- Utility-based autonomous behavior selection rather than a scripted loop
- Idle breathing/blinking/tail motion using the canonical transparent frames
- Independent roaming, direction changes, jumping, landing, and platform selection
- DOM panels, shelves, and viewport floor treated as physical surfaces
- Loafing, sleeping, grooming, cursor watching, attention seeking, and mischievous bursts
- Cursor-stroking and Pet Cat controls with purring, hissing, claw swipes, and remembered pet count
- Droppable physics toy with gravity, shelf and floor collisions, diminishing bounces, rolling friction, wall rebounds, and repeated paw strikes from the pursuing cat
- Direct manipulation: pick up and relocate the cat, or drag and toss the ball with release velocity preserved
- Four working toy interactions: red ball, low-latency cursor laser, draggable cardboard sleep box, and a mouse-controlled fishing rod with a springy feather lure
- Cursor toys are rendered once per animation frame, and unchanged cat/debug DOM is no longer rewritten continuously
- Surface navigation graph with edge-fall detection and calculated jump arcs for climbing through every habitat tier and returning safely to the floor
- Optional live brain panel showing needs, chosen action, surface, pets, and landings
- Pause/resume control

## Verify the brain

```bash
npm test
```

The test suite uses Node's built-in test runner and has no dependencies.

## Prototype boundaries

This version proves the behavioral loop and digital-surface physics inside one web habitat. It is not yet a browser extension or desktop overlay. Walking currently reuses the idle artwork with motion and squash/stretch; dedicated walk, jump, climb, sleep, groom, and pounce sprite sets are the next visual milestone.

## Suggested next milestones

1. Author consistent walk, jump, land, climb, sleep, groom, and pounce sprite strips from the canonical sheet.
2. Move the habitat engine into a browser extension content layer that detects safe page edges.
3. Add food bowls, real-time food depletion, visitor attraction, departures, and persistent friendship.
4. Add duplicate collection and a merge-discovery path without directly selling cats.
5. Persist each individual cat's memories, visits, preferences, and friendship locally.
6. Add a compact permissions-and-boundaries screen so the user defines the cat's home.
7. Package the same core as a desktop companion after the browser behavior is stable.
