import type { Hero, HeroClass } from "../data/heroes";
import type { Formation, WarSkillLevels } from "./generator";
import { validateFormation } from "./generator";

export type HeroStarLevels = Record<string, number>;
export type KofLeaderLinks = Record<string, string>;
const validKofTargets:Record<string,string>={"Omega Rugal":"Tyronn","Terry Bogard":"Ryuichi","Mai Shiranui":"Ada"};
const classOrder: HeroClass[] = ["Shield", "Bomber", "Shooter"];
const isBaseJoinerEligible = (hero: Hero) => hero.cageAllowed && hero.rarity !== "KOF";
const tier = (hero: Hero) => hero.leftTier === "top" ? 300 : hero.leftTier === "strong" ? 200 : hero.leftTier === "filler" ? 100 : 0;
const levelOf = (hero: Hero, levels: WarSkillLevels) => Math.min(5, Math.max(1, levels[hero.name] ?? 5));
const starOf = (hero: Hero, stars: HeroStarLevels) => Math.min(5, Math.max(1, stars[hero.name] ?? 1));
// These Main Rally Shields need their three-star unlock; support Joiners are unaffected.
export const meetsMainShieldStars = (hero: Hero, stars: HeroStarLevels) =>
  !["Tyronn", "Phoenix", "Xuanming"].includes(hero.name) || starOf(hero, stars) >= 3;
const skillMultiplier = (hero: Hero, levels: WarSkillLevels) => {
  if (!hero.leftSkill) return 0;
  const level = levelOf(hero, levels);
  if (hero.leftSkillValues) { const actual=hero.leftSkillValues[level-1], max=hero.leftSkillValues[4]; return max>0?actual/max:0; }
  return level/5;
};
export const scoreJoinerLeftHero = (hero: Hero, levels: WarSkillLevels, stars: HeroStarLevels) => (tier(hero)+(hero.leftValue??0))*skillMultiplier(hero,levels)+(starOf(hero,stars)-1)*3;
const leftSorter = (levels: WarSkillLevels, stars: HeroStarLevels) => (a:Hero,b:Hero) => scoreJoinerLeftHero(b,levels,stars)-scoreJoinerLeftHero(a,levels,stars) || starOf(b,stars)-starOf(a,stars) || a.name.localeCompare(b.name);
const pickBest = (list:Hero[], cls:HeroClass, used:Set<string>, stars:HeroStarLevels) => list.filter(h=>h.cls===cls&&!used.has(h.name)).sort((a,b)=>starOf(b,stars)-starOf(a,stars)||a.name.localeCompare(b.name))[0];
const chooseLeft = (eligible:Hero[],count:number,levels:WarSkillLevels,stars:HeroStarLevels,verifiedOnly:boolean) => eligible.filter(h=>!!h.leftSkill&&(!verifiedOnly||h.leftSkillVerified)).sort(leftSorter(levels,stars)).slice(0,count);

export function generateLeaderFormationSmart(availableHeroes:Hero[],ownedRobots:string[]=[],heroStarLevels:HeroStarLevels={},kofLeaderLinks:KofLeaderLinks={}):Formation|null{
  const leaderExcluded=new Set(["Mia","Tormund"]);
  const eligible=availableHeroes.filter(h=>h.cageAllowed&&h.rarity!=="KOF"&&!leaderExcluded.has(h.name)&&meetsMainShieldStars(h,heroStarLevels));
  const ssr=eligible.filter(h=>h.rarity==="SSR");
  const hasFullSsr=classOrder.every(cls=>ssr.some(h=>h.cls===cls));
  const leaderPool=hasFullSsr?ssr:eligible,used=new Set<string>();
  // Trial Cage main-rally BIS priority: Tyronn remains the preferred Shield
  // at three stars or higher. Phoenix/Xuanming also need at least three stars.
  const tyronn=leaderPool.find(h=>h.cls==="Shield"&&h.name==="Tyronn");
  const preferredFallbackShields=new Set(["Phoenix","Xuanming"]);
  const preferredShieldPool=leaderPool.filter(h=>h.cls==="Shield"&&preferredFallbackShields.has(h.name));
  const shield=tyronn ?? (preferredShieldPool.length
    ? preferredShieldPool.sort((a,b)=>starOf(b,heroStarLevels)-starOf(a,heroStarLevels)||a.name.localeCompare(b.name))[0]
    : pickBest(leaderPool,"Shield",used,heroStarLevels));
  if(shield)used.add(shield.name);
  const preferredBomber=leaderPool.find(h=>h.cls==="Bomber"&&h.name==="Ryuichi");
  const bomber=preferredBomber??pickBest(leaderPool,"Bomber",used,heroStarLevels);if(bomber)used.add(bomber.name);
  const preferredShooter=leaderPool.find(h=>h.cls==="Shooter"&&h.name==="Ada");
  const shooter=preferredShooter??pickBest(leaderPool,"Shooter",used,heroStarLevels);if(!shield||!bomber||!shooter)return null;
  const linkedKof=(target:Hero):Hero=>{
    const kof=availableHeroes.find(h=>h.rarity==="KOF"&&h.cls===target.cls&&validKofTargets[h.name]===target.name&&kofLeaderLinks[h.name]===target.name&&starOf(h,heroStarLevels)>=4);
    return kof??target;
  };
  const linkedShield=linkedKof(shield),linkedBomber=linkedKof(bomber),linkedShooter=linkedKof(shooter);
  const base:Omit<Formation,"alerts"|"status">={id:"MAIN",left:linkedShooter,middle:linkedBomber,right:linkedShield,robot:ownedRobots[0],troopText:"Use your maximum available troops"};
  return {...base,...validateFormation(base,"leader")};
}

export function generateJoinerFormationsSmart(availableHeroes:Hero[],count:number,warSkillLevels:WarSkillLevels={},ownedRobots:string[]=[],verifiedOnly=false,heroStarLevels:HeroStarLevels={},leaderFormation:Formation|null=null):Formation[]{
  const reserved=new Set(leaderFormation?[leaderFormation.left.name,leaderFormation.middle?.name,leaderFormation.right?.name].filter((name): name is string => Boolean(name)):[]);
  const eligible=availableHeroes.filter(h=>isBaseJoinerEligible(h)&&!reserved.has(h.name));
  const candidates=chooseLeft(eligible,eligible.length,warSkillLevels,heroStarLevels,verifiedOnly);
  const used=new Set<string>(),results:Formation[]=[];
  for(const left of candidates){
    if(results.length>=count||used.has(left.name))continue;
    // Cage Joiners are LEFT-only recommendations by default. MIDDLE/RIGHT are intentionally left empty.\n    // This prevents neutral/support heroes from looking like additional Cage recommendations.\n    const middle = undefined, right = undefined;\n    used.add(left.name);
    const level=levelOf(left,warSkillLevels),base:Omit<Formation,"alerts"|"status">={id:`J${results.length+1}`,left,middle,right,robot:ownedRobots[results.length],leftSkillLevel:level,leftSkillPercent:left.leftSkillValues?.[level-1],troopText:"10,000 Bombers + 90,000 Shooters OR 100,000 Shooters"};
    results.push({...base,...validateFormation(base,"joiner")});
  }
  return results;
}
