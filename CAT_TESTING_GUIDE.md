# Cat Design Studio — Complete Cat Testing Guide

This is the single source of truth for testing the current 37-cat prototype. It records every cat's rarity, personality, starting mind, physical traits, favorite toys, ability, exact trigger, and visible pass condition.

The guide describes the build represented by the `main` branch after the completed 37-cat roster and sprite cleanup.

## 1. Five-minute test setup

1. Open the Cat Design Studio page.
2. Reload the page before testing a new cat. This gives the cat a fresh brain and resets ability cooldowns.
3. Select **Choose cat**, then select the cat you want to test.
4. Select **Show brain**. Keep it open while testing.
5. Use **Toys** to choose the red ball, laser, box, or fishing rod.
6. Use **Put toy away** between tests so the old toy cannot affect the result.
7. Give random abilities up to 15 seconds of valid play time. A random ability may not fire immediately even when all conditions are correct.

The brain panel shows the current action, energy, curiosity, affection, playfulness, confidence, anger, current surface, pets, landings, and performance mode. The cat card also names the active ability.

### What the ability labels mean

- **Active**: a special animation or physics event appears when its conditions are met.
- **Passive**: always changes the cat's normal movement, decisions, mood, or toy force. It may not make a special flash.
- **Profile-driven**: the personality emerges from the cat's starting drives and decision weights instead of a scripted one-off move.
- **Prototype limit**: the intended fantasy is recorded, but the current one-cat demo cannot show the full future version yet.

### Shared interaction rules

- **Petting:** select **Pet Cat**, or stroke the cat's head with the pointer. A stroke counts when the pointer is within about 54 px of the head and moving at roughly 35–950 px per second. Petting is limited to one registered stroke every 140 ms.
- **Overstimulation:** strokes less than 650 ms apart count as repeat petting. Temper and pet-irritation values determine whether anger rises or falls.
- **Ball strikes:** the ball must have existed for 0.9 seconds, be on the cat's current surface, and come within about 88 px. A new strike can occur every 0.52 seconds.
- **Box:** place the box on the cat's surface and within about 88 px. Cats can enter, rest, and sleep in it. You can drag the box.
- **Laser and fishing rod:** move the target to the cat's surface to start a chase. Move it to the next tier to invite a jump.
- **Page navigation:** every cat can climb the page one reachable tier at a time. Root is the only cat intended to skip a tier with a super-bounce.
- **Performance Lite:** visual trails and effects may be simplified if the automatic performance guard activates. The underlying ability should still work.

## 2. Complete roster at a glance

| Cat | ID | Rarity | Personality | Favorite toys | Ability type | Ability |
|---|---|---|---|---|---|---|
| Byte | `byte` | Common | steady · curious · friendly | Ball, box | Passive/profile | Steady all-rounder |
| Patches | `patches` | Common | sleepy · cuddly · unhurried | Box | Profile-driven | Deep sleep |
| Marmalade | `marmalade` | Common | playful · chaotic · outgoing | Ball, laser, fishing rod | Passive | Turbo sprint |
| Sudo | `sudo` | Rare | nosy · clever · independent | Laser, fishing rod | Passive | High jump |
| Ember | `ember` | Rare | proud · moody · fearless | Ball | Passive/profile | Power swipe and short temper |
| Glitch | `glitch` | Epic | restless · tricky · unpredictable | Laser, fishing rod | Active/random | Teleport |
| Oracle | `oracle` | Epic | serene · affectionate · mysterious | Box, fishing rod | Passive/profile | Calming aura |
| Root | `root` | Legendary | confident · commanding · composed | Ball, fishing rod | Passive | Mega jump |
| Mochi | `mochi` | Common | shy · gentle · loyal | Box, fishing rod | Active | Shy dash |
| Biscuit | `biscuit` | Common | possessive · playful · stubborn | Ball, box | Active | Toy hoarder |
| Dot | `dot` | Common | brave · busy · observant | Laser, fishing rod | Passive | Tiny scout |
| Nimbus | `nimbus` | Rare | dreamy · mellow · trusting | Box, fishing rod | Active/passive | Feather fall |
| Echo | `echo` | Rare | watchful · precise · persistent | Fishing rod, laser | Active | Double jump |
| Magnet | `magnet` | Rare | focused · obsessive · reserved | Ball | Active/continuous | Magnet paws |
| Vanta | `vanta` | Epic | aloof · nocturnal · suspicious | Laser, box | Active/random | Shadow phase |
| Prism | `prism` | Epic | empathetic · expressive · social | Fishing rod, box | Active/continuous | Mood spectrum |
| Nova | `nova` | Legendary | bold · adventurous · impatient | Laser, ball | Active/random | Star dash |
| Tempo | `tempo` | Epic | methodical · musical · patient | Fishing rod, ball | Active | Rhythm burst |
| Blink | `blink` | Epic | anxious · vigilant · hypersensitive | Laser, fishing rod | Active | Time bubble |
| Mirror | `mirror` | Epic | theatrical · clingy · imitative | Ball, laser | Active/continuous | Mirror clone |
| Atlas | `atlas` | Legendary | stoic · protective · stubborn | Ball, box | Active | Ground pound |
| Orbit | `orbit` | Legendary | detached · whimsical · endlessly curious | Laser, fishing rod | Active | Zero gravity |
| Halo | `halo` | Legendary | caring · brave · serene | Box, fishing rod | Active | Sunbeam |
| Melly | `melly` | Rare | nurturing · perceptive · soft-spoken | Box, fishing rod | Active | Comfort knead |
| Witty | `witty` | Epic | quick-witted · cheeky · inventive | Laser, fishing rod | Active | Cursor feint |
| Pixel & Purl | `pixel-purl` | Epic | inseparable · competitive · synchronized | Ball, box | Active | Twin tag-team |
| Sable | `sable` | Common | vocal · devoted · demanding | Fishing rod, box | Active/random | Royal yowl |
| Mr. Mistoffelees | `mistoffelees` | Legendary | showy · secretive · precise | Ball, box | Active/random | Prestidigitation |
| Quickpaw | `quickpaw` | Legendary | heroic · impatient · exuberant | Laser, ball | Active/random | Speed lap |
| Nocturne | `nocturne` | Epic | watchful · protective · solitary | Fishing rod, laser | Active | Grapple glide |
| Webpaw | `webpaw` | Epic | acrobatic · helpful · excitable | Ball, fishing rod | Active | Web sling |
| Bastet | `bastet` | Legendary | regal · patient · protective | Box, fishing rod | Active | Guardian ward |
| Unsinkable Sam | `unsinkable-sam` | Rare | unflappable · hardy · loyal | Box, ball | Active/recovery | Nine lives |
| Trim | `trim` | Rare | adventurous · observant · steadfast | Laser, fishing rod | Active/profile | Navigator |
| Snowball | `snowball` | Rare | bookish · dexterous · dignified | Ball, box | Active | Extra toes |
| Chonk | `chonk` | Common | food-motivated · placid · immovable | Box, ball | Active/passive | Immovable loaf |
| Sphinx | `sphinx` | Rare | warmth-seeking · affectionate · opinionated | Box, fishing rod | Active | Heat seeker |

