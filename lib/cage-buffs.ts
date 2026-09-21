export type CageBuff = {
  id: string;
  name: string;
  source: "prison-buff" | "prisoner-armor";
  durationHours: number;
  stat: "atk" | "lethality" | "hp" | "enemy-atk-reduction" | "enemy-def-reduction" | "expedition-capacity-percent" | "expedition-capacity-flat" | "rally-capacity-flat";
  value: number;
  referenceLevel?: number;
  levelValues?: number[];
  cooldownHours?: number;
  armorRobot?: string;
  breakthroughLevels?: Record<number, number>;
  maxSkillLevel?: number;
};

export type PrisonerArmorSetting = {
  level: number;
  value: number;
};

export type PrisonerArmorSettings = Record<string, PrisonerArmorSetting>;

export function prisonerArmorSetting(
  buff: CageBuff,
  settings: PrisonerArmorSettings = {},
): PrisonerArmorSetting {
  const saved = settings[buff.id];
  const maxLevel = buff.maxSkillLevel ?? 10;
  const level = Math.max(1, Math.min(maxLevel, Math.round(saved?.level ?? 1)));
  const verifiedValue = buff.levelValues?.[level - 1];
  return {
    level,
    value: verifiedValue ?? Math.max(0, Number.isFinite(saved?.value) ? Number(saved.value) : 0),
  };
}

export function effectiveBuffValue(buff: CageBuff, settings: PrisonerArmorSettings = {}) {
  return buff.source === "prisoner-armor" ? prisonerArmorSetting(buff, settings).value : buff.value;
}

export function isPowerArmorLevelVerified(buff: CageBuff, level: number) {
  return buff.source === "prisoner-armor" && buff.levelValues?.[level - 1] !== undefined;
}

export function powerArmorBreakthroughLabel(buff: CageBuff, level: number) {
  const breakthrough = buff.breakthroughLevels?.[level];
  return breakthrough ? `Unlocks after Power Armor breakthrough Lv.${breakthrough}` : "";
}

export const cageBuffs: CageBuff[] = [
  { id: "troops-atk-2h", name: "Troops ATK (2h)", source: "prison-buff", durationHours: 2, stat: "atk", value: 11 },
  { id: "troops-lethality-2h", name: "Troops Lethality (2h)", source: "prison-buff", durationHours: 2, stat: "lethality", value: 11 },
  { id: "expedition-capacity-2h", name: "Expedition Capacity (2h)", source: "prison-buff", durationHours: 2, stat: "expedition-capacity-percent", value: 11 },
  {
    id: "comprehensive-command",
    name: "Comprehensive Command",
    source: "prisoner-armor",
    durationHours: 2,
    cooldownHours: 20,
    stat: "expedition-capacity-flat",
    value: 11250,
    referenceLevel: 9,
    armorRobot: "Infercore",
    maxSkillLevel: 9,
    levelValues: [1250, 2500, 3750, 5000, 6250, 7500, 8750, 10000, 11250],
  },
  {
    id: "overload-charge",
    name: "Overload Charge",
    source: "prisoner-armor",
    durationHours: 2,
    cooldownHours: 20,
    stat: "rally-capacity-flat",
    value: 96000,
    referenceLevel: 6,
    armorRobot: "Halo",
    levelValues: [16000, 32000, 48000, 64000, 80000, 96000, 112000, 128000, 144000, 160000],
    breakthroughLevels: { 7: 70, 8: 80, 9: 90, 10: 100 },
  },
  {
    id: "valiant-breach",
    name: "Valiant Breach",
    source: "prisoner-armor",
    durationHours: 2,
    cooldownHours: 20,
    stat: "lethality",
    value: 4,
    referenceLevel: 4,
    armorRobot: "Yokozuna",
    levelValues: [2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10],
    breakthroughLevels: { 5: 50, 6: 60, 7: 70, 8: 80, 9: 90, 10: 100 },
  },
  {
    id: "orbital-strike",
    name: "Orbital Strike",
    source: "prisoner-armor",
    durationHours: 2,
    cooldownHours: 20,
    stat: "atk",
    value: 4,
    referenceLevel: 5,
    armorRobot: "Atlax",
    maxSkillLevel: 9,
    levelValues: [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6],
    breakthroughLevels: { 6: 60, 7: 70, 8: 80, 9: 90 },
  },
];

export function summarizeSelectedBuffs(selectedIds: string[], armorSettings: PrisonerArmorSettings = {}) {
  const selected = cageBuffs.filter(buff => selectedIds.includes(buff.id));
  const total = (stat: CageBuff["stat"]) =>
    selected.filter(buff => buff.stat === stat).reduce((sum, buff) => sum + effectiveBuffValue(buff, armorSettings), 0);
  return {
    selected,
    atkPercent: total("atk"),
    lethalityPercent: total("lethality"),
    hpPercent: total("hp"),
    enemyAtkReductionPercent: total("enemy-atk-reduction"),
    enemyDefReductionPercent: total("enemy-def-reduction"),
    expeditionCapacityPercent: total("expedition-capacity-percent"),
    expeditionCapacityFlat: total("expedition-capacity-flat"),
    rallyCapacityFlat: total("rally-capacity-flat"),
  };
}

