# Lands of Jail — Trial Cage Formation Generator

A community Trial Cage formation generator for **Lands of Jail**, built around actual player rosters, Trial Cage testing, hero War skills, stars, robots, march capacity and troop ratios.

## Development Beta v1.73

### Visual theme
- Tyronn-focused Trial Cage background based on the in-game Cage target
- Full Trial Cage game-interface skin with forged-metal panels, bronze/gold trim, deep-red accents and game-style controls
- Dark readability overlay and translucent glass-style panels
- Fixed cinematic desktop background with mobile-safe scrolling treatment

### Generator
- Rally Leader and Rally Joiner modes
- Season-aware hero roster filtering
- Hero ownership, 1–5 star levels and LEFT War-skill levels
- Class-aware Shieldbearer / Bomber / Shooter formation generation
- LEFT-slot War-skill priority for joiner formations
- Global LEFT-hero optimization to preserve stronger rally heroes
- Player-specific leader generation instead of a hardcoded leader trio
- Leader heroes reserved from joiner formations
- Non-overlapping generated joiner marches
- Robot ownership and non-repeating robot assignment
- Main Rally uses the player's maximum available troops
- Rally Joiners use either 10,000 Bombers + 90,000 Shooters or 100,000 Shooters
- No troop-inventory or obsolete troop-plan configuration is required
- Formation explanations showing why a LEFT hero was selected
- Hero portraits/icons in generated formations
- Season 7 hero support for Rin, Rex, Boogie and Fran & Pike with cropped in-game-style portraits
- Copy-ready individual and group formation output

### Direct generator
- Opens directly to Cage settings without player profiles or onboarding
- No player name, server identity, member switching or alliance profile backups
- Formation sharing and image download use the current selections
- Seat-holder toggle remains in Cage Setup

### Validation and readiness
- Detects missing hero classes
- Checks whether enough eligible heroes exist for the requested marches
- Checks whether enough LEFT-skill heroes exist for requested joiner marches
- Robot assignment is guidance and does not determine formation legality
- Flags LEFT War skills below Lv5
- Detects hero reuse across generated formations
- Detects robot reuse
- Detects duplicate hero classes within a formation
- Detects generated heroes or robots not owned by the player
- Warns when fewer formations are generated than requested
- KOF event heroes are excluded from Trial Cage generation

### Other current features
- Season filtering through Season 7 with screenshot-backed S7 hero data
- Felon ownership and leader Yard Time support
- Scorpion/Cobra core locks and rally-aware core selection
- Formation sharing/copy tools
- Browser-local saved data
- Responsive desktop/mobile interface
- Clean generator-focused interface for Main Rally and configurable Joiner formations
- General Trial Cage branding; CCW-specific recommendation rules are no longer used as global rules

## Beta v1.40–v1.46 development batch

- **v1.40** — Centralized the verified hero-star → maximum War-skill unlock rule.
- **v1.41** — Updated the page to use the shared War-skill calculation everywhere.
- **v1.42** — Added Joiner roster diagnostics for class and LEFT-skill shortages.
- **v1.43** — Incomplete J1–J6 generation now explains the specific roster blockers.
- **v1.44** — Replaced legacy Joiner troop-plan text with the two Cage troop options.
- **v1.45** — Synchronized the Troop Guidelines panel with 10k Bomber/90k Shooter or 100k Shooter Joiners.
- **v1.46** — Removed stale capacity-preview and obsolete troop-control page state.

## Beta v1.47–v1.53 development batch

- **v1.47** — Removed the hidden 100,000 Main Rally compatibility plan from page state.
- **v1.48** — Removed TroopPlan from automatic Main Rally and Joiner generator APIs.
- **v1.49** — Removed TroopPlan from manual/locked formation generation.
- **v1.50** — Formation validation no longer depends on obsolete troop-ratio warnings.
- **v1.51** — Formation output now uses the actual Cage guidance: Main Rally max troops; Joiners use 10k Bombers + 90k Shooters or 100k Shooters.
- **v1.52** — Joiner recovery diagnostics now respect Verified Skills Only mode.
- **v1.53** — Synchronized copy output, visible beta version and documentation.

## Beta v1.54–v1.63 development batch

- **v1.54** — Season 6 roster support checked for Otto, Wukong, Worrell and Kate in six-Joiner generation.
- **v1.55** — Season 6 skill evidence stays evidence-first: Worrell and Kate keep verified LEFT progressions; Otto/Wukong are not promoted without evidence.
- **v1.56** — Joiner diagnostics identify the class bottleneck and exact shortage.
- **v1.57** — Recovery diagnostics list eligible owned LEFT-skill alternatives.
- **v1.58** — Lock errors identify the conflicting hero, slot, or march.
- **v1.59** — Robot absence is separated from formation legality.
- **v1.60** — Cyber/Warlord robot-specific rules are kept out of normal Trial Cage logic.
- **v1.61** — Pre-Cage checklist copy is shorter while preserving effects and timing.
- **v1.62** — Formation cards improve mobile stacking, star visibility and LEFT-skill evidence labels.
- **v1.63** — Cleaned stale current-feature documentation and synchronized release versions.

