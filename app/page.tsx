"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
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
import {
  createBlankProfile,
  parseProfileExport,
  serializeProfile,
  type MemberProfile,
  type MemberRole,
} from "../lib/profiles";
import { evaluateMemberReadiness } from "../lib/readiness";
import { cageBuffs, splitBuffsBySource, cageBuffSummaryText, cageBuffTimingMessage, previewCageCapacity, buffEffectLabel, defaultCageBuffProfile, preCageShareLines, preCageWarnings, capacityObservationLabel, capacityEvidenceStatus, type CapacityObservation } from "../lib/cage-buffs";
import { parseAllianceBackup, serializeAllianceBackup } from "../lib/backup";
import Image from "next/image";

import { buildLockedFormations, slots, type Locks } from "../lib/formation-locks";

import { downloadFormationImage } from "../lib/formation-image";

type Mode = MemberRole;
const troopClasses: { key: TroopClassKey; label: string }[] = [
  { key: "shield", label: "Shieldbearers" },
  { key: "bomber", label: "Bombers" },
  { key: "shooter", label: "Shooters" },
];
const troopTierOptions = Array.from(
  { length: 11 },
  (_, index) => `T${index + 1}` as TroopTier,
);
const profileStorageKey = "loj-member-profiles-v1";
const activeProfileStorageKey = "loj-active-profile-v1";
const heroIconNames = new Set([
  "Omega Rugal", "Terry Bogard", "Mai Shiranui", "Ada", "Ryuichi", "Edwin",
  "Koschevoi", "Mireya", "Marcus", "Whisper", "Drake", "Veronica", "Tyronn",
  "Xuanming", "Sawyer", "Tormund", "Mia Scarlet Pyros", "Phoenix", "Alph",
  "Zoltan", "Lunarl", "Lofili", "Vivian", "Lee", "Samir", "Gerd", "Durga",
  "Harton", "Pasino", "Aiksen", "Gimes", "Caesar", "Flameborne", "Devilian",
  "Iwado", "Inata", "Lanchester", "Vesaryon", "Ekko", "Flora", "Platos",
]);
const heroIconSlug = (name: string) =>
  name.toLowerCase().replace(/scarlet pyros/g, "scarlet-pyros").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export default function Home() {
  const [mode, setMode] = useState<Mode>("joiner");
  const [season, setSeason] = useState(1);
  const [owned, setOwned] = useState<string[]>([]);
  const [troopPreset, setTroopPreset] = useState<TroopPreset>("shooters");
  const [joinerCapacity, setJoinerCapacity] = useState(100000);
  const [leaderCapacity, setLeaderCapacity] = useState(100000);
  const [joinerRatios, setJoinerRatios] = useState<TroopValues>({
    shield: 0,
    bomber: 0,
    shooter: 100,
  });
  const [leaderRatios, setLeaderRatios] = useState<TroopValues>({
    shield: 0,
    bomber: 10,
    shooter: 90,
  });
  const [troopTiers, setTroopTiers] = useState<TroopTiers>({
    shield: "T10",
    bomber: "T10",
    shooter: "T10",
  });
  const [availableTroops, setAvailableTroops] = useState<TroopValues>({
    shield: 0,
    bomber: 0,
    shooter: 0,
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
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState("new-player");
  const [profileName, setProfileName] = useState("New Player");
  const [profileServer, setProfileServer] = useState("");
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");
  const [selectedBuffIds, setSelectedBuffIds] = useState<string[]>([]);
  const [activationLeadMinutes, setActivationLeadMinutes] = useState(5);
  const [showAdvancedTroops, setShowAdvancedTroops] = useState(false);
  const [capacityObservations, setCapacityObservations] = useState<CapacityObservation[]>([]);
  const [kofLeaderLinks, setKofLeaderLinks] = useState<Record<string,string>>({});
  const importProfileInput = useRef<HTMLInputElement>(null);
  const importAllianceInput = useRef<HTMLInputElement>(null);
  function applyProfile(profile: MemberProfile) {
    setLocks({});
    setLeaderLocks({});
    setProfileName(profile.playerName);
    setProfileServer(profile.server);
    setMode(profile.role);
    setSeason(profile.season);
    setOwned(profile.ownedHeroes);
    setHeroStarLevels(profile.heroStarLevels ?? {});
    setWarSkillLevels(profile.warSkillLevels);
    setOwnedRobots(profile.ownedRobots);
    setOwnedFelons(profile.ownedFelons);
    setFelonRallyCapacities(profile.felonRallyCapacities ?? {});
    setRallyFills(profile.rallyFills);
    setSeatHolder(profile.seatHolder ?? false);
    setJoinerCapacity(profile.joinerCapacity);
    setLeaderCapacity(profile.leaderCapacity);
    setJoinerRatios(profile.joinerRatios);
    setLeaderRatios(profile.leaderRatios);
    setTroopTiers(profile.troopTiers);
    setAvailableTroops(profile.availableTroops);
    setTroopPreset(profile.troopPreset);
    setJoinCount(profile.joinCount);
    setVerifiedOnly(profile.verifiedOnly ?? false);
    setSelectedBuffIds(profile.cageBuffProfile?.selectedBuffIds ?? defaultCageBuffProfile.selectedBuffIds);
    setActivationLeadMinutes(profile.cageBuffProfile?.activationLeadMinutes ?? defaultCageBuffProfile.activationLeadMinutes);
    setCapacityObservations(profile.capacityObservations ?? []);
    setKofLeaderLinks(profile.kofLeaderLinks ?? {});
    setGenerated(false);
  }

  const seasonHeroes = useMemo(
    () => heroes.filter((h) => h.season === 0 || h.season <= season),
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
        available: availableTroops,
      }),
    [joinerRatios, troopTiers, availableTroops],
  );
  const leaderTroopPlan = useMemo(
    () =>
      calculateTroopPlan({
        capacity: leaderCapacity,
        ratios: leaderRatios,
        tiers: troopTiers,
        available: availableTroops,
      }),
    [leaderCapacity, leaderRatios, troopTiers, availableTroops],
  );
  const automaticJoiners = useMemo(
    () =>
      generateJoinerFormations(
        available,
        joinCount,
        joinerTroopPlan,
        warSkillLevels,
        availableRobots,
        verifiedOnly,
        heroStarLevels,
      ),
    [
      available,
      joinCount,
      joinerTroopPlan,
      warSkillLevels,
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
  const applyTroopPreset = (preset: TroopPreset) => {
    setTroopPreset(preset);
    setJoinerRatios(
      preset === "shooters"
        ? { shield: 0, bomber: 0, shooter: 100 }
        : { shield: 0, bomber: 10, shooter: 90 },
    );
    setGenerated(false);
  };
  const updateRatio = (key: TroopClassKey, value: number) => {
    const setter = mode === "leader" ? setLeaderRatios : setJoinerRatios;
    setter((current) => ({ ...current, [key]: value }));
    setGenerated(false);
  };
  const updateTier = (key: TroopClassKey, value: TroopTier) => {
    setTroopTiers((current) => ({ ...current, [key]: value }));
    setGenerated(false);
  };
  const updateAvailable = (key: TroopClassKey, value: number) => {
    setAvailableTroops((current) => ({ ...current, [key]: value }));
    setGenerated(false);
  };
  const currentProfileSnapshot = (): MemberProfile => ({
    id: activeProfileId,
    playerName: profileName.trim() || "Unnamed Member",
    server: profileServer.trim(),
    role: mode,
    season,
    ownedHeroes: owned,
    heroStarLevels,
    warSkillLevels,
    ownedRobots,
    ownedFelons,
    felonRallyCapacities,
    capacityObservations,
    kofLeaderLinks,
    rallyFills,
    seatHolder,
    joinerCapacity,
    leaderCapacity,
    joinerRatios,
    leaderRatios,
    troopTiers,
    availableTroops,
    troopPreset,
    joinCount,
    verifiedOnly,
    cageBuffProfile: { selectedBuffIds, activationLeadMinutes },
    updatedAt: Date.now(),
  });
  const [exportingImage, setExportingImage] = useState(false);
  const exportFormationImage = async () => {
    setExportingImage(true);
    try {
      await downloadFormationImage(mode === "leader" ? (leaderFormation ? [leaderFormation] : []) : joinerFormations,
        profileName || "Member", heroStarLevels,
        name => heroIconNames.has(name) ? "/icons/" + heroIconSlug(name) + ".png" : null);
      setProfileNotice("Formation image downloaded.");
    } catch (error) {
      setProfileNotice(error instanceof Error ? error.message : "Image download failed.");
    } finally { setExportingImage(false); }
  };
  const copyAllianceInstructions = async () => {
    const lines = [
      `TRIAL CAGE — ${profileName || "Player"}`,
      `Server ${profileServer || "—"} • ${verifiedOnly ? "verified LEFT skills only" : "standard LEFT skill priority"}`,
      ...preCageShareLines({ selectedBuffIds, activationLeadMinutes }),
      "",
      ...joinerFormations.flatMap((formation) => [
        `${formation.id}: ${formation.left.name} (LEFT Lv${formation.leftSkillLevel}) / ${formation.middle.name} / ${formation.right.name}`,
        `  ${formation.troopText} • Robot: ${formation.robot ?? "none"} • ${formation.status.toUpperCase()}`,
      ]),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setProfileNotice("Alliance instructions copied to the clipboard.");
    } catch {
      setProfileNotice("Clipboard access was blocked. Select and copy the formation list manually.");
    }
  };
  const saveActiveProfile = () => {
    const saved = currentProfileSnapshot();
    const next = profiles.map((profile) =>
      profile.id === activeProfileId ? saved : profile,
    );
    setProfiles(next);
    localStorage.setItem(profileStorageKey, JSON.stringify(next));
    setProfileNotice(`${saved.playerName}'s account profile is saved.`);
  };
  const exportActiveProfile = () => {
    const saved = currentProfileSnapshot();
    const next = profiles.map((profile) =>
      profile.id === activeProfileId ? saved : profile,
    );
    setProfiles(next);
    localStorage.setItem(profileStorageKey, JSON.stringify(next));
    const blob = new Blob([serializeProfile(saved)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    const safeName = saved.playerName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    link.href = URL.createObjectURL(blob);
    link.download = `loj-profile-${safeName || "member"}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setProfileNotice(`${saved.playerName}'s profile backup was downloaded.`);
  };
  const importMemberProfile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const createdAt = Date.now();
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `member-${createdAt}`;
      const imported = parseProfileExport(await file.text(), id);
      const current = currentProfileSnapshot();
      const savedProfiles = profiles.map((profile) =>
        profile.id === activeProfileId ? current : profile,
      );
      const next = [...savedProfiles, imported];
      setProfiles(next);
      localStorage.setItem(profileStorageKey, JSON.stringify(next));
      setActiveProfileId(imported.id);
      localStorage.setItem(activeProfileStorageKey, imported.id);
      applyProfile(imported);
      setProfileNotice(`Imported ${imported.playerName}'s account profile.`);
    } catch (error) {
      setProfileNotice(
        error instanceof Error
          ? error.message
          : "The selected profile could not be imported.",
      );
    }
  };
  const exportAllianceBackup = () => {
    const current = currentProfileSnapshot();
    const savedProfiles = profiles.map((profile) =>
      profile.id === activeProfileId ? current : profile,
    );
    setProfiles(savedProfiles);
    localStorage.setItem(profileStorageKey, JSON.stringify(savedProfiles));
    const blob = new Blob([serializeAllianceBackup(savedProfiles, {})], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `loj-trial-cage-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setProfileNotice("Full Trial Cage alliance backup downloaded.");
  };
  const importAllianceBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const createdAt = Date.now();
      const restored = parseAllianceBackup(
        await file.text(),
        (_sourceId, index) =>
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `member-${createdAt}-${index}`,
      );
      const current = currentProfileSnapshot();
      const savedProfiles = profiles.map((profile) =>
        profile.id === activeProfileId ? current : profile,
      );
      const next = [...savedProfiles, ...restored.profiles];
      const first = restored.profiles[0];
      setProfiles(next);
      localStorage.setItem(profileStorageKey, JSON.stringify(next));
      setActiveProfileId(first.id);
      localStorage.setItem(activeProfileStorageKey, first.id);
      applyProfile(first);
      setProfileNotice(
        `Restored ${restored.profiles.length} member profiles.`,
      );
    } catch (error) {
      setProfileNotice(
        error instanceof Error
          ? error.message
          : "The selected alliance backup could not be restored.",
      );
    }
  };
  const switchProfile = (profileId: string) => {
    const current = currentProfileSnapshot();
    const next = profiles.map((profile) =>
      profile.id === activeProfileId ? current : profile,
    );
    const profile = next.find((entry) => entry.id === profileId);
    if (!profile) return;
    setProfiles(next);
    localStorage.setItem(profileStorageKey, JSON.stringify(next));
    setActiveProfileId(profile.id);
    localStorage.setItem(activeProfileStorageKey, profile.id);
    applyProfile(profile);
    setProfileNotice(`Loaded ${profile.playerName}'s account settings.`);
  };
  const createProfile = () => {
    const createdAt = Date.now();
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `member-${createdAt}`;
    const profile = createBlankProfile(id);
    const current = currentProfileSnapshot();
    const savedProfiles = profiles.map((entry) =>
      entry.id === activeProfileId ? current : entry,
    );
    const next = [...savedProfiles, profile];
    setProfiles(next);
    localStorage.setItem(profileStorageKey, JSON.stringify(next));
    setActiveProfileId(profile.id);
    localStorage.setItem(activeProfileStorageKey, profile.id);
    applyProfile(profile);
    setProfileNotice("Created an empty player profile.");
  };
  const deleteActiveProfile = () => {
    if (profiles.length <= 1) {
      setProfileNotice("At least one member profile must remain.");
      return;
    }
    const next = profiles.filter((profile) => profile.id !== activeProfileId);
    const replacement = next[0];
    setProfiles(next);
    localStorage.setItem(profileStorageKey, JSON.stringify(next));
    setActiveProfileId(replacement.id);
    localStorage.setItem(activeProfileStorageKey, replacement.id);
    applyProfile(replacement);
    setProfileNotice("Member profile deleted from this browser.");
  };

  const buffGroups = splitBuffsBySource();
  const buffCapacityPreview = previewCageCapacity(leaderCapacity, selectedBuffIds);
  const toggleCageBuff = (id: string) => setSelectedBuffIds(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  const profileSnapshot = currentProfileSnapshot();
  const rosterProfiles = profiles.map((profile) =>
    profile.id === activeProfileId ? profileSnapshot : profile,
  );
  const roster = rosterProfiles.map((profile) => ({
    profile,
    readiness: evaluateMemberReadiness(profile, heroes),
  }));
  const readinessCounts = {
    ready: roster.filter((entry) => entry.readiness.status === "ready").length,
    review: roster.filter((entry) => entry.readiness.status === "review")
      .length,
    blocked: roster.filter((entry) => entry.readiness.status === "blocked")
      .length,
  };

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
        <div className="badge">DEV v1.16</div>
      </header>

      <section className="panel profile-panel">
        <div className="title">
          <div>
            <label>PLAYER PROFILE</label>
            <h2>Generate from this member&apos;s actual account</h2>
          </div>
          <span>{profiles.length} saved locally</span>
        </div>
        <div className="profile-grid">
          <label>
            ACTIVE MEMBER
            <select
              value={activeProfileId}
              onChange={(event) => switchProfile(event.target.value)}
              disabled={!profilesLoaded}
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.playerName}
                  {profile.server ? ` — Server ${profile.server}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            PLAYER NAME
            <input
              value={profileName}
              onChange={(event) => {
                setProfileName(event.target.value);
                setProfileNotice("");
              }}
            />
          </label>
          <label>
            SERVER
            <input
              inputMode="numeric"
              value={profileServer}
              onChange={(event) => {
                setProfileServer(event.target.value);
                setProfileNotice("");
              }}
              placeholder="260"
            />
          </label>
          <div className="profile-role">
            <label>SAVED ROLE</label>
            <strong>
              {mode === "leader" ? "Rally Leader" : "Rally Joiner"}
            </strong>
          </div>
          <div className="profile-seat">
            <label>SCARLET BUTCHER SEAT</label>
            <button
              className={seatHolder ? "active" : ""}
              onClick={() => {
                setSeatHolder((current) => !current);
                setGenerated(false);
                setProfileNotice("");
              }}
            >
              {seatHolder ? "SEAT HOLDER • +10% ATK" : "NO SEAT BONUS"}
            </button>
          </div>
        </div>
        <div className="profile-actions">
          <button className="profile-save" onClick={saveActiveProfile}>
            SAVE PROFILE
          </button>
          <button onClick={createProfile}>NEW EMPTY MEMBER</button>
          <button onClick={exportActiveProfile}>EXPORT PROFILE</button>
          <button onClick={() => importProfileInput.current?.click()}>
            IMPORT PROFILE
          </button>
          <input
            ref={importProfileInput}
            className="profile-file-input"
            type="file"
            accept="application/json,.json"
            onChange={importMemberProfile}
          />
          <button className="profile-delete" onClick={deleteActiveProfile}>
            DELETE PROFILE
          </button>
        </div>
        {profileNotice && <p className="profile-notice">{profileNotice}</p>}
        <p className="helper">
          Profiles stay in this browser. New members begin with
          no owned heroes, robots or Felons selected, so Stiletto&apos;s Server
          260 settings are never used as their account data. Exported profile
          files contain account settings.
        </p>
      </section>

      <section className="panel cage-buffs-panel">
        <div className="title"><div><label>PRE-CAGE SETUP</label><h2>2-hour buffs & Prisoner Armor</h2></div></div>
        <p className="helper">Select the buffs you actually activate before Trial Cage. Capacity bonuses stay separated until their in-game stacking order is verified.</p>
        <div className="buff-groups">
          {[["Prison Buffs", buffGroups.prisonBuffs], ["Prisoner Armor", buffGroups.prisonerArmor]].map(([title, items]) => <div className="buff-group" key={String(title)}><h3>{String(title)}</h3><div className="buff-grid">{(items as typeof cageBuffs).map(buff => <button type="button" className={selectedBuffIds.includes(buff.id) ? "buff selected" : "buff"} key={buff.id} onClick={()=>toggleCageBuff(buff.id)}><b>{buff.name}{buff.level ? ` Lv.${buff.level}` : ""}</b><span>{buffEffectLabel(buff)}</span><small>{buff.durationHours}h after activation</small></button>)}</div></div>)}
        </div>
        <div className="buff-summary"><b className="pre-cage-label">PRE-CAGE CHECKLIST</b><span>✓ Main Rally capacity: {leaderCapacity.toLocaleString()}</span><span>✓ Troop ratio: {leaderRatios.shield}/{leaderRatios.bomber}/{leaderRatios.shooter}</span><span>{availableRobots.length ? "✓" : "⚠"} Robot: {availableRobots[0] ?? "none selected"}</span><strong>{cageBuffSummaryText(selectedBuffIds)}</strong><label>Activate before Cage <input type="number" min="0" max="120" value={activationLeadMinutes} onChange={e=>setActivationLeadMinutes(Math.max(0,Math.min(120,Number(e.target.value)||0)))} /> min</label><small>{cageBuffTimingMessage({selectedBuffIds,activationLeadMinutes})}</small></div>
        <div className="capacity-preview"><b>Capacity preview</b><span>Base {buffCapacityPreview.baseCapacity.toLocaleString()}</span><span>Expedition {buffCapacityPreview.expeditionPercent ? `+${buffCapacityPreview.expeditionPercent}%` : "—"}</span><span>Expedition flat {buffCapacityPreview.expeditionFlat ? `+${buffCapacityPreview.expeditionFlat.toLocaleString()}` : "—"}</span><span>Rally flat {buffCapacityPreview.rallyFlat ? `+${buffCapacityPreview.rallyFlat.toLocaleString()}` : "—"}</span><small>{buffCapacityPreview.note}</small>{preCageWarnings(leaderCapacity,selectedBuffIds).map(w=><small className="buff-warning" key={w}>{w}</small>)}</div>
      </section>

      <section className="panel capacity-lab">
        <div className="title"><div><label>CAPACITY TEST RECORDER</label><h2>Record what the game actually displays</h2></div><span>{capacityObservations.length} tests</span></div>
        <p className="helper">Use this after a normal Cage activation. It records evidence without guessing the stacking formula.</p><div className={`evidence-status evidence-${capacityEvidenceStatus(capacityObservations).status}`}>{capacityEvidenceStatus(capacityObservations).label}</div>
        <div className="capacity-test-form">
          <input id="capacity-felon" placeholder="Felon used (optional)" />
          <input id="capacity-displayed" type="number" min="1" placeholder="Displayed capacity" />
          <button type="button" onClick={()=>{const f=document.querySelector<HTMLInputElement>("#capacity-felon");const d=document.querySelector<HTMLInputElement>("#capacity-displayed");const shown=Number(d?.value);if(!shown)return;setCapacityObservations(cur=>[{felon:f?.value.trim()||"Unspecified",baseCapacity:leaderCapacity,selectedBuffIds:[...selectedBuffIds],displayedCapacity:shown,recordedAt:Date.now()},...cur]);if(d)d.value="";}}>RECORD TEST</button>
        </div>
        {capacityObservations.length > 0 && <button className="clear-capacity-tests" type="button" onClick={()=>setCapacityObservations([])}>CLEAR RECORDED TESTS</button>}
        <div className="capacity-test-list">{capacityObservations.slice(0,5).map((o,i)=><div key={o.recordedAt+"-"+i}>{capacityObservationLabel(o)}</div>)}</div>
      </section>

      <section className="panel alliance-panel">
        <div className="title">
          <div>
            <label>PLAYER READINESS</label>
            <h2>See who is ready before Trial Cage opens</h2>
          </div>
          <span>{roster.length} member profiles</span>
        </div>
        <div className="alliance-summary">
          <div className="ready">
            <strong>{readinessCounts.ready}</strong>
            <span>READY</span>
          </div>
          <div className="review">
            <strong>{readinessCounts.review}</strong>
            <span>REVIEW</span>
          </div>
          <div className="blocked">
            <strong>{readinessCounts.blocked}</strong>
            <span>BLOCKED</span>
          </div>
          <div>
            <strong>
              {roster.filter((entry) => entry.profile.seatHolder).length}
            </strong>
            <span>SEAT HOLDERS</span>
          </div>
        </div>
        <div className="profile-actions alliance-actions">
          <button className="profile-save" onClick={exportAllianceBackup}>
            EXPORT FULL ALLIANCE
          </button>
          <button onClick={() => importAllianceInput.current?.click()}>
            RESTORE ALLIANCE BACKUP
          </button>
          <input
            ref={importAllianceInput}
            className="profile-file-input"
            type="file"
            accept="application/json,.json"
            onChange={importAllianceBackup}
          />
          <span>
            Includes every member profile and each member&apos;s Cage-hit
            profiles and Trial Cage setup.
          </span>
        </div>
        <div className="alliance-roster">
          {roster.map(({ profile, readiness }) => (
            <article
              className={`member-card ${
                profile.id === activeProfileId ? "active" : ""
              }`}
              key={profile.id}
            >
              <div className="member-card-head">
                <div>
                  <b>{profile.playerName}</b>
                  <span>
                    {profile.server ? `Server ${profile.server}` : "No server"}
                    {profile.seatHolder ? " • Seat +10% ATK" : ""}
                  </span>
                </div>
                <em className={`status status-${readiness.status}`}>
                  {readiness.status.toUpperCase()}
                </em>
              </div>
              <div className="member-facts">
                <span>
                  <b>{profile.role === "leader" ? "Leader" : "Joiner"}</b>
                  Role
                </span>
                <span>
                  <b>{readiness.capacity.toLocaleString("en-US")}</b>
                  Capacity
                </span>
                <span>
                  <b>
                    {readiness.possibleMarches}/{readiness.requestedMarches}
                  </b>
                  Marches
                </span>
                <span>
                  <b>
                    {readiness.classCounts.Shield}/
                    {readiness.classCounts.Bomber}/
                    {readiness.classCounts.Shooter}
                  </b>
                  S / B / S heroes
                </span>
                <span>
                  <b>{profile.ownedRobots.length}</b>
                  Robots
                </span>
              </div>
              <p>
                {readiness.issues.length
                  ? readiness.issues.slice(0, 2).join(" • ")
                  : "Profile has the required heroes, troops and support setup."}
              </p>
              <button onClick={() => switchProfile(profile.id)}>
                {profile.id === activeProfileId
                  ? "ACTIVE MEMBER"
                  : "OPEN MEMBER PROFILE"}
              </button>
            </article>
          ))}
        </div>
      </section>

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
        {mode === "joiner" && (
          <label className="verified-toggle">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(event) => {
                setVerifiedOnly(event.target.checked);
                setGenerated(false);
              }}
            />
            <span>
              <b>VERIFIED SKILLS ONLY</b>
              <small>Use screenshot-confirmed LEFT War progressions only</small>
              <small>
                {evidenceCounts.verified}/{evidenceCounts.total} available LEFT
                skills verified
              </small>
            </span>
          </label>
        )}
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
                  applyTroopPreset(e.target.value as TroopPreset);
                }}
              >
                <option value="shooters">0 / 0 / 100</option>
                <option value="10-90">0 / 10 / 90</option>
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

      <section className="panel setup-dashboard">
        <div className="title"><div><label>PROFILE SETUP DASHBOARD</label><h2>Current Cage account setup</h2></div></div>
        <div className="setup-progress"><b>Setup:</b> {[profileName && profileName !== "New Player", profileServer, owned.length >= 3, availableTroops.bomber > 0 || availableTroops.shooter > 0, ownedRobots.length > 0].filter(Boolean).length}/5 basics complete</div>
        <div className="setup-facts">
          <span><b>{owned.length}</b> Heroes</span><span><b>{ownedRobots.length}</b> Robots</span><span><b>{ownedFelons.length}</b> Felons</span>
          <span><b>{mode === "leader" ? leaderCapacity.toLocaleString() : "100,000"}</b> March</span><span><b>{selectedBuffIds.length}</b> Pre-Cage buffs</span>
        </div>
      </section>

      <section className="panel troop-panel">
        <div className="title">
          <div>
            <label>TROOP SETUP</label>
            <h2>{mode === "leader" ? "Leader march" : "Joiner marches"}</h2>
          </div>
          <span>
            {(mode === "leader"
              ? leaderTroopPlan.assignedTotal
              : joinerTroopPlan.assignedTotal
            ).toLocaleString("en-US")}{" "}
            assigned
          </span>
        </div>
        <div className="troop-capacity">
          <label htmlFor="march-capacity">UNBUFFED MARCH CAPACITY</label>
          <input
            id="march-capacity"
            type="number"
            min="1"
            step="1"
            value={mode === "leader" ? leaderCapacity : 100000}
            disabled={mode === "joiner"}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (mode === "leader") setLeaderCapacity(value);
              setGenerated(false);
            }}
          />
          {mode === "leader" && <div className="main-rally-context"><b>MAIN RALLY • MAX CAP</b><span>Full march: {leaderCapacity.toLocaleString()} troops</span><span>Composition: {leaderRatios.shield} / {leaderRatios.bomber} / {leaderRatios.shooter}</span><span>Exact troops: {leaderTroopPlan.counts.shield.toLocaleString()} Shield / {leaderTroopPlan.counts.bomber.toLocaleString()} Bomber / {leaderTroopPlan.counts.shooter.toLocaleString()} Shooter = {leaderTroopPlan.assignedTotal.toLocaleString()}</span><small>Ratios split your full Main Rally capacity; they do not reduce the march to 100,000.</small></div>}
          <small>
            {mode === "leader"
              ? "Rally Leaders always use the full saved Main Rally capacity. The ratio only divides that full capacity between troop classes. Temporary Cage buffs are tracked separately below."
              : "Trial Cage joiners use a fixed 100,000 troops. The LEFT hero is prioritized by Cage War skill; stars are secondary."}
          </small>
        </div>
        <div className="cage-ratio-presets"><b>QUICK CAGE RATIOS</b><button type="button" onClick={()=>{(mode==="leader"?setLeaderRatios:setJoinerRatios)({shield:0,bomber:0,shooter:100});setGenerated(false)}}>0 / 0 / 100</button><button type="button" onClick={()=>{const set=mode==="leader"?setLeaderRatios:setJoinerRatios;set(r=>({shield:0,bomber:r.bomber,shooter:100-r.bomber}));setGenerated(false)}}>RESET SHIELD TO 0</button><button type="button" onClick={()=>{(mode==="leader"?setLeaderRatios:setJoinerRatios)({shield:0,bomber:10,shooter:90});setGenerated(false)}}>0 / 10 / 90</button></div>
        <button className="advanced-troops-toggle" type="button" onClick={()=>setShowAdvancedTroops(v=>!v)}>{showAdvancedTroops ? "HIDE ADVANCED SHIELDBEARER TROOPS" : "ADVANCED: SHIELDBEARER TROOPS"}</button>
        <p className="cage-troop-note"><b>Shieldbearer hero ≠ Shieldbearer troops.</b> Standard Trial Cage setup uses 0 Shieldbearer troops, so only Bombers and Shooters are shown here.</p>
        <div className="troop-grid troop-grid-head">
          <b>CAGE TROOPS</b>
          <b>RATIO %</b>
          <b>TIER</b>
          <b>AVAILABLE</b>
          <b>REQUIRED</b>
        </div>
        {troopClasses.filter(({ key }) => key !== "shield" || showAdvancedTroops).map(({ key, label }) => {
          const ratios = mode === "leader" ? leaderRatios : joinerRatios;
          const plan = mode === "leader" ? leaderTroopPlan : joinerTroopPlan;
          return (
            <div className="troop-grid" key={key}>
              <strong>{label}</strong>
              <input
                aria-label={`${label} ratio`}
                type="number"
                min="0"
                max="100"
                step="1"
                value={ratios[key]}
                onChange={(event) =>
                  updateRatio(key, Number(event.target.value))
                }
              />
              <select
                aria-label={`${label} tier`}
                value={troopTiers[key]}
                onChange={(event) =>
                  updateTier(key, event.target.value as TroopTier)
                }
              >
                {troopTierOptions.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
              <input
                aria-label={`${label} available`}
                type="number"
                min="0"
                step="1"
                value={availableTroops[key]}
                onChange={(event) =>
                  updateAvailable(key, Number(event.target.value))
                }
              />
              <b>{plan.counts[key].toLocaleString("en-US")}</b>
            </div>
          );
        })}
        <div className="troop-summary">
          <span>
            Ratio total:{" "}
            {mode === "leader"
              ? leaderTroopPlan.ratioTotal
              : joinerTroopPlan.ratioTotal}
            %
          </span>
          <strong>
            {mode === "leader" ? leaderTroopPlan.text : joinerTroopPlan.text}
          </strong>
        </div>
        {(mode === "leader" ? leaderTroopPlan : joinerTroopPlan).warnings.map(
          (warning) => (
            <div className="warning-box" key={warning}>
              {warning}
            </div>
          ),
        )}
      </section>

      {mode === "leader" && season >= 5 && (
        <section className="panel kof-link-panel">
          <div className="title"><div><label>KOF LEGACY LINKS</label><h2>Link ★4+ KOF heroes to your Main Rally</h2></div></div>
          <p className="helper">KOF heroes stay excluded from Joiner LEFT recommendations. At ★4 or ★5, an owned KOF hero can be linked as a player-chosen Main Rally replacement. Linking does not claim the KOF hero is automatically stronger.</p>
          <div className="kof-links">
            {heroes.filter(h=>h.rarity==="KOF" && owned.includes(h.name)).map(h=>{const stars=heroStarLevels[h.name]??1;const targets=h.cls==="Shield"?["Tyronn"]:h.cls==="Bomber"?["Ryuichi"]:["Ada"];return <div className="kof-link" key={h.name}><b>{h.name} • {"★".repeat(stars)}</b>{stars>=4?<select value={kofLeaderLinks[h.name]??""} onChange={e=>{setKofLeaderLinks(cur=>({...cur,[h.name]:e.target.value}));setGenerated(false)}}><option value="">Not linked</option>{targets.map(target=><option key={target} value={target}>Link to / replace {target}</option>)}</select>:<small>Requires ★4 or higher for Main Rally linking.</small>}</div>})}
            {!heroes.some(h=>h.rarity==="KOF" && owned.includes(h.name)) && <p className="helper">Select an owned KOF hero in your hero roster to configure a link.</p>}
          </div>
        </section>
      )}

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
                    Hero stars{" "}
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

      <section className="panel">
        <h2>Hero locks &amp; replacements</h2>
        <p>Choose an owned hero to lock a slot. Other slots fill automatically. To replace a hero you do not own, clear that hero in your roster and choose an eligible alternative here.</p>
        <button onClick={() => { (mode === "leader" ? setLeaderLocks : setLocks)({}); setGenerated(false); }}>Clear locks</button>
        {Array.from({length: mode === "leader" ? 1 : joinCount}, (_, i) => (
          <div className="slots" key={i}>
            {slots.map(slot => {
              const key = i + ":" + slot;
              const reserved = mode === "joiner" && leaderFormation ? slots.map(s => leaderFormation![s].name) : [];
              return <label key={slot}>{mode === "leader" ? "MAIN" : "J" + (i+1)} · {slot.toUpperCase()}
                <select value={currentLocks[key] ?? ""} onChange={e => updateLock(key, e.target.value)}>
                  <option value="">Automatic / best available</option>
                  {available.filter(h => !reserved.includes(h.name) && (mode === "leader" || h.rarity === "SSR" || ["Lunarl","Lofili","Samir"].includes(h.name)) && (mode === "leader" || slot !== "left" || (h.leftSkill && (!verifiedOnly || h.leftSkillVerified)))).map(h => <option key={h.name} value={h.name}>{h.name} · {h.cls}</option>)}
                </select>
              </label>;
            })}
          </div>
        ))}
        {lockError && <p role="alert" className="warning-box">{lockError}</p>}
        <p className="helper">Locks apply to this session and reset when switching profiles. Every march requires one Shield, Bomber and Shooter. Leader heroes remain reserved.</p>
      </section>
      <button className="generate" onClick={() => setGenerated(true)}>
        GENERATE CAGE FORMATION{mode === "joiner" ? "S" : ""}
      </button>

      {generated && (
        <div className={`seat-bonus ${seatHolder ? "active" : "inactive"}`}>
          <b>{seatHolder ? "+10% ATK ACTIVE" : "NO SEAT ATK BONUS"}</b>
          <span>
            {seatHolder
              ? "This member is a seat holder: +10% ATK against Imprisoned Scarlet Butcher."
              : "This member is not marked as a seat holder; no seat modifier is applied."}
          </span>
        </div>
      )}

      {generated && !lockError && (
        <button className="copy-button" disabled={exportingImage || (mode === "leader" ? !leaderFormation : !joinerFormations.length)} onClick={exportFormationImage}>
          {exportingImage ? "CREATING IMAGE…" : "DOWNLOAD FORMATION IMAGE"}
        </button>
      )}

      {generated &&
        mode === "leader" &&
        (leaderFormation ? (
          <section className="result">
            <div className="result-title">
              <label>RECOMMENDED LEADER BASELINE</label>
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
            <div className="ratio">
              <span>TROOPS • Shield / Bomber / Shooter</span>
              <strong>{leaderFormation.troopText}</strong>
            </div>
            <p>
              Main Rally uses your owned heroes, star levels and configured troop ratio. New season swaps should be tested one change at a time before being treated as verified Cage improvements.
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

      {generated && mode === "joiner" && (
        <section className="result">
          <div className="result-title">
            <label>GENERATED JOINER FORMATIONS</label>
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
            Each joiner is fixed at 100,000 troops. The first hero shown is physically
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
                    <details><summary>Why this hero?</summary><p>First War skill: {f.left.leftSkill}. {locks[(Number(f.id.slice(1))-1)+":left"] ? "Manually locked" : "Selected"} at skill Lv{f.leftSkillLevel}; skill priority comes first, with stars as a secondary preference. {f.left.leftSkillVerified ? "Skill progression verified." : "Exact progression is not verified."}</p></details>
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
          {availableRobots.length < joinerFormations.length && (
            <div className="warning-box">
              Only {availableRobots.length} owned robot
              {availableRobots.length === 1 ? "" : "s"} selected for{" "}
              {joinerFormations.length} formations. Select more robots to
              complete every march.
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
            J1–J6 &nbsp; ✓ configurable capacity, ratios and troop tiers &nbsp;
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
