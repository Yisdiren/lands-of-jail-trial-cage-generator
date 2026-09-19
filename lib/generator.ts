import type { Felon, Hero } from "../data/heroes";
import { generateJoinerFormationsSmart, generateLeaderFormationSmart, type HeroStarLevels, type KofLeaderLinks } from "./formation-generator";

export type TroopPreset = "shooters" | "10-90";
export type WarSkillLevels = Record<string, number>;
export type TroopClassKey = "shield" | "bomber" | "shooter";
export type TroopTier = `T${number}`;
export type TroopValues = Record<TroopClassKey, number>;
export type TroopTiers = Record<TroopClassKey, TroopTier>;
export type TroopConfig = { capacity: number; ratios: TroopValues; tiers: TroopTiers; available: TroopValues };
export type TroopPlan = { counts: TroopValues; ratioTotal: number; assignedTotal: number; text: string; warnings: string[] };
export type FormationAlert = { severity: "error" | "warning" | "info"; message: string };
export type FormationStatus = "blocked" | "review" | "ready";
export type Formation = { id:string; left:Hero; middle:Hero; right:Hero; troopText:string; robot?:string; leftSkillLevel?:number; leftSkillPercent?:number; alerts:FormationAlert[]; status:FormationStatus };
export type FelonPlan = { selected: Felon[]; preferredThird: "Rage Fist" | "Devil"; warning?: string };
const troopClassLabels:Record<TroopClassKey,string>={shield:"Shieldbearers",bomber:"Bombers",shooter:"Shooters"};
const safeWhole=(value:number)=>Number.isFinite(value)?Math.max(0,Math.floor(value)):0;
const formatNumber=(value:number)=>value.toLocaleString("en-US");

export function calculateTroopPlan(config:TroopConfig):TroopPlan{
  const capacity=safeWhole(config.capacity),ratios:TroopValues={shield:safeWhole(config.ratios.shield),bomber:safeWhole(config.ratios.bomber),shooter:safeWhole(config.ratios.shooter)};
  const ratioTotal=ratios.shield+ratios.bomber+ratios.shooter,counts:TroopValues={shield:Math.floor(capacity*ratios.shield/100),bomber:Math.floor(capacity*ratios.bomber/100),shooter:Math.floor(capacity*ratios.shooter/100)};
  if(ratioTotal===100)counts.shooter=capacity-counts.shield-counts.bomber;
  const assignedTotal=counts.shield+counts.bomber+counts.shooter,warnings:string[]=[];
  if(capacity<1)warnings.push("March capacity must be at least 1.");if(ratioTotal===100&&assignedTotal!==capacity)warnings.push(`Troop assignment is ${formatNumber(assignedTotal)} but march capacity is ${formatNumber(capacity)}.`);if(ratioTotal!==100)warnings.push(`Troop ratios total ${ratioTotal}%; they must total 100%.`);
  (Object.keys(counts)as TroopClassKey[]).forEach(key=>{const available=safeWhole(config.available[key]);if(counts[key]>available)warnings.push(`Need ${formatNumber(counts[key])} ${config.tiers[key]} ${troopClassLabels[key]}, but only ${formatNumber(available)} are available.`)});
  const parts=(Object.keys(counts)as TroopClassKey[]).filter(key=>counts[key]>0).map(key=>`${formatNumber(counts[key])} ${config.tiers[key]} ${troopClassLabels[key]}`);
  return{counts,ratioTotal,assignedTotal,text:`${ratios.shield} / ${ratios.bomber} / ${ratios.shooter} — ${parts.join(" + ")||"No troops assigned"}`,warnings};
}

export function validateFormation(formation:Omit<Formation,"alerts"|"status">,troopPlan:TroopPlan,mode:"leader"|"joiner"):Pick<Formation,"alerts"|"status">{
  const alerts:FormationAlert[]=troopPlan.warnings.map(message=>({severity:"error",message})),formationHeroes=[formation.left,formation.middle,formation.right];
  if(new Set(formationHeroes.map(hero=>hero.cls)).size!==3)alerts.push({severity:"error",message:"Formation must contain exactly one Shield, one Bomber and one Shooter hero."});
  formationHeroes.forEach(hero=>{if(hero.rarity==="KOF"&&mode==="joiner")alerts.push({severity:"error",message:`${hero.name} is a KOF event hero and is excluded from Joiner generation.`})});
  if(!formation.robot)alerts.push({severity:"warning",message:"No owned robot is assigned to this march. Select a robot in setup or review this march before Cage."});
  if(mode==="joiner"){
    if(!formation.left.leftSkill)alerts.push({severity:"error",message:"The LEFT hero has no confirmed first War skill for rally joining."});
    else{if(formation.left.leftTier==="filler")alerts.push({severity:"warning",message:"Filler LEFT skill — use only after stronger LEFT heroes are exhausted."});if((formation.leftSkillLevel??5)<5)alerts.push({severity:"warning",message:`${formation.left.name}'s LEFT War skill is only Lv${formation.leftSkillLevel}.`});if(!formation.left.leftSkillVerified)alerts.push({severity:"info",message:`${formation.left.name}'s exact War skill percentage progression is not yet verified.`})}
  }
  return{alerts,status:alerts.some(a=>a.severity==="error")?"blocked":alerts.some(a=>a.severity==="warning")?"review":"ready"};
}

export function generateJoinerFormations(availableHeroes:Hero[],count=6,troopPlan:TroopPlan,warSkillLevels:WarSkillLevels={},ownedRobots:string[]=[],verifiedOnly=false,heroStarLevels:HeroStarLevels={}):Formation[]{
  const leaderFormation=generateLeaderFormationSmart(availableHeroes,troopPlan,ownedRobots,heroStarLevels);
  return generateJoinerFormationsSmart(availableHeroes,count,troopPlan,warSkillLevels,ownedRobots,verifiedOnly,heroStarLevels,leaderFormation);
}
export function generateLeaderFormation(availableHeroes:Hero[],troopPlan:TroopPlan,ownedRobots:string[]=[],heroStarLevels:HeroStarLevels={},kofLeaderLinks:KofLeaderLinks={}):Formation|null{return generateLeaderFormationSmart(availableHeroes,troopPlan,ownedRobots,heroStarLevels,kofLeaderLinks)}
export function optimizeFelons(felons:Felon[],ownedNames:string[],rallyFills:boolean):FelonPlan{
  const owned=felons.filter(f=>ownedNames.includes(f.name)),byName=new Map(owned.map(f=>[f.name,f])),preferredThird=rallyFills?"Rage Fist":"Devil",alternateThird=rallyFills?"Devil":"Rage Fist",order=["Scorpion","Cobra",preferredThird,alternateThird];
  const selected=order.map(name=>byName.get(name)).filter((felon):felon is Felon=>Boolean(felon)).slice(0,3),missingCore=["Scorpion","Cobra"].filter(name=>!byName.has(name)),warnings:string[]=[];
  if(missingCore.length)warnings.push(`Missing core Yard Time felon${missingCore.length===1?"":"s"}: ${missingCore.join(" + ")}.`);if(!byName.has(preferredThird))warnings.push(`${preferredThird} is preferred for this rally condition${byName.has(alternateThird)?`; using ${alternateThird} instead`:""}.`);if(selected.length<3)warnings.push(`Only ${selected.length} owned Yard Time felon${selected.length===1?" is":"s are"} available.`);
  return{selected,preferredThird,warning:warnings.length?warnings.join(" "):undefined};
}