## Beta v1.64–v1.73 development batch

- **v1.64** — Promoted the Season 7 roster integration into the current release line, including Rin, Rex, Boogie and Fran & Pike.
- **v1.65** — Fixed robot assignment so the Main Rally robot is not reused by J1; Joiners now receive the remaining selected robot pool.
- **v1.66** — Added a robot-pool preflight summary showing projected assignments and unassigned selected robots without treating shortages as formation errors.
- **v1.67** — Added a pre-generation roster simulator showing Main Rally reserves and the projected Joiner hero usage count/list.
- **v1.68** — Recovery ordering now uses the exact same LEFT-slot scoring model as automatic formation generation.
- **v1.69** — Added a Formation Preflight panel with class counts, LEFT-skill readiness, roster shortages and configuration conflicts before Generate.
- **v1.70** — Hero cards now show consistent VERIFIED LEFT, UNVERIFIED LEFT, NO LEFT DATA and EXCLUDED evidence badges.
- **v1.71** — Copy Instructions now includes the Main Rally plus roster blockers and ranked LEFT recovery options when Joiners are incomplete.
- **v1.72** — Clarified why MIDDLE/RIGHT support heroes are chosen and how stronger unused LEFT candidates are protected for later Joiners.
- **v1.73** — Updated exported formation-image branding/version/file name, synchronized package/UI versions and refreshed current documentation.

## What is next — next 10 changes

1. **LEFT comparison drawer** — show the next-best LEFT candidates beside each generated Joiner and explain the ranking inputs.
2. **Roster shortage actions** — turn each class/LEFT shortage into a compact “what to add” recovery checklist.
3. **Robot assignment controls** — allow optional per-march robot overrides while preserving no-reuse checks.
4. **Formation share card polish** — bring exported image layout in line with the current on-page cards and Season 7 portraits.
5. **Hero evidence details** — expose the verified Lv1–Lv5 progression and evidence note without cluttering the main hero grid.
6. **Import report upgrade** — show matched, unmatched and duplicate hero rows after roster text import.
7. **Data provenance pass** — add concise evidence/source notes to screenshot-verified season data and keep heuristic priority weights clearly separated from game percentages.
8. **Production smoke check** — verify the deployed build after the batch and fix only genuine compile/runtime blockers.
9. **Season-aware roster polish** — make season labels, newly unlocked heroes and current-season additions easier to scan in the hero grid.
10. **Mobile results polish** — tighten the Preflight and generated-formation layouts for smaller screens without hiding evidence or warning details.

### Deferred until direct account evidence is available

- **Season 6 evidence completion** — wait until Season 6 reaches Server 260, then capture exact Otto and Wukong War-skill progressions from direct screenshots.
- **Season 6 robot intake** — Season 6 also unlocks a new robot. Its name, icon, stats and Cage usefulness are currently unknown, so do not guess or add placeholder game data; capture it from Server 260 when Season 6 arrives.
- **Season 7 Cage testing notes** — wait until the Server 10004 account is developed enough for useful Trial Cage testing, then record real Rin, Rex and Boogie results without turning untested assumptions into hard rankings.

## Evidence rules

Trial Cage has RNG and some mechanics still require direct game verification. The generator distinguishes known game/account information from assumptions where possible. Joiner recommendations prioritize the first War skill of the hero physically placed in the **LEFT** slot, based on the Trial Cage testing used to build this project.

Exact hero skill values or mechanics that have not been verified should not be invented. When additional evidence is required, development will pause for a clean in-game screenshot or other source information.

## Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

This community project is not affiliated with Lands of Jail or its publisher.


### Beta v0.41
- Main Rally prefers the strongest owned Tyronn, Phoenix, or Xuanming for Shieldbearer.
- Mia and Tormund are excluded from Main Rally selection.
- Whisper corrected: Curse is not treated as a Trial Cage LEFT damage skill.


### Beta v0.42
- Main Rally now uses the player's maximum saved march capacity; Joiner marches are fixed at 100,000 troops.
- Troop readiness now validates Shieldbearers, Bombers and Shooters independently across requested marches.
- Main Rally meta preferences completed: strongest owned Tyronn/Phoenix/Xuanming Shieldbearer, Ryuichi Bomber when owned, and Ada Shooter when owned, with legal fallbacks.
- Manual/locked formations are now star-aware.
- Cage Result Lab remains hidden so the public interface stays focused on Main Rally and Joiner configuration.
- Existing season-aware profiles, profile export/import, formation comparison and alliance batch tools remain available.


