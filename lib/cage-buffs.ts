export type CageBuff = {
  id: string;
  name: string;
  source: "prison-buff" | "prisoner-armor";
  durationHours: number;
  stat: "atk" | "lethality" | "hp" | "enemy-def-reduction" | "expedition-capacity-percent" | "expedition-capacity-flat" | "rally-capacity-flat";
  value: number;
  level?: number;
};

export const cageBuffs: CageBuff[] = [
  { id: "troops-atk-2h", name: "Troops ATK (2h)", source: "prison-buff", durationHours: 2, stat: "atk", value: 11 },
  { id: "troops-lethality-2h", name: "Troops Lethality (2h)", source: "prison-buff", durationHours: 2, stat: "lethality", value: 11 },
  { id: "expedition-capacity-2h", name: "Expedition Capacity (2h)", source: "prison-buff", durationHours: 2, stat: "expedition-capacity-percent", value: 11 },
  { id: "comprehensive-command", name: "Comprehensive Command", source: "prisoner-armor", durationHours: 2, stat: "expedition-capacity-flat", value: 11250, level: 9 },
  { id: "pinpoint-suppression", name: "Pinpoint Suppression", source: "prisoner-armor", durationHours: 2, stat: "hp", value: 10, level: 10 },
  { id: "overload-charge", name: "Overload Charge", source: "prisoner-armor", durationHours: 2, stat: "rally-capacity-flat", value: 96000, level: 6 },
  { id: "valiant-breach", name: "Valiant Breach", source: "prisoner-armor", durationHours: 2, stat: "lethality", value: 4, level: 4 },
  { id: "penetrating-ray", name: "Penetrating Ray", source: "prisoner-armor", durationHours: 2, stat: "enemy-def-reduction", value: 10, level: 10 },
  { id: "orbital-strike", name: "Orbital Strike", source: "prisoner-armor", durationHours: 2, stat: "atk", value: 4, level: 5 },
];

export function summarizeSelectedBuffs(selectedIds: string[]) {
  const selected = cageBuffs.filter(buff => selectedIds.includes(buff.id));
  return {
    selected,
    atkPercent: selected.filter(b => b.stat === "atk").reduce((sum,b)=>sum+b.value,0),
    lethalityPercent: selected.filter(b => b.stat === "lethality").reduce((sum,b)=>sum+b.value,0),
    hpPercent: selected.filter(b => b.stat === "hp").reduce((sum,b)=>sum+b.value,0),
    enemyDefReductionPercent: selected.filter(b => b.stat === "enemy-def-reduction").reduce((sum,b)=>sum+b.value,0),
    expeditionCapacityPercent: selected.filter(b => b.stat === "expedition-capacity-percent").reduce((sum,b)=>sum+b.value,0),
    expeditionCapacityFlat: selected.filter(b => b.stat === "expedition-capacity-flat").reduce((sum,b)=>sum+b.value,0),
    rallyCapacityFlat: selected.filter(b => b.stat === "rally-capacity-flat").reduce((sum,b)=>sum+b.value,0),
  };
}

export function buildPreCageChecklist(selectedIds: string[]) {
  return cageBuffs
    .filter(buff => selectedIds.includes(buff.id))
    .map(buff => ({
      id: buff.id,
      label: `${buff.name}${buff.level ? ` Lv.${buff.level}` : ""}`,
      duration: `${buff.durationHours}h`,
      source: buff.source === "prison-buff" ? "Prison Buff" : "Prisoner Armor",
    }));
}

export type CapacityPreview = {
  baseCapacity: number;
  expeditionPercent: number;
  expeditionFlat: number;
  rallyFlat: number;
  confirmedFinalCapacity: number | null;
  note: string;
};

export function previewCageCapacity(baseCapacity: number, selectedIds: string[]): CapacityPreview {
  const totals = summarizeSelectedBuffs(selectedIds);
  return {
    baseCapacity,
    expeditionPercent: totals.expeditionCapacityPercent,
    expeditionFlat: totals.expeditionCapacityFlat,
    rallyFlat: totals.rallyCapacityFlat,
    confirmedFinalCapacity: null,
    note: "Capacity effects are shown separately until the game's stacking/order is verified.",
  };
}

export function buffEffectLabel(buff: CageBuff) {
  const pctStats = new Set(["atk","lethality","hp","enemy-def-reduction","expedition-capacity-percent"]);
  const value = pctStats.has(buff.stat) ? `+${buff.value}%` : `+${buff.value.toLocaleString("en-US")}`;
  const labels: Record<CageBuff["stat"], string> = {
    atk: "Troops ATK",
    lethality: "Troops Lethality",
    hp: "Expedition Troops HP",
    "enemy-def-reduction": "Enemy DEF Reduction",
    "expedition-capacity-percent": "Expedition Capacity",
    "expedition-capacity-flat": "Expedition Troop Capacity",
    "rally-capacity-flat": "Rally Troop Capacity",
  };
  return `${labels[buff.stat]} ${value}`;
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

export function cageBuffSummaryText(selectedIds: string[]) {
  const totals = summarizeSelectedBuffs(selectedIds);
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
