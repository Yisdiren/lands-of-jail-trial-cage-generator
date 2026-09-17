"use client";

import { useEffect } from "react";

const heroIconNames = new Set([
  "Omega Rugal", "Terry Bogard", "Mai Shiranui", "Ada", "Ryuichi", "Edwin",
  "Koschevoi", "Mireya", "Marcus", "Whisper", "Drake", "Veronica", "Tyronn",
  "Xuanming", "Sawyer", "Tormund", "Mia Scarlet Pyros", "Phoenix", "Alph",
  "Zoltan", "Lunarl", "Lofili", "Vivian", "Lee", "Samir", "Gerd", "Durga",
  "Harton", "Pasino", "Aiksen", "Gimes", "Caesar", "Flameborne", "Devilian",
  "Iwado", "Inata", "Lanchester", "Vesaryon", "Ekko", "Flora", "Platos",
]);

const heroIconSlug = (name: string) =>
  name.toLowerCase().replace(/scarlet pyros/g, "scarlet-pyros").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function addHeroIcon(slot: HTMLElement) {
  if (slot.querySelector(".formation-hero-icon")) return;
  const nameElement = slot.querySelector("b");
  const name = nameElement?.textContent?.trim();
  if (!name || !heroIconNames.has(name) || !nameElement) return;
  const img = document.createElement("img");
  img.className = "formation-hero-icon";
  img.src = `/icons/${heroIconSlug(name)}.png`;
  img.alt = `${name} portrait`;
  img.width = 48;
  img.height = 60;
  nameElement.before(img);
}

function readHeroStars(name: string) {
  const select = document.querySelector<HTMLSelectElement>(`select[aria-label="${CSS.escape(name)} star level"]`);
  const value = Number(select?.value ?? 1);
  return Number.isFinite(value) ? Math.min(5, Math.max(1, value)) : 1;
}

function addFormationReason(card: HTMLElement) {
  if (card.querySelector(".formation-why")) return;
  const slots = card.querySelectorAll<HTMLElement>(".slot");
  if (slots.length < 3) return;
  const left = slots[0];
  const leftName = left.querySelector("b")?.textContent?.trim();
  const skill = left.querySelector("small")?.textContent?.trim();
  const levelText = left.querySelector("span")?.textContent?.match(/Lv\s*(\d+)/i)?.[1];
  if (!leftName) return;
  const stars = readHeroStars(leftName);
  const why = document.createElement("div");
  why.className = "formation-why";
  why.style.cssText = "margin-top:10px;padding:9px 11px;border-radius:8px;background:rgba(255,255,255,.045);font-size:12px;line-height:1.45";
  const title = document.createElement("b");
  title.textContent = "WHY THIS FORMATION";
  title.style.cssText = "display:block;margin-bottom:3px";
  const detail = document.createElement("span");
  detail.textContent = `LEFT priority: ${leftName} • ${skill || "active first War skill"} • War Skill Lv${levelText ?? "?"} • ${"★".repeat(stars)}. Middle/right are class-legal fillers chosen to preserve stronger LEFT-skill heroes for other marches.`;
  why.append(title, detail);
  card.querySelector(".slots")?.after(why);
}

type SavedProfile = {
  id?: string;
  playerName?: string;
  server?: string;
  role?: string;
  season?: number;
  ownedHeroes?: string[];
  heroStarLevels?: Record<string, number>;
  warSkillLevels?: Record<string, number>;
  ownedRobots?: string[];
  joinCount?: number;
  joinerCapacity?: number;
  leaderCapacity?: number;
};

function savedProfiles(): SavedProfile[] {
  try {
    const parsed = JSON.parse(localStorage.getItem("loj-member-profiles-v1") ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function addCcwMemberOverview() {
  if (document.querySelector(".ccw-member-overview")) return;
  const profiles = savedProfiles();
  if (!profiles.length) return;
  const activeId = localStorage.getItem("loj-active-profile-v1") ?? profiles[0]?.id;
  const host = document.querySelector<HTMLElement>("main") ?? document.body;
  const panel = document.createElement("section");
  panel.className = "panel ccw-member-overview";
  panel.style.cssText = "margin-bottom:18px";

  const title = document.createElement("div");
  title.className = "title";
  title.innerHTML = `<div><label>CCW MEMBER GENERATOR</label><h2>Alliance member profiles</h2><p style="margin:.35rem 0 0;opacity:.75">Select a saved CCW member, then generate formations from that member’s heroes, stars, War skills, troops and robots.</p></div>`;
  panel.append(title);

  const grid = document.createElement("div");
  grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-top:12px";
  profiles.forEach((profile) => {
    const button = document.createElement("button");
    button.type = "button";
    const active = profile.id === activeId;
    button.style.cssText = `text-align:left;padding:12px;border-radius:10px;border:1px solid ${active ? "currentColor" : "rgba(255,255,255,.12)"};background:${active ? "rgba(255,255,255,.09)" : "rgba(255,255,255,.035)"};cursor:pointer`;
    const heroCount = profile.ownedHeroes?.length ?? 0;
    const robotCount = profile.ownedRobots?.length ?? 0;
    const capacity = profile.role === "leader" ? profile.leaderCapacity : profile.joinerCapacity;
    button.innerHTML = `<b style="display:block;font-size:15px">${profile.playerName || "Unnamed member"}${active ? " • ACTIVE" : ""}</b><span style="display:block;margin-top:4px;font-size:12px;opacity:.78">Server ${profile.server || "?"} • S${profile.season ?? "?"} • ${(profile.role || "joiner").toUpperCase()}</span><span style="display:block;margin-top:3px;font-size:12px;opacity:.7">${heroCount} heroes • ${robotCount} robots • ${Number(capacity || 0).toLocaleString()} capacity</span>`;
    button.addEventListener("click", () => {
      if (!profile.id || profile.id === activeId) return;
      localStorage.setItem("loj-active-profile-v1", profile.id);
      window.location.reload();
    });
    grid.append(button);
  });
  panel.append(grid);

  const note = document.createElement("p");
  note.style.cssText = "margin:10px 0 0;font-size:12px;opacity:.72";
  note.textContent = "Use the existing member-profile controls below to add or update CCW members. Each saved member keeps an independent roster and generator setup.";
  panel.append(note);
  host.prepend(panel);
}

function enhanceGenerator() {
  document.querySelectorAll<HTMLElement>(".formation-card .slot").forEach(addHeroIcon);
  document.querySelectorAll<HTMLElement>(".formation-card").forEach(addFormationReason);
  document.querySelectorAll<HTMLElement>(".result > .slots > .slot").forEach(addHeroIcon);
  document.querySelectorAll<HTMLElement>(".results-panel").forEach((panel) => {
    panel.hidden = true;
    panel.setAttribute("aria-hidden", "true");
  });
  addCcwMemberOverview();
}

export default function FormationIconEnhancer() {
  useEffect(() => {
    enhanceGenerator();
    const observer = new MutationObserver(enhanceGenerator);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
