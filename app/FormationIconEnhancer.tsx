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
  name
    .toLowerCase()
    .replace(/scarlet pyros/g, "scarlet-pyros")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

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
  const select = document.querySelector<HTMLSelectElement>(
    `select[aria-label="${CSS.escape(name)} star level"]`,
  );
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
  why.style.marginTop = "10px";
  why.style.padding = "9px 11px";
  why.style.borderRadius = "8px";
  why.style.background = "rgba(255,255,255,0.045)";
  why.style.fontSize = "12px";
  why.style.lineHeight = "1.45";

  const title = document.createElement("b");
  title.textContent = "WHY THIS FORMATION";
  title.style.display = "block";
  title.style.marginBottom = "3px";

  const detail = document.createElement("span");
  const skillDetail = skill || "active first War skill";
  detail.textContent = `LEFT priority: ${leftName} • ${skillDetail} • War Skill Lv${levelText ?? "?"} • ${"★".repeat(stars)}. Middle/right are class-legal fillers chosen to preserve stronger LEFT-skill heroes for other marches.`;

  why.append(title, detail);
  const slotsContainer = card.querySelector(".slots");
  slotsContainer?.after(why);
}

function enhanceGenerator() {
  document
    .querySelectorAll<HTMLElement>(".formation-card .slot")
    .forEach(addHeroIcon);

  document
    .querySelectorAll<HTMLElement>(".formation-card")
    .forEach(addFormationReason);

  document
    .querySelectorAll<HTMLElement>(".result > .slots > .slot")
    .forEach(addHeroIcon);

  document.querySelectorAll<HTMLElement>(".results-panel").forEach((panel) => {
    panel.hidden = true;
    panel.setAttribute("aria-hidden", "true");
  });
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
