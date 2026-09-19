"use client";

import { useMemo, useState } from "react";
import { felons, heroes, robots } from "../data/heroes";
import {
  calculateTroopPlan,
  generateJoinerFormations,
  generateLeaderFormation,
  optimizeFelons,
  type TroopPreset,
  type TroopClassKey,
  type TroopTier,
  type TroopTiers,
  type TroopValues,
  type WarSkillLevels,
} from "../lib/generator";
import { cageBuffs, splitBuffsBySource, cageBuffSummaryText, cageBuffTimingMessage, previewCageCapacity, buffEffectLabel, defaultCageBuffProfile, preCageShareLines, preCageWarnings } from "../lib/cage-buffs";
import Image from "next/image";

import { buildLockedFormations, slots, type Locks } from "../lib/formation-locks";

import { downloadFormationImage } from "../lib/formation-image";

type Mode = "leader" | "joiner";
const troopClasses: { key: TroopClassKey; label: string }[] = [
  { key: "shield", label: "Shieldbearers" },
  { key: "bomber", label: "Bombers" },
  { key: "shooter", label: "Shooters" },
];
const troopTierOptions = Array.from(
  { length: 11 },
  (_, index) => `T${index + 1}` as TroopTier,
);
const retainedSrHeroes = new Set(["Lofili", "Lunarl", "Flameborne", "Samir"]);
const showHeroInGenerator = (hero: (typeof heroes)[number]) => hero.rarity !== "R" && (hero.rarity !== "SR" || retainedSrHeroes.has(hero.name));
const heroIconNames = new Set([
  "Omega Rugal", "Terry Bogard", "Mai Shiranui", "Ada", "Ryuichi", "Edwin",
  "Koschevoi", "Mireya", "Marcus", "Whisper", "Drake", "Veronica", "Tyronn",
  "Xuanming", "Sawyer", "Tormund", "Mia Scarlet Pyros", "Phoenix", "Alph",
  "Zoltan", "Lunarl", "Lofili", "Vivian", "Lee", "Samir", "Caesar", "Flameborne",
  "Devilian", "Inata", "Lanchester",
]);
const heroIconSlug = (name: string) =>
  name.toLowerCase().replace(/scarlet pyros/g, "scarlet-pyros").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export default function Home() {
  const [mode, setMode] = useState<Mode>("joiner"); // Streamlined UI generates both
  const [season, setSeason] = useState(1);
  const [owned, setOwned] = useState<string[]>([]);
  const leaderCapacity = 100000;
  const [joinerRatios, setJoinerRatios] = useState<TroopValues>({
    shield: 0,
    bomber: 0,
    shooter: 100,
  });
  const [troopTiers, setTroopTiers] = useState<TroopTiers>({
    shield: "T10",
    bomber: "T10",
    shooter: "T10",
  });
  const [joinCount, setJoinCount] = useState(6);
  const [warSkillLevels, setWarSkillLevels] = useState<WarSkillLevels>({});
  const [heroStarLevels, setHeroStarLevels] = useState<Record<string, number>>({});
  const [ownedRobots, setOwnedRobots] = useState<string[]>([]);
  const [ownedFelons, setOwnedFelons] = useState<string[]>([]);
  const [felonRallyCapacities, setFelonRallyCapacities] = useState<Record<string, number>>({});
  const [rallyFills, setRallyFills] = useState(true);
  const [seatHolder, setSeatHolder] = useState(false);
  const [locks, setLocks] = useState<Locks>({});
  const [leaderLocks, setLeaderLocks] = useState<Locks>({});
  const [generated, setGenerated] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedBuffIds, setSelectedBuffIds] = useState<string[]>([]);
  const [activationLeadMinutes, setActivationLeadMinutes] = useState(5);
  const [showAdvancedTroops, setShowAdvancedTroops] = useState(false);
  const [kofLeaderLinks, setKofLeaderLinks] = useState<Record<string,string>>({});
  const seasonHeroes = useMemo(
    () => heroes.filter((h) => (h.season === 0 || h.season <= season) && showHeroInGenerator(h)),
    [season],
  );
  const available = useMemo(
    () => seasonHeroes.filter((h) => owned.includes(h.name) && h.cageAllowed),
    [seasonHeroes, owned],
  );
  const evidenceCounts = useMemo(() => {
    const leftSkills = available.filter((hero) => hero.leftSkill);
    return {
      total: leftSkills.length,
      verified: leftSkills.filter((hero) => hero.leftSkillVerified).length,
    };
  }, [available]);
  const availableRobots = useMemo(
    () => robots.filter((robot) => ownedRobots.includes(robot)),
    [ownedRobots],
  );
  const joinerTroopPlan = useMemo(
    () =>
      calculateTroopPlan({
        capacity: 100000,
        ratios: joinerRatios,
        tiers: troopTiers,
      }),
    [joinerRatios, troopTiers],
  );
  const leaderTroopPlan = useMemo(
    () =>
      calculateTroopPlan({
        capacity: leaderCapacity,
        ratios: { shield: 0, bomber: 10, shooter: 90 },
        tiers: troopTiers,
      }),
    [leaderCapacity, troopTiers],
  );
  const automaticWarSkillLevels = useMemo<WarSkillLevels>(() => {
    const levels: WarSkillLevels = {};
    available.forEach((hero) => {
      if (hero.leftSkill) levels[hero.name] = Math.min(5, Math.max(1, heroStarLevels[hero.name] ?? 1));
    });
    return levels;
  }, [available, heroStarLevels]);

  const automaticJoiners = useMemo(
    () =>
      generateJoinerFormations(
        available,
        joinCount,
        joinerTroopPlan,
        automaticWarSkillLevels,
        availableRobots,
        verifiedOnly,
        heroStarLevels,
      ),
    [
      available,
      joinCount,
      joinerTroopPlan,
      automaticWarSkillLevels,
      availableRobots,
      verifiedOnly,
      heroStarLevels,
    ],
  );
  const automaticLeader = useMemo(
    () => generateLeaderFormation(available, leaderTroopPlan, availableRobots, heroStarLevels, kofLeaderLinks),
    [available, leaderTroopPlan, availableRobots, heroStarLevels, kofLeaderLinks],
  );
  let lockError = "";
  let leaderFormation = automaticLeader;
  let joinerFormations = automaticJoiners;
  try {
    if (Object.values(leaderLocks).some(Boolean)) leaderFormation = buildLockedFormations(available, 1, leaderLocks, leaderTroopPlan, warSkillLevels, availableRobots, false, null, "leader", heroStarLevels)[0] ?? null;
    if (Object.values(locks).some(Boolean) || Object.values(leaderLocks).some(Boolean)) joinerFormations = buildLockedFormations(available, joinCount, locks, joinerTroopPlan, warSkillLevels, availableRobots, verifiedOnly, leaderFormation, "joiner", heroStarLevels);
  } catch (error) {
    lockError = error instanceof Error ? error.message : "Check your hero locks.";
    joinerFormations = [];
    if (mode === "leader") leaderFormation = null;
  }
  const currentLocks = mode === "leader" ? leaderLocks : locks;
  const updateLock = (key: string, name: string) => {
    (mode === "leader" ? setLeaderLocks : setLocks)(value => ({...value, [key]: name}));
    setGenerated(false);
  };
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
  const setStarLevel = (name: string, level: number) => {
    setHeroStarLevels((current) => ({ ...current, [name]: level }));
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
  const updateTier = (key: TroopClassKey, value: TroopTier) => {
    setTroopTiers((current) => ({ ...current, [key]: value }));
    setGenerated(false);
  };
  const [exportingImage, setExportingImage] = useState(false);
  const exportFormationImage = async () => {
    setExportingImage(true);
    try {
      await downloadFormationImage(leaderFormation ? [leaderFormation, ...joinerFormations] : joinerFormations,
        "Trial Cage", heroStarLevels,
        name => heroIconNames.has(name) ? "/icons/" + heroIconSlug(name) + ".png" : null);
      setNotice("Formation image downloaded.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Image download failed.");
    } finally { setExportingImage(false); }
  };
  const copyAllianceInstructions = async () => {
    const lines = [
      "TRIAL CAGE FORMATIONS",
      verifiedOnly ? "Verified LEFT skills only" : "Standard LEFT skill priority",
      ...preCageShareLines({ selectedBuffIds, activationLeadMinutes }),
      "",
      ...joinerFormations.flatMap((formation) => [
        `${formation.id}: ${formation.left.name} (LEFT Lv${formation.leftSkillLevel}) / ${formation.middle.name} / ${formation.right.name}`,
        `  ${formation.troopText} • Robot: ${formation.robot ?? "none"} • ${formation.status.toUpperCase()}`,
      ]),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setNotice("Alliance instructions copied to the clipboard.");
    } catch {
      setNotice("Clipboard access was blocked. Select and copy the formation list manually.");
    }
  };
  const buffGroups = splitBuffsBySource();
  const buffCapacityPreview = previewCageCapacity(leaderCapacity, selectedBuffIds);
  const toggleCageBuff = (id: string) => setSelectedBuffIds(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  return (
    <main>
      <header>
        <div>
          <span className="eyebrow">TRIAL CAGE TOOLS</span>
          <h1>
            Trial Cage <b>Formation Generator</b>
          </h1>
          <p>
            Lands of Jail • class-legal formations • LEFT-slot aware • no hero
            or robot reuse
          </p>
        </div>
        <div className="badge">DEV v1.29 SIMPLE</div>
      </header>

      <section className="panel cage-buffs-panel">
        <div className="title"><div><label>PRE-CAGE SETUP</label><h2>2-hour buffs & Prisoner Armor</h2></div></div>
        <p className="helper">Select the buffs you actually activate before Trial Cage. Capacity bonuses stay separated until their in-game stacking order is verified.</p>
        <div className="buff-groups">
          {[["Prison Buffs", buffGroups.prisonBuffs], ["Prisoner Armor", buffGroups.prisonerArmor]].map(([title, items]) => <div className="buff-group" key={String(title)}><h3>{String(title)}</h3><div className="buff-grid">{(items as typeof cageBuffs).map(buff => <button type="button" className={selectedBuffIds.includes(buff.id) ? "buff selected" : "buff"} key={buff.id} onClick={()=>toggleCageBuff(buff.id)}><b>{buff.name}{buff.level ? ` Lv.${buff.level}` : ""}</b><span>{buffEffectLabel(buff)}</span><small>{buff.durationHours}h after activation</small></button>)}</div></div>)}
        </div>
        <div className="buff-summary"><b className="pre-cage-label">PRE-CAGE CHECKLIST</b><span>✓ Main Rally capacity: {leaderCapacity.toLocaleString()}</span><span>✓ Main Rally: use your maximum available troops</span><span>{availableRobots.length ? "✓" : "⚠"} Robot: {availableRobots[0] ?? "none selected"}</span><strong>{cageBuffSummaryText(selectedBuffIds)}</strong><label>Activate before Cage <input type="number" min="0" max="120" value={activationLeadMinutes} onChange={e=>setActivationLeadMinutes(Math.max(0,Math.min(120,Number(e.target.value)||0)))} /> min</label><small>{cageBuffTimingMessage({selectedBuffIds,activationLeadMinutes})}</small></div>
        <div className="capacity-preview"><b>Capacity preview</b><span>Base {buffCapacityPreview.baseCapacity.toLocaleString()}</span><span>Expedition {buffCapacityPreview.expeditionPercent ? `+${buffCapacityPreview.expeditionPercent}%` : "—"}</span><span>Expedition flat {buffCapacityPreview.expeditionFlat ? `+${buffCapacityPreview.expeditionFlat.toLocaleString()}` : "—"}</span><span>Rally flat {buffCapacityPreview.rallyFlat ? `+${buffCapacityPreview.rallyFlat.toLocaleString()}` : "—"}</span><small>{buffCapacityPreview.note}</small>{preCageWarnings(leaderCapacity,selectedBuffIds).map(w=><small className="buff-warning" key={w}>{w}</small>)}</div>
      </section>

      {notice && <p role="status" className="profile-notice">{notice}</p>}

      <section className="panel controls">
        <div>
          <label>CAGE SETUP</label>
          <h2>One-click Main Rally + Joiners</h2>
          <p className="helper">Choose your heroes, robots and march settings, then generate your Main Rally and Joiners together.</p>
        </div>
        <label className="verified-toggle">
          <input type="checkbox" checked={verifiedOnly} onChange={(event)=>{setVerifiedOnly(event.target.checked);setGenerated(false)}} />
          <span><b>VERIFIED SKILLS ONLY</b><small>Use screenshot-confirmed LEFT War progressions only</small><small>{evidenceCounts.verified}/{evidenceCounts.total} available LEFT skills verified</small></span>
        </label>
        <label><input type="checkbox" checked={seatHolder} onChange={event => {setSeatHolder(event.target.checked);setGenerated(false)}} /> SCARLET BUTCHER SEAT • +10% ATK</label>
        <div><label>SERVER SEASON</label><select value={season} onChange={(e)=>{setSeason(+e.target.value);setGenerated(false)}}>{[1,2,3,4,5,6].map(s=><option key={s} value={s}>Season {s}</option>)}</select></div>
        <div><label>JOINER MARCHES</label><select value={joinCount} onChange={(e)=>{setJoinCount(+e.target.value);setGenerated(false)}}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}</select></div>
      </section>

      <section className="panel troop-panel">
        <div className="title"><div><label>TROOP GUIDELINES</label><h2>Use your alliance's Cage troop rules</h2></div></div>
        <p className="helper"><b>Main Rally:</b> use your maximum available troops. <b>Joiners:</b> use the troop amount your alliance has set for Trial Cage joiners.</p>
      </section>

      <section className="panel simple-cage-tips">
        <div className="title"><div><label>CAGE RECOMMENDATIONS</label><h2>Use these with the generated formations</h2></div></div>
        <div className="mini-grid">
          <div><b>Robots</b><span>Musashimaru + Phantom Cat are the current priority choices when owned.</span></div>
          <div><b>Felons</b><span>Scorpion + Cobra core. Use Rage Fist for a full rally; Devil when expedition capacity is more useful.</span></div>
          <div><b>2-hour buffs</b><span>Troops ATK +11%, Troops Lethality +11%, Expedition Capacity +11%. Activate about 5 minutes before Cage.</span></div>
        </div>
      </section>

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
              {index < 2 && <small>Trial Cage priority</small>}
            </button>
          ))}
        </div>
        <p className="helper">
          Selected robots are assigned in priority order and are not reused across generated marches.
        </p>
      </section>

      <section className="panel">
        <div className="title">
          <div>
            <label>YOUR HEROES</label>
            <h2>Select your heroes and set only their star levels</h2>
          </div>
          <span>{available.length} selected</span>
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
                  {heroIconNames.has(hero.name) ? (
                    <Image
                      className="hero-icon"
                      src={`/icons/${heroIconSlug(hero.name)}.png`}
                      alt=""
                      width={48}
                      height={60}
                    />
                  ) : (
                    <i>{hero.cls[0]}</i>
                  )}
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
                {selected && !disabled && (
                  <label
                    style={{ display: "block", marginTop: 6, fontSize: 12 }}
                  >
                    Star level{" "}
                    <select
                      aria-label={`${hero.name} star level`}
                      value={heroStarLevels[hero.name] ?? 1}
                      onChange={(e) => setStarLevel(hero.name, +e.target.value)}
                      style={{ marginLeft: 6 }}
                    >
                      {[1, 2, 3, 4, 5].map((l) => (
                        <option key={l} value={l}>
                          {"★".repeat(l)} ({l})
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

      <button className="generate" onClick={() => setGenerated(true)}>GENERATE MY CAGE SETUP</button>

      {generated && (
        <div className={`seat-bonus ${seatHolder ? "active" : "inactive"}`}>
          <b>{seatHolder ? "+10% ATK ACTIVE" : "NO SEAT ATK BONUS"}</b>
          <span>
            {seatHolder
              ? "You are a seat holder: +10% ATK against Imprisoned Scarlet Butcher."
              : "Seat holder is turned off; no seat modifier is applied."}
          </span>
        </div>
      )}

      {generated && !lockError && (
        <button className="copy-button" disabled={exportingImage || (!leaderFormation && !joinerFormations.length)} onClick={exportFormationImage}>
          {exportingImage ? "CREATING IMAGE…" : "DOWNLOAD FORMATION IMAGE"}
        </button>
      )}

      {generated &&
        (leaderFormation ? (
          <section className="result">
            <div className="result-title">
              <label>YOUR MAIN RALLY</label>
              <span className={`status status-${leaderFormation.status}`}>
                {leaderFormation.status.toUpperCase()}
              </span>
            </div>
            <div className="slots">
              <div className="slot">
                <span>{leaderFormation.left.cls}</span>
                {heroIconNames.has(leaderFormation.left.name) && (
                      <Image className="formation-hero-icon"
                        src={`/icons/${heroIconSlug(leaderFormation.left.name)}.png`}
                        alt="" width={42} height={52} />
                    )}
                    <b>{leaderFormation.left.name}</b><small>{heroStarLevels[leaderFormation.left.name] ? "★".repeat(heroStarLevels[leaderFormation.left.name]) : "Stars not set"}</small>
              </div>
              <div className="slot">
                <span>{leaderFormation.middle.cls}</span>
                {heroIconNames.has(leaderFormation.middle.name) && (
                      <Image className="formation-hero-icon"
                        src={`/icons/${heroIconSlug(leaderFormation.middle.name)}.png`}
                        alt="" width={42} height={52} />
                    )}
                    <b>{leaderFormation.middle.name}</b><small>{heroStarLevels[leaderFormation.middle.name] ? "★".repeat(heroStarLevels[leaderFormation.middle.name]) : "Stars not set"}</small>
              </div>
              <div className="slot">
                <span>{leaderFormation.right.cls}</span>
                {heroIconNames.has(leaderFormation.right.name) && (
                      <Image className="formation-hero-icon"
                        src={`/icons/${heroIconSlug(leaderFormation.right.name)}.png`}
                        alt="" width={42} height={52} />
                    )}
                    <b>{leaderFormation.right.name}</b><small>{heroStarLevels[leaderFormation.right.name] ? "★".repeat(heroStarLevels[leaderFormation.right.name]) : "Stars not set"}</small>
              </div>
            </div>
            <p>
              Use your maximum available troops for your Main Rally. Follow your alliance’s current Trial Cage troop composition rules.
            </p>
            {Object.entries(kofLeaderLinks).filter(([name,target]) => target && (heroStarLevels[name]??1) >= 4 && owned.includes(name)).length > 0 && <div className="kof-active-links"><b>KOF MAIN RALLY LINKS</b>{Object.entries(kofLeaderLinks).filter(([name,target]) => target && (heroStarLevels[name]??1) >= 4 && owned.includes(name)).map(([name,target])=><span key={name}>{name} → replaces {target}</span>)}</div>}
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
                <b>3rd felon</b>
                <span>
                  {felonPlan.selected.find(
                    (felon) =>
                      felon.name !== "Scorpion" && felon.name !== "Cobra",
                  )?.name ?? `Missing ${felonPlan.preferredThird}`}
                </span>
              </div>
            </div>
            {felonPlan.warning && (
              <div className="warning-box">{felonPlan.warning}</div>
            )}
            {leaderTroopPlan.warnings.map((warning) => (
              <div className="warning-box" key={warning}>
                {warning}
              </div>
            ))}
            {leaderFormation.alerts
              .filter(
                (alert) => !leaderTroopPlan.warnings.includes(alert.message),
              )
              .map((alert) => (
                <div
                  className={`formation-alert alert-${alert.severity}`}
                  key={`${alert.severity}-${alert.message}`}
                >
                  <b>{alert.severity.toUpperCase()}</b>
                  <span>{alert.message}</span>
                </div>
              ))}
          </section>
        ) : (
          <section className="result warning">
            <b>Not enough heroes.</b>
            <p>You need one usable Shieldbearer-class hero, one Bomber-class hero and one Shooter-class hero. This hero-class requirement does not mean you should send Shieldbearer troops.</p>
          </section>
        ))}

      {generated && (
        <section className="result">
          <div className="result-title">
            <label>YOUR JOINERS</label>
            <div className="status-summary">
              <span className="status status-ready">
                {joinerFormations.filter((f) => f.status === "ready").length}{" "}
                READY
              </span>
              <span className="status status-review">
                {joinerFormations.filter((f) => f.status === "review").length}{" "}
                REVIEW
              </span>
              <span className="status status-blocked">
                {joinerFormations.filter((f) => f.status === "blocked").length}{" "}
                BLOCKED
              </span>
              <button className="copy-button" onClick={copyAllianceInstructions}>
                COPY INSTRUCTIONS
              </button>
            </div>
          </div>
          <p className="result-intro">
            Every joiner uses exactly one Shieldbearer, one Bomber and one Shooter.
            Use the joiner troop amount and composition set by your alliance. The first hero shown is physically
            LEFT; LEFT War skill level and hero stars affect recommendation priority.
            Owned robots are assigned without reuse.
          </p>
          {joinerFormations.length === 0 && (
            <div className="warning-box">
              {verifiedOnly
                ? "No legal formation uses a screenshot-verified LEFT skill from this roster. Add verified LEFT heroes or turn the filter off."
                : `Not enough compatible heroes to build all requested joiners. Check that you have at least ${joinCount} eligible LEFT-skill heroes plus one Shieldbearer, Bomber and Shooter for each march.`}
            </div>
          )}
          <p className="helper">Leader heroes are reserved. Each joiner uses different heroes; supporting slots preserve priority LEFT skills for other marches.</p><div className="formation-list">
            {joinerFormations.map((f) => (
              <article className="formation-card" key={f.id}>
                <div className="formation-head">
                  <b>{f.id}</b>
                  <span>{f.troopText}</span>
                  <em className={`status status-${f.status}`}>
                    {f.status.toUpperCase()}
                  </em>
                </div>
                <div className="slots">
                  <div className="slot left">
                    <span>
                      LEFT • ACTIVE RALLY SKILL • Lv{f.leftSkillLevel}
                    </span>
                    {heroIconNames.has(f.left.name) && (
                      <Image className="formation-hero-icon"
                        src={`/icons/${heroIconSlug(f.left.name)}.png`}
                        alt="" width={42} height={52} />
                    )}
                    <b>{f.left.name}</b><small>{heroStarLevels[f.left.name] ? "★".repeat(heroStarLevels[f.left.name]) : "Stars not set"}</small>
                    <small>{f.left.leftSkill}</small>
                    <details><summary>Why this hero?</summary><p>First War skill: {f.left.leftSkill}. Auto-ranked from the hero star level at Lv{f.leftSkillLevel}; skill priority comes first, with stars used by the generator. {f.left.leftSkillVerified ? "Skill progression verified." : "Exact progression is not verified."}</p></details>
                  </div>
                  <div className="slot">
                    <span>MIDDLE • {f.middle.cls}</span>
                    {heroIconNames.has(f.middle.name) && (
                      <Image className="formation-hero-icon"
                        src={`/icons/${heroIconSlug(f.middle.name)}.png`}
                        alt="" width={42} height={52} />
                    )}
                    <b>{f.middle.name}</b><small>{heroStarLevels[f.middle.name] ? "★".repeat(heroStarLevels[f.middle.name]) : "Stars not set"}</small>
                  </div>
                  <div className="slot">
                    <span>RIGHT • {f.right.cls}</span>
                    {heroIconNames.has(f.right.name) && (
                      <Image className="formation-hero-icon"
                        src={`/icons/${heroIconSlug(f.right.name)}.png`}
                        alt="" width={42} height={52} />
                    )}
                    <b>{f.right.name}</b><small>{heroStarLevels[f.right.name] ? "★".repeat(heroStarLevels[f.right.name]) : "Stars not set"}</small>
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
                {f.alerts
                  .filter(
                    (alert) =>
                      !joinerTroopPlan.warnings.includes(alert.message),
                  )
                  .map((alert) => (
                    <div
                      className={`formation-alert alert-${alert.severity}`}
                      key={`${f.id}-${alert.severity}-${alert.message}`}
                    >
                      <b>{alert.severity.toUpperCase()}</b>
                      <span>{alert.message}</span>
                    </div>
                  ))}
              </article>
            ))}
          </div>
          {joinerFormations.length < joinCount &&
            joinerFormations.length > 0 && (
              <div className="warning-box">
                {verifiedOnly
                  ? `Verified-only mode produced ${joinerFormations.length} of ${joinCount} legal non-repeating formations. Add more screenshot-verified LEFT heroes or turn the filter off.`
                  : `Only ${joinerFormations.length} legal non-repeating formation${joinerFormations.length === 1 ? "" : "s"} could be built from the selected roster.`}
              </div>
            )}
          {joinerTroopPlan.warnings.map((warning) => (
            <div className="warning-box" key={warning}>
              {warning}
            </div>
          ))}
        </section>
      )}

      <section className="panel notes">
        <div>
          <label>RULES CURRENTLY ENFORCED</label>
          <p>
            ✓ 1 Shield + 1 Bomber + 1 Shooter &nbsp; ✓ LEFT-slot skill priority
            &nbsp; ✓ LEFT War skill level &nbsp; ✓ no hero or robot reuse across
            J1–J6 &nbsp; ✓ Main Rally uses max troops &nbsp; ✓ joiners follow alliance troop limits &nbsp; ✓ troop tiers &nbsp;
            ✓ KOF excluded
          </p>
        </div>
      </section>
      <footer>
        Community tool • Not affiliated with Lands of Jail. Unknown season
        numbers are marked “Legacy” instead of being guessed.
        <br />
        Problems, incorrect formations, or website issues? Contact <b>Stiletto</b> on <b>Server 260</b>.
      </footer>
    </main>
  );
}
