import { test } from "node:test";
import assert from "node:assert/strict";
import { heroes, robots } from "../data/heroes";
import { generateJoinerFormations, generateLeaderFormation } from "../lib/generator";
import { buildLockedFormations } from "../lib/formation-locks";
import { normalizeRobotPriority, normalizeSimpleSetup, normalizeStars, parseHeroListText, parseStoredSimpleSetup } from "../lib/simple-setup";
import { cageBuffs, buffEffectLabel, prisonerArmorSetting, powerArmorBreakthroughLabel } from "../lib/cage-buffs";
import { normalizeGeneratorBackup } from "../lib/generator-backup";
import { extraUiText, languageOptions, uiText } from "../data/ui-text";

test("one displayed Main reserves its heroes and robot from six Joiners", () => {
  const pool = heroes.filter(hero => hero.season <= 6 && hero.cageAllowed);
  const leader = generateLeaderFormation(pool, robots);
  assert.ok(leader);
  const joiners = generateJoinerFormations(pool, 6, {}, robots, false, {}, leader);
  const all = [leader, ...joiners];
  const names = all.flatMap(formation => [formation.left.name, formation.middle.name, formation.right.name]);
  assert.equal(new Set(names).size, names.length);
  const assignedRobots = all.map(formation => formation.robot).filter(Boolean);
  assert.equal(new Set(assignedRobots).size, assignedRobots.length);
  assert.ok(joiners.length > 0);
});

test("Joiners reserve pinned Main heroes rather than a separately calculated Main", () => {
  const pool = heroes.filter(hero => hero.season <= 6 && hero.cageAllowed);
  const pinned = buildLockedFormations(pool, 1, { "0:left": "Phoenix" }, {}, [], false, null, "leader", { Phoenix: 3 })[0];
  assert.equal(pinned.left.name, "Phoenix");
  const joiners = generateJoinerFormations(pool, 6, {}, [], false, {}, pinned);
  assert.ok(joiners.every(formation => ![formation.left, formation.middle, formation.right].some(hero => hero.name === "Phoenix")));
});

test("a partial roster returns only legal, non-repeating Joiners", () => {
  const pool = heroes.filter(hero => ["Tyronn", "Ryuichi", "Ada", "Phoenix", "Worrell", "Kate"].includes(hero.name));
  const leader = generateLeaderFormation(pool, [], { Tyronn: 3 });
  assert.ok(leader);
  const joiners = generateJoinerFormations(pool, 6, {}, [], false, {}, leader);
  assert.equal(joiners.length, 1);
  assert.deepEqual(new Set([joiners[0].left.cls, joiners[0].middle.cls, joiners[0].right.cls]).size, 3);
});

test("saved and imported stars reject corrupt values and unknown heroes", () => {
  assert.deepEqual(normalizeStars({ Tyronn: 4, Ada: Infinity, Kate: 9, Worrell: "5", Unknown: 3 }), { Tyronn: 4 });
  const saved = normalizeSimpleSetup({ season: 6, joinCount: 99, owned: ["Tyronn", "Tyronn", "Unknown"], heroStarLevels: { Tyronn: 5, Ada: -1 } });
  assert.equal(saved.joinCount, 6);
  assert.deepEqual(saved.owned, ["Tyronn"]);
  assert.deepEqual(saved.heroStarLevels, { Tyronn: 5 });
});


test("Season 5 visible roster can build Main plus six Joiners with SR Shield fallbacks", () => {
  const visibleSr = new Set(["Lofili", "Lunarl", "Flameborne", "Samir", "Gerd", "Iwado", "Vesaryon"]);
  const pool = heroes.filter(hero =>
    hero.season <= 5 &&
    hero.cageAllowed &&
    hero.rarity !== "R" &&
    hero.rarity !== "KOF" &&
    (hero.rarity !== "SR" || visibleSr.has(hero.name))
  );
  const leader = generateLeaderFormation(pool);
  assert.ok(leader);
  const joiners = generateJoinerFormations(pool, 6, {}, [], false, {}, leader);
  assert.equal(joiners.length, 6);
  const allNames = [leader, ...joiners].flatMap(formation => [formation.left.name, formation.middle.name, formation.right.name]);
  assert.equal(new Set(allNames).size, allNames.length);
  assert.ok(joiners.some(formation => [formation.middle.name, formation.right.name].some(name => ["Gerd", "Iwado", "Vesaryon"].includes(name))));
});


