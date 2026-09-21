# Lands of Jail — Trial Cage Formation Generator

A community tool for building **one Main Rally plus up to six Joiner rallies** in **Lands of Jail**.

**Created by Stiletto of Server 260.**

Live site: https://lands-of-jail-trial-cage-generator.vercel.app

## Current release

**Beta v2.22**

### Beta v2.20 — multilingual public interface

The header now includes a compact language selector for English, Spanish, Portuguese, German, French, Italian, Polish, Turkish, Russian, Japanese, Korean, and Simplified Chinese. The browser language is used on first visit when supported, the visitor's choice is remembered locally, and English remains the fallback. Core public setup/results labels are translated; hero, skill, robot, and other in-game proper names remain unchanged unless official localized names are verified.

The public workflow is intentionally simple:

1. Choose your server season.
2. Choose how many Joiner rallies you want.
3. Select the heroes you own and set their star levels.
4. Press **Generate My Cage Setup**.
5. Use the generated **Main Rally + J1–J6** formations.

The browser remembers the core quick setup: season, Joiner count, selected heroes, and star levels.

## Core formation rules

- Every formation uses exactly **1 Shield + 1 Bomber + 1 Shooter hero**.
- Main Rally uses the player's **maximum available troops**.
- Joiners use **10,000 Bombers + 90,000 Shooters** or **100,000 Shooters**.
- Joiner recommendations prioritize the hero physically placed in the **LEFT** slot and that hero's first War skill.
- Main Rally heroes are reserved and cannot be reused in Joiners.
- Joiner heroes cannot be reused across J1–J6.
- KOF heroes remain excluded from Joiner generation.
- Robots are optional guidance and do not determine formation legality.
- The generator does not invent missing game values.

## Simple first, advanced when needed

The normal page stays focused on hero selection and formation generation.

The collapsed **Advanced / Optional Setup** area contains the extra tools:

- Robots and robot priority/overrides
- Felons
- Prison Buffs and Power Armor
- LEFT filters
- Formation pinning
- Evidence details
- Roster backup/import tools
- Formation comparison
- Preflight and recovery diagnostics

None of those are required to generate normal Main + Joiner formations.

## Current hero/data coverage

- Season-aware hero support through **Season 7**
- Screenshot-backed S7 data for **Rin, Rex, Boogie, and Fran & Pike**
- Season 6 hero entries for **Otto, Wukong, Worrell, and Kate**
- All four S6 heroes now have direct screenshot-backed first/LEFT War-skill evidence recorded
- **Otto — Natural Hymn:** Tactical DMG Taken Reduction 12/24/36/48/60% and Basic Attack DMG Taken Reduction 8/16/24/32/40%
- **Wukong — Calamity Inferno:** Lv1–Lv5 progression 30/60/90/120/150%
- The new Season 6 robot is intentionally not added until direct screenshots verify its identity and effects

See [Season 6 evidence intake](docs/season-6-evidence.md).

## Power Armor data

Verified Cage-relevant Power Armor data currently includes:

- **Infercore — Comprehensive Command:** Lv1–Lv9
- **Atlax — Orbital Strike:** Lv1–Lv9
- **Halo — Overload Charge:** Lv1–Lv10, including Lv10 **+160,000 Rally Troop Capacity**
- **Yokozuna — Valiant Breach:** Lv1–Lv10

Infercore and Atlax max at Lv90/Lv9. Halo and Yokozuna support Lv10 where directly verified.

Unknown values are left unverified instead of being extrapolated.

## Beta v2.19 — simple results and reliability pass

- Simplified Joiner result wording and collapsed technical LEFT explanations into compact skill details.
- Incomplete results now lead with the first plain-language shortage instead of a long diagnostic dump.
- Added regression coverage for documented Main Rally class priorities.
- Added season-by-season legality/no-reuse tests through Season 7.
- Added hero database integrity checks for duplicate names, class/season validity, verified LEFT evidence, five-level skill arrays, and KOF exclusion.
- Added evidence-first guards for S6/S7 LEFT data and explicit caveats on promoted S7 heuristic priorities.

## Beta v2.18 — evidence and ranking regression guard

The current pre-S6 evidence pass is now protected by regression tests:

- Every pre-S6 non-R Cage hero that has a recorded LEFT skill must keep a verified five-level progression.
- Marcus, Caesar, Zoltan, Gerd, Vesaryon, Whisper, and Platos are explicitly guarded against accidental Cage-priority promotion until direct Cage evidence supports one.
- The existing Season 5 Main + six-Joiner legality/no-reuse/KOF/R regression tests remain in place.

The audit found no remaining pre-S6 non-R hero with a recorded LEFT skill that lacks a verified Lv1-Lv5 progression. Heroes whose skills have not been directly captured remain unguessed.

## Beta v2.17 — remaining pre-S6 War-skill evidence

Direct screenshots supplied on 2026-09-20 now record the displayed War-skill sets for **Marcus, Caesar, Zoltan, Gerd, Vesaryon, Whisper, and Platos**.

- Exact displayed Lv1-Lv5 progressions are recorded for each first/LEFT War skill.
- Additional War-skill progressions shown in the screenshots are preserved in hero notes.
- Defensive, utility, conditional, and untested effects do not receive unsupported Trial Cage priority promotions.
- This closes the specific pre-S6 evidence gaps identified by the v2.16 audit.

## Beta v2.16 — pre-S6 audit and simple-results pass

Five-part maintenance pass completed without adding controls to the simple setup:

