"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { felons, heroes, robots, type HeroClass } from "../data/heroes";
import {
  generateJoinerFormations,
  generateLeaderFormation,
  optimizeFelons,
  type WarSkillLevels,
  maxWarSkillLevelForStars,
  diagnoseJoinerRoster,
  validateFormation,
  type Formation,
} from "../lib/generator";
import { cageBuffs, splitBuffsBySource, cageBuffSummaryText, cageBuffTimingMessage, buffEffectLabel, preCageShareLines, prisonerArmorSetting, isPowerArmorLevelVerified, powerArmorBreakthroughLabel, type PrisonerArmorSettings } from "../lib/cage-buffs";
import Image from "next/image";

import { buildLockedFormations, slots, type Locks } from "../lib/formation-locks";

import { downloadFormationImage } from "../lib/formation-image";
import { normalizeSimpleSetup, normalizeStars, simpleSetupKey } from "../lib/simple-setup";

type Mode = "leader" | "joiner";
type ImportReport = { matched: string[]; unmatched: string[]; duplicates: string[] };
type FormationSnapshotLine = { id: string; left: string; middle: string; right: string; robot: string; status: string };
type FormationSnapshot = { savedAt: string; lines: FormationSnapshotLine[] };
type SimpleSavedSetup = {
  season: number;
  joinCount: number;
  owned: string[];
  heroStarLevels: Record<string, number>;
};
type GeneratorBackup = {
  format: "loj-trial-cage-backup";
  version: 1;
  season: number;
  joinCount: number;
  owned: string[];
  heroStarLevels: Record<string, number>;
  ownedRobots: string[];
  robotPriority: string[];
  ownedFelons: string[];
  rallyFills: boolean;
  seatHolder: boolean;
  verifiedOnly: boolean;
  hideFillerLeft: boolean;
  leftClassFilter: HeroClass | "all";
  selectedBuffIds: string[];
  armorSettings: PrisonerArmorSettings;
  activationLeadMinutes: number;
};

const withRobotAssignment = (formation: Formation, robot: string | undefined, mode: Mode): Formation => {
  const { alerts: _alerts, status: _status, ...base } = formation;
  const next = { ...base, robot };
  return { ...next, ...validateFormation(next, mode) };
};

const resolveRobotAssignments = (
  leader: Formation | null,
  joiners: Formation[],
  availableRobots: string[],
  overrides: Record<string, string>,
) => {
  const used = new Set<string>();
  const assign = (formation: Formation, mode: Mode) => {
    const requested = overrides[formation.id];
    const candidates = [requested, formation.robot, ...availableRobots].filter((robot): robot is string => Boolean(robot));
    const robot = candidates.find(candidate => availableRobots.includes(candidate) && !used.has(candidate));
    if (robot) used.add(robot);
    return withRobotAssignment(formation, robot, mode);
  };
  const resolvedLeader = leader ? assign(leader, "leader") : null;
  return {
    leader: resolvedLeader,
    joiners: joiners.map(formation => assign(formation, "joiner")),
  };
};
const retainedSrHeroes = new Set(["Lofili", "Lunarl", "Flameborne", "Samir"]);
const showHeroInGenerator = (hero: (typeof heroes)[number]) => hero.rarity !== "R" && (hero.rarity !== "SR" || retainedSrHeroes.has(hero.name));
const heroIconNames = new Set([
  "Omega Rugal", "Terry Bogard", "Mai Shiranui", "Ada", "Ryuichi", "Edwin",
  "Koschevoi", "Mireya", "Marcus", "Whisper", "Drake", "Veronica", "Tyronn",
  "Xuanming", "Sawyer", "Tormund", "Mia Scarlet Pyros", "Phoenix", "Alph",
  "Zoltan", "Lunarl", "Lofili", "Vivian", "Lee", "Samir", "Caesar", "Flameborne",
  "Devilian", "Inata", "Lanchester", "Otto", "Wukong", "Worrell", "Kate", "Rin", "Rex", "Boogie", "Fran & Pike",
]);
const heroIconSlug = (name: string) =>
  name.toLowerCase().replace(/scarlet pyros/g, "scarlet-pyros").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const season7IconNames = new Set(["Rin", "Rex", "Boogie", "Fran & Pike"]);