test("SR Shield fallbacks survive saved quick-setup restore", () => {
  const saved = normalizeSimpleSetup({
    season: 5,
    joinCount: 6,
    owned: ["Gerd", "Iwado", "Vesaryon"],
    heroStarLevels: { Gerd: 5, Iwado: 4, Vesaryon: 5 },
  });
  assert.deepEqual(saved.owned, ["Gerd", "Iwado", "Vesaryon"]);
  assert.deepEqual(saved.heroStarLevels, { Gerd: 5, Iwado: 4, Vesaryon: 5 });
});


test("Main Shield requires three stars and prefers eligible Tyronn", () => {
  const pool = heroes.filter(h => ["Tyronn", "Phoenix", "Xuanming", "Ada", "Ryuichi"].includes(h.name));
  const shield = (stars: Record<string, number>, available = pool) => generateLeaderFormation(available, [], stars)?.right.name;
  assert.equal(shield({ Tyronn: 2, Phoenix: 3, Xuanming: 2 }), "Phoenix");
  assert.equal(shield({ Tyronn: 1, Phoenix: 2, Xuanming: 3 }), "Xuanming");
  assert.equal(shield({ Phoenix: 3 }, pool.filter(h => h.name !== "Tyronn")), "Phoenix");
  assert.equal(shield({ Tyronn: 3, Phoenix: 5, Xuanming: 5 }), "Tyronn");
  assert.equal(shield({ Tyronn: 2, Phoenix: 2, Xuanming: 2 }), undefined);
  assert.equal(shield({}), undefined);
  for (const name of ["Tyronn", "Phoenix", "Xuanming"]) {
    assert.throws(() => buildLockedFormations(pool, 1, { "0:right": name }, {}, [], false, null, "leader", { [name]: 2 }), /at least 3 stars/);
    assert.equal(buildLockedFormations(pool, 1, { "0:right": name }, {}, [], false, null, "leader", { [name]: 3 })[0].right.name, name);
  }
});


test("verified Xuanming first War skill remains usable without inventing a priority tier", () => {
  const pool = heroes.filter(h => ["Xuanming", "Ada", "Alph"].includes(h.name));
  const joiners = generateJoinerFormations(pool, 1, { Xuanming: 4 }, [], true, { Xuanming: 3 }, null);
  assert.equal(joiners.length, 1);
  assert.notEqual(joiners[0].left.name, "Xuanming", "verified evidence alone must not invent a priority promotion");
  const xuanmingOnly = buildLockedFormations(pool, 1, { "0:left": "Xuanming" }, { Xuanming: 4 }, [], true, null, "joiner", { Xuanming: 3 });
  assert.equal(xuanmingOnly[0].left.name, "Xuanming");
  assert.equal(xuanmingOnly[0].leftSkillPercent, 20);
  assert.match(xuanmingOnly[0].left.leftSkill!, /Lethality/);
});


