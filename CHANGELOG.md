# Changelog — Lands of Jail Trial Cage Formation Generator

This file contains the detailed development history that was previously stored in the main README.

For the current project overview, quick-use instructions, evidence policy, and development commands, see [README.md](README.md).

> Current public release: **Beta v2.13**

## Beta v2.13 — War-skill evidence expansion

- Added screenshot-verified War-skill data for Samir, Flameborne, Lee, Tormund, Alph, and Lanchester.
- Recorded their first/LEFT skill Lv1–Lv5 progressions and the verified second/third War-skill effects in hero evidence notes.
- Preserved conservative Trial Cage priority where screenshots verify mechanics but do not prove Cage performance.

## Beta v2.12 — Clearer Shield recovery

- Explain Shield shortages after the actual Main reserve, including pinned Main heroes.
- List unselected Shield options available in the chosen season, with ownership guidance.
- Explain SR Shield support and distinguish hero class from troop instructions.

## Beta v2.11 — Season 5 Shield fallback support

- Added **Gerd, Iwado, and Vesaryon** to the streamlined hero picker as SR Shield support fallbacks.
- Added cleaned hero icons for all three.
- Follow-up wiring fix: the core generator and saved quick-setup allow-list now include all three SR Shield fallbacks, matching the visible picker.
- Main Rally SSR preference remains unchanged.
- The three SR Shields carry no offensive LEFT priority; they fill support slots when the Season 5 SSR Shield pool cannot cover Main + six Joiners.
- Added a regression test for a full Season 5 Main + J1–J6 using the visible fallback roster.

## Beta v2.10 — Season 6 evidence correction

- Corrected the stale Otto/Wukong deferred-evidence notes.
- Recorded Otto's screenshot-verified **Natural Hymn** first/LEFT skill: Tactical DMG Taken Reduction 12/24/36/48/60% and Basic Attack DMG Taken Reduction 8/16/24/32/40%.
- Recorded Wukong's screenshot-verified **Calamity Inferno** first/LEFT progression: 30/60/90/120/150%.
- Kept Otto and Wukong without an asserted offensive Trial Cage priority tier until testing supports one.
- Season 6 robot identity/effects remain pending direct evidence.

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

## Beta v1.74–v1.83 development batch

- **v1.74** — Added per-Joiner LEFT comparison drawers showing the next-ranked candidates, War-skill level, evidence state and clearly labeled internal generator score.
- **v1.75** — Added a compact “What to add” recovery checklist for Shield, Bomber, Shooter, LEFT-skill and total-roster shortages.
- **v1.76** — Added optional per-march robot overrides. Pinning a robot automatically rebalances the other marches while preserving the no-reuse rule.
- **v1.77** — Rebuilt the downloadable formation share card to match the current dark/gold UI more closely and include hero portraits, stars, LEFT evidence, troops and robot assignments.
- **v1.78** — Added expandable hero evidence details with Lv1–Lv5 progression, evidence notes, priority-model notes and existing hero notes.
- **v1.79** — Upgraded text roster import with a visible report for matched heroes, unmatched rows and duplicate rows.
- **v1.80** — Added explicit provenance notes to entered S6/S7 data and separated heuristic generator priority weights from actual in-game percentages.
- **v1.81** — Kept production build/type checking as the release gate for the combined batch; only genuine compile/runtime blockers are to be fixed after deployment.
- **v1.82** — Grouped the hero browser into current-season additions and earlier/legacy heroes so new unlocks are easier to scan.
- **v1.83** — Tightened mobile Preflight, status, robot, comparison, evidence and formation layouts without hiding warning/evidence details.

## Beta v1.84–v1.87 Power Armor configuration update

- **v1.84** — Power Armor was separated from the original Server 260 armor levels so each player could enter their own level/effect instead of inheriting one account's values.
- **v1.85** — Replaced manual effect entry for verified levels with direct screenshot-backed level tables: Comprehensive Command Lv1–9 (+1,250 to +11,250 expedition capacity), Overload Charge Lv1–9 (+16,000 to +144,000 rally capacity), Orbital Strike Lv1–9 (+2.0% to +6.0% expedition-troop ATK), and Valiant Breach Lv1–10 (+2.0% to +10.0% troops lethality). All four screenshots confirm 2h duration and 20h cooldown.
- **v1.86** — Corrected robot-specific skill caps: Infercore Comprehensive Command and Atlax Orbital Strike stop at Lv9 because those Power Armor tracks max at Lv90, so Lv10 is no longer offered for either skill.
- **v1.87** — Added screenshot-verified Halo Overload Charge Lv10: +160,000 Rally Troop Capacity for 2h, unlocking after Power Armor breakthrough Lv100.

## Beta v1.88–v1.97 development batch

