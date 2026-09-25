# Lands of Jail — Trial Cage Formation Generator

A community tool for building **one Main Rally plus up to six Joiner rallies** in **Lands of Jail**.

**Created by Stiletto of Server 260.**

Live site: https://lands-of-jail-trial-cage-generator.vercel.app

## Current release

**Beta v2.56**

The generator is designed for players across Lands of Jail rather than one server or alliance. The normal workflow stays simple, while testing, evidence, diagnostics, and alliance-oriented tools remain optional.

### What's new in v2.56

- **LEFT Hero Comparison** compares two owned LEFT candidates using entered War-skill data, stars, skill level, evidence status, and recommendation basis without inventing a damage winner.
- **Personal-best progression** automatically finds record-breaking hits in saved Cage history.
- **Community evidence guide** explains what screenshots and information are useful for correcting or expanding the database.
- Includes the v2.55 recommendation explanations, Cage sessions, season-transition helper, and S1–S6 data-quality dashboard.
- Includes the v2.54 generator self-check and the start of the ongoing component cleanup/refactor.

## Quick start

1. Choose your current season.
2. Choose how many Joiner rallies you want.
3. Select the heroes you actually own and set their star levels.
4. Press **Generate My Cage Setup**.
5. Use the generated **Main Rally + J1–J6** formations.

The browser remembers the core quick setup: season, Joiner count, selected heroes, and star levels.

## Formation model

- Main Rally is a full **Shield + Bomber + Shooter** formation and uses the player's maximum available troops.
- Joiners prioritize the hero physically placed in the **LEFT** slot and that hero's first War skill.
- Joiners default to full three-hero formations when enough eligible support is available.
- **LEFT HERO ONLY FOR JOINERS** intentionally leaves MIDDLE and RIGHT empty.
- Full-mode MIDDLE/RIGHT support requires **3★+** heroes, prefers SSR over SR, and protects useful future LEFT candidates from being consumed as filler.
- Main heroes are reserved and cannot be reused in Joiners.
- Joiner heroes are not reused across J1–J6.
- KOF heroes are excluded from Joiner generation.
- Joiner troop instructions can be set to **90K total** or **100K total**. The generator does not invent an alliance-specific troop mix.
- Robots are optional guidance and do not determine formation legality.

## Evidence-first recommendations

Game evidence and generator recommendations are deliberately separate.

The generator can show why a LEFT hero was selected, including the recorded first War skill, skill level, verified percentage when available, and the recommendation basis. A verified skill does **not** automatically mean a hero receives a high Cage priority.

Unknown values stay unknown. The project does not extrapolate missing percentages or treat unverified community reports as established game data.

## Season coverage

The hero database supports seasons through **Season 7**. Active refinement currently focuses on **S1–S6**.

Season 6 includes direct first/LEFT War-skill evidence for **Otto, Wukong, Worrell, and Kate**. Bastion is the verified S6 robot. Its Shockwave Crush evidence is retained, but enemy ATK reduction is not treated as a Cage damage buff.

Existing S7 screenshot-backed data includes **Rin, Rex, Boogie, and Fran & Pike**. S7 support remains available, but active recommendation tuning is intentionally deferred until stronger Cage evidence is available.

See **[Season 6 evidence intake](docs/season-6-evidence.md)** for the detailed S6 evidence work.

## Advanced / optional tools

None of these are required for normal generation:

- Robots and robot priority/overrides
- Felons
- Prison Buffs and Power Armor
- LEFT filters and verified-only filtering
- Formation pinning
- Hero evidence details
- Roster backup/import
- Formation comparison
- LEFT Hero Comparison
- Preflight/recovery diagnostics
- Generator data self-check
- S1–S6 data-quality summary
- Community evidence guidance

## Actual Cage results

The optional browser-local Cage tracker can record real damage hits from generated setups.

It provides:

- Hit count, best, average, and total damage
- Damage-history chart
- Results grouped by exact setup
- Sessions grouped by date
- Personal-best progression
- Editable notes/damage
- JSON export/import backup

Cage records are personal testing data. They **do not change universal recommendation rankings**.

Records are stored in browser local storage, so exporting a JSON backup is recommended before clearing browser data or moving to another browser/device.

## Season transition helper

When a season is selected, the generator can show heroes introduced in that season, their class/rarity, recorded LEFT skill, evidence status, and current generator role.

This is an information aid—not a claim that a newly unlocked hero is automatically stronger than an older hero.

## Data integrity

The generator self-check looks for problems such as:

- Duplicate hero or robot names
- Invalid season values
- Verified skills without skill text
- Malformed Lv1–Lv5 progressions
- Cage-priority data without corresponding LEFT-skill data
- Missing S1–S6 class coverage

Regression coverage also stress-tests S1–S6 generation, Main reservations, no hero reuse, LEFT-only/full-mode behavior, 3★ support requirements, SSR support preference, protected LEFT candidates, and verified-only generation.

## Power Armor

Verified Cage-relevant Power Armor data currently includes:

- **Infercore — Comprehensive Command:** Lv1–Lv9
- **Atlax — Orbital Strike:** Lv1–Lv9
- **Halo — Overload Charge:** Lv1–Lv10, including Lv10 **+160,000 Rally Troop Capacity**
- **Yokozuna — Valiant Breach:** Lv1–Lv10

Utility/non-Cage Pilot skills are kept out of Cage buff recommendations. Unknown values are not extrapolated.

## Sharing and mobile use

Generated setups can be copied individually or as a full setup for alliance sharing. Results can also be printed or exported as an image. The interface includes mobile-specific layout adjustments and a compact formation overview.

## Community evidence

Useful evidence is a clear in-game screenshot showing the hero name and War skill screen. When possible, include the season, rarity, first/LEFT War-skill text, and displayed Lv1–Lv5 values.

Submitted information is reviewed before changing the database. Evidence alone does not automatically establish a Trial Cage recommendation or ranking.

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

Run the full project check:

```bash
npm run check
```

Run a production build:

```bash
npm run build
```

The project uses Next.js 15. The release goal is passing tests/type checks plus a successful production deployment.

The codebase is also undergoing a gradual component refactor. Large page sections are being extracted incrementally rather than through a high-risk rewrite.

## Project history

The README describes the current product rather than carrying every historical beta note.

See **[CHANGELOG.md](CHANGELOG.md)** for detailed release history.

---

This community project is not affiliated with Lands of Jail or its publisher.
