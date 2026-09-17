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
  compareResults,
  type CageName,
  type CageResult,
  type TestVariant,
} from "../lib/results";
import {
  createBlankProfile,
  parseProfileExport,
  serializeProfile,
  type MemberProfile,
  type MemberRole,
} from "../lib/profiles";
import { evaluateMemberReadiness } from "../lib/readiness";
import { parseAllianceBackup, serializeAllianceBackup } from "../lib/backup";

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
const legacyResultStorageKey = "loj-cage-results-v1";
const profileStorageKey = "loj-member-profiles-v1";
const activeProfileStorageKey = "loj-active-profile-v1";
const resultStorageKey = (profileId: string) =>
  `loj-cage-results-v1:${profileId}`;
const formatDamage = (value: number) => value.toLocaleString("en-US");
const createStilettoProfile = (): MemberProfile => ({
  id: "stiletto-s260",
  playerName: "Stiletto",
  server: "260",
  role: "joiner",
  season: 6,
  ownedHeroes: heroes
    .filter((hero) => hero.cageAllowed)
    .map((hero) => hero.name),
  warSkillLevels: Object.fromEntries(
    heroes.filter((hero) => hero.leftSkill).map((hero) => [hero.name, 5]),
  ),
  ownedRobots: [...robots],
  ownedFelons: felons.map((felon) => felon.name),
  rallyFills: true,
  seatHolder: true,
  joinerCapacity: 100000,
  leaderCapacity: 188662,
  joinerRatios: { shield: 0, bomber: 0, shooter: 100 },
  leaderRatios: { shield: 0, bomber: 10, shooter: 90 },
  troopTiers: { shield: "T10", bomber: "T10", shooter: "T11" },
  availableTroops: { shield: 188662, bomber: 188662, shooter: 188662 },
  troopPreset: "shooters",
  joinCount: 6,
  updatedAt: Date.now(),
});

