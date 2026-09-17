"use client";

import { useEffect } from "react";
import { heroes } from "../data/heroes";
import { calculateTroopPlan, generateJoinerFormations, generateLeaderFormation, type TroopTiers, type TroopValues } from "../lib/generator";

const heroIconNames = new Set([
  "Omega Rugal", "Terry Bogard", "Mai Shiranui", "Ada", "Ryuichi", "Edwin", "Koschevoi", "Mireya", "Marcus", "Whisper", "Drake", "Veronica", "Tyronn", "Xuanming", "Sawyer", "Tormund", "Mia Scarlet Pyros", "Phoenix", "Alph", "Zoltan", "Lunarl", "Lofili", "Vivian", "Lee", "Samir", "Gerd", "Durga", "Harton", "Pasino", "Aiksen", "Gimes", "Caesar", "Flameborne", "Devilian", "Iwado", "Inata", "Lanchester", "Vesaryon", "Ekko", "Flora", "Platos",
]);
const heroIconSlug = (name: string) => name.toLowerCase().replace(/scarlet pyros/g, "scarlet-pyros").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function addHeroIcon(slot: HTMLElement) {
  if (slot.querySelector(".formation-hero-icon")) return;
  const nameElement = slot.querySelector("b");
  const name = nameElement?.textContent?.trim();
  if (!name || !heroIconNames.has(name) || !nameElement) return;
  const img = document.createElement("img"); img.className = "formation-hero-icon"; img.src = `/icons/${heroIconSlug(name)}.png`; img.alt = `${name} portrait`; img.width = 48; img.height = 60; nameElement.before(img);
}
function readHeroStars(name: string) {
  const select = document.querySelector<HTMLSelectElement>(`select[aria-label="${CSS.escape(name)} star level"]`);
  const value = Number(select?.value ?? 1); return Number.isFinite(value) ? Math.min(5, Math.max(1, value)) : 1;
}
function addFormationReason(card: HTMLElement) {
  if (card.querySelector(".formation-why")) return;
  const slots = card.querySelectorAll<HTMLElement>(".slot"); if (slots.length < 3) return;
  const left = slots[0]; const leftName = left.querySelector("b")?.textContent?.trim(); const skill = left.querySelector("small")?.textContent?.trim(); const levelText = left.querySelector("span")?.textContent?.match(/Lv\s*(\d+)/i)?.[1]; if (!leftName) return;
  const why = document.createElement("div"); why.className = "formation-why"; why.style.cssText = "margin-top:10px;padding:9px 11px;border-radius:8px;background:rgba(255,255,255,.045);font-size:12px;line-height:1.45";
  const title = document.createElement("b"); title.textContent = "WHY THIS FORMATION"; title.style.cssText = "display:block;margin-bottom:3px";
  const detail = document.createElement("span"); detail.textContent = `LEFT priority: ${leftName} • ${skill || "active first War skill"} • War Skill Lv${levelText ?? "?"} • ${"★".repeat(readHeroStars(leftName))}. Middle/right are class-legal fillers chosen to preserve stronger LEFT-skill heroes for other marches.`;
  why.append(title, detail); card.querySelector(".slots")?.after(why);
}

