import type { Hero } from "../data/heroes";
import { validateFormation, type Formation, type WarSkillLevels } from "./generator";
import type { HeroStarLevels } from "./formation-generator";
export type Locks = Record<string,string>;
export const slots=["left","middle","right"] as const;
export function buildLockedFormations(pool:Hero[],count:number,locks:Locks,levels:WarSkillLevels,robots:string[],verified:boolean,leader:Formation|null,mode:"leader"|"joiner",stars:HeroStarLevels={}):Formation[]{
  const reserved=mode==="joiner"&&leader?new Set(slots.map(s=>leader[s].name)):new Set<string>();
  const allowed=pool.filter(h=>h.cageAllowed&&h.rarity!=="KOF"&&!reserved.has(h.name));
  const active=Object.entries(locks).filter(([key,name])=>name&&Number(key.split(":")[0])<count),names=active.map(([,name])=>name);
  if(new Set(names).size!==names.length)throw new Error("A hero cannot be locked into two slots.");
  for(const[,name]of active)if(!allowed.some(h=>h.name===name))throw new Error(name+" is unavailable, excluded, or reserved for the leader.");
  const used=new Set<string>(),output:Formation[]=[];
  for(let i=0;i<count;i++){
    const chosen:Hero[]=[];
    function search(pos:number):boolean{
      if(pos===3)return true;
      const key=i+":"+slots[pos],fixed=locks[key];
      const candidates=allowed.filter(h=>(!fixed||h.name===fixed)&&!used.has(h.name)&&!chosen.some(c=>c.name===h.name||c.cls===h.cls)&&(!names.includes(h.name)||h.name===fixed)&&(mode!=="joiner"||pos!==0||(h.leftSkill&&(!verified||h.leftSkillVerified))));
      candidates.sort((a,b)=>pos===0&&mode==="joiner"?(((b.leftTier==="top"?300:b.leftTier==="strong"?200:100)+(b.leftValue??0))*(levels[b.name]??5)+(stars[b.name]??1)*3)-(((a.leftTier==="top"?300:a.leftTier==="strong"?200:100)+(a.leftValue??0))*(levels[a.name]??5)+(stars[a.name]??1)*3):(stars[b.name]??1)-(stars[a.name]??1)||Number(!!a.leftSkill)-Number(!!b.leftSkill)||a.name.localeCompare(b.name));
      for(const h of candidates){chosen.push(h);if(search(pos+1))return true;chosen.pop()}return false;
    }
    if(!search(0)){if(active.some(([k])=>Number(k.split(":")[0])>=i))throw new Error("These locks cannot form legal marches. Change a lock or add eligible heroes.");break}
    chosen.forEach(h=>used.add(h.name));const level=levels[chosen[0].name]??5;
    const base={id:mode==="leader"?"MAIN":"J"+(i+1),left:chosen[0],middle:chosen[1],right:chosen[2],robot:robots[i],troopText:mode==="leader"?"Use your maximum available troops":"10,000 Bombers + 90,000 Shooters OR 100,000 Shooters",leftSkillLevel:level,leftSkillPercent:chosen[0].leftSkillValues?.[level-1]};
    output.push({...base,...validateFormation(base,mode)});
  }
  return output;
}
