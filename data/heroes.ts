export type HeroClass = 'Shield' | 'Bomber' | 'Shooter';
export type Rarity = 'R' | 'SR' | 'SSR' | 'KOF';

export type Hero = {
  name: string;
  cls: HeroClass;
  season: number; // 0 = legacy/season not yet verified
  rarity: Rarity;
  leftSkill?: string;
  leftValue?: number;
  leftTier?: 'top' | 'strong' | 'filler';
  cageAllowed: boolean;
  notes?: string;
};

// leftValue is a deterministic Cage JOINER priority score, not a damage formula.
// It separates guaranteed all-troop DMG / Basic Attack DMG from ATK/Crit effects
// and lowers proc-dependent effects. Empirical Cage logs should eventually replace
// these rule-based priorities where enough controlled data exists.
export const heroes: Hero[] = [
  // Shieldbearers
  { name: 'Tyronn', cls: 'Shield', season: 0, rarity: 'SSR', leftSkill: '+25% damage class', leftValue: 92, leftTier: 'top', cageAllowed: true },
  { name: 'Phoenix', cls: 'Shield', season: 0, rarity: 'SSR', leftSkill: '+25% damage class', leftValue: 92, leftTier: 'top', cageAllowed: true },
  { name: 'Xuanming', cls: 'Shield', season: 0, rarity: 'SSR', cageAllowed: true },
  { name: 'Marcus', cls: 'Shield', season: 0, rarity: 'SSR', cageAllowed: true },
  { name: 'Caesar', cls: 'Shield', season: 0, rarity: 'SSR', cageAllowed: true },
  { name: 'Zoltan', cls: 'Shield', season: 0, rarity: 'SSR', cageAllowed: true },
  { name: 'Durga', cls: 'Shield', season: 0, rarity: 'R', cageAllowed: true },
  { name: 'Harton', cls: 'Shield', season: 0, rarity: 'R', cageAllowed: true },
  { name: 'Gerd', cls: 'Shield', season: 0, rarity: 'SR', cageAllowed: true, notes: 'Defense-oriented; not a priority LEFT hero.' },
  { name: 'Iwado', cls: 'Shield', season: 0, rarity: 'SR', cageAllowed: true },
  { name: 'Vesaryon', cls: 'Shield', season: 0, rarity: 'SR', cageAllowed: true },
  { name: 'Omega Rugal', cls: 'Shield', season: 0, rarity: 'KOF', cageAllowed: false, notes: 'KOF hero — excluded from current Cage planning.' },
  { name: 'Otto', cls: 'Shield', season: 6, rarity: 'SSR', cageAllowed: true, notes: 'S6. Defensive kit with +75% allied Tactical DMG at War Lv5.' },

  // Bombers
  { name: 'Lunarl', cls: 'Bomber', season: 0, rarity: 'SR', leftSkill: '+25% damage class', leftValue: 92, leftTier: 'top', cageAllowed: true },
  { name: 'Koschevoi', cls: 'Bomber', season: 0, rarity: 'SSR', leftSkill: '+25% all troop DMG', leftValue: 100, leftTier: 'top', cageAllowed: true },
  { name: 'Ryuichi', cls: 'Bomber', season: 0, rarity: 'SSR', leftSkill: '+25% ATK/Crit class', leftValue: 76, leftTier: 'strong', cageAllowed: true },
  { name: 'Vivian', cls: 'Bomber', season: 0, rarity: 'SSR', leftSkill: '+25% ATK class', leftValue: 72, leftTier: 'strong', cageAllowed: true },
  { name: 'Samir', cls: 'Bomber', season: 0, rarity: 'SR', leftSkill: 'Filler/Decent LEFT skill', leftValue: 20, leftTier: 'filler', cageAllowed: true },
  { name: 'Flameborne', cls: 'Bomber', season: 0, rarity: 'SR', leftSkill: 'Filler/Decent LEFT skill', leftValue: 20, leftTier: 'filler', cageAllowed: true, notes: 'Strong empirical Gorilla performer; Cage LEFT only as filler.' },
  { name: 'Whisper', cls: 'Bomber', season: 0, rarity: 'SSR', leftSkill: 'Filler/Decent LEFT skill', leftValue: 20, leftTier: 'filler', cageAllowed: true },
  { name: 'Lee', cls: 'Bomber', season: 0, rarity: 'SSR', leftSkill: 'Filler/Decent LEFT skill', leftValue: 20, leftTier: 'filler', cageAllowed: true },
  { name: 'Tormund', cls: 'Bomber', season: 0, rarity: 'SSR', cageAllowed: true, notes: 'Defense/control kit; not a Cage damage LEFT priority.' },
  { name: 'Alph', cls: 'Bomber', season: 0, rarity: 'SSR', cageAllowed: true },
  { name: 'Lanchester', cls: 'Bomber', season: 0, rarity: 'SSR', cageAllowed: true },
  { name: 'Pasino', cls: 'Bomber', season: 0, rarity: 'R', cageAllowed: true },
  { name: 'Gimes', cls: 'Bomber', season: 0, rarity: 'SR', cageAllowed: true },
  { name: 'Ekko', cls: 'Bomber', season: 0, rarity: 'SR', cageAllowed: true },
  { name: 'Terry Bogard', cls: 'Bomber', season: 0, rarity: 'KOF', cageAllowed: false, notes: 'KOF hero — excluded from current Cage planning.' },
  { name: 'Worrell', cls: 'Bomber', season: 6, rarity: 'SSR', leftSkill: '+25% Basic Attack DMG (all allied troops)', leftValue: 98, leftTier: 'top', cageAllowed: true, notes: 'S6 priority target.' },
  { name: 'Wukong', cls: 'Bomber', season: 6, rarity: 'SSR', cageAllowed: true, notes: 'S6. +25% Bomber DMG and +25% all allied troop DMG at War Lv5.' },

  // Shooters
  { name: 'Veronica', cls: 'Shooter', season: 0, rarity: 'SSR', leftSkill: '+25% damage class (proc/reliability caveat)', leftValue: 82, leftTier: 'top', cageAllowed: true },
  { name: 'Lofili', cls: 'Shooter', season: 0, rarity: 'SR', leftSkill: '+25% ATK class', leftValue: 72, leftTier: 'strong', cageAllowed: true },
  { name: 'Ada', cls: 'Shooter', season: 0, rarity: 'SSR', cageAllowed: true, notes: 'Current main-leader Shooter.' },
  { name: 'Mireya', cls: 'Shooter', season: 0, rarity: 'SSR', cageAllowed: true },
  { name: 'Drake', cls: 'Shooter', season: 0, rarity: 'SSR', cageAllowed: true },
  { name: 'Edwin', cls: 'Shooter', season: 0, rarity: 'SSR', cageAllowed: true, notes: 'Judgment of Justice Lv5 on Server 260.' },
  { name: 'Sawyer', cls: 'Shooter', season: 0, rarity: 'SSR', cageAllowed: true },
  { name: 'Devilian', cls: 'Shooter', season: 0, rarity: 'SSR', leftSkill: 'Filler/Decent LEFT skill', leftValue: 20, leftTier: 'filler', cageAllowed: true },
  { name: 'Inata', cls: 'Shooter', season: 0, rarity: 'SSR', cageAllowed: true },
  { name: 'Mia Scarlet Pyros', cls: 'Shooter', season: 0, rarity: 'SSR', cageAllowed: true },
  { name: 'Aiksen', cls: 'Shooter', season: 0, rarity: 'R', cageAllowed: true },
  { name: 'Flora', cls: 'Shooter', season: 0, rarity: 'SR', cageAllowed: true },
  { name: 'Platos', cls: 'Shooter', season: 0, rarity: 'SR', cageAllowed: true },
  { name: 'Mai Shiranui', cls: 'Shooter', season: 0, rarity: 'KOF', cageAllowed: false, notes: 'KOF hero — excluded from current Cage planning.' },
  { name: 'Kate', cls: 'Shooter', season: 6, rarity: 'SSR', leftSkill: '+25% ATK (all allied troops)', leftValue: 80, leftTier: 'strong', cageAllowed: true, notes: 'S6. Also has a periodic all-troop DMG boost.' },
];

export const robots = ['Musashimaru', 'Phantom Cat', 'Ranger', 'Infercore', 'Hercules α', 'Halo', 'Light Cone', 'Atlax', 'Yokozuna'];

export const felons = [
  { name: 'Scorpion', effect: 'Yard Time: Troops ATK +45%' },
  { name: 'Cobra', effect: 'Yard Time: Troops Lethality +45%' },
  { name: 'Rage Fist', effect: 'Yard Time: Rally Capacity +90,000' },
  { name: 'Devil', effect: 'Yard Time: Expedition Capacity +9,000' },
];
