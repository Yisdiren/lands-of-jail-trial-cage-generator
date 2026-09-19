import type { Hero, HeroClass } from "../data/heroes";
import type { Formation, TroopPlan, WarSkillLevels } from "./generator";
import { validateFormation } from "./generator";

export type HeroStarLevels = Record<string, number>;
export type KofLeaderLinks = Record<string, string>;
const classOrder: HeroClass[] = ["Shield", "Bomber", "Shooter"];
const isBaseJoinerEligible = (hero: Hero) => hero.cageAllowed && hero.rarity !== "KOF";
const tier = (hero: Hero) => hero.leftTier === "top" ? 300 : hero.leftTier === "strong" ? 200 : hero.leftTier === "filler" ? 100 : 0;
const levelOf = (hero: Hero, levels: WarSkillLevels) => Math.min(5, Math.max(1, levels[hero.name] ?? 5));
const starOf = (hero: Hero, stars: HeroStarLevels) => Math.min(5, Math.max(1, stars[hero.name] ?? 1));
const skillMultiplier = (hero: Hero, levels: WarSkillLevels) => {
  if (!hero.leftSkill) return 0;
  const level = levelOf(hero, levels);
  if (hero.leftSkillValues) { const actual=hero.leftSkillValues[level-1], max=hero.leftSkillValues[4]; return max>0?actual/max:0; }
  return level/5;
};
const leftScore = (hero: Hero, levels: WarSkillLevels, stars: HeroStarLevels) => (tier(hero)+(hero.leftValue??0))*skillMultiplier(hero,levels)+(starOf(hero,stars)-1)*3;
const valuable = (hero: Hero) => hero.leftTier === "top" || hero.leftTier === "strong";
const leftSorter = (levels: WarSkillLevels, stars: HeroStarLevels) => (a:Hero,b:Hero) => leftScore(b,levels,stars)-leftScore(a,levels,stars) || starOf(b,stars)-starOf(a,stars) || a.name.localeCompare(b.name);
const pickBest = (list:Hero[], cls:HeroClass, used:Set<string>, stars:HeroStarLevels) => list.filter(h=>h.cls===cls&&!used.has(h.name)).sort((a,b)=>starOf(b,stars)-starOf(a,stars)||a.name.localeCompare(b.name))[0];
const chooseLeft = (eligible:Hero[],count:number,levels:WarSkillLevels,stars:HeroStarLevels,verifiedOnly:boolean) => eligible.filter(h=>!!h.leftSkill&&(!verifiedOnly||h.leftSkillVerified)).sort(leftSorter(levels,stars)).slice(0,count);
const pickFiller = (eligible:Hero[],cls:HeroClass,used:Set<string>,protectedNames:Set<string>,levels:WarSkillLevels,stars:HeroStarLevels) => eligible.filter(h=>h.cls===cls&&!used.has(h.name)).sort((a,b)=>{
  const ap=protectedNames.has(a.name)?1:0,bp=protectedNames.has(b.name)?1:0;if(ap!==bp)return ap-bp;
  const av=valuable(a)?1:0,bv=valuable(b)?1:0;if(av!==bv)return av-bv;
  const al=a.leftSkill?1:0,bl=b.leftSkill?1:0;if(al!==bl)return al-bl;
  return starOf(a,stars)-starOf(b,stars)||leftScore(a,levels,stars)-leftScore(b,levels,stars)||a.name.localeCompare(b.name);
})[0];

export function generateLeaderFormationSmart(availableHeroes:Hero[],troopPlan:TroopPlan,ownedRobots:string[]=[],heroStarLevels:HeroStarLevels={},kofLeaderLinks:KofLeaderLinks={}):Formation|null{
  const leaderExcluded=new Set(["Mia","Tormund"]);
  const eligible=availableHeroes.filter(h=>h.cageAllowed&&h.rarity!=="KOF"&&!leaderExcluded.has(h.name));
  const ssr=eligible.filter(h=>h.rarity==="SSR");
  const hasFullSsr=classOrder.every(cls=>ssr.some(h=>h.cls===cls));
  const leaderPool=hasFullSsr?ssr:eligible,used=new Set<string>();
  const preferredShields=new Set(["Tyronn","Phoenix","Xuanming"]);
  const preferredShieldPool=leaderPool.filter(h=>h.cls==="Shield"&&preferredShields.has(h.name));
  const shield=preferredShieldPool.length
    ? preferredShieldPool.sort((a,b)=>starOf(b,heroStarLevels)-starOf(a,heroStarLevels)||a.name.localeCompare(b.name))[0]
    : pickBest(leaderPool,"Shield",used,heroStarLevels);
  if(shield)used.add(shield.name);
  const preferredBomber=leaderPool.find(h=>h.cls==="Bomber"&&h.name==="Ryuichi");
  const bomber=preferredBomber??pickBest(leaderPool,"Bomber",used,heroStarLevels);if(bomber)used.add(bomber.name);
  const preferredShooter=leaderPool.find(h=>h.cls==="Shooter"&&h.name==="Ada");
  const shooter=preferredShooter??pickBest(leaderPool,"Shooter",used,heroStarLevels);if(!shield||!bomber||!shooter)return null;
  const linkedKof=(target:Hero):Hero=>{
    const kof=availableHeroes.find(h=>h.rarity==="KOF"&&h.cls===target.cls&&kofLeaderLinks[h.name]===target.name&&starOf(h,heroStarLevels)>=4);
    return kof??target;
  };
  const linkedShield=linkedKof(shield),linkedBomber=linkedKof(bomber),linkedShooter=linkedKof(shooter);
  const base:Omit<Formation,"alerts"|"status">={id:"MAIN",left:linkedShooter,middle:linkedBomber,right:linkedShield,robot:ownedRobots[0],troopText:troopPlan.text};
  return {...base,...validateFormation(base,troopPlan,"leader")};
}

export function generateJoinerFormationsSmart(availableHeroes:Hero[],count:number,troopPlan:TroopPlan,warSkillLevels:WarSkillLevels={},ownedRobots:string[]=[],verifiedOnly=false,heroStarLevels:HeroStarLevels={},leaderFormation:Formation|null=null):Formation[]{
  const reserved=new Set(leaderFormation?[leaderFormation.left.name,leaderFormation.middle.name,leaderFormation.right.name]:[]);
  const eligible=availableHeroes.filter(h=>isBaseJoinerEligible(h)&&!reserved.has(h.name));
  const planned=chooseLeft(eligible,count,warSkillLevels,heroStarLevels,verifiedOnly),protectedNames=new Set(planned.map(h=>h.name)),used=new Set<string>(),results:Formation[]=[];
  for(const left of planned){
    if(results.length>=count||used.has(left.name))continue;
    const missing=classOrder.filter(cls=>cls!==left.cls),local=new Set(used);local.add(left.name);
    const middle=pickFiller(eligible,missing[0],local,protectedNames,warSkillLevels,heroStarLevels);if(!middle)continue;local.add(middle.name);
    const right=pickFiller(eligible,missing[1],local,protectedNames,warSkillLevels,heroStarLevels);if(!right)continue;
    used.add(left.name);used.add(middle.name);used.add(right.name);
    const level=levelOf(left,warSkillLevels),base:Omit<Formation,"alerts"|"status">={id:`J${results.length+1}`,left,middle,right,robot:ownedRobots[results.length],leftSkillLevel:level,leftSkillPercent:left.leftSkillValues?.[level-1],troopText:troopPlan.text};
    results.push({...base,...validateFormation(base,troopPlan,"joiner")});
  }
  return results;
}