1. **Hero evidence audit:** remaining pre-S6 screenshot gaps are explicitly marked for Marcus, Caesar, Zoltan, Gerd, Vesaryon, Whisper, and Platos.
2. **Cage priority audit:** newly verified offensive first/LEFT skills receive conservative generator weights only where the screenshots support an offensive effect; defensive and utility skills remain unpromoted.
3. **Season 5 six-Joiner regression:** tests exercise Main + J1-J6 across star scenarios and assert class legality, no reuse, and no KOF/R Joiners.
4. **Simple results cleanup:** technical next-best LEFT comparisons and informational formation notices are removed from the normal results path; actionable warnings remain.
5. **Season 6 freeze:** unknown Season 6 hero and robot values remain deferred until direct evidence is available.

## v2.15 Edwin War-skill evidence

Direct screenshots supplied on 2026-09-20 now verify Edwin's complete three-skill War kit and Lv1-Lv5 progressions.

## v2.14 War-skill evidence expansion II

Direct screenshots supplied on 2026-09-20 now verify complete War-skill sets for **Ada, Mireya, Drake, Sawyer, Devilian, Inata, and Mia Scarlet Pyros**.

- Added exact displayed Lv1–Lv5 progressions for all seven first/LEFT War skills.
- Recorded the verified second and third War-skill mechanics in hero evidence notes.
- Kept utility and conditional skills from receiving unsupported Trial Cage priority changes.

## v2.13 War-skill evidence expansion

Direct screenshots supplied on 2026-09-20 now verify complete War-skill sets for **Samir, Flameborne, Lee, Tormund, Alph, and Lanchester**.

- The hero database records the exact displayed Lv1–Lv5 progressions.
- First/LEFT skills are identified separately from second/third War skills so useful support effects do not get mistaken for LEFT bonuses.
- Existing Cage priority tiers are not promoted solely from these screenshots; effects that need Cage testing remain conservatively ranked.

## v2.11 Season 5 Shield fallback support

Season 5 has only six usable SSR Shield heroes, while one Main Rally plus six Joiners requires seven different Shields. To avoid forcing players to wait for or heavily spend on Otto in Season 6:

- **Gerd, Iwado, and Vesaryon** are now visible as SR Shield support fallbacks.
- The normal Main Rally still prefers the existing SSR Main choices.
- These SR Shields have no offensive LEFT priority and are used as MIDDLE/RIGHT support when the SSR Shield pool runs short.
- Added cleaned icons for all three support heroes.
- This lets a Season 5 roster build a full Main + J1–J6 when the player owns enough heroes in the other classes.

## v2.10 Season 6 evidence correction

- Corrected the older Otto/Wukong “deferred” note after reviewing the screenshots already supplied.
- Added Otto's verified **Natural Hymn** first/LEFT skill progression to hero data.
- Added Wukong's verified **Calamity Inferno** Lv1–Lv5 progression to hero data.
- Kept their generator priority neutral unless Trial Cage testing supports a stronger ranking.

## v2.09 reliability work

The current release also adds:

- Shared Main Rally reservation for Joiner generation
- Safer pinned-Main handling
- Joiner generation that keeps trying later LEFT candidates when an earlier one cannot complete a legal march
- Saved-setup validation for unknown heroes and invalid star values
- Season-change protection so later-season selections return when switching back
- Optional actual LEFT War-skill level entry inside hero evidence details
- Clear shortage/recovery messages for incomplete rally sets
- Regression tests for reuse, pinned Main, partial rosters, and bad saved data

Stars determine the highest **unlocked** LEFT War-skill level. By default, the generator assumes that unlocked maximum unless the player enters a lower actual level in the optional skill details.

## Sharing and mobile use

- Copy MAIN or any Joiner formation individually
- Copy the full alliance instruction block
- Download a formation image
- Use **Results Only** for cleaner sharing/printing
- Mobile layout includes a sticky Generate button
- Generated cards show LEFT / MIDDLE / RIGHT clearly

## Evidence policy

Trial Cage has RNG, and some mechanics still require direct in-game verification.

Exact hero skills, robot effects, Power Armor values, or other mechanics are not added as facts unless we have reliable direct evidence. Unknown data stays marked as unknown instead of being guessed.

## Development

Install and run locally:

```bash
npm install
npm run dev
```

Run regression tests:

```bash
npm test
```

Run the production build check:

```bash
npm run build
```

The release gate is a passing test/build plus a successful deployment.

## Project history

The detailed beta-by-beta history was moved out of this README to keep this page useful and readable.

See **[CHANGELOG.md](CHANGELOG.md)** for the full development history.

---

This community project is not affiliated with Lands of Jail or its publisher.


## Beta v2.21 — translation and reliability pass

- Expanded localization into the Advanced / Optional Setup area, including pre-Cage, Power Armor, backup, bulk-star and skill-detail controls while leaving game proper names unchanged.
- Corrected the English subtitle/helper localization fallback introduced in v2.20.
- Refreshed the S6 hero icons for Worrell, Kate and Wukong from unlocked Server 260 screenshots.
- Server 260 is now in Season 6. S6 evidence collection is active; unknown hero/robot values remain evidence-first and are not guessed.
- Rechecked the simple public workflow contract: season → Joiner count → heroes/stars → Generate; Advanced remains collapsed and optional.


### Beta v2.22 — Season 6 live
Server 260 is now in Season 6. Worrell, Kate and Wukong War-skill evidence is already recorded. Bastion is confirmed as the S6 robot. Shockwave Crush is verified Lv1–10: Enemy ATK Reduction 2/2.5/3/4/5/6/7/8/9/10%, lasting 2h with a 20h cooldown. Bastion's Core Skill remains unknown until direct evidence is available. The simple default workflow remains unchanged and Advanced stays optional.
