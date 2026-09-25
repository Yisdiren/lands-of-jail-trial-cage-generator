import type { Hero } from "../data/heroes";

export type SeasonTransitionHero = {
  name: string;
  cls: Hero["cls"];
  rarity: Hero["rarity"];
  role: "Joiner LEFT" | "Support / Main candidate" | "No Cage priority entered";
  skill: string;
  verified: boolean;
};

export function seasonTransitionHeroes(allHeroes: Hero[], season: number): SeasonTransitionHero[] {
  return allHeroes.filter(hero => hero.season === season && hero.cageAllowed).map(hero => ({
    name: hero.name,
    cls: hero.cls,
    rarity: hero.rarity,
    role: hero.leftSkill && (hero.leftTier || hero.leftValue !== undefined)
      ? "Joiner LEFT"
      : hero.leftSkill ? "Support / Main candidate" : "No Cage priority entered",
    skill: hero.leftSkill ?? "No LEFT skill data entered",
    verified: Boolean(hero.leftSkillVerified),
  }));
}

export function recommendationReason(hero: Hero, level=5): string {
  const safeLevel=Math.min(5,Math.max(1,level));
  const value=hero.leftSkillValues?.[safeLevel-1];
  const skill=hero.leftSkill ?? "No LEFT skill data entered";
  const evidence=hero.leftSkillVerified ? "verified" : "unverified progression";
  return value !== undefined ? `${skill} • Lv${safeLevel}: ${value}% • ${evidence}` : `${skill} • ${evidence}`;
}