## 3. Exact cat-by-cat tests

### 1. Byte — steady all-rounder

- **What makes Byte different:** Byte is the neutral reference cat. Its speed, jump power, toy force, and most decision weights are all exactly `1.00`.
- **Trigger:** no one-off trigger; the ability is always active.
- **Test:** try the ball, box, laser, fishing rod, petting, and a one-tier jump.
- **Pass:** Byte uses every system without an extreme delay, speed, jump, mood spike, or special effect. Compare other cats to Byte.

### 2. Patches — deep sleep

- **What makes Patches different:** low starting energy and a `1.78×` sleep instinct make sleep much more likely; the box is the only favorite toy.
- **Trigger:** leave Patches alone at low energy, preferably with a box on the same surface.
- **Test:** place the box beside Patches, stop moving the pointer, and watch the action in **Show brain**.
- **Pass:** Patches chooses loaf or sleep much sooner and more often than Byte. **Current limitation:** the choice is strongly cat-specific, but the final sleep animation timer is still shared with other cats.

### 3. Marmalade — turbo sprint

- **What makes Marmalade different:** `1.72×` movement speed, high playfulness, and strong toy force.
- **Trigger:** get Marmalade chasing the ball, laser, or fishing rod; horizontal speed above about 120 px/s shows the sprint animation.
- **Test:** sweep the laser or fishing lure across a wide ledge, or throw the ball far away.
- **Pass:** Marmalade accelerates into a visibly faster run than Byte and repeatedly catches moving toys.

### 4. Sudo — high jump

- **What makes Sudo different:** `1.38×` jump power and high curiosity/jump instincts.
- **Trigger:** put the laser or fishing lure on the next webpage tier.
- **Test:** begin on the floor, move the target to the first shelf, then repeat toward a higher shelf.
- **Pass:** Sudo reaches each adjacent tier with a higher, sharper arc than Byte. Sudo still follows the normal one-tier navigation rule.

### 5. Ember — power swipe

- **What makes Ember different:** `1.46×` toy force, high starting anger (`0.48`), high temper, and the roster's quickest hiss/claw thresholds.
- **Trigger:** ball contact activates the stronger passive hit; fast repeated petting pushes anger toward hiss at `0.46` and claw at `0.70`.
- **Test:** first let Ember hit the ball and compare its travel to Byte. Then repeatedly pet Ember with quick back-and-forth strokes.
- **Pass:** the ball launches harder; the brain's anger rises quickly and Ember hisses, then claws when sufficiently overstimulated.

### 6. Glitch — teleport

- **What makes Glitch different:** high mischief and a short-distance teleport during play.
- **Trigger:** while grounded and in **play** or **mischief**, the teleport gets a random `0.60` chance per second when off cooldown. Cooldown varies from 1.9–3.5 seconds.
- **Test:** use the laser or fishing rod on Glitch's current ledge and keep the chase active for up to 15 seconds.
- **Pass:** Glitch flickers and jumps 62–158 px along the same safe platform without using a normal jump arc.

### 7. Oracle — calming aura

