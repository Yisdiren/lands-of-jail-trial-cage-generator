"use client";

import { useEffect } from "react";
import { heroes, robots } from "../data/heroes";
import { calculateTroopPlan, generateJoinerFormations, generateLeaderFormation, type Formation, type TroopTiers, type TroopValues } from "../lib/generator";

const heroIconNames=new Set(["Omega Rugal","Terry Bogard","Mai Shiranui","Ada","Ryuichi","Edwin","Koschevoi","Mireya","Marcus","Whisper","Drake","Veronica","Tyronn","Xuanming","Sawyer","Tormund","Mia Scarlet Pyros","Phoenix","Alph","Zoltan","Lunarl","Lofili","Vivian","Lee","Samir","Gerd","Durga","Harton","Pasino","Aiksen","Gimes","Caesar","Flameborne","Devilian","Iwado","Inata","Lanchester","Vesaryon","Ekko","Flora","Platos"]);
const heroIconSlug=(name:string)=>name.toLowerCase().replace(/scarlet pyros/g,"scarlet-pyros").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
function addHeroIcon(slot:HTMLElement){if(slot.querySelector(".formation-hero-icon"))return;const el=slot.querySelector("b"),name=el?.textContent?.trim();if(!name||!heroIconNames.has(name)||!el)return;const img=document.createElement("img");img.className="formation-hero-icon";img.src=`/icons/${heroIconSlug(name)}.png`;img.alt=`${name} portrait`;img.width=48;img.height=60;el.before(img)}
function readHeroStars(name:string){const s=document.querySelector<HTMLSelectElement>(`select[aria-label="${CSS.escape(name)} star level"]`),v=Number(s?.value??1);return Number.isFinite(v)?Math.min(5,Math.max(1,v)):1}
function addFormationReason(card:HTMLElement){if(card.querySelector(".formation-why"))return;const slots=card.querySelectorAll<HTMLElement>(".slot");if(slots.length<3)return;const left=slots[0],name=left.querySelector("b")?.textContent?.trim(),skill=left.querySelector("small")?.textContent?.trim(),lv=left.querySelector("span")?.textContent?.match(/Lv\s*(\d+)/i)?.[1];if(!name)return;const isMain=/MAIN/i.test(card.querySelector(".formation-head b")?.textContent??"");const why=document.createElement("div");why.className="formation-why";why.style.cssText="margin-top:10px;padding:9px 11px;border-radius:8px;background:rgba(255,255,255,.045);font-size:12px;line-height:1.45";why.innerHTML=isMain?`<b style="display:block;margin-bottom:3px">WHY THIS MAIN RALLY</b><span>Uses your full saved Main Rally march capacity. Preferred meta is the strongest owned Tyronn/Phoenix/Xuanming Shieldbearer with Ryuichi and Ada when available; legal owned fallbacks are used when needed.</span>`:`<b style="display:block;margin-bottom:3px">WHY THIS JOINER</b><span>LEFT priority: ${name} • ${skill||"active first War skill"} • War Skill Lv${lv??"?"} • ${"★".repeat(readHeroStars(name))}. This joiner uses 100,000 troops; supporting slots preserve stronger LEFT-skill heroes for other marches.</span>`;card.querySelector(".slots")?.after(why)}

