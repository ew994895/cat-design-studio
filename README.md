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

- Thirty-seven selectable cats across common, rare, epic, and legendary tiers
- Six internal drives: energy, curiosity, affection, playfulness, confidence, and anger
- Per-cat instinct weights, movement speed, jump power, toy force, temper, and favorite toys
- Every cat can follow toys upward through reachable webpage tiers; Root alone has the current super-bounce range for skipping levels
- A second nine-cat roster with genuinely different personalities: shy Mochi, possessive Biscuit, brave Dot, dreamy Nimbus, persistent Echo, obsessive Magnet, suspicious Vanta, expressive Prism, and impatient Nova
- New working abilities: shy dash, toy hoarding, tiny scout scale, feather fall, double jump, magnetic paws, shadow phase, mood spectrum, and star dash
- Six super residents with entirely new play styles: rhythmic Tempo, time-bending Blink, imitative Mirror, heavyweight Atlas, free-floating Orbit, and restorative Halo
- Super abilities are physical and visible: beat-timed sprinting, toy-slowing time bubbles, echo strikes, ball-launching ground pounds, zero-gravity toy orbiting, and an anger-calming sunbeam
- A fourteen-cat fourth generation completes the current roster: personal mascots Melly and Witty; twin cats Pixel & Purl; vocal Siamese Sable; magical Mr. Mistoffelees; hero-inspired Quickpaw, Nocturne, and Webpaw; historic Bastet, Unsinkable Sam, Trim, and Snowball; plus Chonk and Sphinx
- The fourth generation adds fourteen visible mechanics: comfort kneading, cursor feints, twin strikes, yowling, toy magic, speed laps, anchored grapple pulls, pendulum web swings with physical-toy webbing, guardian wards, nine-life recovery, exploration memory, six-toed ball spin, immovable loafing, and heat-seeking rest
- All five roster atlases use isolated, centered 3×3 cells with safe transparent margins so ears, paws, tails, and effects cannot bleed into neighboring cats
- Existing special behaviors including Marmalade's turbo sprint, Glitch's teleport, Root's mega jump, and Patches' deep sleep
- Utility-based autonomous behavior selection rather than a scripted loop
- Idle breathing/blinking/tail motion using the canonical transparent frames
- Independent roaming, direction changes, jumping, landing, and platform selection
- DOM panels, shelves, and viewport floor treated as physical surfaces
- Loafing, sleeping, grooming, cursor watching, attention seeking, and mischievous bursts
- Cursor-stroking and Pet Cat controls with purring, hissing, claw swipes, and remembered pet count
- Droppable physics toy with gravity, shelf and floor collisions, diminishing bounces, rolling friction, wall rebounds, and repeated paw strikes from the pursuing cat
- Direct manipulation: pick up and relocate the cat, or drag and toss the ball with release velocity preserved
- Seven working toy interactions: red ball, low-latency cursor laser, draggable cardboard sleep box, reel-and-cast fishing rod, scurrying wind-up mouse, bubble machine, and a draggable play tunnel
- The fishing rod now has a stable center-facing dead zone, hold-to-reel and release-to-cast control, a spring-whip lure, direct paw strikes, and lure-first platform targeting
- New toy games are mechanically distinct: the mouse reverses at ledges and escapes pounces, bubbles stay capped and can be placed for aerial pops, and the tunnel launches the cat out the opposite side
- A single Put toy away control removes whichever toy is active and returns the cat to autonomous behavior
- Cursor toys are rendered once per animation frame, and unchanged cat/debug DOM is no longer rewritten continuously
- Pointer and drag events are coalesced so input-heavy toys never run the full simulation more than once per display frame
- Ball, cat, box, laser, rod, line, and lure movement use compositor-friendly transforms instead of layout-changing motion
- Expensive live backdrop blurs were removed from the animated habitat while preserving the dark glass-panel appearance
- An automatic performance governor monitors frame time and JavaScript work, then temporarily reduces decorative effects on struggling hardware and restores them after sustained recovery
- The brain panel reports the current quality mode and measured frame rate
- Surface navigation graph with edge-fall detection and calculated jump arcs for climbing through every habitat tier and returning safely to the floor
- Optional live brain panel showing needs, chosen action, surface, pets, and landings
- Pause/resume control

## Test every cat

Open [`CAT_TESTING_GUIDE.md`](CAT_TESTING_GUIDE.md) for the complete 37-cat handbook: personality, starting brain values, physical tuning, favorite toys, ability triggers, exact test steps, visible pass conditions, and known prototype boundaries.

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