- **What makes Oracle different:** extremely low temper, negative pet irritation, and `1.72×` calm rate. Oracle is slow, sleepy, and affectionate.
- **Trigger:** always active as part of Oracle's brain profile.
- **Test:** pet Oracle repeatedly, then leave Oracle alone and watch anger in the brain panel.
- **Pass:** petting lowers rather than raises irritation, and any anger drains faster than Byte's. **Current limitation:** the future aura is meant to calm nearby cats, but the current prototype only runs one active cat, so it presently calms Oracle only.

### 8. Root — mega jump

- **What makes Root different:** the roster's only `1.80×` navigation range, plus `1.58×` jump power and `1.52×` toy force.
- **Trigger:** a toy or autonomous route selects a higher reachable surface.
- **Test:** put the ball or fishing lure on a platform more than one normal tier above Root.
- **Pass:** Root can make the super-bounce route that ordinary and other legendary cats cannot. Root should still land with both feet flush on the target surface.

### 9. Mochi — shy dash

- **What makes Mochi different:** low confidence, strong affection, and a fear response to abrupt pointer movement.
- **Trigger:** make a sudden fast pointer movement near Mochi.
- **Test:** approach slowly, then swipe quickly across Mochi's immediate area; afterward hold still.
- **Pass:** Mochi darts away from the pointer, then settles and eventually returns when the area is calm.

### 10. Biscuit — toy hoarder

- **What makes Biscuit different:** wants to play but deliberately keeps the ball close.
- **Trigger:** every valid ball strike.
- **Test:** drop the ball on Biscuit's current surface and let Biscuit make several contacts.
- **Pass:** each hit is softened (`0.34×` horizontal and `0.42×` vertical after the normal strike), and **MINE** briefly appears. The ball remains easier for Biscuit to guard than after Byte's hit.

### 11. Dot — tiny scout

- **What makes Dot different:** rendered at `0.76×` normal size with `1.34×` movement speed and the roster's strongest curiosity among common cats.
- **Trigger:** always active.
- **Test:** compare Dot and Byte walking across the same ledge, then attract Dot upward with the laser.
- **Pass:** Dot looks distinctly smaller, crosses the ledge faster, and frequently chooses exploration. **Current limitation:** the visual is smaller, but the prototype still uses the shared 84 px physics footprint.

### 12. Nimbus — feather fall

- **What makes Nimbus different:** gravity is reduced to `0.34×` whenever Nimbus is descending.
- **Trigger:** any jump or fall.
- **Test:** put the fishing lure on the next tier, let Nimbus jump, and watch the descending half of the arc.
- **Pass:** Nimbus rises normally but drifts down slowly with a feather-fall effect, then lands flush on the surface.

### 13. Echo — double jump

- **What makes Echo different:** adds one extra midair hop to an ordinary pounce.
- **Trigger:** Echo must be airborne and descending faster than about 42 px/s during jump, play, or mischief. The extra hop is not used during a pre-calculated platform-to-platform route.
- **Test:** keep the fishing lure above and a little ahead of Echo on the same broad surface so Echo pounces without changing tiers.
- **Pass:** after beginning to fall, Echo makes one clear second hop and a short ability flash appears. Only one extra hop occurs per jump.

### 14. Magnet — magnet paws

- **What makes Magnet different:** continuously pulls a nearby ball during play.
- **Trigger:** ball is 44–280 px away while Magnet's action is **play**; it works on the same surface or while airborne.
- **Test:** drop the ball, drag it about 150 px away from Magnet, release it, and wait for play.
- **Pass:** the ball bends and accelerates toward Magnet with magnetic pulse effects even before paw contact.

### 15. Vanta — shadow phase

- **What makes Vanta different:** short shadow-step movement while stalking.
- **Trigger:** grounded during roam, play, inspect, or mischief; random `0.48` chance per second when off cooldown. Cooldown varies from 2.3–3.6 seconds.
- **Test:** chase the laser across Vanta's current ledge for up to 15 seconds.
- **Pass:** Vanta phases 74–146 px toward the target with a shadow effect instead of walking that distance.

### 16. Prism — mood spectrum

- **What makes Prism different:** the visible aura continuously changes with mood.
- **Trigger:** aura is always active; petting triggers the stronger calming reaction.
- **Test:** watch Prism's aura while it shifts between rest, curiosity, play, and irritation. Pet Prism gently.
- **Pass:** the aura color changes with mood; petting removes `0.16` anger and briefly displays a heart and diamond-like flash.

### 17. Nova — star dash

- **What makes Nova different:** very fast normal movement plus a blazing ground dash.
- **Trigger:** grounded during roam, play, or mischief; random `0.34` chance per second when off cooldown. The dash lasts about 0.64 seconds and has a 3.6–5.3 second cooldown.
- **Test:** sweep the laser along a wide ledge for up to 15 seconds.
- **Pass:** Nova launches at roughly `282 × speed` with a comet-like effect, but still climbs the page only one tier at a time.

### 18. Tempo — rhythm burst

- **What makes Tempo different:** movement alternates between a precisely timed burst and pause.
- **Trigger:** grounded during roam, play, or mischief without a tier change.
- **Test:** move the fishing lure or ball horizontally along Tempo's current platform.
- **Pass:** Tempo runs for about 0.32 seconds, pauses, then repeats on a roughly 0.92-second beat. The motion should feel deliberate, not like frame lag.