### Beta v0.43
- Public wording cleaned up so the interface is Trial Cage focused instead of CCW branded.
- Main Rally cards now explain the full-capacity rule and preferred meta selection.
- Joiner cards now explain the fixed 100,000-troop rule and LEFT-skill/star priority.
- Failed joiner generation gives a more useful roster-recovery hint.
- Cage Result Lab remains hidden; the public experience stays focused on Main Rally and Joiner configuration.


### Beta v0.44
- Fresh visitors now start with neutral New Player defaults instead of historical account values.
- Existing locally saved player profiles remain intact.

### Beta v0.45
- Removed the unused Cage Result Lab state, comparison logic and result-storage wiring from the public generator.
- Legacy browser result data is left untouched rather than deleted.

### Beta v0.46
- Removed historical Stiletto-specific source defaults and migrations from normal profile loading.
- Saved profiles now load their own values without account-specific fallback data.

### Beta v0.47
- Removed remaining CCW wording from the main generator source and generalized backup/readiness labels.

### Beta v0.48
- Removed the obsolete runtime code that hid the old Cage Result Lab.
- Generator remains focused on Main Rally and configurable 100,000-troop Joiners.
- Switched the visual direction to the new Tyronn Trial Cage background.


### Beta v0.49
- Readiness now gives specific missing-class counts when the requested number of marches cannot be built.
- Joiner readiness reports exactly how many additional eligible LEFT-skill heroes are needed.
- Joiner readiness now consistently uses the fixed 100,000-troop Trial Cage rule.

### Beta v0.50
- Removed obsolete Cage Result Lab CSS left behind after the feature was removed.
- Added small public-generator layout cleanup for profile actions and readiness cards.


## Beta v0.51–v0.60 development batch
This batch is intentionally being developed away from `main` so intermediate beta commits do not need production Vercel deployments.

- **v0.51** — Added screenshot-verified 2-hour Prison Buff and Prisoner Armor data model.
- **v0.52** — Added a reusable pre-Cage activation checklist builder.
- **v0.53** — Added a safe capacity preview that keeps percentage, expedition-flat and rally-flat bonuses separate until stacking order is verified.
- **v0.54** — Added readable effect labels for all verified buffs.
- **v0.55** — Separated Prison Buffs from Prisoner Armor skills and identified the common 2-hour prison-buff set.
- **v0.56** — Added reusable per-player Cage buff settings with a configurable activation lead time.
- **v0.57** — Added validation for saved/unknown/duplicate buff selections.
- **v0.58** — Added compact pre-Cage buff summary text for future UI/sharing output.
- **v0.59** — Added pre-Cage timing/reminder helper based on selected buff duration.
- **v0.60** — Consolidated and documented the first complete pre-Cage buff framework without guessing the game's capacity stacking formula.

Verified screenshot data currently represented: Troops ATK +11%, Troops Lethality +11%, Expedition Capacity +11%, Comprehensive Command Lv.9 +11,250 expedition capacity, Pinpoint Suppression Lv.10 +10% HP, Overload Charge Lv.6 +96,000 rally capacity, Valiant Breach Lv.4 +4% Lethality, Penetrating Ray Lv.10 +10% enemy DEF reduction, and Orbital Strike Lv.5 +4% expedition ATK. All shown effects last 2 hours after activation.


## Beta v0.61–v0.70 development batch
- **v0.61** — Pre-Cage selections persist with each player profile and profile export/import.
- **v0.62** — Added the interactive Pre-Cage Buffs & Prisoner Armor panel.
- **v0.63** — Added responsive desktop/mobile styling for the new panel.
- **v0.64** — Added neutral offense/capacity/support categorization without claiming an optimal setup.
- **v0.65** — Added shareable pre-Cage checklist output.
- **v0.66** — Copied Trial Cage instructions now include the player's pre-Cage setup.
- **v0.67** — Added warnings when multiple unverified capacity stacking effects are selected.
- **v0.68** — Capacity verification warnings are now visible in the UI.
- **v0.69** — Improved selected-buff and warning visibility.
- **v0.70** — Consolidated the complete first interactive Pre-Cage UI batch for later merge/deployment.


## Beta v0.71–v0.80 development batch
- **v0.71** — Added per-felon unbuffed rally-capacity storage so felon-specific baselines can be recorded without becoming global game assumptions.
- **v0.72** — Separated unbuffed Main Rally capacity wording from temporary Cage buffs.
- **v0.73** — Added a capacity-observation model for future in-game stacking tests.
- **v0.74** — Strengthened the Pre-Cage checklist presentation.
- **v0.75** — Added a compact profile setup dashboard.
- **v0.76** — Redesigned normal Cage troop entry around Bombers and Shooters; Shieldbearer troops are no longer presented as a standard Cage input.
- **v0.77** — Added clearer Main Rally capacity and troop-ratio context.
- **v0.78** — Clarified the fixed 100,000 Joiner rule and LEFT War-skill priority.
- **v0.79** — Added responsive polish for the new dashboard and troop setup.
- **v0.80** — Removed the stale runtime beta-badge override, preserved felon-capacity profile data, and synchronized the development milestone version.

