import type { Felon, Hero } from "../data/heroes";
import { generateJoinerFormationsSmart, generateLeaderFormationSmart, scoreJoinerLeftHero, type HeroStarLevels, type KofLeaderLinks } from "./formation-generator";

export type WarSkillLevels = Record<string, number>;
export const maxWarSkillLevelForStars = (stars:number) => Math.min(5, Math.max(1, Math.floor(stars)) + 1);

const retainedSrHeroes = new Set(["Lofili", "Lunarl", "Flameborne", "Samir", "Gerd", "Iwado", "Vesaryon"]);
const streamlinedHeroes = (pool: Hero[]) => pool.filter(hero => hero.rarity !== "R" && (hero.rarity !== "SR" || retainedSrHeroes.has(hero.name)));

export type FormationAlert = { severity: "error" | "warning" | "info"; message: string };
export type FormationStatus = "blocked" | "review" | "ready";
export type Formation = { id:string; left:Hero; middle:Hero; right:Hero; troopText:string; robot?:string; leftSkillLevel?:number; leftSkillPercent?:number; alerts:FormationAlert[]; status:FormationStatus };
export type FelonPlan = { selected: Felon[]; preferredThird: "Rage Fist" | "Devil"; warning?: string };
export function validateFormation(formation:Omit<Formation,"alerts"|"status">,mode:"leader"|"joiner"):Pick<Formation,"alerts"|"status">{
  const alerts:FormationAlert[]=[],formationHeroes=[formation.left,formation.middle,formation.right];
  if(new Set(formationHeroes.map(hero=>hero.cls)).size!==3)alerts.push({severity:"error",message:"Formation must contain exactly one Shield, one Bomber and one Shooter hero."});
  formationHeroes.forEach(hero=>{if(hero.rarity==="KOF"&&mode==="joiner")alerts.push({severity:"error",message:`${hero.name} is a KOF event hero and is excluded from Joiner generation.`})});
  if(!formation.robot)alerts.push({severity:"info",message:"No robot selected. Robot setup is optional and does not affect formation legality."});
  if(mode==="joiner"){
    if(!formation.left.leftSkill)alerts.push({severity:"error",message:"The LEFT hero has no confirmed first War skill for rally joining."});
    else{if(formation.left.leftTier==="filler")alerts.push({severity:"warning",message:"Filler LEFT skill — use only after stronger LEFT heroes are exhausted."});if((formation.leftSkillLevel??5)<5)alerts.push({severity:"warning",message:`${formation.left.name}'s LEFT War skill is only Lv${formation.leftSkillLevel}.`});if(!formation.left.leftSkillVerified)alerts.push({severity:"info",message:`${formation.left.name}'s exact War skill percentage progression is not yet verified.`})}
  }
  return{alerts,status:alerts.some(a=>a.severity==="error")?"blocked":alerts.some(a=>a.severity==="warning")?"review":"ready"};
}

export function generateJoinerFormations(availableHeroes:Hero[],count=6,warSkillLevels:WarSkillLevels={},ownedRobots:string[]=[],verifiedOnly=false,heroStarLevels:HeroStarLevels={},leader?:Formation|null):Formation[]{
  const heroPool=streamlinedHeroes(availableHeroes);
  const leaderFormation=leader===undefined?generateLeaderFormationSmart(heroPool,ownedRobots,heroStarLevels):leader;
  const joinerRobots=leaderFormation?.robot?ownedRobots.filter(robot=>robot!==leaderFormation.robot):ownedRobots;
  return generateJoinerFormationsSmart(heroPool,count,warSkillLevels,joinerRobots,verifiedOnly,heroStarLevels,leaderFormation);
}
export function generateLeaderFormation(availableHeroes:Hero[],ownedRobots:string[]=[],heroStarLevels:HeroStarLevels={},kofLeaderLinks:KofLeaderLinks={}):Formation|null{return generateLeaderFormationSmart(streamlinedHeroes(availableHeroes),ownedRobots,heroStarLevels,kofLeaderLinks)}
export function optimizeFelons(felons:Felon[],ownedNames:string[],rallyFills:boolean):FelonPlan{
  const owned=felons.filter(f=>ownedNames.includes(f.name)),byName=new Map(owned.map(f=>[f.name,f])),preferredThird=rallyFills?"Rage Fist":"Devil",alternateThird=rallyFills?"Devil":"Rage Fist",order=["Scorpion","Cobra",preferredThird,alternateThird];
  const selected=order.map(name=>byName.get(name)).filter((felon):felon is Felon=>Boolean(felon)).slice(0,3),missingCore=["Scorpion","Cobra"].filter(name=>!byName.has(name)),warnings:string[]=[];
  if(missingCore.length)warnings.push(`Missing core Yard Time felon${missingCore.length===1?"":"s"}: ${missingCore.join(" + ")}.`);if(!byName.has(preferredThird))warnings.push(`${preferredThird} is preferred for this rally condition${byName.has(alternateThird)?`; using ${alternateThird} instead`:""}.`);if(selected.length<3)warnings.push(`Only ${selected.length} owned Yard Time felon${selected.length===1?" is":"s are"} available.`);
  return{selected,preferredThird,warning:warnings.length?warnings.join(" "):undefined};
}