### 19. Blink — time bubble

- **What makes Blink different:** protects itself from sudden cursor motion by slowing the active toy.
- **Trigger:** pointer speed above about 760 px/s within 240 px of Blink while Blink is not being dragged.
- **Test:** get the red ball rolling or move the fishing lure, then make a fast cursor swipe beside Blink.
- **Pass:** a bubble appears for about 1.2 seconds. The ball's velocity drops to `0.28×`; the fishing lure's velocity drops to `0.22×`; active-toy time advances at `0.28×` while the bubble lasts.

### 20. Mirror — mirror clone

- **What makes Mirror different:** a delayed ghost double follows every movement and assists with the ball.
- **Trigger:** clone visual is continuous; every valid ball strike triggers the second hit.
- **Test:** move Mirror around and look for the trailing reflection, then let Mirror strike the red ball.
- **Pass:** the ghost follows with a delay. On ball contact it flashes and adds about 118 px/s horizontal and 72 px/s upward velocity after the first hit.

### 21. Atlas — ground pound

- **What makes Atlas different:** visually larger (`1.12×`), heavy on descent, slow on foot, and strongest toy force (`1.82×`).
- **Trigger:** descent uses `1.48×` gravity; landing impact above about 235 activates the pound.
- **Test:** put the ball within 280 px horizontally and 150 px vertically of the landing point, then lure Atlas into a high jump.
- **Pass:** Atlas drops faster than Byte, lands with a ground-pound effect, and launches the nearby ball. A low hop that does not meet the impact threshold should not pound.

### 22. Orbit — zero gravity

- **What makes Orbit different:** temporarily leaves the platform system to orbit an airborne cursor toy.
- **Trigger:** grounded and playing with an active laser or fishing lure while the ability is off cooldown.
- **Test:** select the laser or fishing rod and move its target above Orbit.
- **Pass:** Orbit floats off the ledge and circles the target for about 2.4 seconds before returning to normal physics. Cooldown is about 6.9 seconds.

### 23. Halo — sunbeam

- **What makes Halo different:** resting and affection create a restorative warm area.
- **Trigger:** a gentle pet immediately starts the effect when off cooldown; it also starts automatically while grounded in sleep, loaf, or purr. Cooldown is about 5.6 seconds.
- **Test:** pet Halo once, or place the box nearby and wait for rest.
- **Pass:** a sunbeam appears for about 3.2 seconds. Energy rises, anger falls, and the effect continues restoring energy and dissolving anger while active.

### 24. Melly — comfort knead

- **What makes Melly different:** quiet resting behavior actively restores energy and affection.
- **Trigger:** petting starts a short knead; it also starts automatically while grounded in sleep, loaf, or purr. Automatic cooldown is about 5.9 seconds.
- **Test:** place a box beside Melly and wait for rest, or use **Pet Cat** once.
- **Pass:** Melly performs a small rhythmic knead. A pet gives an immediate energy/affection boost; the automatic effect lasts about 2.3 seconds and continues restoring both.

### 25. Witty — cursor feint

- **What makes Witty different:** deliberately moves the wrong way before snapping toward a target.
- **Trigger:** grounded in play or inspect, target on the same tier, target more than about 68 px away, and ability off cooldown.
- **Test:** put the laser or fishing lure far to one side of Witty on the same broad ledge.
- **Pass:** Witty moves away from the target for about 0.19 seconds, reverses sharply, and pursues it. The full move is about 0.62 seconds; cooldown is about 3.2 seconds.

### 26. Pixel & Purl — twin tag-team

- **What makes them different:** two synchronized cats are represented as one resident and combine their strike.
- **Trigger:** every valid ball contact.
- **Test:** drop the ball on the twins' current surface and let them hit it.
- **Pass:** a coordinated second strike flashes and adds about 148 px/s horizontal and 84 px/s upward velocity after the first hit.

### 27. Sable — royal yowl

- **What makes Sable different:** highly affectionate, vocal, and demanding when ignored.
- **Trigger:** grounded, off cooldown, and either affection is below `0.56` or the pointer has been still for more than 7.6 seconds. It then has a random `0.24` chance per second.
- **Test:** put toys away, do not move the pointer, and wait up to 20 seconds.
- **Pass:** Sable stops, displays **MRRROW**, and seeks affection for about 2.1 seconds. Cooldown is about 6.9 seconds.

### 28. Mr. Mistoffelees — prestidigitation

- **What makes Mr. Mistoffelees different:** performs close-up magic on physical toys.
- **Trigger:** grounded in play with the ball or box active; random `0.28` chance per second when off cooldown.
- **Test:** place the ball or box on Mr. Mistoffelees' surface and keep the cat engaged for up to 15 seconds.
- **Pass:** the toy vanishes from its old spot and safely reappears on a nearby reachable surface. The magic effect lasts about 1.7 seconds; cooldown is about 6.2 seconds.

### 29. Quickpaw — speed lap