- **v1.88** — Exposed the formation slot-lock engine as a pinning UI for MAIN and J1–J6, with the existing class, reuse and LEFT-skill legality checks still enforced.
- **v1.89** — Added LEFT eligibility filters for hiding filler skills and limiting Joiner LEFT candidates to Shield, Bomber or Shooter while keeping those heroes available as support.
- **v1.90** — Added player-controlled robot priority ordering for automatic assignment, alongside the existing per-march robot overrides and no-reuse protection.
- **v1.91** — Added a bulk star editor for all currently selected heroes.
- **v1.92** — Added portable JSON setup export including roster, stars, robots, robot priority, season, Joiner count, felons, filters and Power Armor settings.
- **v1.93** — Added one-step JSON setup restore while keeping the plain-text hero importer available.
- **v1.94** — Added an evidence-completeness dashboard showing verified LEFT data, partial LEFT data, intentionally deferred evidence and heroes without LEFT priority data by season.
- **v1.95** — Added a two-slot formation comparison workspace for saving and comparing formation choices without presenting either setup as a guaranteed damage winner.
- **v1.96** — Added keyboard/accessibility improvements including a skip link, visible focus states, ARIA pressed states and clearer control labels.
- **v1.97** — Completed the production regression pass for this batch; deployment/build status is the release gate and only confirmed errors are patched afterward.

## Beta v1.98 simplification pass

- Returned the public experience to the original goal: select a season, choose 1–6 Joiners, select heroes/stars, and generate one Main Rally plus the requested Joiner rallies.
- Added the requested top-page credit: **Created by Stiletto of Server 260**.
- Moved Robots, Felons, Power Armor, Prison Buffs, advanced LEFT filters, hero pinning, evidence dashboards, comparison tools and JSON setup utilities behind one collapsed **Advanced / Optional Setup** section.
- Robot selection is now truly optional: having no robot selected is informational and no longer turns a legal formation into REVIEW status.
- Optional seat and Felon details stay out of generated results unless the player actually configured them.
- Copied alliance instructions omit the entire pre-Cage buff block when no buffs were selected.
- Kept the essential troop rule as a single compact line beneath Generate instead of a separate configuration panel.

## Beta v1.99–v2.08 simple workflow batch

- **v1.99** — Added compact selected hero counts by Shield, Bomber and Shooter without adding search or class-filter controls to the main screen.
- **v2.00** — Cleaned the generated Main/Joiner cards with clearer LEFT/MIDDLE/RIGHT labels and larger hero portraits.
- **v2.01** — Added a small copy button to MAIN and every individual Joiner formation.
- **v2.02** — Added a Results Only view plus print-friendly output for sharing the generated formations without the setup controls.
- **v2.03** — The core quick setup now automatically remembers server season, Joiner count, selected heroes and star levels in the browser.
- **v2.04** — Added a plain-language shortage message outside Advanced when the requested Main/Joiner set cannot be completed.
- **v2.05** — Added a confirmed Start Over action that resets only the simple core setup.
- **v2.06** — Added a mobile sticky Generate button so phone users do not have to scroll back after selecting heroes.
- **v2.07** — Added a compact result summary showing Main readiness, Joiners built and selected hero count.
- **v2.08** — Completed the production regression/deployment pass for the simple-workflow batch.

## One-click reliability and Season 6 readiness

### v2.09 changes

1. Main and Joiners share the displayed Main formation for hero and robot reservation.
2. Generator and setup regression tests cover reuse, pinned Main, partial rosters, and bad saved data.
3. A LEFT candidate that cannot complete a march no longer stops consideration of later candidates.
4. Quick local storage and JSON restore sanitize star values; local save errors do not block generation.
5. Changing to an earlier season reports temporarily unavailable selected heroes without erasing them.
6. Results explain the star-based skill-level assumption; hero evidence details accept an actual skill level.
7. Incomplete results link directly to hero selection and give class/LEFT shortage guidance.
8. Season 6 hero evidence intake records the verified and pending skill data.
9. Season 6 robot acceptance checks are recorded; game data remains pending screenshots.
10. README release guidance and exported image version text were synchronized; tests and build pass.

The quick path is season → Joiner count → owned heroes and stars → Generate. The displayed Main Rally is the source of truth for hero and robot reservation in Joiners, including a pinned Main. Joiner generation considers additional LEFT candidates if an earlier candidate cannot fill all three classes. A partial result shows a recovery message and a link to hero selection. Robots remain optional.

Selected heroes from later seasons remain saved when switching to an earlier season; they are labeled unavailable and return when that season is selected again. Browser-local quick setup saves season, Joiner count, roster, and stars. Unknown heroes and invalid star values are discarded on restore; unavailable browser storage never blocks generation. JSON restore applies the same star checks.

Stars establish the highest *unlocked* LEFT War-skill level, not proof of the level upgraded in-game. The default result assumes that unlocked maximum. Set a lower actual level in a hero's optional Skill & evidence details when known. Such manual skill levels are for the current page session; the quick saved setup only includes the four fields listed above.

[Season 6 evidence intake](docs/season-6-evidence.md) tracks Otto, Wukong and the new robot. Their unknown data stays out of the generator until direct evidence exists. Worrell and Kate already have recorded LEFT progressions. A robot will be added only after its identity and effects are verified.

Run `npm test` for generation and saved-setup regression checks, then `npm run build` before release. Review the Main plus six Joiner output at phone width, including focus and print views. Update this section in the same PR as any behavior change.

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

Historical v0.60 note: the initial evidence covered common 2-hour Prison Buffs and four Cage-relevant Power Armor skills. Later verified levels, including Halo Overload Charge Lv10, are listed above. The screenshots confirm a 2-hour effect duration and 20-hour cooldown for these Power Armor skills. Values outside the captured level ranges are not inferred.


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

Historical note: at v1.20, Season 6 hero work was deferred; current evidence status is tracked above.

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

