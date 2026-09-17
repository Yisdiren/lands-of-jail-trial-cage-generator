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

function addFormationIcons() {
  document.querySelectorAll<HTMLElement>(".formation-card .slot").forEach((slot) => {
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
  });
}

export default function FormationIconEnhancer() {
  useEffect(() => {
    addFormationIcons();
    const observer = new MutationObserver(addFormationIcons);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