const heroIconPath = (name: string) => `/icons/${heroIconSlug(name)}.${season7IconNames.has(name) ? "jpg" : "png"}`;
export default function Home() {
  const [mode, setMode] = useState<Mode>("joiner"); // Streamlined UI generates both
  const [season, setSeason] = useState(1);
  const [owned, setOwned] = useState<string[]>([]);
  const [joinCount, setJoinCount] = useState(6);
  const [warSkillLevels, setWarSkillLevels] = useState<WarSkillLevels>({});
  const [heroStarLevels, setHeroStarLevels] = useState<Record<string, number>>({});
  const [ownedRobots, setOwnedRobots] = useState<string[]>([]);
  const [robotPriority, setRobotPriority] = useState<string[]>(robots);
  const [robotOverrides, setRobotOverrides] = useState<Record<string, string>>({});
  const [ownedFelons, setOwnedFelons] = useState<string[]>([]);
  const [rallyFills, setRallyFills] = useState(true);
  const [seatHolder, setSeatHolder] = useState(false);
  const [locks, setLocks] = useState<Locks>({});
  const [leaderLocks, setLeaderLocks] = useState<Locks>({});
  const [generated, setGenerated] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [hideFillerLeft, setHideFillerLeft] = useState(false);
  const [leftClassFilter, setLeftClassFilter] = useState<HeroClass | "all">("all");
  const [comparisonA, setComparisonA] = useState<FormationSnapshot | null>(null);
  const [comparisonB, setComparisonB] = useState<FormationSnapshot | null>(null);
  const [resultsOnly, setResultsOnly] = useState(false);
  const [restoredSimpleSetup, setRestoredSimpleSetup] = useState(false);
  const [notice, setNotice] = useState("");
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const heroImportRef = useRef<HTMLInputElement>(null);
  const backupImportRef = useRef<HTMLInputElement>(null);
  const [selectedBuffIds, setSelectedBuffIds] = useState<string[]>([]);
  const [armorSettings, setArmorSettings] = useState<PrisonerArmorSettings>({});
  const [activationLeadMinutes, setActivationLeadMinutes] = useState(5);
  const [kofLeaderLinks, setKofLeaderLinks] = useState<Record<string,string>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(simpleSetupKey);
      if (raw) {
        const saved = normalizeSimpleSetup(JSON.parse(raw));
        setSeason(saved.season);
        setJoinCount(saved.joinCount);
        setOwned(saved.owned);
        setHeroStarLevels(saved.heroStarLevels);
      }
    } catch {
      // A bad local value should never block the generator.
    } finally {
      setRestoredSimpleSetup(true);
    }
  }, []);

  useEffect(() => {
    if (!restoredSimpleSetup) return;
    const saved: SimpleSavedSetup = { season, joinCount, owned, heroStarLevels };
    try {
      window.localStorage.setItem(simpleSetupKey, JSON.stringify(saved));
    } catch {
      // Private browsing and full storage must not prevent generation.
    }
  }, [restoredSimpleSetup, season, joinCount, owned, heroStarLevels]);

  const seasonHeroes = useMemo(
    () => heroes.filter((h) => (h.season === 0 || h.season <= season) && showHeroInGenerator(h)),
    [season],
  );
  const currentSeasonHeroes = useMemo(
    () => seasonHeroes.filter(hero => hero.season === season),
    [seasonHeroes, season],
  );
  const earlierSeasonHeroes = useMemo(
    () => seasonHeroes.filter(hero => hero.season !== season),
    [seasonHeroes, season],
  );
  const available = useMemo(
    () => seasonHeroes.filter((h) => owned.includes(h.name) && h.cageAllowed),
    [seasonHeroes, owned],
  );
  const unavailableSelected = owned.filter(name => {
    const hero = heroes.find(item => item.name === name);
    return hero && hero.season > season;
  });
  const selectedClassCounts = useMemo(() => ({
    Shield: available.filter(hero => hero.cls === "Shield").length,
    Bomber: available.filter(hero => hero.cls === "Bomber").length,
    Shooter: available.filter(hero => hero.cls === "Shooter").length,
  }), [available]);
  const generatorAvailable = useMemo(
    () => available.map(hero => {
      const hideAsLeft =
        (hideFillerLeft && hero.leftTier === "filler") ||
        (leftClassFilter !== "all" && Boolean(hero.leftSkill) && hero.cls !== leftClassFilter);
      return hideAsLeft
        ? { ...hero, leftSkill: undefined, leftValue: undefined, leftTier: undefined, leftSkillValues: undefined, leftSkillVerified: undefined }
        : hero;
    }),
    [available, hideFillerLeft, leftClassFilter],
  );
  const evidenceCounts = useMemo(() => {
    const leftSkills = available.filter((hero) => hero.leftSkill);
    return {
      total: leftSkills.length,
      verified: leftSkills.filter((hero) => hero.leftSkillVerified).length,
    };
  }, [available]);
  const evidenceDashboard = useMemo(() =>
    Array.from({ length: season + 1 }, (_, index) => index)
      .filter(value => value === 0 || value >= 1)
      .map(value => {
        const pool = seasonHeroes.filter(hero => hero.season === value);
        return {
          season: value,
          total: pool.length,
          verified: pool.filter(hero => hero.leftSkillVerified).length,
          partial: pool.filter(hero => hero.leftSkill && !hero.leftSkillVerified).length,
          deferred: pool.filter(hero => hero.evidenceNote?.toLowerCase().includes("deferred")).length,
          noLeft: pool.filter(hero => !hero.leftSkill).length,
        };
      })
      .filter(row => row.total > 0),
    [season, seasonHeroes],
  );
  const availableRobots = useMemo(
    () => robotPriority.filter((robot) => ownedRobots.includes(robot)),
    [robotPriority, ownedRobots],
  );
  // War skills unlock one level ahead of hero stars:
  // 1★ -> max Lv2, 2★ -> max Lv3, 3★ -> max Lv4, 4★+ -> max Lv5.
  // This matches the in-game upgrade gate shown on Rin (2★ / Lv3; Lv4 requires 3★).
  const automaticWarSkillLevels = useMemo<WarSkillLevels>(() => {
    const levels: WarSkillLevels = {};
    available.forEach((hero) => {
      if (hero.leftSkill) {
        const stars = Math.min(5, Math.max(1, heroStarLevels[hero.name] ?? 1));
        levels[hero.name] = Math.min(maxWarSkillLevelForStars(stars), Math.max(1, warSkillLevels[hero.name] ?? 5));
      }
    });
    return levels;
  }, [available, heroStarLevels, warSkillLevels]);

  const automaticLeader = useMemo(
    () => generateLeaderFormation(available, availableRobots, heroStarLevels, kofLeaderLinks),
    [available, availableRobots, heroStarLevels, kofLeaderLinks],
  );

  const automaticJoiners = useMemo(
    () =>
      generateJoinerFormations(
        generatorAvailable,
        joinCount,
        automaticWarSkillLevels,
        availableRobots,
        verifiedOnly,
        heroStarLevels,
        automaticLeader,
      ),
    [
      generatorAvailable,
      joinCount,
      automaticWarSkillLevels,
      availableRobots,
      verifiedOnly,
      heroStarLevels,
      automaticLeader,
    ],
  );
  const joinerRosterDiagnostics = useMemo(() => diagnoseJoinerRoster(generatorAvailable, joinCount, automaticLeader, verifiedOnly, automaticWarSkillLevels, heroStarLevels), [generatorAvailable, joinCount, automaticLeader, verifiedOnly, automaticWarSkillLevels, heroStarLevels]);
  let lockError = "";
  let leaderFormation = automaticLeader;
  let joinerFormations = automaticJoiners;
  try {
    if (Object.values(leaderLocks).some(Boolean)) leaderFormation = buildLockedFormations(available, 1, leaderLocks, automaticWarSkillLevels, availableRobots, false, null, "leader", heroStarLevels)[0] ?? null;
    const leaderRobot = leaderFormation?.robot;
    const joinerRobotPool = leaderRobot ? availableRobots.filter(robot => robot !== leaderRobot) : availableRobots;
    if (Object.values(locks).some(Boolean)) joinerFormations = buildLockedFormations(generatorAvailable, joinCount, locks, automaticWarSkillLevels, joinerRobotPool, verifiedOnly, leaderFormation, "joiner", heroStarLevels);
    else if (Object.values(leaderLocks).some(Boolean)) joinerFormations = generateJoinerFormations(generatorAvailable, joinCount, automaticWarSkillLevels, joinerRobotPool, verifiedOnly, heroStarLevels, leaderFormation);
  } catch (error) {
    lockError = error instanceof Error ? error.message : "Check your hero locks.";
    joinerFormations = [];
    if (mode === "leader") leaderFormation = null;
  }
  const resolvedRobots = resolveRobotAssignments(leaderFormation, joinerFormations, availableRobots, robotOverrides);
  leaderFormation = resolvedRobots.leader;
  joinerFormations = resolvedRobots.joiners;
  const currentLocks = mode === "leader" ? leaderLocks : locks;
  const updateLock = (key: string, name: string) => {
    (mode === "leader" ? setLeaderLocks : setLocks)(value => ({...value, [key]: name}));
    setGenerated(false);
  };
  const leaderReservedNames = leaderFormation ? [leaderFormation.left.name, leaderFormation.middle.name, leaderFormation.right.name] : [];
  const projectedJoinerHeroNames = Array.from(new Set(joinerFormations.flatMap(formation => [formation.left.name, formation.middle.name, formation.right.name])));
  const assignedRobotNames = [leaderFormation?.robot, ...joinerFormations.map(formation => formation.robot)].filter((name): name is string => Boolean(name));
  const unassignedRobotNames = availableRobots.filter(robot => !assignedRobotNames.includes(robot));
  const requestedRobotSlots = (leaderFormation ? 1 : 0) + joinCount;
  const preflightStatus = lockError || !leaderFormation ? "blocked" : joinerFormations.length < joinCount ? "review" : "ready";
  const topRecoveryOptions = joinerRosterDiagnostics.rankedLeftAlternatives.slice(0, 6);
  const shortageActions: string[] = [];
  if (joinerRosterDiagnostics.counts.Shield < joinCount) shortageActions.push(`Add ${joinCount - joinerRosterDiagnostics.counts.Shield} eligible Shield hero${joinCount - joinerRosterDiagnostics.counts.Shield === 1 ? "" : "es"}.`);
  if (joinerRosterDiagnostics.counts.Bomber < joinCount) shortageActions.push(`Add ${joinCount - joinerRosterDiagnostics.counts.Bomber} eligible Bomber hero${joinCount - joinerRosterDiagnostics.counts.Bomber === 1 ? "" : "es"}.`);
  if (joinerRosterDiagnostics.counts.Shooter < joinCount) shortageActions.push(`Add ${joinCount - joinerRosterDiagnostics.counts.Shooter} eligible Shooter hero${joinCount - joinerRosterDiagnostics.counts.Shooter === 1 ? "" : "es"}.`);
  if (joinerRosterDiagnostics.leftSkills < joinCount) shortageActions.push(`Add or verify ${joinCount - joinerRosterDiagnostics.leftSkills} more ${verifiedOnly ? "screenshot-verified " : ""}LEFT-skill hero${joinCount - joinerRosterDiagnostics.leftSkills === 1 ? "" : "es"}.`);
  if (joinerRosterDiagnostics.heroShortage > 0) shortageActions.push(`Add ${joinerRosterDiagnostics.heroShortage} eligible hero${joinerRosterDiagnostics.heroShortage === 1 ? "" : "es"} overall for ${joinCount} full non-repeating Joiners.`);
  const missingMainClasses = (["Shield","Bomber","Shooter"] as const).filter(cls => !available.some(hero => hero.cls === cls));
  const simpleShortageItems = [
    ...(missingMainClasses.length ? [`Main Rally needs: ${missingMainClasses.join(" + ")}.`] : []),
    ...shortageActions.slice(0, 3),
  ];
  const setRobotOverride = (formationId: string, robot: string) => {
    setRobotOverrides(current => {
      const next = { ...current };
      Object.entries(next).forEach(([id, assigned]) => {
        if (id !== formationId && robot && assigned === robot) delete next[id];
      });
      if (robot) next[formationId] = robot;
      else delete next[formationId];
      return next;
    });
    setNotice(robot
      ? `${robot} pinned to ${formationId}. Other marches will be reassigned automatically without robot reuse.`
      : `${formationId} returned to automatic robot assignment.`);
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
  const startOver = () => {
    if (!window.confirm("Start over and clear your season, selected heroes and star levels?")) return;
    setSeason(1);
    setJoinCount(6);
    setOwned([]);
    setHeroStarLevels({});
    setGenerated(false);
    setResultsOnly(false);
    setImportReport(null);
    setNotice("Quick setup cleared.");
  };
  const generateNow = () => {
    setResultsOnly(false);
    setGenerated(true);
  };
  const copySingleFormation = async (formation: Formation, kind: "Main" | "Joiner") => {
    const robot = formation.robot ? ` • Robot: ${formation.robot}` : "";
    const leftLevel = kind === "Joiner" && formation.leftSkillLevel ? ` • LEFT Lv${formation.leftSkillLevel}` : "";
    const text = [
      `${formation.id}: ${formation.left.name} / ${formation.middle.name} / ${formation.right.name}${leftLevel}`,
      `${kind} troops: ${formation.troopText}${robot}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setNotice(`${formation.id} copied.`);
    } catch {
      setNotice("Clipboard access was blocked.");
    }
  };
  const importHeroList = async (file: File) => {
    const text = await file.text();
    const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
    const candidates = heroes.filter(hero => hero.cageAllowed && showHeroInGenerator(hero));
    const imported: string[] = [];
    const stars: Record<string, number> = {};
    const unknown: string[] = [];
    const duplicates: string[] = [];
    const seen = new Set<string>();

    text.split(/\r?\n/).map(line => line.trim()).filter(Boolean).forEach(line => {
      const normalizedLine = normalized(line);
      const hero = candidates
        .slice()
        .sort((a, b) => b.name.length - a.name.length)
        .find(candidate => normalizedLine.includes(normalized(candidate.name)));

      if (!hero) {
        unknown.push(line);
        return;
      }
      if (seen.has(hero.name)) {
        duplicates.push(line);
        return;
      }
      seen.add(hero.name);

      const afterName = line.slice(line.toLowerCase().indexOf(hero.name.toLowerCase()) + hero.name.length);
      const starSymbols = afterName.match(/★/g)?.length ?? 0;
      const numericStar = afterName.match(/★\s*([1-5])|\b([1-5])\s*(?:star|stars)\b/i);
      const starLevel = Math.max(1, Math.min(5, starSymbols > 1 ? starSymbols : Number(numericStar?.[1] || numericStar?.[2] || starSymbols || 1)));

      if (!imported.includes(hero.name)) imported.push(hero.name);
      stars[hero.name] = starLevel;
    });

    if (imported.length) {
      const highestSeason = Math.max(season, ...imported.map(name => heroes.find(hero => hero.name === name)?.season ?? 1));
      setSeason(Math.min(7, highestSeason));
      setOwned(imported);
      setHeroStarLevels(stars);
      setGenerated(false);
    }
    setImportReport({ matched: imported, unmatched: unknown, duplicates });
    setNotice(imported.length
      ? `Imported ${imported.length} unique hero${imported.length === 1 ? "" : "es"} with star levels. Review the import report for unmatched or duplicate rows.`
      : "No matching heroes were found in that text file.");
  };
  const setSkillLevel = (name: string, level: number | null) => {
    setWarSkillLevels((current) => {
      const next = { ...current };
      if (level === null) delete next[name]; else next[name] = level;
      return next;
    });
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
    setRobotOverrides(current => Object.fromEntries(Object.entries(current).filter(([, robot]) => robot !== name)));
    setGenerated(false);
  };
  const moveRobot = (name: string, direction: -1 | 1) => {
    setRobotPriority(current => {
      const index = current.indexOf(name);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setGenerated(false);
  };
  const exportRosterBackup = () => {
    const backup: GeneratorBackup = {
      format: "loj-trial-cage-backup",
      version: 1,
      season,
      joinCount,
      owned,
      heroStarLevels,
      ownedRobots,
      robotPriority,
      ownedFelons,
      rallyFills,
      seatHolder,
      verifiedOnly,
      hideFillerLeft,
      leftClassFilter,
      selectedBuffIds,
      armorSettings,
      activationLeadMinutes,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "trial-cage-roster-backup.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Roster backup exported.");
  };
  const importRosterBackup = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Partial<GeneratorBackup>;
      if (parsed.format !== "loj-trial-cage-backup") throw new Error("That file is not a Trial Cage generator backup.");
      const validHeroNames = new Set(heroes.map(hero => hero.name));
      const validRobotNames = new Set(robots);
      const validFelonNames = new Set(felons.map(felon => felon.name));
      const nextOwned = Array.isArray(parsed.owned) ? parsed.owned.filter((name): name is string => typeof name === "string" && validHeroNames.has(name)) : [];
      const nextRobots = Array.isArray(parsed.ownedRobots) ? parsed.ownedRobots.filter((name): name is string => typeof name === "string" && validRobotNames.has(name)) : [];
      const nextRobotPriority = Array.isArray(parsed.robotPriority)
        ? [...parsed.robotPriority.filter((name): name is string => typeof name === "string" && validRobotNames.has(name)), ...robots.filter(name => !parsed.robotPriority?.includes(name))]
        : robots;
      setSeason(Math.max(1, Math.min(7, Number(parsed.season) || 1)));
      setJoinCount(Math.max(1, Math.min(6, Number(parsed.joinCount) || 6)));
      setOwned(nextOwned);
      setHeroStarLevels(normalizeStars(parsed.heroStarLevels));
      setOwnedRobots(nextRobots);
      setRobotPriority(nextRobotPriority);
      setOwnedFelons(Array.isArray(parsed.ownedFelons) ? parsed.ownedFelons.filter((name): name is string => typeof name === "string" && validFelonNames.has(name)) : []);
      setRallyFills(parsed.rallyFills !== false);
      setSeatHolder(Boolean(parsed.seatHolder));
      setVerifiedOnly(Boolean(parsed.verifiedOnly));
      setHideFillerLeft(Boolean(parsed.hideFillerLeft));
      setLeftClassFilter(parsed.leftClassFilter === "Shield" || parsed.leftClassFilter === "Bomber" || parsed.leftClassFilter === "Shooter" ? parsed.leftClassFilter : "all");
      setSelectedBuffIds(Array.isArray(parsed.selectedBuffIds) ? parsed.selectedBuffIds.filter((id): id is string => typeof id === "string" && cageBuffs.some(buff => buff.id === id)) : []);
      setArmorSettings(parsed.armorSettings && typeof parsed.armorSettings === "object" ? parsed.armorSettings : {});
      setActivationLeadMinutes(Math.max(0, Math.min(120, Number(parsed.activationLeadMinutes) || 5)));
      setLocks({});
      setLeaderLocks({});
      setRobotOverrides({});
      setGenerated(false);
      setNotice(`Backup restored: ${nextOwned.length} heroes and ${nextRobots.length} robots loaded.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not restore that backup.");
    }
  };
  const saveComparison = (side: "A" | "B") => {
    const formations = leaderFormation ? [leaderFormation, ...joinerFormations] : joinerFormations;
    const snapshot: FormationSnapshot = {
      savedAt: new Date().toLocaleString(),
      lines: formations.map(formation => ({
        id: formation.id,
        left: formation.left.name,
        middle: formation.middle.name,
        right: formation.right.name,
        robot: formation.robot ?? "None",
        status: formation.status,
      })),
    };
    if (side === "A") setComparisonA(snapshot);
    else setComparisonB(snapshot);
    setNotice(`Saved current formations to comparison ${side}.`);
  };
  const toggleFelon = (name: string) => {
    setOwnedFelons((current) =>
      current.includes(name)
        ? current.filter((x) => x !== name)
        : [...current, name],
    );
    setGenerated(false);
  };
  const [exportingImage, setExportingImage] = useState(false);
  const exportFormationImage = async () => {
    setExportingImage(true);
    try {
      await downloadFormationImage(leaderFormation ? [leaderFormation, ...joinerFormations] : joinerFormations,
        `Season ${season}`, heroStarLevels,
        name => heroIconNames.has(name) ? heroIconPath(name) : null);
      setNotice("Formation image downloaded.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Image download failed.");
    } finally { setExportingImage(false); }
  };
  const copyAllianceInstructions = async () => {
    const recoveryNames = topRecoveryOptions.map((hero, index) => `${index + 1}. ${hero.name} (Lv${hero.level}, ${hero.verified ? "verified" : "unverified"})`);
    const readinessLines = joinerFormations.length < joinCount
      ? [
          "",
          "READINESS / RECOVERY",
          ...joinerRosterDiagnostics.blockers.map(blocker => `- ${blocker}`),
          ...(recoveryNames.length ? [`- Ranked LEFT options: ${recoveryNames.join(" • ")}`] : []),
        ]
      : [];
    const lines = [
      "TRIAL CAGE FORMATIONS",
      `Season ${season} • ${verifiedOnly ? "Verified LEFT skills only" : "Standard LEFT skill priority"}`,
      ...(selectedBuffIds.length ? [...preCageShareLines({ selectedBuffIds, activationLeadMinutes }, armorSettings), ""] : []),
      ...(leaderFormation ? [
        `MAIN: ${leaderFormation.left.name} / ${leaderFormation.middle.name} / ${leaderFormation.right.name}`,
        `  Main troops: ${leaderFormation.troopText} • Robot: ${leaderFormation.robot ?? "none"} • ${leaderFormation.status.toUpperCase()}`,
      ] : ["MAIN: unavailable — check hero class readiness."]),
      "",
      ...joinerFormations.flatMap((formation) => [
        `${formation.id}: ${formation.left.name} (LEFT Lv${formation.leftSkillLevel}) / ${formation.middle.name} / ${formation.right.name}`,
        `  Joiner troops: ${formation.troopText} • Robot: ${formation.robot ?? "none"} • ${formation.status.toUpperCase()}`,
      ]),
      ...readinessLines,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setNotice("Alliance instructions copied to the clipboard.");
    } catch {
      setNotice("Clipboard access was blocked. Select and copy the formation list manually.");
    }
  };
  const buffGroups = splitBuffsBySource();
  const toggleCageBuff = (id: string) => setSelectedBuffIds(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  const updateArmorSetting = (id: string, patch: Partial<{ level: number; value: number }>) => {
    const buff = cageBuffs.find(item => item.id === id);
    if (!buff || buff.source !== "prisoner-armor") return;
    setArmorSettings(current => {
      const base = prisonerArmorSetting(buff, current);
      const level = Math.max(1, Math.min(buff.maxSkillLevel ?? 10, Math.round(patch.level ?? base.level)));
      const verifiedValue = buff.levelValues?.[level - 1];
      return {
        ...current,
        [id]: {
          level,
          value: verifiedValue ?? Math.max(0, patch.value ?? base.value),
        },
      };
    });
  };
  return (
    <>
    <a className="skip-link" href="#generator-main">Skip to generator setup</a>
    <main id="generator-main" className={resultsOnly ? "results-only" : ""}>
      <header>
        <div>
          <span className="eyebrow">TRIAL CAGE TOOLS</span>
          <p className="creator-line">Created by <b>Stiletto</b> of Server 260</p>
          <h1>
            Trial Cage <b>Formation Generator</b>
          </h1>
          <p>
            Build a Main Rally and up to 6 Joiner rallies from your own hero roster
          </p>
        </div>
        <div className="badge">DEV v2.10 BETA</div>
      </header>

      {notice && <p role="status" className="profile-notice">{notice}</p>}

      <section className="panel controls simple-setup setup-only">
        <div>
          <label>QUICK SETUP</label>
          <h2>Main Rally + up to 6 Joiners</h2>
          <p className="helper">Pick your server season, choose how many Joiner rallies you want, select your heroes and stars, then Generate. Everything else is optional.</p>
        </div>
        <div><label>SERVER SEASON</label><select value={season} onChange={(e)=>{setSeason(+e.target.value);setGenerated(false)}}>{[1,2,3,4,5,6,7].map(s=><option key={s} value={s}>Season {s}</option>)}</select></div>
        <div><label>JOINER MARCHES</label><select value={joinCount} onChange={(e)=>{setJoinCount(+e.target.value);setGenerated(false)}}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}</select></div>
        {unavailableSelected.length > 0 && <p role="status" className="helper">Unavailable in Season {season}: {unavailableSelected.join(", ")}. Your selections return when you switch back.</p>}
      </section>

      <section className="panel setup-only hero-picker-panel">
        <div className="title">
          <div>
            <label>YOUR HEROES</label>
            <h2 id="hero-picker-heading">Select your heroes and set only their star levels</h2>
          </div>
          <span className="selected-class-counts">{available.length} selected • {selectedClassCounts.Shield} Shield • {selectedClassCounts.Bomber} Bomber • {selectedClassCounts.Shooter} Shooter</span>
        </div>
        <div className="quick-actions">
          <button onClick={selectAll}>Select all usable</button>
          <button onClick={clearAll}>Clear heroes</button>
          <button type="button" className="start-over-button" onClick={startOver}>Start over</button>
          <button type="button" onClick={() => heroImportRef.current?.click()}>Import hero list (.txt)</button>
          <input
            ref={heroImportRef}
            type="file"
            accept=".txt,text/plain"
            hidden
            onChange={async event => {
              const file = event.target.files?.[0];
              if (file) await importHeroList(file);
              event.currentTarget.value = "";
            }}
          />

        </div>
        <p className="helper">Import one hero per line. Examples: <b>Tyronn ★4</b>, <b>Phoenix ★★★★★</b>, or <b>Ryuichi SSR ★5 Rank 1</b>. Matching heroes are selected and their star levels are filled automatically.</p>
        {importReport && (
          <div className="import-report">
            <b>IMPORT REPORT</b>
            <span>{importReport.matched.length} matched • {importReport.unmatched.length} unmatched • {importReport.duplicates.length} duplicate row{importReport.duplicates.length === 1 ? "" : "s"}</span>
            {importReport.matched.length > 0 && <details><summary>Matched heroes</summary><p>{importReport.matched.join(", ")}</p></details>}
            {importReport.unmatched.length > 0 && <details><summary>Unmatched rows</summary><p>{importReport.unmatched.join(" • ")}</p></details>}
            {importReport.duplicates.length > 0 && <details><summary>Duplicate rows ignored</summary><p>{importReport.duplicates.join(" • ")}</p></details>}
          </div>
        )}
        <div className="hero-season-groups">
          {[
            { label: `SEASON ${season} ADDITIONS`, items: currentSeasonHeroes, current: true },
            { label: "EARLIER / LEGACY HEROES", items: earlierSeasonHeroes, current: false },
          ].map(group => group.items.length > 0 && (
            <section className={group.current ? "hero-season-group current" : "hero-season-group"} key={group.label}>
              <div className="hero-season-heading"><b>{group.label}</b><span>{group.items.length} shown</span></div>
              <div className="heroes">
                {group.items.map((hero) => {
                  const selected = owned.includes(hero.name);
                  const disabled = !hero.cageAllowed;
                  return (
                    <div key={hero.name}>
                      <button
                        onClick={() => !disabled && toggle(hero.name)}
                        disabled={disabled}
                        className={`${selected ? "hero selected" : "hero"} ${disabled ? "disabled" : ""}`}
                        aria-pressed={selected}
                        aria-label={`${selected ? "Remove" : "Add"} ${hero.name}, ${hero.cls}, ${hero.rarity}`}
                        title={hero.notes || ""}
                      >
                        {heroIconNames.has(hero.name) ? (
                          <Image className="hero-icon" src={heroIconPath(hero.name)} alt="" width={48} height={60} />
                        ) : (
                          <i>{hero.cls[0]}</i>
                        )}
                        <strong>{hero.name}</strong>
                        <small>{hero.cls} • {hero.season === 0 ? "Legacy" : `S${hero.season}`} • {hero.rarity}</small>
                        {hero.leftSkill && (
                          <em className={`evidence-badge ${hero.leftSkillVerified ? "verified" : "unverified"}`}>
                            LEFT {hero.leftSkillVerified ? "VERIFIED" : "UNVERIFIED"}{hero.leftTier ? ` • ${hero.leftTier.toUpperCase()}` : ""}
                          </em>
                        )}
                        {hero.cageAllowed && !hero.leftSkill && <em className="evidence-badge no-left">NO LEFT DATA</em>}
                        {!hero.cageAllowed && <em className="evidence-badge excluded">EXCLUDED</em>}
                      </button>
                      {selected && !disabled && (
                        <>
                          <label className="hero-star-control">
                            Star level{" "}
                            <select
                              aria-label={`${hero.name} star level`}
                              value={heroStarLevels[hero.name] ?? 1}
                              onChange={(e) => setStarLevel(hero.name, +e.target.value)}
                            >
                              {[1, 2, 3, 4, 5].map((l) => (
                                <option key={l} value={l}>{"★".repeat(l)} ({l})</option>
                              ))}
                            </select>
                          </label>
                          <details className="hero-evidence-details">
                            <summary>Skill & evidence details</summary>
                            {hero.leftSkill && <label>Actual LEFT War skill level (optional) <select aria-label={`${hero.name} actual LEFT skill level`} value={warSkillLevels[hero.name] ?? ""} onChange={e => setSkillLevel(hero.name, e.target.value ? Number(e.target.value) : null)}>
                              <option value="">Assume unlocked maximum</option>
                              {Array.from({length: maxWarSkillLevelForStars(heroStarLevels[hero.name] ?? 1)}, (_, index) => index + 1).map(level => <option key={level} value={level}>Lv{level}</option>)}
                            </select></label>}
                            <p><b>LEFT skill:</b> {hero.leftSkill ?? "No Cage LEFT priority skill entered."}</p>
                            {hero.leftSkillValues && <p><b>Lv1-Lv5:</b> {hero.leftSkillValues.map((value, index) => `Lv${index + 1} ${value}%`).join(" • ")}</p>}
                            {hero.evidenceNote && <p><b>Evidence:</b> {hero.evidenceNote}</p>}
                            {hero.priorityNote && <p><b>Priority model:</b> {hero.priorityNote}</p>}
                            {hero.notes && <p><b>Notes:</b> {hero.notes}</p>}
                          </details>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>

      <details className="advanced-tools setup-only">
        <summary>
          <span><b>Advanced / Optional Setup</b><small>Robots, Felons, Power Armor, buffs, filters, pins, evidence and backup tools</small></span>
        </summary>
        <div className="advanced-tools-body">
          <section className="panel">
            <div className="title"><div><label>OPTIONAL CAGE SETTINGS</label><h2>Extra filters and modifiers</h2></div></div>
            <div className="advanced-toggle-grid">
              <label className="verified-toggle">
                <input type="checkbox" checked={verifiedOnly} onChange={(event)=>{setVerifiedOnly(event.target.checked);setGenerated(false)}} />
                <span><b>VERIFIED SKILLS ONLY</b><small>Use screenshot-confirmed LEFT War progressions only</small><small>{evidenceCounts.verified}/{evidenceCounts.total} available LEFT skills verified</small></span>
              </label>
              <label className="verified-toggle">
                <input type="checkbox" checked={seatHolder} onChange={event => {setSeatHolder(event.target.checked);setGenerated(false)}} />
                <span><b>SCARLET BUTCHER SEAT</b><small>Apply the +10% ATK seat reminder to your results.</small></span>
              </label>
            </div>
          </section>
      <section className="panel left-priority-panel" aria-labelledby="left-priority-heading">
        <div className="title">
          <div><label>LEFT PRIORITY FILTERS</label><h2 id="left-priority-heading">Control which heroes can lead Joiner marches</h2></div>
        </div>
        <div className="left-filter-controls">
          <label className="verified-toggle">
            <input type="checkbox" checked={hideFillerLeft} onChange={event=>{setHideFillerLeft(event.target.checked);setGenerated(false)}} />
            <span><b>HIDE FILLER LEFT SKILLS</b><small>Filler heroes can still be used in MIDDLE or RIGHT support slots.</small></span>
          </label>
          <label>
            LEFT hero class
            <select value={leftClassFilter} onChange={event=>{setLeftClassFilter(event.target.value as HeroClass | "all");setGenerated(false)}}>
              <option value="all">All classes</option>
              <option value="Shield">Shield only</option>
              <option value="Bomber">Bomber only</option>
              <option value="Shooter">Shooter only</option>
            </select>
          </label>
        </div>
        <p className="helper">Verified Skills Only remains available above. These filters affect LEFT eligibility only; they do not remove heroes from legal support-slot filling.</p>
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
          {robotPriority.map((robot, index) => (
            <div className={ownedRobots.includes(robot) ? "robot-priority-card selected" : "robot-priority-card"} key={robot}>
              <button
                type="button"
                className={ownedRobots.includes(robot) ? "robot selected" : "robot"}
                aria-pressed={ownedRobots.includes(robot)}
                aria-label={`${ownedRobots.includes(robot) ? "Remove" : "Add"} ${robot} robot`}
                onClick={() => toggleRobot(robot)}
              >
                <i>R{index + 1}</i>
                <strong>{robot}</strong>
                {index < 2 && <small>Auto priority {index + 1}</small>}
              </button>
              <div className="robot-order-controls">
                <button type="button" onClick={()=>moveRobot(robot,-1)} disabled={index===0} aria-label={`Move ${robot} up in automatic priority`}>↑</button>
                <button type="button" onClick={()=>moveRobot(robot,1)} disabled={index===robotPriority.length-1} aria-label={`Move ${robot} down in automatic priority`}>↓</button>
              </div>
            </div>
          ))}
        </div>
        <p className="helper">
          Robots are optional guidance, not a formation-legality requirement. Selected robots are assigned automatically without reuse; after generation you can pin a different owned robot to any individual march and the remaining marches will rebalance automatically. Cyber/Warlord-specific robot rules belong to Gorilla planning and are not applied to normal Trial Cage formations.
        </p>
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


      <section className="panel cage-buffs-panel">
        <div className="title"><div><label>PRE-CAGE SETUP</label><h2>2-hour buffs & Power Armor</h2></div></div>
        <p className="helper">Prison Buffs use verified fixed values. For Power Armor, choose your skill level and the generator fills the screenshot-verified effect automatically. Infercore Comprehensive Command and Atlax Orbital Strike max at Lv9; Halo Overload Charge and Yokozuna Valiant Breach support Lv10. No unavailable or unverified level is guessed.</p>
        <div className="buff-groups">
          <div className="buff-group">
            <h3>Prison Buffs</h3>
            <div className="buff-grid">
              {buffGroups.prisonBuffs.map(buff => (
                <button type="button" className={selectedBuffIds.includes(buff.id) ? "buff selected" : "buff"} key={buff.id} onClick={()=>toggleCageBuff(buff.id)}>
                  <b>{buff.name}</b>
                  <span>{buffEffectLabel(buff, armorSettings)}</span>
                  <small>{buff.durationHours}h after activation</small>
                </button>
              ))}
            </div>
          </div>
          <div className="buff-group">
            <h3>Power Armor</h3>
            <p className="helper armor-helper">Pick the level shown on your account. Verified levels fill their exact effect automatically. If a skill reaches an unverified level later, the generator will ask for the value instead of guessing it.</p>
            <div className="buff-grid armor-grid">
              {buffGroups.prisonerArmor.map(buff => {
                const setting = prisonerArmorSetting(buff, armorSettings);
                const selected = selectedBuffIds.includes(buff.id);
                return (
                  <div className={selected ? "buff armor-buff selected" : "buff armor-buff"} key={buff.id}>
                    <button type="button" className="armor-select" onClick={()=>toggleCageBuff(buff.id)} aria-pressed={selected}>
                      <b>{buff.name}</b>
                      <span>{selected ? "SELECTED" : "SELECT FOR CAGE"}</span>
                    </button>
                    <span className="armor-effect">{buffEffectLabel(buff, armorSettings)}</span>
                    <div className="armor-meta">
                      <span>{buff.armorRobot ? `${buff.armorRobot} skill` : "Power Armor skill"}</span>
                      <span>{buff.durationHours}h duration • {buff.cooldownHours ?? 20}h cooldown</span>
                    </div>
                    <div className="armor-controls">
                      <label>
                        Your skill level
                        <select value={setting.level} onChange={event => updateArmorSetting(buff.id, { level: Number(event.target.value) })}>
                          {Array.from({ length: buff.maxSkillLevel ?? 10 }, (_, index) => index + 1).map(level => (
                            <option key={level} value={level}>
                              Lv.{level}{buff.levelValues?.[level - 1] !== undefined ? " • verified" : " • value needed"}
                            </option>
                          ))}
                        </select>
                      </label>
                      {!isPowerArmorLevelVerified(buff, setting.level) && (
                        <label>
                          Unverified effect value
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="Enter value shown in game"
                            value={setting.value || ""}
                            onChange={event => updateArmorSetting(buff.id, { value: Number(event.target.value) || 0 })}
                          />
                        </label>
                      )}
                    </div>
                    {powerArmorBreakthroughLabel(buff, setting.level) && <small className="armor-breakthrough">{powerArmorBreakthroughLabel(buff, setting.level)}</small>}
                    <small>{isPowerArmorLevelVerified(buff, setting.level) ? `Screenshot verified at Lv.${setting.level}` : `Lv.${setting.level} effect not yet screenshot verified — no value is guessed.`}</small>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="buff-summary"><b className="pre-cage-label">PRE-CAGE CHECKLIST</b><span>✓ Main: maximum troops • Joiners: 10k Bombers + 90k Shooters or 100k Shooters</span><strong>{cageBuffSummaryText(selectedBuffIds, armorSettings)}</strong><label>Activate <input type="number" min="0" max="120" value={activationLeadMinutes} onChange={e=>setActivationLeadMinutes(Math.max(0,Math.min(120,Number(e.target.value)||0)))} /> min before Cage</label><small>{cageBuffTimingMessage({selectedBuffIds,activationLeadMinutes})}</small></div>
      </section>


          <section className="panel">
            <div className="title"><div><label>ROSTER UTILITIES</label><h2>Optional setup tools</h2></div></div>
            <div className="quick-actions">
              <button type="button" onClick={exportRosterBackup}>Export setup (.json)</button>
              <button type="button" onClick={() => backupImportRef.current?.click()}>Restore setup (.json)</button>
              <input
                ref={backupImportRef}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={async event => {
                  const file = event.target.files?.[0];
                  if (file) await importRosterBackup(file);
                  event.currentTarget.value = "";
                }}
              />
            </div>
            {available.length > 0 && (
              <details className="bulk-stars">
                <summary>Bulk edit selected hero stars</summary>
                <div className="bulk-star-grid">
                  {available.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(hero=>(
                    <label key={hero.name}>
                      <span>{hero.name}</span>
                      <select aria-label={`${hero.name} bulk star level`} value={heroStarLevels[hero.name] ?? 1} onChange={event=>setStarLevel(hero.name,Number(event.target.value))}>
                        {[1,2,3,4,5].map(level=><option key={level} value={level}>{"★".repeat(level)} ({level})</option>)}
                      </select>
                    </label>
                  ))}
                </div>
              </details>
            )}
          </section>
      <section className="panel pinning-panel" aria-labelledby="pinning-heading">
        <div className="title"><div><label>FORMATION PINNING</label><h2 id="pinning-heading">Pin heroes, then regenerate the rest</h2></div><button type="button" className="small-action" onClick={()=>{setLeaderLocks({});setLocks({});setGenerated(false)}}>Clear all pins</button></div>
        <p className="helper">Pins use the existing legality engine. A hero cannot be reused, every formation still needs one Shield/Bomber/Shooter hero, and Joiner LEFT pins must pass the active LEFT filters.</p>
        <div className="pin-grid">
          <div className="pin-row">
            <b>MAIN</b>
            {slots.map(slot=>(
              <label key={`main-${slot}`}><span>{slot.toUpperCase()}</span>
                <select value={leaderLocks[`0:${slot}`] ?? ""} onChange={event=>{setLeaderLocks(current=>({...current,[`0:${slot}`]:event.target.value}));setGenerated(false)}}>
                  <option value="">Auto</option>
                  {available.map(hero=><option key={hero.name} value={hero.name}>{hero.name} • {hero.cls}</option>)}
                </select>
              </label>
            ))}
          </div>
          {Array.from({length:joinCount},(_,index)=>(
            <div className="pin-row" key={`pin-j${index+1}`}>
              <b>J{index+1}</b>
              {slots.map(slot=>{
                const pool = slot === "left" ? generatorAvailable.filter(hero=>hero.leftSkill && (!verifiedOnly || hero.leftSkillVerified)) : generatorAvailable;
                const key = `${index}:${slot}`;
                return (
                  <label key={key}><span>{slot.toUpperCase()}</span>
                    <select value={locks[key] ?? ""} onChange={event=>{setLocks(current=>({...current,[key]:event.target.value}));setGenerated(false)}}>
                      <option value="">Auto</option>
                      {pool.map(hero=><option key={hero.name} value={hero.name}>{hero.name} • {hero.cls}</option>)}
                    </select>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </section>


      <section className="panel evidence-dashboard" aria-labelledby="evidence-heading">
        <div className="title"><div><label>EVIDENCE COMPLETENESS</label><h2 id="evidence-heading">Hero data by season</h2></div></div>
        <div className="evidence-grid">
          {evidenceDashboard.map(row=>(
            <div key={row.season}>
              <b>{row.season === 0 ? "Legacy" : `Season ${row.season}`}</b>
              <span>{row.verified} verified LEFT</span>
              <span>{row.partial} partial LEFT</span>
              <span>{row.deferred} deferred</span>
              <small>{row.noLeft} without LEFT priority data • {row.total} total shown</small>
            </div>
          ))}
        </div>
        <p className="helper">“Deferred” means we intentionally wait for direct account evidence instead of filling unknown values from assumptions.</p>
      </section>


      <section className="panel preflight-panel">
        <div className="result-title">
          <div><label>FORMATION PREFLIGHT</label><h2>Roster, LEFT skills & robot pool</h2></div>
          <span className={`status status-${preflightStatus}`}>{preflightStatus.toUpperCase()}</span>
        </div>
        <div className="mini-grid">
          <div><b>Main Rally reserve</b><span>{leaderReservedNames.length ? leaderReservedNames.join(" + ") : "Need one usable hero from each class"}</span></div>
          <div><b>Joiner hero usage</b><span>{projectedJoinerHeroNames.length}/{joinCount * 3} projected heroes for {joinCount} Joiner{joinCount === 1 ? "" : "s"}</span></div>
          <div><b>Class pool after Main</b><span>{joinerRosterDiagnostics.counts.Shield} Shield • {joinerRosterDiagnostics.counts.Bomber} Bomber • {joinerRosterDiagnostics.counts.Shooter} Shooter</span></div>
          <div><b>LEFT skill pool</b><span>{joinerRosterDiagnostics.leftSkills}/{joinCount} needed • {verifiedOnly ? "verified only" : "verified + known"}{hideFillerLeft ? " • no filler" : ""}{leftClassFilter !== "all" ? ` • ${leftClassFilter} only` : ""}</span></div>
          <div><b>Robot pool</b><span>{assignedRobotNames.length}/{requestedRobotSlots} projected assignments • {unassignedRobotNames.length} unassigned</span></div>
          <div><b>Season evidence</b><span>{seasonHeroes.filter(hero => hero.season === season && hero.leftSkillVerified).length} verified LEFT skill{seasonHeroes.filter(hero => hero.season === season && hero.leftSkillVerified).length === 1 ? "" : "s"} entered for Season {season}</span></div>
        </div>
        {projectedJoinerHeroNames.length > 0 && (
          <details className="preflight-details">
            <summary>Show projected roster usage</summary>
            <p><b>Main reserved:</b> {leaderReservedNames.join(", ") || "none"}</p>
            <p><b>Joiners ({projectedJoinerHeroNames.length}/{joinCount * 3} heroes):</b> {projectedJoinerHeroNames.join(", ")}</p>
          </details>
        )}
        {topRecoveryOptions.length > 0 && (
          <details className="preflight-details">
            <summary>Show ranked LEFT recovery order</summary>
            <ol>{topRecoveryOptions.map(hero => <li key={hero.name}><b>{hero.name}</b> — {hero.cls} • Lv{hero.level} • {hero.verified ? "verified" : "unverified"}</li>)}</ol>
          </details>
        )}
        {lockError && <div className="warning-box"><b>Configuration conflict:</b> {lockError}</div>}
        {joinerRosterDiagnostics.blockers.length > 0 && <div className="warning-box">{joinerRosterDiagnostics.blockers.join(" ")}</div>}
        {shortageActions.length > 0 && (
          <div className="shortage-actions">
            <b>WHAT TO ADD</b>
            <ul>{shortageActions.map(action => <li key={action}>{action}</li>)}</ul>
          </div>
        )}
        {!lockError && joinerRosterDiagnostics.blockers.length === 0 && <p className="helper">Preflight found enough class coverage and LEFT-skill candidates for the requested Joiners. Robot shortages remain guidance only and never make a formation illegal.</p>}
      </section>


      <section className="panel simple-cage-tips">
        <div className="title"><div><label>CAGE RECOMMENDATIONS</label><h2>Use these with the generated formations</h2></div></div>
        <div className="mini-grid">
          <div><b>Robots</b><span>Musashimaru + Phantom Cat are the current priority choices when owned.</span></div>
          <div><b>Felons</b><span>Scorpion + Cobra core. Use Rage Fist for a full rally; Devil when expedition capacity is more useful.</span></div>
          <div><b>2-hour buffs</b><span>Troops ATK +11%, Troops Lethality +11%, Expedition Capacity +11%. Activate about 5 minutes before Cage.</span></div>
        </div>
      </section>


      <section className="panel comparison-workspace" aria-labelledby="comparison-heading">
        <div className="title"><div><label>FORMATION COMPARISON</label><h2 id="comparison-heading">Compare two saved setups</h2></div></div>
        <p className="helper">This compares formation choices only. It does not predict Cage damage or claim one setup will outperform the other.</p>
        <div className="comparison-actions">
          <button type="button" onClick={()=>saveComparison("A")} disabled={!leaderFormation && joinerFormations.length===0}>Save current as A</button>
          <button type="button" onClick={()=>saveComparison("B")} disabled={!leaderFormation && joinerFormations.length===0}>Save current as B</button>
          <button type="button" onClick={()=>{setComparisonA(null);setComparisonB(null)}} disabled={!comparisonA&&!comparisonB}>Clear comparison</button>
        </div>
        <div className="snapshot-grid">
          {[["A",comparisonA],["B",comparisonB]].map(([label,snapshot])=>(
            <div className="snapshot-card" key={String(label)}>
              <b>SETUP {String(label)}</b>
              {snapshot ? (
                <>
                  <small>Saved {(snapshot as FormationSnapshot).savedAt}</small>
                  {(snapshot as FormationSnapshot).lines.map(line=>(
                    <div className="snapshot-line" key={`${String(label)}-${line.id}`}>
                      <strong>{line.id}</strong>
                      <span>{line.left} / {line.middle} / {line.right}</span>
                      <small>Robot: {line.robot} • {line.status.toUpperCase()}</small>
                    </div>
                  ))}
                </>
              ) : <span>Not saved yet.</span>}
            </div>
          ))}
        </div>
      </section>


        </div>
      </details>

      <button className="generate setup-only" onClick={generateNow}>GENERATE MY CAGE SETUP</button>
      <p className="helper setup-only">LEFT skill levels assume the maximum unlocked by stars unless you set an actual level in Advanced.</p>
      <p className="core-troop-rule setup-only"><b>Main:</b> use your maximum troops. <b>Joiners:</b> 10,000 Bombers + 90,000 Shooters or 100,000 Shooters.</p>

      {!generated && <button className="mobile-generate setup-only" onClick={generateNow}>GENERATE MAIN + {joinCount} JOINER{joinCount === 1 ? "" : "S"}</button>}

      {generated && (
        <div className="result-overview">
          <b>{leaderFormation ? "MAIN READY" : "MAIN NEEDED"}</b>
          <span>{joinerFormations.length}/{joinCount} JOINERS BUILT</span>
          <span>{available.length} HEROES SELECTED</span>
        </div>
      )}

      {generated && (simpleShortageItems.length > 0 || joinerFormations.length < joinCount) && (
        <div className="simple-shortage">
          <b>TO FINISH THIS SETUP</b>
          <span>{simpleShortageItems.length ? simpleShortageItems.join(" ") : `Need more compatible heroes to build all ${joinCount} Joiners.`}</span>
          <a href="#hero-picker-heading">Review selected heroes</a>
        </div>
      )}

      {generated && seatHolder && (
        <div className="seat-bonus active">
          <b>+10% ATK ACTIVE</b>
          <span>You are a seat holder: +10% ATK against Imprisoned Scarlet Butcher.</span>
        </div>
      )}

      {generated && (
        <div className="result-toolbar">
          <button className="copy-button" type="button" onClick={()=>setResultsOnly(current=>!current)}>
            {resultsOnly ? "BACK TO SETUP" : "RESULTS ONLY"}
          </button>
          <button className="copy-button" type="button" onClick={()=>window.print()}>PRINT RESULTS</button>
          {!lockError && (
            <button className="copy-button" disabled={exportingImage || (!leaderFormation && !joinerFormations.length)} onClick={exportFormationImage}>
              {exportingImage ? "CREATING IMAGE…" : "DOWNLOAD IMAGE"}
            </button>
          )}
        </div>
      )}

      {generated &&
        (leaderFormation ? (
          <section className="result">
            <div className="result-title">
              <label>YOUR MAIN RALLY</label>
              <div className="result-card-actions">
                <button type="button" className="mini-copy" onClick={()=>copySingleFormation(leaderFormation, "Main")}>COPY MAIN</button>
                <span className={`status status-${leaderFormation.status}`}>{leaderFormation.status.toUpperCase()}</span>
              </div>
            </div>
            <div className="slots">
              <div className="slot left">
                <span>LEFT • {leaderFormation.left.cls}</span>
                {heroIconNames.has(leaderFormation.left.name) && (
                      <Image className="formation-hero-icon"
                        src={heroIconPath(leaderFormation.left.name)}
                        alt="" width={42} height={52} />
                    )}
                    <b>{leaderFormation.left.name}</b><small>{heroStarLevels[leaderFormation.left.name] ? "★".repeat(heroStarLevels[leaderFormation.left.name]) : "Stars not set"}</small>
              </div>
              <div className="slot">
                <span>MIDDLE • {leaderFormation.middle.cls}</span>
                {heroIconNames.has(leaderFormation.middle.name) && (
                      <Image className="formation-hero-icon"
                        src={heroIconPath(leaderFormation.middle.name)}
                        alt="" width={42} height={52} />
                    )}
                    <b>{leaderFormation.middle.name}</b><small>{heroStarLevels[leaderFormation.middle.name] ? "★".repeat(heroStarLevels[leaderFormation.middle.name]) : "Stars not set"}</small>
              </div>
              <div className="slot">
                <span>RIGHT • {leaderFormation.right.cls}</span>
                {heroIconNames.has(leaderFormation.right.name) && (
                      <Image className="formation-hero-icon"
                        src={heroIconPath(leaderFormation.right.name)}
                        alt="" width={42} height={52} />
                    )}
                    <b>{leaderFormation.right.name}</b><small>{heroStarLevels[leaderFormation.right.name] ? "★".repeat(heroStarLevels[leaderFormation.right.name]) : "Stars not set"}</small>
              </div>
            </div>
            <p>
              Use your maximum available troops for your Main Rally. Follow your alliance’s current Trial Cage troop composition rules.
            </p>
            {Object.entries(kofLeaderLinks).filter(([name,target]) => target && (heroStarLevels[name]??1) >= 4 && owned.includes(name)).length > 0 && <div className="kof-active-links"><b>KOF MAIN RALLY LINKS</b>{Object.entries(kofLeaderLinks).filter(([name,target]) => target && (heroStarLevels[name]??1) >= 4 && owned.includes(name)).map(([name,target])=><span key={name}>{name} → replaces {target}</span>)}</div>}
            {(availableRobots.length > 0 || ownedFelons.length > 0) && (
                          <div className="mini-grid">
                            <div className="robot-control">
                              <b>Robot assignment</b>
                              <span>{leaderFormation.robot ?? "No owned robot selected"}</span>
                              <select
                                aria-label="Main Rally robot override"
                                value={robotOverrides.MAIN ?? ""}
                                onChange={event => setRobotOverride("MAIN", event.target.value)}
                              >
                                <option value="">Auto ({leaderFormation.robot ?? "none"})</option>
                                {availableRobots.map(robot => <option key={robot} value={robot}>{robot}</option>)}
                              </select>
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
            )}
            {ownedFelons.length > 0 && felonPlan.warning && (
              <div className="warning-box">{felonPlan.warning}</div>
            )}
            {leaderFormation.alerts
              
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
          <p className="result-intro">Each Joiner uses one Shield, one Bomber and one Shooter. The first hero shown is the LEFT hero whose War skill drives the Joiner recommendation.</p>
          {lockError && <div className="warning-box">{lockError}</div>}
          {joinerFormations.length === 0 && (
            <div className="warning-box">
              {verifiedOnly
                ? "No legal formation uses a screenshot-verified LEFT skill from this roster. Add verified LEFT heroes or turn the filter off."
                : `Not enough compatible heroes to build all requested joiners. Check that you have at least ${joinCount} eligible LEFT-skill heroes plus one Shieldbearer, Bomber and Shooter for each march.`}
            </div>
          )}
          <p className="helper">Leader heroes are reserved. Each Joiner uses different heroes. MIDDLE and RIGHT are filled with lower-priority support heroes first so stronger LEFT-skill heroes remain available for later Joiners whenever the roster allows it.</p><div className="formation-list">
            {joinerFormations.map((f) => (
              <article className="formation-card" key={f.id}>
                <div className="formation-head">
                  <b>{f.id}</b>
                  <span>10k Bombers + 90k Shooters OR 100k Shooters</span>
                  <div className="formation-head-actions">
                    <button type="button" className="mini-copy" onClick={()=>copySingleFormation(f, "Joiner")}>COPY {f.id}</button>
                    <em className={`status status-${f.status}`}>{f.status.toUpperCase()}</em>
                  </div>
                </div>
                <div className="slots">
                  <div className="slot left">
                    <span>
                      LEFT • ACTIVE RALLY SKILL • Lv{f.leftSkillLevel} • {f.left.leftSkillVerified ? "VERIFIED" : "UNVERIFIED"}
                    </span>
                    {heroIconNames.has(f.left.name) && (
                      <Image className="formation-hero-icon"
                        src={heroIconPath(f.left.name)}
                        alt="" width={42} height={52} />
                    )}
                    <b>{f.left.name}</b><small className="hero-stars">{heroStarLevels[f.left.name] ? "★".repeat(heroStarLevels[f.left.name]) : "Stars not set"}</small>
                    <small>{f.left.leftSkill}</small>
                    <details><summary>Why this hero?</summary><p>First War skill: {f.left.leftSkill}. The generator ranks LEFT candidates with the same skill-tier, War-skill-level and star model used during automatic formation building. War skill auto-ranks to Lv{f.leftSkillLevel} from the hero star unlock: 1★→Lv2, 2★→Lv3, 3★→Lv4, 4★+→Lv5. MIDDLE and RIGHT choices protect stronger unused LEFT candidates when possible. {f.left.leftSkillVerified ? "Skill progression verified from direct evidence." : "Exact progression is not yet verified."}</p></details>
                  </div>
                  <div className="slot">
                    <span>MIDDLE • {f.middle.cls}</span>
                    {heroIconNames.has(f.middle.name) && (
                      <Image className="formation-hero-icon"
                        src={heroIconPath(f.middle.name)}
                        alt="" width={42} height={52} />
                    )}
                    <b>{f.middle.name}</b><small>{heroStarLevels[f.middle.name] ? "★".repeat(heroStarLevels[f.middle.name]) : "Stars not set"}</small>
                  </div>
                  <div className="slot">
                    <span>RIGHT • {f.right.cls}</span>
                    {heroIconNames.has(f.right.name) && (
                      <Image className="formation-hero-icon"
                        src={heroIconPath(f.right.name)}
                        alt="" width={42} height={52} />
                    )}
                    <b>{f.right.name}</b><small>{heroStarLevels[f.right.name] ? "★".repeat(heroStarLevels[f.right.name]) : "Stars not set"}</small>
                  </div>
                </div>
                {availableRobots.length > 0 && (
                                  <div className={f.robot ? "robot-assignment" : "robot-assignment missing"}>
                                    <span>ROBOT</span>
                                    <b>{f.robot ?? "No owned robot available"}</b>
                                    <select
                                      aria-label={`${f.id} robot override`}
                                      value={robotOverrides[f.id] ?? ""}
                                      onChange={event => setRobotOverride(f.id, event.target.value)}
                                    >
                                      <option value="">Auto ({f.robot ?? "none"})</option>
                                      {availableRobots.map(robot => <option key={robot} value={robot}>{robot}</option>)}
                                    </select>
                                  </div>
                )}
                <details className="left-comparison">
                  <summary>Compare next-best LEFT heroes</summary>
                  <p className="comparison-note">Comparison score is an internal generator heuristic, not an in-game damage percentage. It combines skill tier, verified progression at the auto War-skill level, and hero stars.</p>
                  <div className="left-comparison-grid">
                    {joinerRosterDiagnostics.rankedLeftAlternatives
                      .filter(candidate => candidate.name !== f.left.name)
                      .slice(0, 3)
                      .map(candidate => (
                        <div key={`${f.id}-${candidate.name}`}>
                          <b>{candidate.name}</b>
                          <span>{candidate.cls} • Lv{candidate.level} • {candidate.verified ? "verified" : "unverified"}</span>
                          <small>Generator score {Math.round(candidate.score)} • {leaderReservedNames.includes(candidate.name) || projectedJoinerHeroNames.includes(candidate.name) ? "currently used" : "available"}</small>
                        </div>
                      ))}
                  </div>
                </details>
                {f.alerts
                  
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
                  : `Only ${joinerFormations.length} legal non-repeating formation${joinerFormations.length === 1 ? "" : "s"} could be built. ${joinerRosterDiagnostics.bottleneck ? `Bottleneck: ${joinerRosterDiagnostics.bottleneck.cls} is short by ${joinerRosterDiagnostics.bottleneck.short}. ` : ""}${joinerRosterDiagnostics.blockers.join(" ")}${joinerRosterDiagnostics.leftAlternatives.length ? ` Eligible LEFT options: ${joinerRosterDiagnostics.leftAlternatives.join(", ")}.` : ""}` }
              </div>
            )}
        </section>
      )}

      <section className="panel notes setup-only">
        <div>
          <label>RULES CURRENTLY ENFORCED</label>
          <p>
            ✓ 1 Shield + 1 Bomber + 1 Shooter &nbsp; ✓ LEFT-slot skill priority
            &nbsp; ✓ LEFT War skill level &nbsp; ✓ no hero reuse across
            J1–J6 &nbsp; ✓ Main Rally uses max troops &nbsp; ✓ joiners use the two Cage troop options &nbsp; ✓ KOF excluded
          </p>
        </div>
      </section>
      <footer className="setup-only">
        Community tool • Not affiliated with Lands of Jail. Unknown season
        numbers are marked “Legacy” instead of being guessed.
        <br />
        Problems, incorrect formations, or website issues? Contact <b>Stiletto</b> on <b>Server 260</b>.
      </footer>
    </main>
    </>
  );
}