Capacity stacking remains intentionally uncalculated until direct in-game observations verify the order/formula. Known account observations should be stored per player rather than hardcoded as universal values.


## Beta v0.81–v1.00 development batch
- **v0.81** — Capacity test observations can be stored with player profiles.
- **v0.82** — Capacity observations persist through the active profile snapshot.
- **v0.83** — Added an interactive capacity test recorder for actual in-game displayed values.
- **v0.84** — Added responsive styling for the capacity recorder.
- **v0.85** — Added observation comparison math (delta and percent over base) without inferring a stacking formula.
- **v0.86** — Added a clear-recorded-tests control.
- **v0.87** — Added quick 0/0/100 and 0/10/90 Cage ratio controls.
- **v0.88** — Styled the quick Cage ratio controls.
- **v0.89** — Added optional Advanced Shieldbearer troop controls while keeping them hidden from normal Cage setup.
- **v0.90** — Styled the advanced troop control.
- **v0.91** — Added evidence collection states for capacity testing.
- **v0.92** — Displayed capacity evidence status in the recorder.
- **v0.93** — Styled evidence-status indicators.
- **v0.94** — Added a profile setup completion meter.
- **v0.95** — Polished the setup meter.
- **v0.96** — Added a one-click reset to zero Shieldbearer troops.
- **v0.97** — Clarified formation recovery: Shieldbearer-class hero requirement does not imply Shieldbearer troops.
- **v0.98** — Removed account-specific robot-priority wording from the public generator.
- **v0.99** — Generalized Main Rally recommendation wording so account-specific testing is not presented as a universal rule.
- **v1.00** — Completed the 20-build development milestone and synchronized the visible development version.

The capacity recorder is intentionally evidence-first. It records actual displayed capacities and selected buffs, but it does not invent a final capacity-stacking formula.


## Beta v1.01–v1.06 — KOF Main Rally links
- Player profiles now persist KOF Main Rally links.
- Owned KOF heroes become linkable only at ★4 or ★5.
- KOF heroes remain excluded from Joiner LEFT recommendations.
- Season 5 link targets follow hero class: Omega Rugal → Tyronn, Terry Bogard → Ryuichi, Mai Shiranui → Ada.
- KOF links can target SSR Main Rally heroes only; SR heroes such as Flameborne cannot be linked.
- Links are player-selected replacements, not automatic claims that a KOF hero is stronger.
- Generated Main Rally output displays active KOF replacement links.


## Beta v1.10–v1.20 development batch
- **v1.10** — KOF-linked heroes are valid in Main Rally while remaining blocked from Joiners.
- **v1.11** — Hardened KOF replacement targets to the verified SSR link pairs.
- **v1.12** — Added a full-capacity troop assignment consistency check.
- **v1.13** — Added live exact Main Rally troop counts and total.
- **v1.14** — Removed stale Cage-hit-history backup wording.
- **v1.15** — Capacity observations now show both absolute and percentage deltas.
- **v1.16** — Expanded the Pre-Cage checklist with capacity, ratio and robot readiness.
- **v1.17** — Reinforced the fixed 100,000-troop Joiner rule in the interface.
- **v1.18** — Improved formation recovery guidance when a robot is missing.
- **v1.19** — Generalized remaining backup wording.
- **v1.20** — Synchronized the visible development badge and package versions for the stabilization milestone.

Season 6 hero work is intentionally deferred until direct in-game evidence is available.

## Beta v1.23 — Complete inventory-free Cage setup
- Removed remaining troop-count inputs from guided onboarding and inventory shortage checks from saved-player and alliance generation.
- All troop plans now use march capacity and ratios, including imported profiles with zero legacy inventory.
- Legacy inventory data stays compatible with profile imports and exports; no artificial stock counts are saved.
- Main Rally capacity, ratio validation, troop tiers, and fixed 100,000-troop Joiners remain in place.

### Deployment
Vercel Git deployments are enabled for the v1.23 release. Commits to the production branch deploy through the existing Vercel integration.

## Beta v1.24 — Remove player profiles
Removed profile management, member overview, alliance readiness and batch panels, and onboarding. The generator uses the selections on the page directly. Existing browser profile data is left untouched but is no longer read or written.

## Beta v1.25 — Remove Capacity Test Recorder
Removed the capacity recording panel, recording controls and page state. Main Rally capacity and the pre-Cage capacity preview remain available.