type SavedProfile = { id?: string; playerName?: string; server?: string; role?: string; season?: number; ownedHeroes?: string[]; heroStarLevels?: Record<string, number>; warSkillLevels?: Record<string, number>; ownedRobots?: string[]; joinCount?: number; joinerCapacity?: number; leaderCapacity?: number; joinerRatios?: TroopValues; leaderRatios?: TroopValues; troopTiers?: TroopTiers; availableTroops?: TroopValues; verifiedOnly?: boolean };
function savedProfiles(): SavedProfile[] { try { const parsed = JSON.parse(localStorage.getItem("loj-member-profiles-v1") ?? "[]"); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
const defaults = { ratios: { shield: 0, bomber: 0, shooter: 100 } as TroopValues, tiers: { shield: "T10", bomber: "T10", shooter: "T11" } as TroopTiers, available: { shield: 9999999, bomber: 9999999, shooter: 9999999 } as TroopValues };
function rosterFor(profile: SavedProfile) { const season = profile.season ?? 99; return heroes.filter(h => h.cageAllowed && h.season <= season && (profile.ownedHeroes ?? []).includes(h.name)); }
function bestLeft(profile: SavedProfile) {
  const roster = rosterFor(profile); const reserved = new Set(["Ada", "Ryuichi", "Tyronn"]); const eligible = roster.filter(h => h.leftSkill && !reserved.has(h.name));
  return eligible.sort((a,b) => { const tier=(h:typeof a)=>h.leftTier==="top"?300:h.leftTier==="strong"?200:h.leftTier==="filler"?100:0; const level=(h:typeof a)=>profile.warSkillLevels?.[h.name]??5; const stars=(h:typeof a)=>profile.heroStarLevels?.[h.name]??1; return (tier(b)+(b.leftValue??0))*(level(b)/5)+(stars(b)-1)*3-((tier(a)+(a.leftValue??0))*(level(a)/5)+(stars(a)-1)*3); })[0];
}
function readiness(profile: SavedProfile) {
  const roster = rosterFor(profile); const classes = new Set(roster.map(h=>h.cls)); const lefts = roster.filter(h=>h.leftSkill).length; const robots = profile.ownedRobots?.length ?? 0;
  const issues:string[]=[]; if(classes.size<3) issues.push("missing hero class"); if(lefts<1) issues.push("no LEFT skill hero"); if(robots<1) issues.push("no robot"); return { label: issues.length ? "NEEDS SETUP" : "READY", issues };
}
function switchMember(id?: string) { if(!id) return; localStorage.setItem("loj-active-profile-v1", id); window.location.reload(); }

function addCcwMemberOverview() {
  if (document.querySelector(".ccw-member-overview")) return;
  const profiles=savedProfiles(); if(!profiles.length)return; const activeId=localStorage.getItem("loj-active-profile-v1")??profiles[0]?.id; const host=document.querySelector<HTMLElement>("main")??document.body;
  const panel=document.createElement("section"); panel.className="panel ccw-member-overview"; panel.style.cssText="margin-bottom:18px";
  const title=document.createElement("div"); title.className="title"; title.innerHTML=`<div><label>CCW MEMBER GENERATOR</label><h2>Alliance member profiles</h2><p style="margin:.35rem 0 0;opacity:.75">Select a saved CCW member, then generate formations from that member’s actual roster.</p></div>`; panel.append(title);
  const grid=document.createElement("div"); grid.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-top:12px";
  profiles.forEach(profile=>{const button=document.createElement("button");button.type="button";const active=profile.id===activeId;button.style.cssText=`text-align:left;padding:12px;border-radius:10px;border:1px solid ${active?"currentColor":"rgba(255,255,255,.12)"};background:${active?"rgba(255,255,255,.09)":"rgba(255,255,255,.035)"};cursor:pointer`;button.innerHTML=`<b style="display:block;font-size:15px">${profile.playerName||"Unnamed member"}${active?" • ACTIVE":""}</b><span style="display:block;margin-top:4px;font-size:12px;opacity:.78">Server ${profile.server||"?"} • S${profile.season??"?"} • ${(profile.role||"joiner").toUpperCase()}</span><span style="display:block;margin-top:3px;font-size:12px;opacity:.7">${profile.ownedHeroes?.length??0} heroes • ${profile.ownedRobots?.length??0} robots</span>`;button.onclick=()=>profile.id!==activeId&&switchMember(profile.id);grid.append(button)}); panel.append(grid); host.prepend(panel);
}

function addBatchGenerator() {
  if(document.querySelector(".ccw-batch-generator"))return; const profiles=savedProfiles(); if(!profiles.length)return; const overview=document.querySelector<HTMLElement>(".ccw-member-overview"); if(!overview)return;
  const panel=document.createElement("section");panel.className="panel ccw-batch-generator";panel.style.cssText="margin-top:14px";panel.innerHTML=`<div class="title"><div><label>CCW ALLIANCE BATCH GENERATOR</label><h2>Whole-alliance formation overview</h2><p style="margin:.35rem 0 0;opacity:.75">Select members and build a quick Cage readiness + formation summary for everyone at once.</p></div></div>`;
  const controls=document.createElement("div");controls.style.cssText="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0";
  const selected=new Set(profiles.map(p=>p.id).filter(Boolean) as string[]);
  profiles.forEach(p=>{const label=document.createElement("label");label.style.cssText="display:flex;align-items:center;gap:6px;padding:7px 9px;border:1px solid rgba(255,255,255,.12);border-radius:8px;font-size:12px";const cb=document.createElement("input");cb.type="checkbox";cb.checked=true;cb.onchange=()=>{if(!p.id)return;cb.checked?selected.add(p.id):selected.delete(p.id)};label.append(cb,document.createTextNode(p.playerName||"Unnamed"));controls.append(label)});
  const run=document.createElement("button");run.type="button";run.textContent="GENERATE CCW OVERVIEW";run.style.cssText="padding:8px 12px;border-radius:8px;cursor:pointer;font-weight:700";controls.append(run);panel.append(controls);
  const results=document.createElement("div");results.className="ccw-batch-results";panel.append(results);
  run.onclick=()=>{results.replaceChildren();const chosen=profiles.filter(p=>p.id&&selected.has(p.id));if(!chosen.length){results.textContent="Select at least one CCW member.";return} const grid=document.createElement("div");grid.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:10px";
    chosen.forEach(p=>{const roster=rosterFor(p);const best=bestLeft(p);const ready=readiness(p);const role=p.role==="leader"?"leader":"joiner";const capacity=role==="leader"?(p.leaderCapacity??100000):(p.joinerCapacity??100000);const ratios=role==="leader"?(p.leaderRatios??defaults.ratios):(p.joinerRatios??defaults.ratios);const troopPlan=calculateTroopPlan({capacity,ratios,tiers:p.troopTiers??defaults.tiers,available:p.availableTroops??defaults.available}); let count=0; try { count=role==="leader"?(generateLeaderFormation(roster,troopPlan,p.ownedRobots??[])?1:0):generateJoinerFormations(roster,p.joinCount??6,troopPlan,p.warSkillLevels??{},p.ownedRobots??[],p.verifiedOnly??false).length; } catch { count=0; }
      const card=document.createElement("article");card.style.cssText="padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(255,255,255,.035)";const stars=best?(p.heroStarLevels?.[best.name]??1):0;const skillLv=best?(p.warSkillLevels?.[best.name]??5):0;card.innerHTML=`<b style="font-size:16px">${p.playerName||"Unnamed member"}</b><span style="float:right;font-size:11px;font-weight:700">${ready.label}</span><div style="margin-top:7px;font-size:12px;line-height:1.55;opacity:.82">Best LEFT: <b>${best?.name??"None"}</b>${best?` • ${"★".repeat(stars)} • War Lv${skillLv}`:""}<br>${role==="leader"?"Leader formation":"Joiner formations"}: <b>${count}</b>${role==="joiner"?` / ${p.joinCount??6}`:""}<br>Roster: ${roster.length} Cage heroes • ${p.ownedRobots?.length??0} robots${ready.issues.length?`<br>Check: ${ready.issues.join(", ")}`:""}</div>`;const open=document.createElement("button");open.type="button";open.textContent="OPEN MEMBER GENERATOR";open.style.cssText="margin-top:9px;padding:6px 8px;border-radius:7px;cursor:pointer;font-size:11px;font-weight:700";open.onclick=()=>switchMember(p.id);card.append(open);grid.append(card)});results.append(grid)};
  overview.after(panel);
}

function enhanceGenerator(){document.querySelectorAll<HTMLElement>(".formation-card .slot").forEach(addHeroIcon);document.querySelectorAll<HTMLElement>(".formation-card").forEach(addFormationReason);document.querySelectorAll<HTMLElement>(".result > .slots > .slot").forEach(addHeroIcon);document.querySelectorAll<HTMLElement>(".results-panel").forEach(p=>{p.hidden=true;p.setAttribute("aria-hidden","true")});addCcwMemberOverview();addBatchGenerator()}
export default function FormationIconEnhancer(){useEffect(()=>{enhanceGenerator();const observer=new MutationObserver(enhanceGenerator);observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect()},[]);return null}
