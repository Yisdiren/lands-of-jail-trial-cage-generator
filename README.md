# Lands of Jail — Trial Cage Formation Generator

A community Trial Cage formation generator for **Lands of Jail**, built around actual player rosters, Trial Cage testing, hero War skills, stars, robots and troop availability.

## Current Beta v0.38

### Visual theme
- Lands of Jail-inspired Trial Cage fortress background
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
- Editable leader and joiner march capacities
- Configurable troop ratios, T1–T11 tiers and available troop counts
- Exact troop-plan calculation
- Formation explanations showing why a LEFT hero was selected
- Hero portraits/icons in generated formations
- Copy-ready individual and group formation output

### Player profiles and onboarding
- General player profiles for any alliance or server
- New visitors begin with a clean **New Player** profile
- Existing saved profiles, including older Stiletto data, are preserved
- Guided first-time setup for player name, server, season, role, capacity and join count
- Guided hero ownership selection
- Guided ★ and War-skill setup for selected heroes
- Guided robot and troop-tier/count setup
- Player profiles store heroes, stars, War skills, robots and troop settings
- Member Generator for switching between saved players
- Alliance Batch Generator calculates every selected player independently
- Versioned browser-local profile storage

### Validation and readiness
- Detects missing hero classes
- Checks whether enough eligible heroes exist for the requested marches
- Checks whether enough LEFT-skill heroes exist for requested joiner marches
- Checks robot availability against requested marches
- Flags LEFT War skills below Lv5
- Checks troop inventory against requested marches
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
- Cage Result Lab hidden from the generator interface while historical saved data remains intact
- General Trial Cage branding; CCW-specific recommendation rules are no longer used as global rules

## What is next

Development is continuing in this order:

1. **Validation UI improvements** — make readiness/conflict problems easier to see directly on each generated march and provide specific fixes.
2. **Star-aware manual/locked formations** — make locked and manually edited formations use the same ★-aware scoring as automatic generation.
3. **Formation recovery suggestions** — when a requested march cannot be built, explain exactly which class, LEFT hero, robot or troop resource is missing.
4. **Profile setup dashboard** — show setup completion and let players quickly return to Heroes, War Skills, Robots or Troops without rerunning onboarding.
5. **Generator cleanup** — remove remaining historical CCW/Stiletto source defaults and old compatibility UI where it is no longer required, while preserving existing saved data.
6. **S6 hero/icon completion** — add and verify remaining Season 6 hero information, icons and exact War-skill progression when clean game screenshots/assets are available.
7. **Hero database verification** — continue verifying S1–S6 Cage heroes and exact War-skill values from game evidence.
8. **Result/formation polish** — improve formation cards, mobile readability, sharing output and alliance overview.
9. **Build/deployment checks** — continue testing releases and keep the displayed beta, package version and README synchronized.

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