export function buildPreCageChecklist(selectedIds: string[], armorSettings: PrisonerArmorSettings = {}) {
  return cageBuffs
    .filter(buff => selectedIds.includes(buff.id))
    .map(buff => {
      const armor = buff.source === "prisoner-armor" ? prisonerArmorSetting(buff, armorSettings) : null;
      return {
        id: buff.id,
        label: `${buff.name}${armor ? ` Lv.${armor.level}` : ""} — ${buffEffectLabel(buff, armorSettings)}`,
        duration: `${buff.durationHours}h`,
        source: buff.source === "prison-buff" ? "Prison Buff" : "Power Armor",
      };
    });
}

export type CapacityPreview = {
  baseCapacity: number;
  expeditionPercent: number;
  expeditionFlat: number;
  rallyFlat: number;
  confirmedFinalCapacity: number | null;
  note: string;
};

export function previewCageCapacity(baseCapacity: number, selectedIds: string[], armorSettings: PrisonerArmorSettings = {}): CapacityPreview {
  const totals = summarizeSelectedBuffs(selectedIds, armorSettings);
  return {
    baseCapacity,
    expeditionPercent: totals.expeditionCapacityPercent,
    expeditionFlat: totals.expeditionCapacityFlat,
    rallyFlat: totals.rallyCapacityFlat,
    confirmedFinalCapacity: null,
    note: "Capacity effects are shown separately until the game's stacking/order is verified.",
  };
}

export function buffEffectLabel(buff: CageBuff, armorSettings: PrisonerArmorSettings = {}) {
  const pctStats = new Set(["atk","lethality","hp","enemy-atk-reduction","enemy-def-reduction","expedition-capacity-percent"]);
  const effective = effectiveBuffValue(buff, armorSettings);
  const armor = buff.source === "prisoner-armor" ? prisonerArmorSetting(buff, armorSettings) : null;
  const verified = armor ? isPowerArmorLevelVerified(buff, armor.level) : true;
  const value = buff.source === "prisoner-armor" && !verified && effective <= 0
    ? "— value not verified"
    : pctStats.has(buff.stat) ? `+${effective}%` : `+${effective.toLocaleString("en-US")}`;
  const labels: Record<CageBuff["stat"], string> = {
    atk: "Troops ATK",
    lethality: "Troops Lethality",
    hp: "Expedition Troops HP",
    "enemy-atk-reduction": "Enemy ATK Reduction",
    "enemy-def-reduction": "Enemy DEF Reduction",
    "expedition-capacity-percent": "Expedition Capacity",
    "expedition-capacity-flat": "Expedition Troop Capacity",
    "rally-capacity-flat": "Rally Troop Capacity",
  };
  return `${labels[buff.stat]} ${buff.stat === "enemy-atk-reduction" ? `-${effective}%` : value}`;
}

export const commonTwoHourPrisonBuffIds = [
  "troops-atk-2h",
  "troops-lethality-2h",
  "expedition-capacity-2h",
] as const;

export function splitBuffsBySource() {
  return {
    prisonBuffs: cageBuffs.filter(buff => buff.source === "prison-buff"),
    prisonerArmor: cageBuffs.filter(buff => buff.source === "prisoner-armor"),
  };
}

export type CageBuffProfile = {
  selectedBuffIds: string[];
  activationLeadMinutes: number;
};

export const defaultCageBuffProfile: CageBuffProfile = {
  selectedBuffIds: [],
  activationLeadMinutes: 5,
};

export function sanitizeCageBuffProfile(value?: Partial<CageBuffProfile> | null): CageBuffProfile {
  const known = new Set(cageBuffs.map(buff => buff.id));
  return {
    selectedBuffIds: (value?.selectedBuffIds ?? []).filter(id => known.has(id)),
    activationLeadMinutes: Math.max(0, Math.min(120, Math.round(value?.activationLeadMinutes ?? 5))),
  };
}

export function validateCageBuffSelection(selectedIds: string[]) {
  const known = new Set(cageBuffs.map(buff => buff.id));
  const unknownIds = selectedIds.filter(id => !known.has(id));
  const duplicates = selectedIds.filter((id,index) => selectedIds.indexOf(id) !== index);
  return {
    valid: unknownIds.length === 0 && duplicates.length === 0,
    unknownIds: [...new Set(unknownIds)],
    duplicates: [...new Set(duplicates)],
  };
}

