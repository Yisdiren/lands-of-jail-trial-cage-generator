# Lands of Jail — Trial Cage Formation Generator

An evidence-based Trial Cage formation generator inspired by the workflow of the Whiteout Survival Bear Trap formation tools, but designed specifically around Lands of Jail mechanics and real Cage testing.

## Current Beta v0.6

- Rally Leader / Rally Joiner modes
- Season filter through S6
- Hero ownership selector
- Class-aware formation generation
- LEFT-slot rally-skill emphasis for joiners
- 100k pure-Shooter joiner baseline
- Current 0/10/90 leader baseline
- Responsive desktop/mobile interface
- Complete non-overlapping J1–J6 formation generation
- Per-hero LEFT War skill levels and verified percentage scaling
- Global LEFT-hero optimization that protects valuable rally skills from filler slots
- Robot ownership selection and non-repeating priority assignment
- Clear incomplete-roster and incomplete-robot warnings
- Felon ownership selection and leader-only Yard Time optimization
- Scorpion/Cobra core locks with rally-aware Rage Fist/Devil selection
- Missing-core and missing-capacity-felon warnings
- Separate editable leader and joiner march capacities
- Configurable Shieldbearer, Bomber and Shooter ratios and T1–T11 tiers
- Exact class troop-count calculation with availability warnings

## Planned

- Complete and verify the S1–S6 hero database and remaining War skill progressions
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