export function diagnoseJoinerRoster(
  availableHeroes:Hero[],
  requested:number,
  leader:Formation|null=null,
  verifiedOnly=false,
  warSkillLevels:WarSkillLevels={},
  heroStarLevels:HeroStarLevels={},
) {
  const reserved=new Set(leader?[leader.left.name,leader.middle.name,leader.right.name]:[]);
  const eligible=streamlinedHeroes(availableHeroes).filter(hero=>hero.cageAllowed&&hero.rarity!=="KOF"&&!reserved.has(hero.name));
  const counts={
    Shield: eligible.filter(hero=>hero.cls==="Shield").length,
    Bomber: eligible.filter(hero=>hero.cls==="Bomber").length,
    Shooter: eligible.filter(hero=>hero.cls==="Shooter").length,
  };
  const leftCandidates=eligible.filter(hero=>Boolean(hero.leftSkill)&&(!verifiedOnly||hero.leftSkillVerified));
  const leftSkills=leftCandidates.length;
  const requiredHeroes=requested*3;
  const availableTotal=eligible.length;
  const blockers:string[]=[];
  (["Shield","Bomber","Shooter"] as const).forEach(cls=>{
    if(counts[cls]<requested) blockers.push(`Need ${requested-counts[cls]} more ${cls} hero${requested-counts[cls]===1?"":"es"} for ${requested} non-repeating Joiners.`);
  });
  if(leftSkills<requested) blockers.push(`Need ${requested-leftSkills} more ${verifiedOnly?"verified ":""}eligible LEFT-skill hero${requested-leftSkills===1?"":"es"}.`);
  if(availableTotal<requiredHeroes) blockers.push(`Need ${requiredHeroes-availableTotal} more eligible hero${requiredHeroes-availableTotal===1?"":"es"} overall to fill all ${requested} Joiners.`);
  const bottleneck = (["Shield","Bomber","Shooter"] as const)
    .map(cls=>({cls,available:counts[cls],short:Math.max(0,requested-counts[cls])}))
    .filter(x=>x.short>0)
    .sort((a,b)=>b.short-a.short)[0]??null;
  const rankedLeftAlternatives=leftCandidates
    .map(hero=>({
      name:hero.name,
      cls:hero.cls,
      score:scoreJoinerLeftHero(hero,warSkillLevels,heroStarLevels),
      level:Math.min(5,Math.max(1,warSkillLevels[hero.name]??5)),
      verified:Boolean(hero.leftSkillVerified),
    }))
    .sort((a,b)=>b.score-a.score||b.level-a.level||a.name.localeCompare(b.name));
  const leftAlternatives=rankedLeftAlternatives.map(hero=>hero.name);
  return {
    counts,
    leftSkills,
    blockers,
    bottleneck,
    leftAlternatives,
    rankedLeftAlternatives,
    requiredHeroes,
    availableTotal,
    heroShortage:Math.max(0,requiredHeroes-availableTotal),
  };
}