test("Season 5 full visible roster builds Main plus six legal Joiners across star scenarios", () => {
  const visibleSr = new Set(["Lofili", "Lunarl", "Flameborne", "Samir", "Gerd", "Iwado", "Vesaryon"]);
  const pool = heroes.filter(hero => hero.season <= 5 && hero.cageAllowed && hero.rarity !== "R" && hero.rarity !== "KOF" && (hero.rarity !== "SR" || visibleSr.has(hero.name)));
  for (let stars = 1; stars <= 5; stars++) {
    const levels = Object.fromEntries(pool.map(hero => [hero.name, stars]));
    levels.Tyronn = 3;
    const leader = generateLeaderFormation(pool, [], levels);
    assert.ok(leader);
    const joiners = generateJoinerFormations(pool, 6, {}, [], false, levels, leader);
    assert.equal(joiners.length, 6);
    const all = [leader, ...joiners];
    const names = all.flatMap(f => [f.left.name, f.middle.name, f.right.name]);
    assert.equal(new Set(names).size, names.length);
    for (const formation of all) assert.equal(new Set([formation.left.cls, formation.middle.cls, formation.right.cls]).size, 3);
  }
});

test("Season 5 six-Joiner generation excludes KOF and R heroes from Joiners", () => {
  const pool = heroes.filter(hero => hero.season <= 5 && hero.cageAllowed);
  const stars = Object.fromEntries(pool.map(hero => [hero.name, 5]));
  const leader = generateLeaderFormation(pool, [], stars);
  assert.ok(leader);
  const joiners = generateJoinerFormations(pool, 6, {}, [], false, stars, leader);
  assert.equal(joiners.length, 6);
  const used = [leader, ...joiners].flatMap(f => [f.left, f.middle, f.right]);
  assert.equal(new Set(used.map(h => h.name)).size, used.length);
  assert.ok(joiners.flatMap(f => [f.left, f.middle, f.right]).every(h => h.rarity !== "KOF" && h.rarity !== "R"));
});


test("all pre-S6 non-R Cage heroes with recorded LEFT skills have verified progressions", () => {
  const recorded = heroes.filter(hero => hero.season <= 5 && hero.cageAllowed && hero.rarity !== "R" && hero.leftSkill);
  assert.ok(recorded.length > 0);
  for (const hero of recorded) {
    assert.equal(hero.leftSkillVerified, true, `${hero.name} LEFT skill should be evidence-verified`);
    assert.equal(hero.leftSkillValues?.length, 5, `${hero.name} should have Lv1-Lv5 LEFT values`);
  }
});

test("defensive and utility LEFT heroes are not accidentally promoted into Cage priority tiers", () => {
  const neutral = ["Marcus", "Caesar", "Zoltan", "Gerd", "Vesaryon", "Whisper", "Platos"];
  for (const name of neutral) {
    const hero = heroes.find(candidate => candidate.name === name);
    assert.ok(hero, `${name} should exist`);
    assert.equal(hero.leftTier, undefined, `${name} should remain neutral until Cage evidence supports promotion`);
    assert.equal(hero.leftValue, undefined, `${name} should not receive a heuristic Cage priority weight`);
  }
});


test("Main Rally keeps documented class priorities across representative rosters", () => {
  const pick = (names: string[], stars: Record<string, number> = {}) =>
    generateLeaderFormation(heroes.filter(hero => names.includes(hero.name)), [], stars);
  const preferred = pick(["Tyronn","Phoenix","Xuanming","Ryuichi","Vivian","Ada","Veronica"], { Tyronn:3, Phoenix:5, Xuanming:5 });
  assert.ok(preferred); assert.equal(preferred.right.name,"Tyronn"); assert.equal(preferred.middle.name,"Ryuichi"); assert.equal(preferred.left.name,"Ada");
  const fallback = pick(["Phoenix","Xuanming","Vivian","Veronica"], { Phoenix:3, Xuanming:5 });
  assert.ok(fallback); assert.equal(fallback.right.name,"Xuanming"); assert.equal(fallback.middle.name,"Vivian"); assert.equal(fallback.left.name,"Veronica");
});