export default function Home() {
  const [mode, setMode] = useState<Mode>("joiner");
  const [season, setSeason] = useState(6);
  const [owned, setOwned] = useState<string[]>(
    heroes.filter((h) => h.cageAllowed).map((h) => h.name),
  );
  const [troopPreset, setTroopPreset] = useState<TroopPreset>("shooters");
  const [joinerCapacity, setJoinerCapacity] = useState(100000);
  const [leaderCapacity, setLeaderCapacity] = useState(188662);
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
    shooter: "T11",
  });
  const [availableTroops, setAvailableTroops] = useState<TroopValues>({
    shield: 188662,
    bomber: 188662,
    shooter: 188662,
  });
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
  const [seatHolder, setSeatHolder] = useState(true);
  const [generated, setGenerated] = useState(false);
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState("stiletto-s260");
  const [profileName, setProfileName] = useState("Stiletto");
  const [profileServer, setProfileServer] = useState("260");
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");
  const importProfileInput = useRef<HTMLInputElement>(null);
  const importAllianceInput = useRef<HTMLInputElement>(null);
  const [cageResults, setCageResults] = useState<CageResult[]>([]);
  const [resultsLoaded, setResultsLoaded] = useState(false);
  const [resultsProfileId, setResultsProfileId] = useState("");
  const [resultCage, setResultCage] = useState<CageName>("Cage 1");
  const [resultDate, setResultDate] = useState("");
  const [testName, setTestName] = useState("Main baseline");
  const [testVariant, setTestVariant] = useState<TestVariant>("A");
  const [resultLeftHero, setResultLeftHero] = useState("Ryuichi");
  const [resultDamage, setResultDamage] = useState("");
  const [resultNotes, setResultNotes] = useState("");
  const [resultError, setResultError] = useState("");
  const [comparisonName, setComparisonName] = useState("");

  function applyProfile(profile: MemberProfile) {
    setProfileName(profile.playerName);
    setProfileServer(profile.server);
    setMode(profile.role);
    setSeason(profile.season);
    setOwned(profile.ownedHeroes);
    setWarSkillLevels(profile.warSkillLevels);
    setOwnedRobots(profile.ownedRobots);
    setOwnedFelons(profile.ownedFelons);
    setRallyFills(profile.rallyFills);
    setSeatHolder(profile.seatHolder ?? profile.id === "stiletto-s260");
    setJoinerCapacity(profile.joinerCapacity);
    setLeaderCapacity(profile.leaderCapacity);
    setJoinerRatios(profile.joinerRatios);
    setLeaderRatios(profile.leaderRatios);
    setTroopTiers(profile.troopTiers);
    setAvailableTroops(profile.availableTroops);
    setTroopPreset(profile.troopPreset);
    setJoinCount(profile.joinCount);
    setGenerated(false);
  }

  useEffect(() => {
    setResultDate(new Date().toISOString().slice(0, 10));
    try {
      const storedProfiles = localStorage.getItem(profileStorageKey);
      const parsedProfiles = storedProfiles ? JSON.parse(storedProfiles) : null;
      const loadedProfiles: MemberProfile[] =
        Array.isArray(parsedProfiles) && parsedProfiles.length
          ? parsedProfiles.map((profile: MemberProfile) => ({
              ...profile,
              seatHolder: profile.seatHolder ?? profile.id === "stiletto-s260",
            }))
          : [createStilettoProfile()];
      const storedActive = localStorage.getItem(activeProfileStorageKey);
      const active =
        loadedProfiles.find((profile) => profile.id === storedActive) ??
        loadedProfiles[0];
      setProfiles(loadedProfiles);
      setActiveProfileId(active.id);
      applyProfile(active);
      localStorage.setItem(profileStorageKey, JSON.stringify(loadedProfiles));
      localStorage.setItem(activeProfileStorageKey, active.id);
    } catch {
      const fallback = createStilettoProfile();
      setProfiles([fallback]);
      applyProfile(fallback);
      setProfileNotice("Saved member profiles could not be read.");
    } finally {
      setProfilesLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!profilesLoaded) return;
    setResultsLoaded(false);
    setComparisonName("");
    try {
      const profileKey = resultStorageKey(activeProfileId);
      const stored = localStorage.getItem(profileKey);
      const legacy =
        activeProfileId === "stiletto-s260"
          ? localStorage.getItem(legacyResultStorageKey)
          : null;
      const parsed = JSON.parse(stored ?? legacy ?? "[]");
      const loaded = Array.isArray(parsed) ? parsed : [];
      setCageResults(loaded);
      if (!stored && legacy) {
        localStorage.setItem(profileKey, JSON.stringify(loaded));
      }
    } catch {
      setCageResults([]);
      setResultError("Saved results could not be read for this profile.");
    } finally {
      setResultsProfileId(activeProfileId);
      setResultsLoaded(true);
    }
  }, [activeProfileId, profilesLoaded]);

  useEffect(() => {
    if (!resultsLoaded || resultsProfileId !== activeProfileId) return;
    localStorage.setItem(
      resultStorageKey(activeProfileId),
      JSON.stringify(cageResults),
    );
  }, [activeProfileId, cageResults, resultsLoaded, resultsProfileId]);

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
  const joinerTroopPlan = useMemo(
    () =>
      calculateTroopPlan({
        capacity: joinerCapacity,
        ratios: joinerRatios,
        tiers: troopTiers,
        available: availableTroops,
      }),
    [joinerCapacity, joinerRatios, troopTiers, availableTroops],
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
  const joinerFormations = useMemo(
    () =>
      generateJoinerFormations(
        available,
        joinCount,
        joinerTroopPlan,
        warSkillLevels,
        availableRobots,
      ),
    [available, joinCount, joinerTroopPlan, warSkillLevels, availableRobots],
  );
  const leaderFormation = useMemo(
    () => generateLeaderFormation(available, leaderTroopPlan, availableRobots),
    [available, leaderTroopPlan, availableRobots],
  );
  const felonPlan = useMemo(
    () => optimizeFelons(felons, ownedFelons, rallyFills),
    [ownedFelons, rallyFills],
  );
  const testNames = useMemo(
    () => [...new Set(cageResults.map((result) => result.testName))].sort(),
    [cageResults],
  );
  const activeComparisonName = comparisonName || testNames[0] || "";
  const comparison = useMemo(
    () => compareResults(cageResults, activeComparisonName),
    [cageResults, activeComparisonName],
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
    warSkillLevels,
    ownedRobots,
    ownedFelons,
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
    updatedAt: Date.now(),
  });
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
    const results = Object.fromEntries(
      savedProfiles.map((profile) => {
        if (profile.id === activeProfileId) {
          return [profile.id, cageResults];
        }
        try {
          const stored = localStorage.getItem(resultStorageKey(profile.id));
          const parsed = stored ? JSON.parse(stored) : [];
          return [profile.id, Array.isArray(parsed) ? parsed : []];
        } catch {
          return [profile.id, []];
        }
      }),
    );
    setProfiles(savedProfiles);
    localStorage.setItem(profileStorageKey, JSON.stringify(savedProfiles));
    const blob = new Blob([serializeAllianceBackup(savedProfiles, results)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `loj-ccw-alliance-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setProfileNotice("Full CCW alliance backup downloaded.");
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
      Object.entries(restored.results).forEach(([profileId, results]) => {
        localStorage.setItem(
          resultStorageKey(profileId),
          JSON.stringify(results),
        );
      });
      const first = restored.profiles[0];
      setProfiles(next);
      localStorage.setItem(profileStorageKey, JSON.stringify(next));
      setActiveProfileId(first.id);
      localStorage.setItem(activeProfileStorageKey, first.id);
      applyProfile(first);
      setProfileNotice(
        `Restored ${restored.profiles.length} member profiles with their Cage histories.`,
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
    setProfileNotice("Created an empty CCW member profile.");
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
  const addCageResult = () => {
    const damage = Number(resultDamage.replaceAll(",", ""));
    if (!resultDate || !testName.trim() || !resultLeftHero.trim()) {
      setResultError("Date, test name and LEFT hero are required.");
      return;
    }
    if (!Number.isFinite(damage) || damage <= 0) {
      setResultError("Enter a damage result greater than zero.");
      return;
    }
    const createdAt = Date.now();
    setCageResults((current) => [
      {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${createdAt}-${current.length}`,
        cage: resultCage,
        date: resultDate,
        testName: testName.trim(),
        variant: testVariant,
        leftHero: resultLeftHero.trim(),
        damage,
        notes: resultNotes.trim(),
        createdAt,
      },
      ...current,
    ]);
    setComparisonName(testName.trim());
    setResultDamage("");
    setResultNotes("");
    setResultError("");
  };
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
          <span className="eyebrow">CCW TOOLS</span>
          <h1>
            Trial Cage <b>Formation Generator</b>
          </h1>
          <p>
            Lands of Jail • class-legal formations • LEFT-slot aware • no hero
            or robot reuse
          </p>
        </div>
        <div className="badge">BETA v0.13</div>
      </header>

      <section className="panel profile-panel">
        <div className="title">
          <div>
            <label>CCW MEMBER PROFILE</label>
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
          Profiles and Cage results stay in this browser. New members begin with
          no owned heroes, robots or Felons selected, so Stiletto&apos;s Server
          260 settings are never used as their account data. Exported profile
          files contain account settings, but not saved Cage-hit history.
        </p>
      </section>

      <section className="panel alliance-panel">
        <div className="title">
          <div>
            <label>CCW ALLIANCE READINESS</label>
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
            history.
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
          <label htmlFor="march-capacity">MARCH CAPACITY</label>
          <input
            id="march-capacity"
            type="number"
            min="1"
            step="1"
            value={mode === "leader" ? leaderCapacity : joinerCapacity}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (mode === "leader") setLeaderCapacity(value);
              else setJoinerCapacity(value);
              setGenerated(false);
            }}
          />
          <small>
            {mode === "leader"
              ? "Your personal maximum march size; this is separate from total rally capacity."
              : "CCW default is 100,000 troops per joiner march."}
          </small>
        </div>
        <div className="troop-grid troop-grid-head">
          <b>CLASS</b>
          <b>RATIO %</b>
          <b>TIER</b>
          <b>AVAILABLE</b>
          <b>REQUIRED</b>
        </div>
        {troopClasses.map(({ key, label }) => {
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
            <p>You need at least one usable Shield, Bomber and Shooter.</p>
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
            </div>
          </div>
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
                  <em className={`status status-${f.status}`}>
                    {f.status.toUpperCase()}
                  </em>
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
          {joinerTroopPlan.warnings.map((warning) => (
            <div className="warning-box" key={warning}>
              {warning}
            </div>
          ))}
        </section>
      )}

      <section className="panel results-panel">
        <div className="title">
          <div>
            <label>CAGE RESULT LAB</label>
            <h2>Log controlled hits and compare A vs B</h2>
          </div>
          <span>{cageResults.length} saved hits</span>
        </div>
        <p className="helper">
          Change one variable at a time and keep team, troops, robot and buffs
          identical. Results are saved in this browser.
        </p>
        <div className="result-form">
          <label>
            CAGE
            <select
              value={resultCage}
              onChange={(event) =>
                setResultCage(event.target.value as CageName)
              }
            >
              <option>Cage 1</option>
              <option>Cage 2</option>
            </select>
          </label>
          <label>
            DATE
            <input
              type="date"
              value={resultDate}
              onChange={(event) => setResultDate(event.target.value)}
            />
          </label>
          <label>
            TEST NAME
            <input
              value={testName}
              onChange={(event) => setTestName(event.target.value)}
              placeholder="Example: Flameborne vs Ryuichi"
            />
          </label>
          <label>
            VARIANT
            <select
              value={testVariant}
              onChange={(event) =>
                setTestVariant(event.target.value as TestVariant)
              }
            >
              <option value="A">A</option>
              <option value="B">B</option>
            </select>
          </label>
          <label>
            LEFT HERO
            <input
              value={resultLeftHero}
              onChange={(event) => setResultLeftHero(event.target.value)}
              placeholder="Ryuichi"
            />
          </label>
          <label>
            DAMAGE
            <input
              inputMode="numeric"
              value={resultDamage}
              onChange={(event) => setResultDamage(event.target.value)}
              placeholder="903641965"
            />
          </label>
          <label className="result-notes">
            NOTES
            <textarea
              value={resultNotes}
              onChange={(event) => setResultNotes(event.target.value)}
              placeholder="Keep team, ratio, robot and buffs identical."
            />
          </label>
          <button className="save-result" onClick={addCageResult}>
            SAVE CAGE HIT
          </button>
        </div>
        {resultError && <div className="warning-box">{resultError}</div>}

        <div className="comparison-panel">
          <div className="comparison-head">
            <div>
              <label>A/B COMPARISON</label>
              <h3>Average damage decides the current leader</h3>
            </div>
            <select
              value={activeComparisonName}
              disabled={!testNames.length}
              onChange={(event) => setComparisonName(event.target.value)}
            >
              {!testNames.length && <option value="">No saved tests</option>}
              {testNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="comparison-grid">
            {(["A", "B"] as const).map((variant) => {
              const variantStats =
                comparison[variant.toLowerCase() as "a" | "b"];
              return (
                <div className="variant-card" key={variant}>
                  <b>VARIANT {variant}</b>
                  <strong>
                    {formatDamage(Math.round(variantStats.average))}
                  </strong>
                  <span>Average • {variantStats.hits} hits</span>
                  <small>Best: {formatDamage(variantStats.best)}</small>
                </div>
              );
            })}
            <div className="variant-card comparison-winner">
              <b>CURRENT RESULT</b>
              <strong>
                {comparison.leader
                  ? comparison.leader === "tie"
                    ? "TIE"
                    : `${comparison.leader} LEADS`
                  : "NEED A + B"}
              </strong>
              <span>
                {comparison.differencePercent === null
                  ? "Record both variants"
                  : `${Math.abs(comparison.differencePercent).toFixed(2)}% average difference`}
              </span>
            </div>
          </div>
          {comparison.warning && (
            <div className="warning-box">{comparison.warning}</div>
          )}
        </div>

        <div className="result-history">
          <div className="comparison-head">
            <div>
              <label>RECENT HITS</label>
              <h3>Saved Cage history</h3>
            </div>
          </div>
          {!cageResults.length && (
            <p className="helper">
              No hits saved yet. Add the first controlled result above.
            </p>
          )}
          {cageResults.map((result) => (
            <article className="result-row" key={result.id}>
              <div>
                <b>{result.variant}</b>
                <span>
                  {result.cage} • {result.date}
                </span>
              </div>
              <div>
                <strong>{result.testName}</strong>
                <span>LEFT: {result.leftHero}</span>
              </div>
              <div>
                <strong>{formatDamage(result.damage)}</strong>
                <span>{result.notes || "No notes"}</span>
              </div>
              <button
                onClick={() =>
                  setCageResults((current) =>
                    current.filter((entry) => entry.id !== result.id),
                  )
                }
                aria-label={`Delete ${result.testName} ${result.variant} result`}
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      </section>

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
      </footer>
    </main>
  );
}
