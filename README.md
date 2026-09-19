# Lands of Jail — Trial Cage Formation Generator

A community Trial Cage formation generator for **Lands of Jail**, built around actual player rosters, Trial Cage testing, hero War skills, stars, robots, march capacity and troop ratios.

## Development Beta v1.46

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
- Main Rally uses the player's saved maximum march capacity
- Rally Joiners use the Trial Cage 100,000-troop march rule
- Configurable troop ratios and T1–T11 tiers; no troop-inventory entry required
- Exact troop-plan calculation
- Formation explanations showing why a LEFT hero was selected
- Hero portraits/icons in generated formations
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
- Checks robot availability against requested marches
- Flags LEFT War skills below Lv5
- Validates march capacity and troop ratios without checking troop inventory
- Detects hero reuse across generated formations
- Detects robot reuse
- Detects duplicate hero classes within a formation
- Detects generated heroes or robots not owned by the player
- Warns when fewer formations are generated than requested
- KOF event heroes are excluded from Trial Cage generation

### Other current features
- Season filtering through currently entered hero data
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

This batch is being developed on the **beta-development** branch. Production main remains at the v1.38 checkpoint until the development batch is reviewed and intentionally merged.

## What is next

Development after this seven-build batch:

1. **Remove the legacy TroopPlan dependency from formation APIs** — Main Rally generation should no longer need a hidden 100,000 compatibility plan.
2. **Season 6 verification** — test Otto, Wukong, Worrell and Kate in full six-Joiner generation and verify their exact LEFT War-skill data from game evidence.
3. **Six-Joiner recovery logic** — improve the generator so it can explain exactly why J6 cannot be formed and which class/LEFT hero is the bottleneck.
4. **War-skill data audit** — verify S1–S6 hero skill values and keep hero stars separate from War-skill rank.
5. **Prisoner Armor cleanup** — keep only Cage-relevant armor choices and simplify pre-Cage summaries.
6. **Formation card polish** — improve mobile readability, hero explanations and copy/share output.
7. **Build verification** — run the full production build, resolve type/lint errors, then merge to main only when the batch is ready for deployment.

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