- **What makes Quickpaw different:** extremely fast, restless, and built to run a complete ledge circuit.
- **Trigger:** grounded on a platform wider than 190 px during roam, play, or mischief; target is on the same tier; random `0.32` chance per second when off cooldown.
- **Test:** move the laser back and forth across the widest platform available for up to 15 seconds.
- **Pass:** Quickpaw begins a lightning lap for about 2.1 seconds and rebounds from both platform edges. Cooldown is about 5.3 seconds.

### 30. Nocturne — grapple glide

- **What makes Nocturne different:** ordinary tier jumps gain a visible grappling line and horizontal midair guidance.
- **Trigger:** any targeted platform jump while ability cooldown is ready.
- **Test:** place the laser or fishing lure on the next tier.
- **Pass:** a line appears toward the landing area for about 1.1 seconds, and Nocturne glides horizontally toward the selected surface while airborne.

### 31. Webpaw — web sling

- **What makes Webpaw different:** retrieves a rolling ball with a one-shot tether.
- **Trigger:** ball is active, Webpaw is playing, and the ball is 82–390 px away while the ability is off cooldown.
- **Test:** drag and release the ball so it rolls away 100–300 px from Webpaw.
- **Pass:** a web line flashes, the airborne ball is pulled back toward Webpaw, and the effect lasts about 0.98 seconds. Cooldown is about 3.4 seconds.

### 32. Bastet — guardian ward

- **What makes Bastet different:** suppresses anger before it can control behavior.
- **Trigger:** automatic when anger reaches `0.30`; petting also raises the ward immediately if anger is already above `0.18`.
- **Test:** make very fast repeat strokes near Bastet, then pause with the pointer nearby and watch anger. Bastet's low temper means the natural test can take time.
- **Pass:** the ward appears, anger drops by about `0.38` automatically or `0.32` on petting, confidence rises, and Bastet settles into loaf or purr instead of escalating. Cooldown is about 4.6 seconds.

### 33. Unsinkable Sam — nine lives

- **What makes Sam different:** recovers safely after falling below the viewport.
- **Trigger:** Sam's body moves more than 40 px below the bottom of the viewport.
- **Test:** this safety case is difficult to create with normal dragging because the floor correctly catches the cat. Use the optional developer shortcut in section 6 for a deterministic test.
- **Pass:** Sam returns to a safe floor position, keeps `0.48×` of horizontal momentum, shows the life recovery, and loses one life. After the ninth recovery, the counter cycles back to nine.

### 34. Trim — navigator

- **What makes Trim different:** remembers platform visits and prefers the least explored or farther reachable ledges.
- **Trigger:** every autonomous platform-route decision.
- **Test:** leave toys put away, keep **Show brain** open, and let Trim roam for several jumps.
- **Pass:** a compass-like effect appears during route choice, and Trim avoids repeatedly choosing the same ledge when unvisited alternatives exist. The internal score favors fewer visits and distance.

### 35. Snowball — extra toes

- **What makes Snowball different:** six-toed strikes produce extra spin and a stronger curve.
- **Trigger:** every valid ball strike.
- **Test:** place the red ball on Snowball's surface and watch one clean contact.
- **Pass:** an extra-toe flash appears; the hit multiplies horizontal velocity by `1.24`, adds 64 px/s upward velocity, and combines with `1.38×` base toy force.

### 36. Chonk — immovable loaf

- **What makes Chonk different:** visually larger (`1.10×`), slowest movement, strongest sleep bias, and a heavy swipe.
- **Trigger:** grounded while the render state is loaf or sleep.
- **Test:** place a box nearby, put other toys away, and leave Chonk alone until loafing or sleeping.
- **Pass:** the ability glow appears, horizontal velocity stays exactly zero, and anger drains by about `0.20` per second. Chonk should ignore movement urges until leaving the resting state.

### 37. Sphinx — heat seeker

- **What makes Sphinx different:** visually smaller (`0.88×`), strongly affectionate, and biased toward warm/resting places.
- **Trigger:** petting starts a short heat shimmer; it also starts automatically while grounded in sleep, loaf, or purr. During platform choice, the editor panel receives a strong warm-spot preference.
- **Test:** pet Sphinx once, then later place a box nearby and wait for rest. For navigation, let Sphinx choose among multiple tiers.
- **Pass:** a heat shimmer appears for about 1.9–3 seconds, energy rises and anger falls. When reachable, Sphinx strongly prefers the warm editor panel. Cooldown is about 5.2 seconds.

## 4. Starting brain values

Values are from `0.00` to `1.00`. They are the cat's starting state after a fresh reload, not permanent labels; play, rest, toys, petting, time, and frustration change them.

