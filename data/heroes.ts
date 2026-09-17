export type HeroClass = 'Shield' | 'Bomber' | 'Shooter';
export type Rarity = 'R' | 'SR' | 'SSR' | 'KOF';

export type Hero = {
  name: string;
  cls: HeroClass;
  season: number;
  rarity: Rarity;
  leftSkill?: string;
  leftValue?: number;
  leftTier?: 'top' | 'strong' | 'filler';
  leftSkillValues?: [number, number, number, number, number];
  leftSkillVerified?: boolean;
  cageAllowed: boolean;
  notes?: string;
};

// leftValue is a Cage JOINER priority weight, not a damage formula.
// leftSkillValues stores the actual Lv1-Lv5 percentage progression only where verified.
// Unknown progressions intentionally fall back to level-aware relative weighting instead of guessed percentages.
export const heroes: Hero[] = [
  { name:'Tyronn', cls:'Shield', season:0, rarity:'SSR', leftSkill:'+25% damage class', leftValue:92, leftTier:'top', cageAllowed:true },
  { name:'Phoenix', cls:'Shield', season:0, rarity:'SSR', leftSkill:'+25% damage class', leftValue:92, leftTier:'top', cageAllowed:true },
  { name:'Xuanming', cls:'Shield', season:0, rarity:'SSR', cageAllowed:true }, { name:'Marcus', cls:'Shield', season:0, rarity:'SSR', cageAllowed:true }, { name:'Caesar', cls:'Shield', season:0, rarity:'SSR', cageAllowed:true }, { name:'Zoltan', cls:'Shield', season:0, rarity:'SSR', cageAllowed:true }, { name:'Durga', cls:'Shield', season:0, rarity:'R', cageAllowed:true }, { name:'Harton', cls:'Shield', season:0, rarity:'R', cageAllowed:true }, { name:'Gerd', cls:'Shield', season:0, rarity:'SR', cageAllowed:true, notes:'Defense-oriented; not a priority LEFT hero.' }, { name:'Iwado', cls:'Shield', season:0, rarity:'SR', cageAllowed:true }, { name:'Vesaryon', cls:'Shield', season:0, rarity:'SR', cageAllowed:true },
  { name:'Omega Rugal', cls:'Shield', season:0, rarity:'KOF', cageAllowed:false, notes:'KOF hero — excluded from current Cage planning.' },
  { name:'Otto', cls:'Shield', season:6, rarity:'SSR', cageAllowed:true, notes:'S6. Defensive kit with +75% allied Tactical DMG at War Lv5.' },

  { name:'Lunarl', cls:'Bomber', season:0, rarity:'SR', leftSkill:'+25% damage class', leftValue:92, leftTier:'top', cageAllowed:true },
  { name:'Koschevoi', cls:'Bomber', season:0, rarity:'SSR', leftSkill:'+25% all troop DMG', leftValue:100, leftTier:'top', cageAllowed:true },
  { name:'Ryuichi', cls:'Bomber', season:0, rarity:'SSR', leftSkill:'+25% ATK/Crit class', leftValue:76, leftTier:'strong', cageAllowed:true },
  { name:'Vivian', cls:'Bomber', season:0, rarity:'SSR', leftSkill:'+25% ATK class', leftValue:72, leftTier:'strong', cageAllowed:true },
  { name:'Samir', cls:'Bomber', season:0, rarity:'SR', leftSkill:'Filler/Decent LEFT skill', leftValue:20, leftTier:'filler', cageAllowed:true },
  { name:'Flameborne', cls:'Bomber', season:0, rarity:'SR', leftSkill:'Filler/Decent LEFT skill', leftValue:20, leftTier:'filler', cageAllowed:true, notes:'Strong empirical Gorilla performer; Cage LEFT only as filler.' },
  { name:'Whisper', cls:'Bomber', season:0, rarity:'SSR', leftSkill:'Filler/Decent LEFT skill', leftValue:20, leftTier:'filler', cageAllowed:true }, { name:'Lee', cls:'Bomber', season:0, rarity:'SSR', leftSkill:'Filler/Decent LEFT skill', leftValue:20, leftTier:'filler', cageAllowed:true },
  { name:'Tormund', cls:'Bomber', season:0, rarity:'SSR', cageAllowed:true, notes:'Defense/control kit; not a Cage damage LEFT priority.' }, { name:'Alph', cls:'Bomber', season:0, rarity:'SSR', cageAllowed:true }, { name:'Lanchester', cls:'Bomber', season:0, rarity:'SSR', cageAllowed:true }, { name:'Pasino', cls:'Bomber', season:0, rarity:'R', cageAllowed:true }, { name:'Gimes', cls:'Bomber', season:0, rarity:'SR', cageAllowed:true }, { name:'Ekko', cls:'Bomber', season:0, rarity:'SR', cageAllowed:true },
  { name:'Terry Bogard', cls:'Bomber', season:0, rarity:'KOF', cageAllowed:false, notes:'KOF hero — excluded from current Cage planning.' },
  { name:'Worrell', cls:'Bomber', season:6, rarity:'SSR', leftSkill:'+25% Basic Attack DMG (all allied troops)', leftValue:98, leftTier:'top', leftSkillValues:[5,10,15,20,25], leftSkillVerified:true, cageAllowed:true, notes:'S6 priority target. Charged Launch progression verified.' },
  { name:'Wukong', cls:'Bomber', season:6, rarity:'SSR', cageAllowed:true, notes:'S6. +25% Bomber DMG and +25% all allied troop DMG at War Lv5.' },

  { name:'Veronica', cls:'Shooter', season:0, rarity:'SSR', leftSkill:'+25% damage class (proc/reliability caveat)', leftValue:82, leftTier:'top', cageAllowed:true },
  { name:'Lofili', cls:'Shooter', season:0, rarity:'SR', leftSkill:'+25% ATK class', leftValue:72, leftTier:'strong', cageAllowed:true },
  { name:'Ada', cls:'Shooter', season:0, rarity:'SSR', cageAllowed:true, notes:'Current main-leader Shooter.' }, { name:'Mireya', cls:'Shooter', season:0, rarity:'SSR', cageAllowed:true }, { name:'Drake', cls:'Shooter', season:0, rarity:'SSR', cageAllowed:true }, { name:'Edwin', cls:'Shooter', season:0, rarity:'SSR', cageAllowed:true, notes:'Judgment of Justice Lv5 on Server 260.' }, { name:'Sawyer', cls:'Shooter', season:0, rarity:'SSR', cageAllowed:true },
  { name:'Devilian', cls:'Shooter', season:0, rarity:'SSR', leftSkill:'Filler/Decent LEFT skill', leftValue:20, leftTier:'filler', cageAllowed:true }, { name:'Inata', cls:'Shooter', season:0, rarity:'SSR', cageAllowed:true }, { name:'Mia Scarlet Pyros', cls:'Shooter', season:0, rarity:'SSR', cageAllowed:true }, { name:'Aiksen', cls:'Shooter', season:0, rarity:'R', cageAllowed:true }, { name:'Flora', cls:'Shooter', season:0, rarity:'SR', cageAllowed:true }, { name:'Platos', cls:'Shooter', season:0, rarity:'SR', cageAllowed:true },
  { name:'Mai Shiranui', cls:'Shooter', season:0, rarity:'KOF', cageAllowed:false, notes:'KOF hero — excluded from current Cage planning.' },
  { name:'Kate', cls:'Shooter', season:6, rarity:'SSR', leftSkill:'+25% ATK (all allied troops)', leftValue:80, leftTier:'strong', leftSkillValues:[5,10,15,20,25], leftSkillVerified:true, cageAllowed:true, notes:'S6. Sprint Signal progression verified; also has a periodic all-troop DMG boost.' },
];

export const robots=['Musashimaru','Phantom Cat','Ranger','Infercore','Hercules α','Halo','Light Cone','Atlax','Yokozuna'];
export type Felon = { name: string; effect: string };
export const felons: Felon[]=[{name:'Scorpion',effect:'Yard Time: Troops ATK +45%'},{name:'Cobra',effect:'Yard Time: Troops Lethality +45%'},{name:'Rage Fist',effect:'Yard Time: Rally Capacity +90,000'},{name:'Devil',effect:'Yard Time: Expedition Capacity +9,000'}];