for (const season of [1,2,3,4,5,6,7]) {
  test(`Season ${season} generation never duplicates heroes or violates classes`, () => {
    const pool = heroes.filter(hero => (hero.season === 0 || hero.season <= season) && hero.cageAllowed && hero.rarity !== "R" && hero.rarity !== "KOF");
    const stars = Object.fromEntries(pool.map(hero => [hero.name,5]));
    const leader = generateLeaderFormation(pool, [], stars);
    if (!leader) return;
    const joiners = generateJoinerFormations(pool, 6, {}, [], false, stars, leader);
    const all = [leader,...joiners], names = all.flatMap(f=>[f.left.name,f.middle.name,f.right.name]);
    assert.equal(new Set(names).size,names.length);
    for (const formation of all) assert.deepEqual(new Set([formation.left.cls,formation.middle.cls,formation.right.cls]).size,3);
    assert.ok(joiners.flatMap(f=>[f.left,f.middle,f.right]).every(hero=>hero.rarity!=="KOF"&&hero.rarity!=="R"));
  });
}

test("hero database integrity is internally consistent", () => {
  const names = heroes.map(hero=>hero.name);
  assert.equal(new Set(names).size,names.length,"hero names must be unique");
  for (const hero of heroes) {
    assert.ok(["Shield","Bomber","Shooter"].includes(hero.cls), `${hero.name} has an invalid class`);
    assert.ok(Number.isInteger(hero.season) && hero.season >= 0 && hero.season <= 7, `${hero.name} has an invalid season`);
    if (hero.leftSkillValues) {
      assert.equal(hero.leftSkillValues.length,5,`${hero.name} LEFT progression must contain Lv1-Lv5`);
      assert.ok(hero.leftSkillValues.every(value=>Number.isFinite(value)&&value>=0), `${hero.name} LEFT progression contains an invalid value`);
    }
    if (hero.leftSkillVerified) assert.ok(hero.leftSkill && hero.leftSkillValues, `${hero.name} verified LEFT data must include skill text and values`);
    if (hero.rarity==="KOF") assert.equal(hero.cageAllowed,false,`${hero.name} KOF must stay excluded from normal Cage planning`);
  }
});

test("untested future-season data stays evidence-first", () => {
  const s6 = heroes.filter(hero=>hero.season===6);
  const s7 = heroes.filter(hero=>hero.season===7);
  assert.ok(s6.every(hero=>!hero.leftSkill || hero.leftSkillVerified), "S6 LEFT data must not be added as unverified guesses");
  assert.ok(s7.every(hero=>!hero.leftSkill || hero.leftSkillVerified), "S7 LEFT data must not be added as unverified guesses");
  const promotedS7=s7.filter(hero=>hero.leftTier);
  assert.ok(promotedS7.every(hero=>hero.evidenceNote && hero.priorityNote), "promoted S7 heroes need evidence and an explicit heuristic/testing caveat");
});


test("Bastion Shockwave Crush is not offered as a Cage buff", () => {
  assert.ok(robots.includes("Bastion"));
  assert.equal(cageBuffs.some(buff => buff.id === "shockwave-crush"), false);
});

test("Pluto is available without inventing a Cage buff", () => {
  assert.ok(robots.includes("Pluto"));
  assert.equal(cageBuffs.some(buff => buff.armorRobot === "Pluto"), false);
});

test("Season 6 full visible roster builds Main plus six legal Joiners", () => {
  const visibleSr=new Set(["Lofili","Lunarl","Flameborne","Samir","Gerd","Iwado","Vesaryon"]);
  const pool=heroes.filter(h=>(h.season===0||h.season<=6)&&h.cageAllowed&&h.rarity!=="R"&&h.rarity!=="KOF"&&(h.rarity!=="SR"||visibleSr.has(h.name)));
  const stars=Object.fromEntries(pool.map(h=>[h.name,5])); const leader=generateLeaderFormation(pool,robots,stars); assert.ok(leader);
  const joiners=generateJoinerFormations(pool,6,{},robots,false,stars,leader); assert.equal(joiners.length,6);
  const all=[leader,...joiners], names=all.flatMap(x=>[x.left.name,x.middle.name,x.right.name]);
  assert.equal(new Set(names).size,names.length); for(const x of all) assert.equal(new Set([x.left.cls,x.middle.cls,x.right.cls]).size,3);
});