| Cat | Energy | Curiosity | Affection | Playfulness | Confidence | Anger |
|---|---:|---:|---:|---:|---:|---:|
| Byte | .74 | .63 | .58 | .56 | .72 | .08 |
| Patches | .36 | .34 | .76 | .24 | .68 | .03 |
| Marmalade | .90 | .74 | .62 | .94 | .76 | .06 |
| Sudo | .78 | .96 | .48 | .68 | .73 | .12 |
| Ember | .70 | .54 | .25 | .42 | .91 | .48 |
| Glitch | .93 | .88 | .38 | .84 | .87 | .24 |
| Oracle | .42 | .70 | .84 | .36 | .88 | .02 |
| Root | .82 | .78 | .58 | .64 | .99 | .18 |
| Mochi | .48 | .40 | .86 | .40 | .28 | .03 |
| Biscuit | .78 | .66 | .46 | .86 | .84 | .18 |
| Dot | .88 | .98 | .56 | .72 | .94 | .02 |
| Nimbus | .46 | .70 | .82 | .44 | .76 | .01 |
| Echo | .76 | .86 | .44 | .80 | .62 | .10 |
| Magnet | .66 | .84 | .34 | .92 | .90 | .20 |
| Vanta | .64 | .88 | .16 | .54 | .97 | .36 |
| Prism | .70 | .76 | .94 | .68 | .70 | .08 |
| Nova | .94 | .96 | .50 | .84 | 1.00 | .12 |
| Tempo | .72 | .68 | .50 | .80 | .82 | .06 |
| Blink | .82 | .80 | .34 | .64 | .32 | .22 |
| Mirror | .70 | .72 | .96 | .82 | .68 | .04 |
| Atlas | .58 | .44 | .70 | .46 | 1.00 | .14 |
| Orbit | .76 | 1.00 | .28 | .90 | .96 | .01 |
| Halo | .54 | .56 | .98 | .42 | .92 | .00 |
| Melly | .56 | .66 | .94 | .48 | .70 | .01 |
| Witty | .82 | .96 | .60 | .90 | .88 | .09 |
| Pixel & Purl | .84 | .78 | .88 | .98 | .80 | .07 |
| Sable | .68 | .70 | .86 | .58 | .82 | .18 |
| Mr. Mistoffelees | .76 | .92 | .52 | .86 | .98 | .05 |
| Quickpaw | .98 | .86 | .64 | .94 | .98 | .06 |
| Nocturne | .72 | .82 | .30 | .50 | .99 | .16 |
| Webpaw | .90 | .88 | .72 | .96 | .84 | .04 |
| Bastet | .62 | .72 | .70 | .42 | 1.00 | .02 |
| Unsinkable Sam | .70 | .68 | .76 | .54 | .98 | .08 |
| Trim | .80 | .99 | .58 | .64 | .90 | .04 |
| Snowball | .58 | .90 | .68 | .70 | .78 | .03 |
| Chonk | .30 | .32 | .78 | .24 | .96 | .01 |
| Sphinx | .44 | .70 | .96 | .50 | .66 | .20 |

## 5. Complete personality and movement tuning

These are multipliers used by the autonomous brain. `1.00` is the Byte/reference level. Higher values make a choice or physical behavior more likely/stronger; lower values suppress it. Pet irritation may be negative, meaning repeated petting actively calms the cat.

### Decision weights

| Cat | Sleep | Play | Roam | Jump urge | Mischief | Seek affection | Temper | Pet irritation | Calm rate |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Byte | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | .55 | -.025 | 1.00 |
| Patches | 1.78 | .50 | .62 | .58 | .42 | 1.35 | .22 | -.045 | 1.45 |
| Marmalade | .56 | 1.62 | 1.12 | 1.28 | 1.18 | 1.00 | .36 | -.010 | 1.10 |
| Sudo | .72 | 1.06 | 1.58 | 1.48 | 1.12 | .82 | .58 | .025 | .92 |
| Ember | .82 | .72 | 1.04 | .96 | 1.32 | .48 | 1.58 | .160 | .52 |
| Glitch | .54 | 1.30 | 1.30 | 1.46 | 1.90 | .62 | 1.08 | .070 | .78 |
| Oracle | 1.66 | .62 | .84 | .72 | .38 | 1.46 | .18 | -.055 | 1.72 |
| Root | .82 | 1.02 | 1.22 | 1.20 | 1.28 | .90 | .92 | .035 | 1.08 |
| Mochi | 1.28 | .70 | .68 | .78 | .22 | 1.70 | .40 | -.050 | 1.50 |
| Biscuit | .82 | 1.44 | .92 | 1.02 | 1.42 | .72 | .92 | .045 | .82 |
| Dot | .58 | 1.10 | 1.72 | 1.18 | .80 | .86 | .16 | -.020 | 1.38 |
| Nimbus | 1.50 | .76 | 1.08 | 1.08 | .30 | 1.42 | .14 | -.060 | 1.90 |
| Echo | .72 | 1.32 | 1.08 | 1.48 | .94 | .70 | .62 | .015 | 1.02 |
| Magnet | .74 | 1.62 | .82 | .90 | 1.24 | .54 | .82 | .040 | .86 |
| Vanta | .96 | .90 | 1.42 | 1.08 | 1.70 | .30 | 1.34 | .130 | .58 |
| Prism | 1.02 | 1.16 | .90 | .94 | .46 | 1.70 | .24 | -.080 | 1.72 |
| Nova | .42 | 1.42 | 1.68 | 1.16 | 1.28 | .72 | .70 | .020 | .92 |
| Tempo | .86 | 1.34 | 1.02 | 1.08 | .72 | .84 | .34 | -.015 | 1.18 |
| Blink | .68 | 1.08 | 1.34 | 1.20 | .58 | .56 | 1.06 | .080 | .72 |
| Mirror | .92 | 1.38 | .72 | 1.02 | .66 | 1.78 | .20 | -.070 | 1.58 |
| Atlas | 1.18 | .82 | .64 | .88 | .92 | 1.12 | .62 | -.010 | 1.04 |
| Orbit | .66 | 1.54 | 1.62 | 1.22 | 1.08 | .44 | .10 | -.035 | 1.70 |
| Halo | 1.46 | .72 | .80 | .84 | .24 | 1.84 | .08 | -.090 | 2.10 |
| Melly | 1.32 | .82 | .82 | .88 | .30 | 1.76 | .12 | -.080 | 1.82 |
| Witty | .62 | 1.52 | 1.38 | 1.20 | 1.54 | .90 | .46 | .010 | 1.04 |
| Pixel & Purl | .72 | 1.72 | .88 | 1.16 | 1.28 | 1.38 | .34 | -.030 | 1.18 |
| Sable | .86 | .98 | 1.02 | 1.06 | .70 | 1.62 | .78 | .020 | .88 |
| Mr. Mistoffelees | .70 | 1.48 | 1.12 | 1.28 | 1.72 | .82 | .30 | -.005 | 1.22 |
| Quickpaw | .32 | 1.66 | 1.86 | 1.18 | 1.36 | .90 | .38 | -.010 | 1.06 |
| Nocturne | .80 | .86 | 1.42 | 1.56 | 1.06 | .50 | .74 | .035 | .90 |
| Webpaw | .48 | 1.70 | 1.28 | 1.62 | 1.06 | 1.04 | .26 | -.020 | 1.26 |
| Bastet | 1.12 | .76 | 1.02 | .90 | .54 | 1.20 | .14 | -.045 | 1.90 |
| Unsinkable Sam | .94 | .94 | 1.30 | 1.10 | .72 | 1.14 | .42 | -.025 | 1.30 |
| Trim | .62 | 1.02 | 1.82 | 1.52 | .68 | .84 | .24 | -.010 | 1.20 |
| Snowball | 1.06 | 1.18 | 1.08 | .92 | .62 | 1.06 | .20 | -.035 | 1.46 |
| Chonk | 1.90 | .46 | .50 | .52 | .28 | 1.32 | .12 | -.070 | 2.08 |
| Sphinx | 1.56 | .82 | 1.08 | .96 | .42 | 1.82 | .72 | .060 | 1.08 |