type SavedProfile={id?:string;playerName?:string;server?:string;role?:string;season?:number;ownedHeroes?:string[];heroStarLevels?:Record<string,number>;warSkillLevels?:Record<string,number>;ownedRobots?:string[];joinCount?:number;joinerCapacity?:number;leaderCapacity?:number;joinerRatios?:TroopValues;leaderRatios?:TroopValues;troopTiers?:TroopTiers;availableTroops?:TroopValues;troopPreset?:string;verifiedOnly?:boolean;updatedAt?:number};
function savedProfiles():SavedProfile[]{try{const p=JSON.parse(localStorage.getItem("loj-member-profiles-v1")??"[]");return Array.isArray(p)?p:[]}catch{return[]}}
const defaults={ratios:{shield:0,bomber:0,shooter:100}as TroopValues,tiers:{shield:"T10",bomber:"T10",shooter:"T10"}as TroopTiers,available:{shield:9999999,bomber:9999999,shooter:9999999}as TroopValues};
function rosterFor(p:SavedProfile){const season=p.season??99;return heroes.filter(h=>h.cageAllowed&&h.rarity!=="KOF"&&(h.season===0||h.season<=season)&&(p.ownedHeroes??[]).includes(h.name))}
function planFor(p:SavedProfile){const leader=p.role==="leader",capacity=leader?(p.leaderCapacity??100000):100000,ratios=leader?(p.leaderRatios??defaults.ratios):(p.joinerRatios??defaults.ratios);return calculateTroopPlan({capacity,ratios,tiers:p.troopTiers??defaults.tiers,available:p.availableTroops??defaults.available})}
function formationsFor(p:SavedProfile):Formation[]{const roster=rosterFor(p),plan=planFor(p),stars=p.heroStarLevels??{},war=p.warSkillLevels??{},robots=p.ownedRobots??[];try{const leader=generateLeaderFormation(roster,plan,robots,stars);if(p.role==="leader")return leader?[leader]:[];return generateJoinerFormations(roster,p.joinCount??6,plan,war,robots,p.verifiedOnly??false,stars)}catch{return[]}}
function bestLeft(p:SavedProfile){const fs=formationsFor(p);return fs[0]?.left??rosterFor(p).filter(h=>h.leftSkill).sort((a,b)=>(b.leftValue??0)-(a.leftValue??0))[0]}
function readiness(p:SavedProfile){
  const r=rosterFor(p),classes=new Set(r.map(h=>h.cls)),lefts=r.filter(h=>h.leftSkill),robots=p.ownedRobots?.length??0,issues:string[]=[];
  const wanted=p.role==="leader"?1:(p.joinCount??6),neededHeroes=wanted*3;
  if(classes.size<3)issues.push("missing one or more hero classes");
  if(r.length<neededHeroes)issues.push(`need ${neededHeroes-r.length} more eligible hero${neededHeroes-r.length===1?"":"es"} for ${wanted} march${wanted===1?"":"es"}`);
  if(p.role!=="leader"&&lefts.length<wanted)issues.push(`only ${lefts.length} LEFT-skill heroes for ${wanted} joiner marches`);
  if(robots<wanted)issues.push(`only ${robots} robot${robots===1?"":"s"} for ${wanted} march${wanted===1?"":"es"}`);
  const lowWar=lefts.filter(h=>(p.warSkillLevels?.[h.name]??1)<5).length;if(lowWar)issues.push(`${lowWar} LEFT War skill${lowWar===1?"":"s"} below Lv5`);
  const troops=p.availableTroops??{shield:0,bomber:0,shooter:0},plan=planFor(p);(["shield","bomber","shooter"] as const).forEach(k=>{const need=plan.counts[k]*wanted;if(troops[k]<need)issues.push(`${k==="shield"?"Shieldbearer":k[0].toUpperCase()+k.slice(1)} inventory is ${(need-troops[k]).toLocaleString()} short for all marches`)});
  return{label:issues.length?"CHECK SETUP":"READY",issues}
}
function formationConflicts(p:SavedProfile,fs:Formation[]){
  const issues:string[]=[],heroSeen=new Set<string>(),robotSeen=new Set<string>();
  fs.forEach((f,i)=>{const id=p.role==="leader"?"Leader":`J${i+1}`,hs=[f.left,f.middle,f.right];
    if(new Set(hs.map(h=>h.cls)).size<3)issues.push(`${id}: duplicate hero class`);
    hs.forEach(h=>{if(heroSeen.has(h.name))issues.push(`${id}: ${h.name} reused`);heroSeen.add(h.name);if(!(p.ownedHeroes??[]).includes(h.name))issues.push(`${id}: ${h.name} not owned`)});
    if(f.robot){if(robotSeen.has(f.robot))issues.push(`${id}: robot ${f.robot} reused`);robotSeen.add(f.robot);if(!(p.ownedRobots??[]).includes(f.robot))issues.push(`${id}: robot ${f.robot} not owned`)}
  });
  const wanted=p.role==="leader"?1:(p.joinCount??6);if(fs.length<wanted)issues.push(`generated ${fs.length} of ${wanted} requested marches`);
  return [...new Set(issues)];
}
function switchMember(id?:string){if(!id)return;localStorage.setItem("loj-active-profile-v1",id);window.location.reload()}
async function copyText(text:string,button:HTMLButtonElement){try{await navigator.clipboard.writeText(text);const old=button.textContent;button.textContent="COPIED ✓";setTimeout(()=>button.textContent=old,1600)}catch{button.textContent="COPY FAILED"}}
function formationShareText(p:SavedProfile,fs:Formation[]){const name=p.playerName||"Player",lines=[`${name} — Lands of Jail Trial Cage`];fs.forEach((f,i)=>{const lv=f.leftSkillLevel??p.warSkillLevels?.[f.left.name]??5,stars=p.heroStarLevels?.[f.left.name]??1;lines.push(`${p.role==="leader"?"Leader":`J${i+1}`}: ${f.left.name} ★${stars} War Lv${lv} | ${f.middle.name} | ${f.right.name}${f.robot?` | Robot: ${f.robot}`:""}`)});lines.push(`Troops: ${planFor(p).text}`);return lines.join("\n")}
function addCurrentFormationCopy(){const result=document.querySelector<HTMLElement>(".formation-list")?.closest<HTMLElement>(".result");if(!result||result.querySelector(".copy-formations"))return;const ps=savedProfiles(),activeId=localStorage.getItem("loj-active-profile-v1"),p=ps.find(x=>x.id===activeId)??ps[0];if(!p)return;const btn=document.createElement("button");btn.type="button";btn.className="copy-formations";btn.textContent="COPY FORMATIONS";btn.style.cssText="margin:10px 0;padding:8px 12px;border-radius:8px;cursor:pointer;font-weight:700";btn.onclick=()=>{const fs=formationsFor(p);if(fs.length)copyText(formationShareText(p,fs),btn)};result.querySelector(".result-title")?.after(btn)}
function addMemberOverview(){if(document.querySelector(".member-overview"))return;const ps=savedProfiles();if(!ps.length)return;const activeId=localStorage.getItem("loj-active-profile-v1")??ps[0]?.id,host=document.querySelector<HTMLElement>("main")??document.body,panel=document.createElement("section");panel.className="panel member-overview";panel.style.cssText="margin-bottom:18px";panel.innerHTML=`<div class="title"><div><label>MEMBER GENERATOR</label><h2>Player profiles</h2><p style="margin:.35rem 0 0;opacity:.75">Select any saved player from any server and generate formations from that player’s actual roster.</p></div></div>`;const grid=document.createElement("div");grid.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-top:12px";ps.forEach(p=>{const b=document.createElement("button"),active=p.id===activeId;b.type="button";b.style.cssText=`text-align:left;padding:12px;border-radius:10px;border:1px solid ${active?"currentColor":"rgba(255,255,255,.12)"};background:${active?"rgba(255,255,255,.09)":"rgba(255,255,255,.035)"};cursor:pointer`;b.innerHTML=`<b style="display:block;font-size:15px">${p.playerName||"Unnamed player"}${active?" • ACTIVE":""}</b><span style="display:block;margin-top:4px;font-size:12px;opacity:.78">Server ${p.server||"?"} • S${p.season??"?"} • ${(p.role||"joiner").toUpperCase()}</span><span style="display:block;margin-top:3px;font-size:12px;opacity:.7">${p.ownedHeroes?.length??0} heroes • ${p.ownedRobots?.length??0} robots</span>`;b.onclick=()=>p.id!==activeId&&switchMember(p.id);grid.append(b)});panel.append(grid);host.prepend(panel)}
function addBatchGenerator(){if(document.querySelector(".alliance-batch-generator"))return;const ps=savedProfiles(),overview=document.querySelector<HTMLElement>(".member-overview");if(!ps.length||!overview)return;const panel=document.createElement("section");panel.className="panel alliance-batch-generator";panel.style.cssText="margin-top:14px";panel.innerHTML=`<div class="title"><div><label>ALLIANCE BATCH GENERATOR</label><h2>Group formation overview</h2><p style="margin:.35rem 0 0;opacity:.75">Works with any alliance or server. Each player is calculated independently from their saved heroes, stars, War skills, robots and troops.</p></div></div>`;const controls=document.createElement("div");controls.style.cssText="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0";const selected=new Set(ps.map(p=>p.id).filter(Boolean)as string[]);ps.forEach(p=>{const l=document.createElement("label");l.style.cssText="display:flex;align-items:center;gap:6px;padding:7px 9px;border:1px solid rgba(255,255,255,.12);border-radius:8px;font-size:12px";const c=document.createElement("input");c.type="checkbox";c.checked=true;c.onchange=()=>{if(p.id)c.checked?selected.add(p.id):selected.delete(p.id)};l.append(c,document.createTextNode(p.playerName||"Unnamed"));controls.append(l)});const run=document.createElement("button");run.type="button";run.textContent="GENERATE ALLIANCE OVERVIEW";run.style.cssText="padding:8px 12px;border-radius:8px;cursor:pointer;font-weight:700";controls.append(run);panel.append(controls);const results=document.createElement("div");panel.append(results);run.onclick=()=>{results.replaceChildren();const chosen=ps.filter(p=>p.id&&selected.has(p.id));if(!chosen.length){results.textContent="Select at least one player.";return}const generated=chosen.map(p=>({p,fs:formationsFor(p)}));const copy=document.createElement("button");copy.type="button";copy.textContent="COPY ALL FORMATIONS";copy.style.cssText="margin-bottom:10px;padding:8px 12px;border-radius:8px;cursor:pointer;font-weight:700";copy.onclick=()=>copyText(generated.map(({p,fs})=>formationShareText(p,fs)).join("\n\n"),copy);results.append(copy);const grid=document.createElement("div");grid.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:10px";generated.forEach(({p,fs})=>{const best=bestLeft(p),ready=readiness(p),conflicts=formationConflicts(p,fs),card=document.createElement("article"),stars=best?(p.heroStarLevels?.[best.name]??1):0,lv=best?(p.warSkillLevels?.[best.name]??5):0;card.style.cssText="padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(255,255,255,.035)";card.innerHTML=`<b style="font-size:16px">${p.playerName||"Unnamed player"}</b><span style="float:right;font-size:11px;font-weight:700">${ready.label}</span><div style="margin-top:7px;font-size:12px;line-height:1.55;opacity:.82">Best LEFT: <b>${best?.name??"None"}</b>${best?` • ${"★".repeat(stars)} • War Lv${lv}`:""}<br>${p.role==="leader"?"Leader formation":"Joiner formations"}: <b>${fs.length}</b>${p.role!=="leader"?` / ${p.joinCount??6}`:""}<br>Roster: ${rosterFor(p).length} Cage heroes • ${p.ownedRobots?.length??0} robots${ready.issues.length?`<br>Readiness: ${ready.issues.join(", ")}`:""}${conflicts.length?`<br>Formation check: ${conflicts.join(", ")}`:""}</div>`;const copyOne=document.createElement("button");copyOne.type="button";copyOne.textContent="COPY PLAYER";copyOne.style.cssText="margin-top:9px;margin-right:6px;padding:6px 8px;border-radius:7px;cursor:pointer;font-size:11px;font-weight:700";copyOne.onclick=()=>copyText(formationShareText(p,fs),copyOne);const open=document.createElement("button");open.type="button";open.textContent="OPEN PLAYER";open.style.cssText="margin-top:9px;padding:6px 8px;border-radius:7px;cursor:pointer;font-size:11px;font-weight:700";open.onclick=()=>switchMember(p.id);card.append(copyOne,open);grid.append(card)});results.append(grid)};overview.after(panel)}

function addSetupWizard(){
  if(document.querySelector(".loj-setup-wizard"))return;
  const ps=savedProfiles();
  if(!ps.length)return;
  const activeId=localStorage.getItem("loj-active-profile-v1")??ps[0]?.id;
  const index=ps.findIndex(p=>p.id===activeId);
  if(index<0)return;
  const p=ps[index];
  const onboardingKey=`loj-onboarding-v034:${p.id??"player"}`;
  const looksNew=(p.playerName==="New Player"||!p.playerName)&&!(p.ownedHeroes?.length)&&!(p.ownedRobots?.length)&&!p.server;
  if(!looksNew||localStorage.getItem(onboardingKey)==="complete")return;

  let step=0;
  const draft={
    playerName:p.playerName&&p.playerName!=="New Player"?p.playerName:"",
    server:p.server??"",
    season:p.season??6,
    role:p.role==="leader"?"leader":"joiner",
    capacity:p.role==="leader"?(p.leaderCapacity??100000):(p.joinerCapacity??100000),
    joinCount:p.joinCount??6,
  };

  const overlay=document.createElement("div");
  overlay.className="loj-setup-wizard";
  overlay.style.cssText="position:fixed;inset:0;z-index:99999;background:rgba(5,8,14,.88);backdrop-filter:blur(7px);display:grid;place-items:center;padding:20px";
  const card=document.createElement("div");
  card.style.cssText="width:min(620px,100%);max-height:90vh;overflow:auto;border:1px solid rgba(255,255,255,.15);border-radius:16px;background:#111722;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.5)";
  overlay.append(card);document.body.append(overlay);

  const field=(label:string,value:string,type="text")=>`<label style="display:grid;gap:6px;margin:14px 0;font-size:13px"><span style="opacity:.78">${label}</span><input data-wizard-field="${label}" type="${type}" value="${value.replace(/"/g,"&quot;")}" style="width:100%;padding:11px;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:inherit"></label>`;
  const actions=()=>`<div style="display:flex;gap:8px;justify-content:space-between;margin-top:20px"><button data-wizard-back type="button" style="padding:9px 13px;border-radius:8px;cursor:pointer">${step?"BACK":"SKIP FOR NOW"}</button><button data-wizard-next type="button" style="padding:9px 13px;border-radius:8px;cursor:pointer;font-weight:800">${step===3?"FINISH SETUP":"NEXT"}</button></div>`;

  const render=()=>{
    const progress=`<div style="font-size:12px;opacity:.65;margin-bottom:6px">SETUP ${step+1} OF 4</div>`;
    if(step===0)card.innerHTML=`${progress}<h2 style="margin:.2rem 0">Welcome to the Trial Cage Generator</h2><p style="opacity:.76;line-height:1.5">We’ll set up the basics first. You can change everything later.</p>${field("Player name",draft.playerName)}${field("Server",draft.server)}${actions()}`;
    if(step===1)card.innerHTML=`${progress}<h2 style="margin:.2rem 0">Season and role</h2><p style="opacity:.76;line-height:1.5">Your season controls which heroes are available. Choose how you normally use Trial Cage.</p><label style="display:grid;gap:6px;margin:14px 0;font-size:13px"><span style="opacity:.78">Season</span><select data-wizard-season style="padding:11px;border-radius:8px;background:#18202d;color:inherit"><option value="1">Season 1</option><option value="2">Season 2</option><option value="3">Season 3</option><option value="4">Season 4</option><option value="5">Season 5</option><option value="6">Season 6</option><option value="7">Season 7</option></select></label><label style="display:grid;gap:6px;margin:14px 0;font-size:13px"><span style="opacity:.78">Role</span><select data-wizard-role style="padding:11px;border-radius:8px;background:#18202d;color:inherit"><option value="joiner">Rally Joiner</option><option value="leader">Rally Leader</option></select></label>${actions()}`;
    if(step===2)card.innerHTML=`${progress}<h2 style="margin:.2rem 0">March setup</h2><p style="opacity:.76;line-height:1.5">Enter your normal march capacity. Joiners can also choose how many marches they want generated.</p>${field("March capacity",String(draft.capacity),"number")}<label data-join-count-wrap style="display:${draft.role==="leader"?"none":"grid"};gap:6px;margin:14px 0;font-size:13px"><span style="opacity:.78">Joiner marches</span><input data-wizard-joins type="number" min="1" max="10" value="${draft.joinCount}" style="width:100%;padding:11px;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:inherit"></label>${actions()}`;
    if(step===3)card.innerHTML=`${progress}<h2 style="margin:.2rem 0">Next: build your roster</h2><p style="opacity:.76;line-height:1.55">After this setup, choose the heroes, ★ levels, War-skill levels, robots and troop tiers you actually own. The generator will then build formations from your real account.</p><div style="margin:16px 0;padding:13px;border-radius:10px;background:rgba(255,255,255,.05);line-height:1.6;font-size:13px"><b>${draft.playerName||"Player"}</b><br>Server ${draft.server||"not set"} • Season ${draft.season} • ${draft.role==="leader"?"Rally Leader":"Rally Joiner"}<br>March capacity: ${Number(draft.capacity).toLocaleString()}${draft.role==="joiner"?` • ${draft.joinCount} marches`:""}</div>${actions()}`;

    (card.querySelector('[data-wizard-season]') as HTMLSelectElement|null)?.setAttribute("value",String(draft.season));
    const seasonEl=card.querySelector('[data-wizard-season]') as HTMLSelectElement|null;if(seasonEl)seasonEl.value=String(draft.season);
    const roleEl=card.querySelector('[data-wizard-role]') as HTMLSelectElement|null;if(roleEl)roleEl.value=draft.role;

    card.querySelector<HTMLButtonElement>("[data-wizard-back]")!.onclick=()=>{if(step===0){localStorage.setItem(onboardingKey,"complete");overlay.remove();return}capture();step--;render()};
    card.querySelector<HTMLButtonElement>("[data-wizard-next]")!.onclick=()=>{capture();if(step<3){step++;render();return}finish()};
  };

  const capture=()=>{
    const name=card.querySelector<HTMLInputElement>('[data-wizard-field="Player name"]');if(name)draft.playerName=name.value.trim();
    const server=card.querySelector<HTMLInputElement>('[data-wizard-field="Server"]');if(server)draft.server=server.value.trim();
    const season=card.querySelector<HTMLSelectElement>("[data-wizard-season]");if(season)draft.season=Number(season.value)||6;
    const role=card.querySelector<HTMLSelectElement>("[data-wizard-role]");if(role)draft.role=role.value==="leader"?"leader":"joiner";
    const capacity=card.querySelector<HTMLInputElement>('[data-wizard-field="March capacity"]');if(capacity)draft.capacity=Math.max(1,Number(capacity.value)||100000);
    const joins=card.querySelector<HTMLInputElement>("[data-wizard-joins]");if(joins)draft.joinCount=Math.min(10,Math.max(1,Number(joins.value)||6));
  };

  const finish=()=>{
    ps[index]={...p,playerName:draft.playerName||"Player",server:draft.server,season:draft.season,role:draft.role,joinerCapacity:draft.role==="joiner"?draft.capacity:(p.joinerCapacity??100000),leaderCapacity:draft.role==="leader"?draft.capacity:(p.leaderCapacity??100000),joinCount:draft.joinCount,updatedAt:Date.now()};
    localStorage.setItem("loj-member-profiles-v1",JSON.stringify(ps));
    localStorage.setItem(onboardingKey,"complete");
    sessionStorage.setItem("loj-guide-roster","1");
    window.location.reload();
  };
  render();
}

function normalizeHeroImportName(value:string){return value.toLowerCase().replace(/sumo tyrant\s*\/\s*/g,"").replace(/[^a-z0-9]/g,"")}
function importHeroText(text:string,available:typeof heroes,selected:Set<string>,stars:Record<string,number>){
  const aliases=new Map<string,string>();available.forEach(h=>{aliases.set(normalizeHeroImportName(h.name),h.name);h.name.split("/").forEach(n=>aliases.set(normalizeHeroImportName(n),h.name))});
  aliases.set(normalizeHeroImportName("Sumo Tyrant"),"Iwado");aliases.set(normalizeHeroImportName("Sumo Tyrant / Iwado"),"Iwado");
  const matched:string[]=[],unmatched:string[]=[];
  text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).forEach(line=>{
    const starMatch=line.match(/[★☆]?\s*([1-5])(?:\s*(?:star|stars))?/i),star=starMatch?Number(starMatch[1]):undefined;
    const prefix=line.replace(/[★☆]\s*[1-5].*$/i,"").replace(/\s+(?:SSR|SR|R)\s*$/i,"").trim();
    const candidates=[prefix,...prefix.split(/\s{2,}|\t/),...prefix.split("/")].map(x=>normalizeHeroImportName(x)).filter(Boolean);
    let name:string|undefined;for(const key of candidates){name=aliases.get(key);if(name)break}
    if(!name){for(const [key,val] of aliases){if(candidates.some(x=>x.startsWith(key)||key.startsWith(x))){name=val;break}}}
    if(name){selected.add(name);if(star)stars[name]=star;matched.push(name)}else unmatched.push(line);
  });
  return{matched:[...new Set(matched)],unmatched};
}
function guideRosterAfterWizard(){
  if(sessionStorage.getItem("loj-guide-roster")!=="1")return;
  sessionStorage.removeItem("loj-guide-roster");
  const ps=savedProfiles(),activeId=localStorage.getItem("loj-active-profile-v1")??ps[0]?.id,index=ps.findIndex(p=>p.id===activeId);
  if(index<0||document.querySelector(".loj-roster-wizard"))return;
  const p=ps[index],available=heroes.filter(h=>h.cageAllowed&&h.rarity!=="KOF"&&(h.season===0||h.season<=(p.season??99)));
  const selected=new Set(p.ownedHeroes??[]),stars={...(p.heroStarLevels??{})},war={...(p.warSkillLevels??{})};
  let step=0;
  const overlay=document.createElement("div");overlay.className="loj-roster-wizard";overlay.style.cssText="position:fixed;inset:0;z-index:100000;background:rgba(5,8,14,.9);backdrop-filter:blur(7px);display:grid;place-items:center;padding:20px";
  const card=document.createElement("div");card.style.cssText="width:min(850px,100%);max-height:90vh;overflow:auto;border:1px solid rgba(255,255,255,.15);border-radius:16px;background:#111722;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.5)";overlay.append(card);document.body.append(overlay);
  const save=()=>{ps[index]={...p,ownedHeroes:[...selected],heroStarLevels:stars,warSkillLevels:war,updatedAt:Date.now()};localStorage.setItem("loj-member-profiles-v1",JSON.stringify(ps));localStorage.setItem(`loj-roster-onboarding-v035:${p.id??"player"}`,"complete");sessionStorage.setItem("loj-guide-troops","1");window.location.reload()};
  const render=()=>{
    if(step===0){
      card.innerHTML=`<div style="font-size:12px;opacity:.65">ROSTER SETUP 1 OF 2</div><h2>Choose your heroes</h2><p style="opacity:.76">Showing Cage-eligible heroes through Season ${p.season??"?"}. Select every hero you actually own.</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0"><button data-all type="button">SELECT ALL</button><button data-none type="button">CLEAR ALL</button><button data-import type="button">IMPORT HERO LIST</button><b style="margin-left:auto">${selected.size} selected</b></div><div data-importer hidden style="margin:10px 0;padding:12px;border:1px solid rgba(213,164,58,.45);border-radius:8px;background:rgba(0,0,0,.22)"><b>Import hero list</b><p style="font-size:12px;opacity:.75">Paste your roster or choose a .txt file. Hero names and ★1–★5 are detected automatically. Existing heroes are kept unless you choose Replace.</p><input data-file type="file" accept=".txt,text/plain" style="margin-bottom:8px"><textarea data-import-text rows="8" placeholder="Tyronn  SSR  ★4&#10;Phoenix  SSR  ★5" style="width:100%;box-sizing:border-box;padding:9px"></textarea><div style="display:flex;gap:8px;margin-top:8px"><button data-merge type="button">MERGE IMPORT</button><button data-replace type="button">REPLACE ROSTER</button></div><div data-import-status style="font-size:12px;margin-top:8px"></div></div><div data-grid style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px"></div><div style="display:flex;justify-content:space-between;margin-top:18px"><button data-skip type="button">SKIP</button><button data-next type="button" style="font-weight:800">NEXT: ★ & WAR SKILLS</button></div>`;
      const grid=card.querySelector<HTMLElement>("[data-grid]")!;
      available.forEach(h=>{const label=document.createElement("label");label.style.cssText="display:flex;align-items:center;gap:8px;padding:9px;border:1px solid rgba(255,255,255,.12);border-radius:8px;font-size:12px";const cb=document.createElement("input");cb.type="checkbox";cb.checked=selected.has(h.name);cb.onchange=()=>{cb.checked?selected.add(h.name):selected.delete(h.name);render()};label.append(cb,document.createTextNode(`${h.name} • ${h.cls}`));grid.append(label)});
      card.querySelector<HTMLButtonElement>("[data-all]")!.onclick=()=>{available.forEach(h=>selected.add(h.name));render()};card.querySelector<HTMLButtonElement>("[data-none]")!.onclick=()=>{selected.clear();render()};
      const importer=card.querySelector<HTMLElement>("[data-importer]")!,ta=card.querySelector<HTMLTextAreaElement>("[data-import-text]")!,status=card.querySelector<HTMLElement>("[data-import-status]")!;
      card.querySelector<HTMLButtonElement>("[data-import]")!.onclick=()=>{importer.hidden=!importer.hidden};
      card.querySelector<HTMLInputElement>("[data-file]")!.onchange=async e=>{const file=(e.currentTarget as HTMLInputElement).files?.[0];if(file)ta.value=await file.text()};
      const runImport=(replace:boolean)=>{if(replace)selected.clear();const result=importHeroText(ta.value,available,selected,stars);status.textContent=result.matched.length?`Imported ${result.matched.length} hero${result.matched.length===1?"":"es"}${result.unmatched.length?`; ${result.unmatched.length} line${result.unmatched.length===1?"":"s"} not recognized: ${result.unmatched.slice(0,4).join(" | ")}`:"."}`:"No heroes recognized. Check the pasted names.";if(result.matched.length)setTimeout(render,1400)};
      card.querySelector<HTMLButtonElement>("[data-merge]")!.onclick=()=>runImport(false);card.querySelector<HTMLButtonElement>("[data-replace]")!.onclick=()=>runImport(true);
      card.querySelector<HTMLButtonElement>("[data-skip]")!.onclick=save;card.querySelector<HTMLButtonElement>("[data-next]")!.onclick=()=>{step=1;render()};
    }else{
      const owned=available.filter(h=>selected.has(h.name));
      card.innerHTML=`<div style="font-size:12px;opacity:.65">ROSTER SETUP 2 OF 2</div><h2>Set ★ and War skills</h2><p style="opacity:.76">Set each hero’s current star level. Heroes with a first War skill also get a War-skill level.</p><div data-levels style="display:grid;gap:8px"></div><div style="display:flex;justify-content:space-between;margin-top:18px"><button data-back type="button">BACK</button><button data-save type="button" style="font-weight:800">SAVE ROSTER</button></div>`;
      const host=card.querySelector<HTMLElement>("[data-levels]")!;
      owned.forEach(h=>{const row=document.createElement("div");row.style.cssText="display:grid;grid-template-columns:minmax(150px,1fr) 120px 140px;gap:8px;align-items:center;padding:9px;border:1px solid rgba(255,255,255,.1);border-radius:8px";row.innerHTML=`<b style="font-size:12px">${h.name}</b><label style="font-size:11px">★ <select data-star="${h.name}" style="padding:6px;background:#18202d;color:inherit">${[1,2,3,4,5].map(n=>`<option value="${n}" ${(stars[h.name]??1)===n?"selected":""}>${n}</option>`).join("")}</select></label>${h.leftSkill?`<label style="font-size:11px">War Lv <select data-war="${h.name}" style="padding:6px;background:#18202d;color:inherit">${[1,2,3,4,5].map(n=>`<option value="${n}" ${(war[h.name]??1)===n?"selected":""}>${n}</option>`).join("")}</select></label>`:"<span></span>"}`;host.append(row)});
      host.querySelectorAll<HTMLSelectElement>("[data-star]").forEach(el=>el.onchange=()=>stars[el.dataset.star!]=Number(el.value));host.querySelectorAll<HTMLSelectElement>("[data-war]").forEach(el=>el.onchange=()=>war[el.dataset.war!]=Number(el.value));card.querySelector<HTMLButtonElement>("[data-back]")!.onclick=()=>{step=0;render()};card.querySelector<HTMLButtonElement>("[data-save]")!.onclick=save;
    }
  };render();
}

function guideTroopsAfterRoster(){
  if(sessionStorage.getItem("loj-guide-troops")!=="1")return;
  sessionStorage.removeItem("loj-guide-troops");
  const ps=savedProfiles(),activeId=localStorage.getItem("loj-active-profile-v1")??ps[0]?.id,index=ps.findIndex(p=>p.id===activeId);
  if(index<0||document.querySelector(".loj-troop-wizard"))return;
  const p=ps[index],selectedRobots=new Set(p.ownedRobots??[]);
  const tiers={...(p.troopTiers??defaults.tiers)},available={...(p.availableTroops??{shield:0,bomber:0,shooter:0})};
  const overlay=document.createElement("div");overlay.className="loj-troop-wizard";overlay.style.cssText="position:fixed;inset:0;z-index:100000;background:rgba(5,8,14,.9);backdrop-filter:blur(7px);display:grid;place-items:center;padding:20px";
  const card=document.createElement("div");card.style.cssText="width:min(720px,100%);max-height:90vh;overflow:auto;border:1px solid rgba(255,255,255,.15);border-radius:16px;background:#111722;padding:24px";overlay.append(card);document.body.append(overlay);
  card.innerHTML=`<div style="font-size:12px;opacity:.65">ACCOUNT SETUP — FINAL STEP</div><h2>Robots and troops</h2><p style="opacity:.76">Choose the robots you own, then enter your troop tiers and available counts. These values help prevent impossible formations.</p><h3>Robots</h3><div data-robots style="display:flex;flex-wrap:wrap;gap:8px"></div><h3 style="margin-top:18px">Troops</h3><div data-troops style="display:grid;gap:8px"></div><div style="display:flex;justify-content:space-between;margin-top:20px"><button data-skip type="button">SKIP</button><button data-save type="button" style="font-weight:800">SAVE & OPEN GENERATOR</button></div>`;
  const robotHost=card.querySelector<HTMLElement>("[data-robots]")!;robots.forEach(r=>{const l=document.createElement("label");l.style.cssText="padding:8px;border:1px solid rgba(255,255,255,.12);border-radius:8px;font-size:12px";const cb=document.createElement("input");cb.type="checkbox";cb.checked=selectedRobots.has(r);cb.onchange=()=>cb.checked?selectedRobots.add(r):selectedRobots.delete(r);l.append(cb,document.createTextNode(" "+r));robotHost.append(l)});
  const troopHost=card.querySelector<HTMLElement>("[data-troops]")!;(["shield","bomber","shooter"] as const).forEach(k=>{const row=document.createElement("div");row.style.cssText="display:grid;grid-template-columns:120px 120px 1fr;gap:8px;align-items:center";const label=k==="shield"?"Shieldbearer":k[0].toUpperCase()+k.slice(1);row.innerHTML=`<b>${label}</b><select data-tier="${k}" style="padding:8px;background:#18202d;color:inherit">${Array.from({length:11},(_,i)=>`<option value="T${i+1}" ${tiers[k]===`T${i+1}`?"selected":""}>T${i+1}</option>`).join("")}</select><input data-count="${k}" type="number" min="0" value="${available[k]??0}" placeholder="Available troops" style="padding:8px;border-radius:7px;background:rgba(255,255,255,.05);color:inherit;border:1px solid rgba(255,255,255,.12)">`;troopHost.append(row)});
  const save=()=>{card.querySelectorAll<HTMLSelectElement>("[data-tier]").forEach(el=>tiers[el.dataset.tier as keyof TroopTiers]=el.value as TroopTiers[keyof TroopTiers]);card.querySelectorAll<HTMLInputElement>("[data-count]").forEach(el=>available[el.dataset.count as keyof TroopValues]=Math.max(0,Number(el.value)||0));ps[index]={...p,ownedRobots:[...selectedRobots],troopTiers:tiers,availableTroops:available,updatedAt:Date.now()};localStorage.setItem("loj-member-profiles-v1",JSON.stringify(ps));localStorage.setItem(`loj-account-onboarding-v036:${p.id??"player"}`,"complete");window.location.reload()};
  card.querySelector<HTMLButtonElement>("[data-save]")!.onclick=save;card.querySelector<HTMLButtonElement>("[data-skip]")!.onclick=()=>{localStorage.setItem(`loj-account-onboarding-v036:${p.id??"player"}`,"complete");overlay.remove()};
}

function syncBetaBadge(){const badge=document.querySelector<HTMLElement>(".badge");if(badge)badge.textContent="BETA v0.48"}
let enhanceQueued=false;
function enhanceGenerator(){syncBetaBadge();document.querySelectorAll<HTMLElement>(".formation-card .slot").forEach(addHeroIcon);document.querySelectorAll<HTMLElement>(".formation-card").forEach(addFormationReason);document.querySelectorAll<HTMLElement>(".result > .slots > .slot").forEach(addHeroIcon);addMemberOverview();addBatchGenerator();addCurrentFormationCopy();addSetupWizard()}
function queueEnhance(){if(enhanceQueued)return;enhanceQueued=true;requestAnimationFrame(()=>{enhanceQueued=false;enhanceGenerator()})}
export default function FormationIconEnhancer(){useEffect(()=>{enhanceGenerator();guideRosterAfterWizard();guideTroopsAfterRoster();const observer=new MutationObserver(mutations=>{if(mutations.some(m=>Array.from(m.addedNodes).some(n=>n.nodeType===Node.ELEMENT_NODE)))queueEnhance()});observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect()},[]);return null}
