# Lands of Jail — Trial Cage Formation Generator

An evidence-based Trial Cage formation generator inspired by the workflow of the Whiteout Survival Bear Trap formation tools, but designed specifically around Lands of Jail mechanics and real Cage testing.

## Current Beta v0.9

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
- READY / REVIEW / BLOCKED validation status for every formation
- Warnings for missing robots, filler or low-level LEFT skills and unverified progressions
- CCW rarity warnings with Lunarl and Lofili retained as approved exceptions
- Browser-persistent Cage 1 / Cage 2 hit logging
- Controlled A/B tests with LEFT hero, damage, date and notes
- Variant hit counts, averages, best hits and percentage comparison
- RNG warning until both variants have at least three recorded hits
- Browser-local CCW member profiles with player, server and role
- Per-member heroes, War skills, troops, robots, Felons and formation settings
- Empty safe defaults for new members instead of inheriting Marvin's account
- Separate Cage result history for every saved member profile

## Planned

- Complete and verify the S1–S6 hero database and remaining War skill progressions
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