test("robot roster is unique and includes the screenshot-verified roster", () => {
  const expected = ["Musashimaru","Phantom Cat","Ranger","Infercore","Hercules α","Halo","Light Cone","Atlax","Yokozuna","Bastion","Pluto"];
  assert.equal(new Set(robots).size, robots.length, "robot names must be unique");
  for (const name of expected) assert.ok(robots.includes(name), `${name} must remain in the robot roster`);
});

test("Cage Power Armor list excludes verified non-Cage utility skills", () => {
  const ids = new Set(cageBuffs.map(buff => buff.id));
  for (const id of ["shockwave-crush","multidimensional","emergency-shelter"]) {
    assert.equal(ids.has(id), false, `${id} must not appear as a Cage pre-buff`);
  }
});

test("robot order keeps the established Cage priority ahead of unranked Pluto", () => {
  const established = ["Musashimaru","Phantom Cat","Ranger","Infercore","Hercules α","Halo","Light Cone","Atlax","Yokozuna","Bastion"];
  assert.deepEqual(robots.slice(0, established.length), established);
  assert.equal(robots.at(-1), "Pluto");
});

test("saved setup normalization rejects impossible values and unknown heroes", () => {
  const saved = normalizeSimpleSetup({ season: 99, joinCount: -4, owned: ["Tyronn","Tyronn","Definitely Not A Hero"], heroStarLevels: { Tyronn: 3, Ada: 9, Unknown: 5 } });
  assert.equal(saved.season, 7);
  assert.equal(saved.joinCount, 1);
  assert.deepEqual(saved.owned, ["Tyronn"]);
  assert.deepEqual(saved.heroStarLevels, { Tyronn: 3 });
});

test("robot backup priority is de-duplicated, sanitized and completed", () => {
  const normalized = normalizeRobotPriority(["Pluto","Pluto","Not A Robot","Musashimaru"], robots);
  assert.equal(normalized[0], "Pluto");
  assert.equal(normalized[1], "Musashimaru");
  assert.equal(new Set(normalized).size, robots.length);
  assert.deepEqual(new Set(normalized), new Set(robots));
});

test("fresh setup defaults to Season 6", () => {
  assert.equal(normalizeSimpleSetup(undefined).season, 6);
  assert.equal(normalizeSimpleSetup({ season: "bad" }).season, 6);
});

test("Season 1 through Season 6 always produce legal non-repeating formations", () => {
  for (let season = 1; season <= 6; season++) {
    const pool = heroes.filter(hero => hero.season <= season && hero.cageAllowed);
    const leader = generateLeaderFormation(pool, robots);
    assert.ok(leader, `Season ${season} should produce a Main Rally`);
    const joiners = generateJoinerFormations(pool, 6, {}, robots, false, {}, leader);
    const formations = [leader, ...joiners];
    const names = formations.flatMap(f => [f.left.name, f.middle.name, f.right.name]);
    assert.equal(new Set(names).size, names.length, `Season ${season} should not reuse heroes`);
    for (const f of formations) assert.notEqual(f.status, "blocked", `Season ${season} formation ${f.id} should be legal`);
  }
});

test("corrupted local setup recovers to the Season 6 default", () => {
  assert.deepEqual(parseStoredSimpleSetup("{broken"), { setup: normalizeSimpleSetup(undefined), recovered: true });
  assert.equal(parseStoredSimpleSetup(JSON.stringify({ season: 4, joinCount: 2 })).setup.season, 4);
});