### Physical multipliers and anger thresholds

| Cat | Visual scale | Speed | Jump power | Navigation range | Toy force | Hiss | Claw |
|---|---:|---:|---:|---:|---:|---:|---:|
| Byte | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | .66 | .86 |
| Patches | 1.00 | .56 | .68 | 1.00 | .72 | .66 | .86 |
| Marmalade | 1.00 | 1.72 | 1.18 | 1.00 | 1.28 | .66 | .86 |
| Sudo | 1.00 | 1.18 | 1.38 | 1.00 | .94 | .66 | .86 |
| Ember | 1.00 | 1.08 | .94 | 1.00 | 1.46 | .46 | .70 |
| Glitch | 1.00 | 1.32 | 1.20 | 1.00 | 1.06 | .62 | .82 |
| Oracle | 1.00 | .74 | .78 | 1.00 | .68 | .66 | .86 |
| Root | 1.00 | 1.12 | 1.58 | 1.80 | 1.52 | .70 | .90 |
| Mochi | 1.00 | .84 | .82 | 1.00 | .70 | .66 | .86 |
| Biscuit | 1.00 | 1.04 | 1.00 | 1.00 | .82 | .62 | .82 |
| Dot | .76 | 1.34 | 1.04 | 1.00 | .58 | .66 | .86 |
| Nimbus | 1.00 | .78 | .94 | 1.00 | .64 | .66 | .86 |
| Echo | 1.00 | 1.06 | .96 | 1.00 | .92 | .66 | .86 |
| Magnet | 1.00 | .94 | .90 | 1.00 | 1.08 | .68 | .86 |
| Vanta | 1.00 | 1.16 | 1.06 | 1.00 | 1.18 | .50 | .72 |
| Prism | 1.00 | .96 | .96 | 1.00 | .82 | .66 | .86 |
| Nova | 1.00 | 1.46 | 1.10 | 1.00 | 1.32 | .66 | .86 |
| Tempo | 1.00 | 1.08 | 1.02 | 1.00 | 1.02 | .66 | .86 |
| Blink | 1.00 | 1.30 | 1.06 | 1.00 | .78 | .58 | .84 |
| Mirror | 1.00 | .98 | 1.00 | 1.00 | .90 | .66 | .86 |
| Atlas | 1.12 | .68 | .90 | 1.00 | 1.82 | .70 | .90 |
| Orbit | 1.00 | 1.04 | 1.08 | 1.00 | .74 | .66 | .86 |
| Halo | 1.00 | .82 | .88 | 1.00 | .70 | .66 | .86 |
| Melly | 1.00 | .86 | .90 | 1.00 | .72 | .66 | .86 |
| Witty | 1.00 | 1.26 | 1.08 | 1.00 | 1.04 | .66 | .86 |
| Pixel & Purl | 1.06 | 1.08 | 1.04 | 1.00 | 1.18 | .66 | .86 |
| Sable | 1.00 | 1.02 | 1.02 | 1.00 | .90 | .60 | .84 |
| Mr. Mistoffelees | 1.00 | 1.12 | 1.16 | 1.00 | 1.08 | .66 | .86 |
| Quickpaw | 1.00 | 1.64 | 1.10 | 1.00 | 1.22 | .66 | .86 |
| Nocturne | 1.00 | 1.14 | 1.12 | 1.00 | 1.16 | .70 | .90 |
| Webpaw | 1.00 | 1.30 | 1.24 | 1.00 | 1.14 | .66 | .86 |
| Bastet | 1.00 | .92 | .94 | 1.00 | .88 | .80 | .94 |
| Unsinkable Sam | 1.00 | 1.02 | 1.06 | 1.00 | 1.02 | .66 | .86 |
| Trim | 1.00 | 1.18 | 1.12 | 1.00 | .94 | .66 | .86 |
| Snowball | 1.00 | .88 | .92 | 1.00 | 1.38 | .66 | .86 |
| Chonk | 1.10 | .48 | .66 | 1.00 | 1.50 | .66 | .86 |
| Sphinx | .88 | .90 | .98 | 1.00 | .78 | .58 | .82 |

