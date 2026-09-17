"use client";

import { useMemo, useState } from "react";
import { felons, heroes, robots } from "../data/heroes";
import {
  generateJoinerFormations,
  generateLeaderFormation,
  optimizeFelons,
  type TroopPreset,
  type WarSkillLevels,
} from "../lib/generator";

type Mode = "leader" | "joiner";

export default function Home() {
  const [mode, setMode] = useState<Mode>("joiner");
  const [season, setSeason] = useState(6);
  const [owned, setOwned] = useState<string[]>(
    heroes.filter((h) => h.cageAllowed).map((h) => h.name),
  );
  const [troopPreset, setTroopPreset] = useState<TroopPreset>("shooters");
  const [joinCount, setJoinCount] = useState(6);
  const [warSkillLevels, setWarSkillLevels] = useState<WarSkillLevels>(() =>
    Object.fromEntries(
      heroes.filter((h) => h.leftSkill).map((h) => [h.name, 5]),
    ),
  );
  const [ownedRobots, setOwnedRobots] = useState<string[]>(robots);
  const [ownedFelons, setOwnedFelons] = useState<string[]>(
    felons.map((felon) => felon.name),
  );
  const [rallyFills, setRallyFills] = useState(true);
  const [generated, setGenerated] = useState(false);

  const seasonHeroes = useMemo(
    () => heroes.filter((h) => h.season === 0 || h.season <= season),
    [season],
  );
  const available = useMemo(
    () => seasonHeroes.filter((h) => owned.includes(h.name) && h.cageAllowed),
    [seasonHeroes, owned],
  );
  const availableRobots = useMemo(
    () => robots.filter((robot) => ownedRobots.includes(robot)),
    [ownedRobots],
  );
  const joinerFormations = useMemo(
    () =>
      generateJoinerFormations(
        available,
        joinCount,
        troopPreset,
        warSkillLevels,
        availableRobots,
      ),
    [available, joinCount, troopPreset, warSkillLevels, availableRobots],
  );
  const leaderFormation = useMemo(
    () => generateLeaderFormation(available, availableRobots),
    [available, availableRobots],
  );
  const felonPlan = useMemo(
    () => optimizeFelons(felons, ownedFelons, rallyFills),
    [ownedFelons, rallyFills],
  );

  const toggle = (name: string) => {
    setGenerated(false);
    setOwned((current) =>
      current.includes(name)
        ? current.filter((x) => x !== name)
        : [...current, name],
    );
  };
  const selectAll = () => {
    setOwned(seasonHeroes.filter((h) => h.cageAllowed).map((h) => h.name));
    setGenerated(false);
  };
  const clearAll = () => {
    setOwned([]);
    setGenerated(false);
  };
  const setSkillLevel = (name: string, level: number) => {
    setWarSkillLevels((current) => ({ ...current, [name]: level }));
    setGenerated(false);
  };
  const toggleRobot = (name: string) => {
    setOwnedRobots((current) =>
      current.includes(name)
        ? current.filter((x) => x !== name)
        : [...current, name],
    );
    setGenerated(false);
  };
  const toggleFelon = (name: string) => {
    setOwnedFelons((current) =>
      current.includes(name)
        ? current.filter((x) => x !== name)
        : [...current, name],
    );
    setGenerated(false);
  };

  return (
    <main>
      <header>
        <div>
          <span className="eyebrow">CCW TOOLS</span>
          <h1>
            Trial Cage <b>Formation Generator</b>
          </h1>
          <p>
            Lands of Jail • class-legal formations • LEFT-slot aware • no hero
            or robot reuse
          </p>
        </div>
        <div className="badge">BETA v0.5</div>
      </header>

      <section className="panel controls">
        <div>
          <label>MODE</label>
          <div className="tabs">
            <button
              className={mode === "leader" ? "active" : ""}
              onClick={() => {
                setMode("leader");
                setGenerated(false);
              }}
            >
              Rally Leader
            </button>
            <button
              className={mode === "joiner" ? "active" : ""}
              onClick={() => {
                setMode("joiner");
                setGenerated(false);
              }}
            >
              Rally Joiner
            </button>
          </div>
        </div>
        <div>
          <label>SERVER SEASON</label>
          <select
            value={season}
            onChange={(e) => {
              setSeason(+e.target.value);
              setGenerated(false);
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <option key={s} value={s}>
                Season {s}
              </option>
            ))}
          </select>
        </div>
        {mode === "joiner" && (
          <>
            <div>
              <label>JOINER TROOPS</label>
              <select
                value={troopPreset}
                onChange={(e) => {
                  setTroopPreset(e.target.value as TroopPreset);
                  setGenerated(false);
                }}
              >
                <option value="shooters">100k Shooters</option>
                <option value="10-90">10k Bomber / 90k Shooter</option>
              </select>
            </div>
            <div>
              <label>JOINER MARCHES</label>
              <select
                value={joinCount}
                onChange={(e) => {
                  setJoinCount(+e.target.value);
                  setGenerated(false);
                }}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </section>

      {mode === "leader" && (
        <section className="panel">
          <div className="title">
            <div>
              <label>YARD TIME FELONS</label>
              <h2>Select owned felons and rally condition</h2>
            </div>
            <span>{ownedFelons.length} owned</span>
          </div>
          <div className="quick-actions">
            <button
              onClick={() => {
                setOwnedFelons(felons.map((felon) => felon.name));
                setGenerated(false);
              }}
            >
              Select all
            </button>
            <button
              onClick={() => {
                setOwnedFelons([]);
                setGenerated(false);
              }}
            >
              Clear
            </button>
          </div>
          <div className="felons">
            {felons.map((felon) => (
              <button
                key={felon.name}
                className={
                  ownedFelons.includes(felon.name) ? "felon selected" : "felon"
                }
                onClick={() => toggleFelon(felon.name)}
              >
                <strong>{felon.name}</strong>
                <small>{felon.effect}</small>
              </button>
            ))}
          </div>
          <div className="rally-condition">
            <label>EXPECTED RALLY</label>
            <div className="tabs">
              <button
                className={rallyFills ? "active" : ""}
                onClick={() => {
                  setRallyFills(true);
                  setGenerated(false);
                }}
              >
                Fills capacity
              </button>
              <button
                className={!rallyFills ? "active" : ""}
                onClick={() => {
                  setRallyFills(false);
                  setGenerated(false);
                }}
              >
                Has open space
              </button>
            </div>
          </div>
          <p className="helper">
            The optimizer keeps Scorpion and Cobra for attack and lethality,
            then chooses Rage Fist for a full rally or Devil when personal
            expedition capacity would otherwise be wasted.
          </p>
        </section>
      )}

      <section className="panel">
        <div className="title">
          <div>
            <label>YOUR ROBOTS</label>
            <h2>Select robots this account owns</h2>
          </div>
          <span>{availableRobots.length} available</span>
        </div>
        <div className="quick-actions">
          <button
            onClick={() => {
              setOwnedRobots(robots);
              setGenerated(false);
            }}
          >
            Select all
          </button>
          <button
            onClick={() => {
              setOwnedRobots([]);
              setGenerated(false);
            }}
          >
            Clear
          </button>
        </div>
        <div className="robots">
          {robots.map((robot, index) => (
            <button
              key={robot}
              className={
                ownedRobots.includes(robot) ? "robot selected" : "robot"
              }
              onClick={() => toggleRobot(robot)}
            >
              <i>R{index + 1}</i>
              <strong>{robot}</strong>
              {index < 2 && <small>CCW priority</small>}
            </button>
          ))}
        </div>
        <p className="helper">
          Selected robots are assigned in priority order. Musashimaru and
          Phantom Cat remain first for this account; each generated march gets a
          different robot.
        </p>
      </section>

      <section className="panel">
        <div className="title">
          <div>
            <label>YOUR HEROES</label>
            <h2>Select heroes this account owns</h2>
          </div>
          <span>{available.length} usable</span>
        </div>
        <div className="quick-actions">
          <button onClick={selectAll}>Select all usable</button>
          <button onClick={clearAll}>Clear</button>
        </div>
        <div className="heroes">
          {seasonHeroes.map((hero) => {
            const selected = owned.includes(hero.name);
            const disabled = !hero.cageAllowed;
            return (
              <div key={hero.name}>
                <button
                  onClick={() => !disabled && toggle(hero.name)}
                  disabled={disabled}
                  className={`${selected ? "hero selected" : "hero"} ${disabled ? "disabled" : ""}`}
                  title={hero.notes || ""}
                >
                  <i>{hero.cls[0]}</i>
                  <strong>{hero.name}</strong>
                  <small>
                    {hero.cls} •{" "}
                    {hero.season === 0 ? "Legacy" : `S${hero.season}`} •{" "}
                    {hero.rarity}
                  </small>
                  {hero.leftSkill && (
                    <em>LEFT ★ {hero.leftTier?.toUpperCase()}</em>
                  )}
                  {!hero.cageAllowed && <em>EXCLUDED</em>}
                </button>
                {mode === "joiner" &&
                  selected &&
                  hero.leftSkill &&
                  !disabled && (
                    <label
                      style={{ display: "block", marginTop: 6, fontSize: 12 }}
                    >
                      LEFT War skill Lv{" "}
                      <select
                        value={warSkillLevels[hero.name] ?? 5}
                        onChange={(e) =>
                          setSkillLevel(hero.name, +e.target.value)
                        }
                        style={{ marginLeft: 6 }}
                      >
                        {[1, 2, 3, 4, 5].map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
              </div>
            );
          })}
        </div>
      </section>

      <button className="generate" onClick={() => setGenerated(true)}>
        GENERATE CAGE FORMATION{mode === "joiner" ? "S" : ""}
      </button>

      {generated &&
        mode === "leader" &&
        (leaderFormation ? (
          <section className="result">
            <label>RECOMMENDED LEADER BASELINE</label>
            <div className="slots">
              <div className="slot">
                <span>SHOOTER</span>
                <b>{leaderFormation.left.name}</b>
              </div>
              <div className="slot">
                <span>BOMBER</span>
                <b>{leaderFormation.middle.name}</b>
              </div>
              <div className="slot">
                <span>SHIELD</span>
                <b>{leaderFormation.right.name}</b>
              </div>
            </div>
            <div className="ratio">
              <span>TROOPS • Shield / Bomber / Shooter</span>
              <strong>{leaderFormation.troopText}</strong>
            </div>
            <p>
              Current controlled-test baseline is Ada / Ryuichi / Tyronn at
              0/10/90 when all three are owned. S6 swaps should be tested one
              change at a time.
            </p>
            <div className="mini-grid">
              <div>
                <b>Robot assignment</b>
                <span>
                  {leaderFormation.robot ?? "No owned robot selected"}
                </span>
              </div>
              <div>
                <b>Yard Time core</b>
                <span>
                  {felonPlan.selected
                    .filter(
                      (felon) =>
                        felon.name === "Scorpion" || felon.name === "Cobra",
                    )
                    .map((felon) => felon.name)
                    .join(" + ") || "No owned core felons"}
                </span>
              </div>
              <div>
                <b>3rd felon • {rallyFills ? "full rally" : "open space"}</b>
                <span>
                  {felonPlan.selected.find(
                    (felon) =>
                      felon.name !== "Scorpion" && felon.name !== "Cobra",
                  )?.name ?? `Missing ${felonPlan.preferredThird}`}
                </span>
              </div>
            </div>
            {!leaderFormation.robot && (
              <div className="warning-box">
                Select at least one owned robot to complete the leader setup.
              </div>
            )}
            {felonPlan.warning && (
              <div className="warning-box">{felonPlan.warning}</div>
            )}
          </section>
        ) : (
          <section className="result warning">
            <b>Not enough heroes.</b>
            <p>You need at least one usable Shield, Bomber and Shooter.</p>
          </section>
        ))}

      {generated && mode === "joiner" && (
        <section className="result">
          <label>GENERATED JOINER FORMATIONS</label>
          <p className="result-intro">
            Every march uses exactly one Shield, one Bomber and one Shooter. The
            first hero shown is physically LEFT. LEFT War skill levels affect
            recommendation priority, and owned robots are assigned without
            reuse.
          </p>
          {joinerFormations.length === 0 && (
            <div className="warning-box">
              Not enough compatible heroes to build a legal joiner formation.
            </div>
          )}
          <div className="formation-list">
            {joinerFormations.map((f) => (
              <article className="formation-card" key={f.id}>
                <div className="formation-head">
                  <b>{f.id}</b>
                  <span>{f.troopText}</span>
                </div>
                <div className="slots">
                  <div className="slot left">
                    <span>
                      LEFT • ACTIVE RALLY SKILL • Lv{f.leftSkillLevel}
                    </span>
                    <b>{f.left.name}</b>
                    <small>{f.left.leftSkill}</small>
                  </div>
                  <div className="slot">
                    <span>MIDDLE • {f.middle.cls}</span>
                    <b>{f.middle.name}</b>
                  </div>
                  <div className="slot">
                    <span>RIGHT • {f.right.cls}</span>
                    <b>{f.right.name}</b>
                  </div>
                </div>
                <div
                  className={
                    f.robot ? "robot-assignment" : "robot-assignment missing"
                  }
                >
                  <span>ROBOT</span>
                  <b>{f.robot ?? "No owned robot available"}</b>
                </div>
                {f.warning && <p className="warn">⚠ {f.warning}</p>}
              </article>
            ))}
          </div>
          {joinerFormations.length < joinCount &&
            joinerFormations.length > 0 && (
              <div className="warning-box">
                Only {joinerFormations.length} legal non-repeating formation
                {joinerFormations.length === 1 ? "" : "s"} could be built from
                the selected roster.
              </div>
            )}
          {availableRobots.length < joinerFormations.length && (
            <div className="warning-box">
              Only {availableRobots.length} owned robot
              {availableRobots.length === 1 ? "" : "s"} selected for{" "}
              {joinerFormations.length} formations. Select more robots to
              complete every march.
            </div>
          )}
        </section>
      )}

      <section className="panel notes">
        <div>
          <label>RULES CURRENTLY ENFORCED</label>
          <p>
            ✓ 1 Shield + 1 Bomber + 1 Shooter &nbsp; ✓ LEFT-slot skill priority
            &nbsp; ✓ LEFT War skill level &nbsp; ✓ no hero or robot reuse across
            J1–J6 &nbsp; ✓ 100k joiner presets &nbsp; ✓ KOF excluded
          </p>
        </div>
      </section>
      <footer>
        Community tool • Not affiliated with Lands of Jail. Unknown season
        numbers are marked “Legacy” instead of being guessed.
      </footer>
    </main>
  );
}
