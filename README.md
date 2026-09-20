# Lands of Jail — Trial Cage Formation Generator

A community tool for building **one Main Rally plus up to six Joiner rallies** in **Lands of Jail**.

**Created by Stiletto of Server 260.**

Live site: https://lands-of-jail-trial-cage-generator.vercel.app

## Current release

**Beta v2.09**

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
- Worrell and Kate have recorded LEFT progressions
- Otto and Wukong remain evidence-first where exact values are not yet verified
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