export function cageBuffSummaryText(selectedIds: string[], armorSettings: PrisonerArmorSettings = {}) {
  const totals = summarizeSelectedBuffs(selectedIds, armorSettings);
  const parts: string[] = [];
  if (totals.atkPercent) parts.push(`ATK +${totals.atkPercent}%`);
  if (totals.lethalityPercent) parts.push(`Lethality +${totals.lethalityPercent}%`);
  if (totals.hpPercent) parts.push(`HP +${totals.hpPercent}%`);
  if (totals.enemyDefReductionPercent) parts.push(`Enemy DEF Reduction +${totals.enemyDefReductionPercent}%`);
  if (totals.expeditionCapacityPercent) parts.push(`Expedition Capacity +${totals.expeditionCapacityPercent}%`);
  if (totals.expeditionCapacityFlat) parts.push(`Expedition Capacity +${totals.expeditionCapacityFlat.toLocaleString("en-US")}`);
  if (totals.rallyCapacityFlat) parts.push(`Rally Capacity +${totals.rallyCapacityFlat.toLocaleString("en-US")}`);
  return parts.length ? parts.join(" • ") : "No pre-Cage buffs selected";
}

export function cageBuffTimingMessage(profile: CageBuffProfile) {
  const selected = cageBuffs.filter(buff => profile.selectedBuffIds.includes(buff.id));
  if (!selected.length) return "No pre-Cage activation reminder is needed.";
  const shortest = Math.min(...selected.map(buff => buff.durationHours));
  return `Activate selected buffs about ${profile.activationLeadMinutes} minute${profile.activationLeadMinutes === 1 ? "" : "s"} before Cage. Shortest selected duration: ${shortest}h.`;
}

export function cageBuffPriorityHint(selectedIds: string[], armorSettings: PrisonerArmorSettings = {}) {
  const selected = cageBuffs.filter(buff => selectedIds.includes(buff.id));
  const offense = selected.filter(buff => ["atk","lethality","enemy-def-reduction"].includes(buff.stat));
  const capacity = selected.filter(buff => buff.stat.includes("capacity"));
  const support = selected.filter(buff => buff.stat === "hp");
  return {
    offense: offense.map(buff => buffEffectLabel(buff, armorSettings)),
    capacity: capacity.map(buff => buffEffectLabel(buff, armorSettings)),
    support: support.map(buff => buffEffectLabel(buff, armorSettings)),
    note: "Categories describe the buff effect only; they are not a claim about the best Trial Cage combination.",
  };
}

export function preCageShareLines(profile: CageBuffProfile, armorSettings: PrisonerArmorSettings = {}) {
  const checklist = buildPreCageChecklist(profile.selectedBuffIds, armorSettings);
  return [
    "PRE-CAGE BUFFS",
    ...checklist.map(item => `• ${item.label} — ${item.source} — ${item.duration}`),
    cageBuffSummaryText(profile.selectedBuffIds, armorSettings),
    cageBuffTimingMessage(profile),
  ];
}

export function preCageWarnings(baseCapacity: number, selectedIds: string[], armorSettings: PrisonerArmorSettings = {}) {
  const totals = summarizeSelectedBuffs(selectedIds, armorSettings);
  const warnings: string[] = [];
  if (baseCapacity <= 0) warnings.push("Enter your unbuffed Main Rally capacity before using the capacity preview.");
  if (totals.expeditionCapacityPercent && (totals.expeditionCapacityFlat || totals.rallyCapacityFlat)) warnings.push("Multiple capacity effects are selected. Final capacity is intentionally not auto-calculated until stacking order is verified.");
  return warnings;
}

export type CapacityObservation = {
  felon: string;
  baseCapacity: number;
  selectedBuffIds: string[];
  displayedCapacity: number;
  recordedAt: number;
};

export function capacityObservationDelta(observation: CapacityObservation) {
  return observation.displayedCapacity - observation.baseCapacity;
}

export function capacityObservationLabel(observation: CapacityObservation) {
  const buffs = observation.selectedBuffIds.length ? cageBuffSummaryText(observation.selectedBuffIds) : "No temporary buffs";
  const delta=capacityObservationDelta(observation); const pct=observation.baseCapacity>0?(delta/observation.baseCapacity)*100:0;
  return `${observation.felon || "No felon"}: ${observation.baseCapacity.toLocaleString()} → ${observation.displayedCapacity.toLocaleString()} (Δ ${delta.toLocaleString()}, ${pct>=0?"+":""}${pct.toFixed(2)}%) • ${buffs}`;
}

export function compareCapacityObservations(observations: CapacityObservation[]) {
  const valid = observations.filter(o => o.baseCapacity > 0 && o.displayedCapacity > 0);
  return valid.map(o => ({
    ...o,
    delta: capacityObservationDelta(o),
    percentOverBase: ((o.displayedCapacity - o.baseCapacity) / o.baseCapacity) * 100,
  }));
}

export function capacityEvidenceStatus(observations: CapacityObservation[]) {
  if (!observations.length) return { status: "waiting" as const, label: "Waiting for in-game tests" };
  const uniqueSetups = new Set(observations.map(o => [o.felon,[...o.selectedBuffIds].sort().join(",")].join("|")));
  if (uniqueSetups.size < 3) return { status: "collecting" as const, label: "Collecting more combinations" };
  return { status: "evidence" as const, label: "Evidence set available for stacking analysis" };
}