## 6. Optional developer shortcuts for difficult tests

Normal play should be the main test. These shortcuts are for deterministic quality checks when a random trigger or safety condition would take too long. Open the browser's developer console after selecting the named cat.

### Inspect the current cat

```js
document.querySelector("#cat").dataset.catId
document.querySelector("#cat").dataset.ability
document.querySelector("#cat").dataset.specialActive
window.catStudio.cat.brain.snapshot()
```

The first three lines confirm the selected cat, ability, and active special effect. The last line prints the complete live brain state.

### Select a cat directly

```js
window.catStudio.selectCat("glitch")
```

Replace `glitch` with any ID from the roster table.

### Trigger selected random abilities immediately

```js
const c = window.catStudio.cat;
const now = performance.now();

// Use only the line for the currently selected cat:
c.glitchStep(now);                                      // Glitch
c.shadowStep(now);                                      // Vanta
c.starDash(now);                                        // Nova
c.conjureToy(now);                                      // Mr. Mistoffelees; first deploy ball or box
c.rhythmBurst(now, c.currentToyTarget());                // Tempo; first deploy a toy
c.beginZeroGravity(now);                                 // Orbit; first deploy laser or fishing rod
```

### Force a resting ability check

Use this after selecting Halo, Melly, Chonk, or Sphinx:

```js
const c = window.catStudio.cat;
const now = performance.now();
c.brain.setAction("loaf", now, 5000);
c.setRenderState("loaf");
```

The normal animation loop should activate that cat's resting ability on the next frames.

### Test Bastet's ward

```js
window.catStudio.cat.brain.drives.anger = 0.31
```

The ward should activate on the next frame and reduce anger.

### Test Unsinkable Sam's recovery

```js
const c = window.catStudio.cat;
c.y = innerHeight + 80;
c.grounded = false;
c.updatePhysics(0.016, performance.now());
```

Sam should immediately return to the floor and the life count should decrease.

### Ask a navigation specialist to choose a route

```js
window.catStudio.cat.jumpToInterestingPlatform()
```

Use this with Root, Trim, Nocturne, or Sphinx while the cat is grounded.

## 7. Full-roster acceptance checklist

A roster build is ready to save when all of these are true:

- [ ] All 37 names appear in **Choose cat** exactly once.
- [ ] Every portrait and live cat has a complete head, ears, body, paws, and tail with no neighboring-cat fragments.
- [ ] Switching cats never shows the previous cat's colors or body parts.
- [ ] Every cat can be picked up, moved, released, and land flush on a surface.
- [ ] Every cat can reach the next webpage tier with a toy target.
- [ ] Only Root skips a tier with a super-bounce.
- [ ] Ball, laser, box, and fishing rod stay responsive without visible pointer lag.
- [ ] The box can be dragged and entered.
- [ ] **Put toy away** removes the active toy.
- [ ] Anger is visible in **Show brain** and hiss/claw reactions occur at the recorded thresholds.
- [ ] Each active ability meets its cat-specific pass condition above.
- [ ] Each passive/profile-driven cat is visibly different from Byte in the stated way.
- [ ] Performance Lite does not change gameplay outcomes.
- [ ] The automated test suite passes before pushing.

## 8. Known prototype boundaries

- The demo currently runs one selected cat at a time. Multi-cat social effects, relationships, and Oracle's nearby-cat aura are future systems.
- Rarity labels organize collection value; they do not automatically boost every stat. Each cat follows its own profile.
- Several common cats are intentionally grounded and believable rather than spectacular. Their difference is personality and tuning.
- Passive abilities such as Byte's steadiness, Patches' sleep bias, Marmalade's speed, Sudo's jump, Ember's force, Oracle's calm, Root's range, and Dot's scale do not always display a special text burst.
- Random abilities use chance plus cooldowns so the cats feel autonomous. A correct test may require waiting through more than one eligible moment.
- The current demo stores one active cat state for the session; long-term friendship, food attraction, merging, visitors, residents, and persistent history are planned systems rather than part of this test guide.