test("backup restore sanitizes corrupt fields and preserves version 1 compatibility", () => {
  const restored = normalizeGeneratorBackup({
    format: "loj-trial-cage-backup", version: 1, season: 99, joinCount: 0,
    owned: ["Tyronn", "Tyronn", "Unknown"], heroStarLevels: { Tyronn: 5, Ada: 9 },
    ownedRobots: ["Bastion", "Unknown"], robotPriority: ["Pluto", "Pluto", "Unknown"],
    ownedFelons: ["Scorpion", "Unknown"], selectedBuffIds: ["troops-atk-2h", "unknown"],
    armorSettings: { "overload-charge": { level: 999, value: -50 }, unknown: { level: 5, value: 5 } },
    activationLeadMinutes: 999,
  });
  assert.equal(restored.season, 7);
  assert.equal(restored.joinCount, 1);
  assert.deepEqual(restored.owned, ["Tyronn"]);
  assert.deepEqual(restored.heroStarLevels, { Tyronn: 5 });
  assert.deepEqual(restored.ownedRobots, ["Bastion"]);
  assert.deepEqual(restored.ownedFelons, ["Scorpion"]);
  assert.deepEqual(restored.selectedBuffIds, ["troops-atk-2h"]);
  assert.equal(restored.armorSettings["overload-charge"].level, 10);
  assert.equal(restored.activationLeadMinutes, 120);
  assert.throws(() => normalizeGeneratorBackup({ format: "loj-trial-cage-backup", version: 2 }), /not supported/);
});

test("all 15 language catalogs expose every public UI key with non-empty fallback text", () => {
  assert.equal(languageOptions.length, 15);
  assert.equal(new Set(languageOptions.map(item => item.code)).size, 15);
  for (const catalog of [uiText, extraUiText]) {
    const expected = Object.keys(catalog.en).sort();
    for (const { code } of languageOptions) {
      assert.deepEqual(Object.keys(catalog[code]).sort(), expected, `${code} catalog key coverage`);
      assert.ok(Object.values(catalog[code]).every(value => value.trim().length > 0), `${code} catalog must not contain blank labels`);
    }
  }
  assert.doesNotMatch(Object.values(extraUiText.en).join(" "), /[\u3400-\u9fff]/, "English catalog must not contain accidental Chinese copy");
});

test("hero text import tolerates spacing, case, stars, duplicates and unknown rows", () => {
  const parsed = parseHeroListText("  TYRONN ★★★  \nAda 4 stars\nTyronn 5 stars\nNot A Hero\nRyuichi ★");
  assert.deepEqual(parsed.matched, ["Tyronn", "Ada", "Ryuichi"]);
  assert.equal(parsed.stars.Tyronn, 3);
  assert.equal(parsed.stars.Ada, 4);
  assert.equal(parsed.stars.Ryuichi, 1);
  assert.deepEqual(parsed.duplicates, ["Tyronn 5 stars"]);
  assert.deepEqual(parsed.unmatched, ["Not A Hero"]);
});

test("saved setup clamps every season boundary and removes unknown heroes", () => {
  for (let season = 1; season <= 6; season++) assert.equal(normalizeSimpleSetup({ season }).season, season);
  assert.equal(normalizeSimpleSetup({ season: -99 }).season, 1);
  assert.equal(normalizeSimpleSetup({ season: 99 }).season, 7);
  assert.deepEqual(normalizeSimpleSetup({ owned: ["Tyronn", "Definitely Not A Hero"] }).owned, ["Tyronn"]);
});

test("Season 1 through Season 6 pools never include future-season heroes", () => {
  for (let season = 1; season <= 6; season++) {
    const pool = heroes.filter(hero => hero.season <= season && hero.cageAllowed);
    assert.ok(pool.every(hero => hero.season <= season));
  }
});

test("KOF and R rarity heroes stay out of ordinary Joiner candidates", () => {
  const joinerCandidates = heroes.filter(hero => hero.cageAllowed && hero.rarity !== "R");
  assert.ok(joinerCandidates.every(hero => hero.rarity !== "KOF"));
  assert.ok(joinerCandidates.every(hero => hero.rarity !== "R"));
});
