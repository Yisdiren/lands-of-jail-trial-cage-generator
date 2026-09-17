# Lands of Jail — Trial Cage Formation Generator

An evidence-based Trial Cage formation generator inspired by the workflow of the Whiteout Survival Bear Trap formation tools, but designed specifically around Lands of Jail mechanics and real Cage testing.

## Current v0.1

- Rally Leader / Rally Joiner modes
- Season filter through S6
- Hero ownership selector
- Class-aware formation generation
- LEFT-slot rally-skill emphasis for joiners
- 100k pure-Shooter joiner baseline
- Current 0/10/90 leader baseline
- Responsive desktop/mobile interface

## Planned

- Complete S1–S6 hero database and War skill levels
- Enforce exactly one Shieldbearer, Bomber and Shooter hero per march
- Six non-overlapping joiner formations
- Robot ownership and assignment
- Felon / Yard Time optimizer
- Configurable troop capacity and troop tiers
- Formation warnings
- Cage result logging and controlled A/B comparisons
- Empirical optimizer using real hit history rather than an assumed hidden damage formula
- Alliance mode for CCW members
- Import/export account profiles

## Known evidence rules

The initial recommendation engine is intentionally conservative. Trial Cage has RNG and incomplete public mechanics, so recommendations should distinguish confirmed account testing from theory. Joiner recommendations prioritize the first War skill of the hero placed physically in the LEFT slot based on alliance testing.

## Development

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

This community project is not affiliated with Lands of Jail or its publisher.
