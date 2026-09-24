import { test } from "node:test";
import assert from "node:assert/strict";
import { heroes, robots } from "../data/heroes";
import { robotIconPaths } from "../data/robot-presentation";
import { diagnoseJoinerRoster, generateJoinerFormations, generateLeaderFormation } from "../lib/generator";
import { buildLockedFormations } from "../lib/formation-locks";
import { normalizeRobotPriority, normalizeSimpleSetup, normalizeStars, parseHeroListText, parseStoredSimpleSetup } from "../lib/simple-setup";
import { cageBuffs, buffEffectLabel, prisonerArmorSetting, powerArmorBreakthroughLabel } from "../lib/cage-buffs";
import { normalizeGeneratorBackup } from "../lib/generator-backup";
import { extraUiText, languageOptions, uiText } from "../data/ui-text";
import { cageRecommendationEvidence } from "../lib/evidence";

test("one displayed Main reserves its heroes and robot from six Joiners", () => {
  const pool = heroes.filter(hero => hero.season <= 6 && hero.cageAllowed);
  const leader = generateLeaderFormation(pool, robots);
  assert.ok(leader);
  const joiners = generateJoinerFormations(pool, 6, {}, robots, false, {}, leader);
  const all = [leader, ...joiners];
  const names = [leader.left.name, leader.middle!.name, leader.right!.name, ...joiners.map(formation => formation.left.name)];
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
  assert.ok(joiners.every(formation => formation.left.name !== "Phoenix"));
});

test("a partial roster returns only legal, non-repeating Joiners", () => {
  const pool = heroes.filter(hero => ["Tyronn", "Ryuichi", "Ada", "Phoenix", "Worrell", "Kate"].includes(hero.name));
  const leader = generateLeaderFormation(pool, [], { Tyronn: 3 });
  assert.ok(leader);
  const joiners = generateJoinerFormations(pool, 6, {}, [], false, {}, leader);
  assert.equal(joiners.length, 1);
  assert.equal(joiners[0].middle, undefined);\n  assert.equal(joiners[0].right, undefined);
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
  const allNames = [leader, ...joiners].flatMap(formation => [formation.left.name, formation.middle!.name, formation.right!.name]);
  assert.equal(new Set(allNames).size, allNames.length);
  assert.ok(joiners.some(formation => [formation.middle!.name, formation.right!.name].some(name => ["Gerd", "Iwado", "Vesaryon"].includes(name))));
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
  const shield = (stars: Record<string, number>, available = pool) => generateLeaderFormation(available, [], stars)?.right!.name;
  assert.equal(shield({ Tyronn: 2, Phoenix: 3, Xuanming: 2 }), "Phoenix");
  assert.equal(shield({ Tyronn: 1, Phoenix: 2, Xuanming: 3 }), "Xuanming");
  assert.equal(shield({ Phoenix: 3 }, pool.filter(h => h.name !== "Tyronn")), "Phoenix");
  assert.equal(shield({ Tyronn: 3, Phoenix: 5, Xuanming: 5 }), "Tyronn");
  assert.equal(shield({ Tyronn: 2, Phoenix: 2, Xuanming: 2 }), undefined);
  assert.equal(shield({}), undefined);
  for (const name of ["Tyronn", "Phoenix", "Xuanming"]) {
    assert.throws(() => buildLockedFormations(pool, 1, { "0:right": name }, {}, [], false, null, "leader", { [name]: 2 }), /at least 3 stars/);
    assert.equal(buildLockedFormations(pool, 1, { "0:right": name }, {}, [], false, null, "leader", { [name]: 3 })[0].right!.name, name);
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
    const names = all.flatMap(f => [f.left.name, f.middle!.name, f.right!.name]);
    assert.equal(new Set(names).size, names.length);
    for (const formation of all) assert.equal(new Set([formation.left.cls, formation.middle!.cls, formation.right!.cls]).size, 3);
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
  assert.ok(preferred); assert.equal(preferred.right!.name,"Tyronn"); assert.equal(preferred.middle!.name,"Ryuichi"); assert.equal(preferred.left.name,"Ada");
  const fallback = pick(["Phoenix","Xuanming","Vivian","Veronica"], { Phoenix:3, Xuanming:5 });
  assert.ok(fallback); assert.equal(fallback.right!.name,"Xuanming"); assert.equal(fallback.middle!.name,"Vivian"); assert.equal(fallback.left.name,"Veronica");
});

for (const season of [1,2,3,4,5,6,7]) {
  test(`Season ${season} generation never duplicates heroes or violates classes`, () => {
    const pool = heroes.filter(hero => (hero.season === 0 || hero.season <= season) && hero.cageAllowed && hero.rarity !== "R" && hero.rarity !== "KOF");
    const stars = Object.fromEntries(pool.map(hero => [hero.name,5]));
    const leader = generateLeaderFormation(pool, [], stars);
    if (!leader) return;
    const joiners = generateJoinerFormations(pool, 6, {}, [], false, stars, leader);
    const all = [leader,...joiners], names = all.flatMap(f=>[f.left.name,f.middle?.name ?? null,f.right?.name ?? null]);
    assert.equal(new Set(names).size,names.length);
    for (const formation of all) assert.deepEqual(new Set([formation.left.cls,formation.middle!.cls,formation.right!.cls]).size,3);
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
  const all=[leader,...joiners], names=all.flatMap(x=>[x.left.name,x.middle!.name,x.right!.name]);
  assert.equal(new Set(names).size,names.length); for(const x of all) assert.equal(new Set([x.left.cls,x.middle!.cls,x.right!.cls]).size,3);
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
    const names = formations.flatMap(f => [f.left.name, f.middle!.name, f.right!.name]);
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

test("verified game evidence remains separate from recommendation heuristics", () => {
  const xuanming = heroes.find(hero => hero.name === "Xuanming")!;
  const tyronn = heroes.find(hero => hero.name === "Tyronn")!;
  const rin = heroes.find(hero => hero.name === "Rin")!;
  assert.deepEqual(cageRecommendationEvidence(xuanming), { gameEvidence: "verified", recommendationBasis: "not-ranked" });
  assert.deepEqual(cageRecommendationEvidence(tyronn), { gameEvidence: "verified", recommendationBasis: "tested-priority" });
  assert.equal(cageRecommendationEvidence(rin).gameEvidence, rin.leftSkill ? "verified" : "not-entered");
});

test("S1-S6 formation stress matrix preserves legality across counts, stars, verification, and robot pools", () => {
  for (let season = 1; season <= 6; season++) {
    const pool = heroes.filter(hero => hero.season <= season && hero.cageAllowed);
    for (const starLevel of [1, 3, 5]) {
      const stars = Object.fromEntries(pool.map(hero => [hero.name, starLevel]));
      for (const robotPool of [[], robots.slice(0, 2), robots]) {
        const leader = generateLeaderFormation(pool, robotPool, stars);
        for (const verifiedOnly of [false, true]) {
          for (let count = 1; count <= 6; count++) {
            const joiners = generateJoinerFormations(pool, count, {}, robotPool, verifiedOnly, stars, leader);
            assert.ok(joiners.length <= count);
            const formations = [...(leader ? [leader] : []), ...joiners];
            const names = formations.flatMap(formation => [formation.left.name, formation.middle!.name, formation.right!.name]);
            assert.equal(new Set(names).size, names.length, `S${season}, ${starLevel}★, ${count} Joiners must not reuse heroes`);
            for (const formation of formations) {
              assert.equal(new Set([formation.left.cls, formation.middle!.cls, formation.right!.cls]).size, 3);
              assert.notEqual(formation.status, "blocked");
            }
            if (verifiedOnly) assert.ok(joiners.every(formation => formation.left.leftSkillVerified));
            const assignedRobots = formations.map(formation => formation.robot).filter(Boolean);
            assert.equal(new Set(assignedRobots).size, assignedRobots.length);
          }
        }
      }
    }
  }
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


test("defensive and evidence-only LEFT heroes cannot silently gain recommendation ranks", () => {
  for (const name of ["Whisper", "Marcus", "Caesar", "Zoltan", "Gerd", "Vesaryon", "Platos", "Otto", "Wukong"]) {
    const hero = heroes.find(item => item.name === name)!;
    assert.equal(hero.leftTier, undefined, `${name} must remain unranked without Cage-priority evidence`);
    assert.equal(hero.leftValue, undefined, `${name} must not receive a heuristic score without explicit evidence`);
  }
});

test("S6 ranked LEFT heroes keep heuristic labeling separate from verified skill data", () => {
  for (const name of ["Worrell", "Kate"]) {
    const hero = heroes.find(item => item.name === name)!;
    assert.equal(hero.leftSkillVerified, true);
    assert.ok(hero.leftTier && hero.leftValue !== undefined);
    assert.match(hero.priorityNote ?? "", /heuristic/i);
    assert.equal(cageRecommendationEvidence(hero).recommendationBasis, "heuristic-only");
  }
});

test("hero import handles empty files, CRLF, punctuation and clamps star syntax", () => {
  assert.deepEqual(parseHeroListText("   \r\n\r\n"), { matched: [], unmatched: [], duplicates: [], stars: {} });
  const parsed = parseHeroListText("TYRONN - 5 stars\r\nAda: ★★★★★\r\nUnknown!!!\r\nADA 2 stars");
  assert.deepEqual(parsed.matched, ["Tyronn", "Ada"]);
  assert.equal(parsed.stars.Tyronn, 5);
  assert.equal(parsed.stars.Ada, 5);
  assert.deepEqual(parsed.unmatched, ["Unknown!!!"]);
  assert.deepEqual(parsed.duplicates, ["ADA 2 stars"]);
});

test("generator backup defaults malformed missing counts safely without accepting future versions", () => {
  const restored = normalizeGeneratorBackup({ format: "loj-trial-cage-backup", version: 1, season: "bad", joinCount: null });
  assert.equal(restored.season, 6);
  assert.equal(restored.joinCount, 6);
  assert.deepEqual(restored.owned, []);
  assert.deepEqual(restored.ownedRobots, []);
  assert.throws(() => normalizeGeneratorBackup({ format: "loj-trial-cage-backup", version: 999 }), /not supported/);
});


test("pinned formation conflicts fail clearly and valid mixed pins remain legal", () => {
  const pool = heroes.filter(hero => hero.season <= 6 && hero.cageAllowed && hero.rarity !== "R" && hero.rarity !== "KOF");
  assert.throws(() => buildLockedFormations(pool, 2, { "0:left": "Tyronn", "1:left": "Tyronn" }, {}, [], false, null, "joiner"), /locked into more than one slot/);
  assert.throws(() => buildLockedFormations(pool, 1, { "0:left": "Omega Rugal" }, {}, [], false, null, "joiner"), /unavailable, excluded, or reserved/);
  const locked = buildLockedFormations(pool, 2, { "0:left": "Worrell", "1:right": "Kate" }, {}, [], false, null, "joiner");
  assert.equal(locked.length, 2);
  const names = locked.flatMap(f => [f.left.name, f.middle!.name, f.right!.name]);
  assert.equal(new Set(names).size, names.length);
  for (const formation of locked) assert.equal(new Set([formation.left.cls, formation.middle!.cls, formation.right!.cls]).size, 3);
});

test("pinned Joiners reject heroes already reserved by Main", () => {
  const pool = heroes.filter(hero => hero.season <= 6 && hero.cageAllowed);
  const leader = generateLeaderFormation(pool, [], { Tyronn: 3, Phoenix: 3, Xuanming: 3 });
  assert.ok(leader);
  assert.throws(() => buildLockedFormations(pool, 1, { "0:left": leader.left.name }, {}, [], false, leader, "joiner"), /reserved for the Main Rally/);
});

test("exact roster boundaries produce only the maximum legal number of formations", () => {
  const byClass = (cls: "Shield"|"Bomber"|"Shooter") => heroes.filter(h => h.season <= 6 && h.cageAllowed && h.rarity !== "R" && h.rarity !== "KOF" && h.cls === cls);
  for (let joins = 1; joins <= 6; joins++) {
    const needed = joins + 1;
    const pool = [...byClass("Shield").slice(0, needed), ...byClass("Bomber").slice(0, needed), ...byClass("Shooter").slice(0, needed)];
    const stars = Object.fromEntries(pool.map(h => [h.name, 5]));
    const leader = generateLeaderFormation(pool, [], stars);
    assert.ok(leader, `exact roster for ${joins} Joiners needs a Main`);
    assert.equal(generateJoinerFormations(pool, joins, {}, [], false, stars, leader).length, joins);
    const shortPool = pool.filter(h => h.name !== byClass("Shooter").slice(0, needed).at(-1)?.name);
    const shortLeader = generateLeaderFormation(shortPool, [], stars);
    assert.ok(shortLeader);
    assert.ok(generateJoinerFormations(shortPool, joins, {}, [], false, stars, shortLeader).length < joins);
  }
});

test("robot assignment remains unique when robot supply is smaller than formation demand", () => {
  const pool = heroes.filter(hero => hero.season <= 6 && hero.cageAllowed);
  for (const robotPool of [[], robots.slice(0, 1), robots.slice(0, 3), robots]) {
    const leader = generateLeaderFormation(pool, robotPool);
    assert.ok(leader);
    const joiners = generateJoinerFormations(pool, 6, {}, robotPool, false, {}, leader);
    const assigned = [leader, ...joiners].map(f => f.robot).filter(Boolean);
    assert.equal(new Set(assigned).size, assigned.length);
    assert.ok(assigned.every(robot => robotPool.includes(robot!)));
  }
});

test("version-1 backup fixture stays restorable as the roster evolves", () => {
  const fixture = {
    format: "loj-trial-cage-backup", version: 1, season: 5, joinCount: 4,
    owned: ["Tyronn", "Ryuichi", "Ada", "Old Removed Hero"],
    heroStarLevels: { Tyronn: 4, Ryuichi: 5, Ada: 3, "Old Removed Hero": 5 },
    ownedRobots: ["Musashimaru", "Old Robot"], robotPriority: ["Musashimaru", "Old Robot"],
    ownedFelons: [], rallyFills: true, seatHolder: false, verifiedOnly: false,
    hideFillerLeft: false, leftClassFilter: "all", selectedBuffIds: [], armorSettings: {}, activationLeadMinutes: 5,
  };
  const restored = normalizeGeneratorBackup(fixture);
  assert.equal(restored.season, 5); assert.equal(restored.joinCount, 4);
  assert.deepEqual(restored.owned, ["Tyronn", "Ryuichi", "Ada"]);
  assert.deepEqual(restored.ownedRobots, ["Musashimaru"]);
  assert.equal(restored.robotPriority[0], "Musashimaru");
  assert.equal(restored.robotPriority.includes("Old Robot"), false);
});

test("local storage recovery survives nulls, arrays, primitive JSON and extreme values", () => {
  for (const raw of ["null", "[]", "true", "42", "\"\"", JSON.stringify({ season: 999999, joinCount: -999, owned: [null, 7, "Tyronn"], heroStarLevels: { Tyronn: 999 } })]) {
    const parsed = parseStoredSimpleSetup(raw);
    assert.ok(parsed.setup.season >= 1 && parsed.setup.season <= 7);
    assert.ok(parsed.setup.joinCount >= 1 && parsed.setup.joinCount <= 6);
    assert.ok(parsed.setup.owned.every(name => heroes.some(hero => hero.name === name)));
    assert.ok(Object.values(parsed.setup.heroStarLevels).every(stars => stars >= 1 && stars <= 5));
  }
});


test("hero and robot presentation data stays internally consistent", () => {
  assert.equal(new Set(heroes.map(hero => hero.name)).size, heroes.length, "hero names must be unique");
  for (const hero of heroes) {
    assert.ok(["Shield","Bomber","Shooter"].includes(hero.cls), `${hero.name} class`);
    assert.ok(Number.isInteger(hero.season) && hero.season >= 0 && hero.season <= 7, `${hero.name} season`);
    assert.ok(["R","SR","SSR","KOF"].includes(hero.rarity), `${hero.name} rarity`);
    if (hero.leftSkillVerified) {
      assert.equal(hero.leftSkillValues?.length, 5, `${hero.name} verified LEFT needs five levels`);
      assert.ok(hero.leftSkillValues?.every(value => Number.isFinite(value) && value >= 0));
    }
  }
  assert.deepEqual(Object.keys(robotIconPaths).sort(), [...robots].sort(), "every robot needs exactly one presentation mapping");
  for (const [name, path] of Object.entries(robotIconPaths)) {
    assert.match(path, /^\/icons\//, `${name} icon must use a public icon path`);
  }
});

test("Cage Power Armor verified level caps and values remain exact", () => {
  const byId = Object.fromEntries(cageBuffs.map(buff => [buff.id, buff]));
  assert.equal(byId["comprehensive-command"].maxSkillLevel, 9);
  assert.deepEqual(byId["comprehensive-command"].levelValues, [1250,2500,3750,5000,6250,7500,8750,10000,11250]);
  assert.equal(byId["orbital-strike"].maxSkillLevel, 9);
  assert.deepEqual(byId["orbital-strike"].levelValues, [2,2.5,3,3.5,4,4.5,5,5.5,6]);
  assert.deepEqual(byId["overload-charge"].levelValues, [16000,32000,48000,64000,80000,96000,112000,128000,144000,160000]);
  assert.deepEqual(byId["valiant-breach"].levelValues, [2,2.5,3,4,5,6,7,8,9,10]);
  for (const id of ["shockwave-crush","multidimensional","emergency-shelter"]) assert.equal(byId[id], undefined);
});


test("important Joiner recommendation ordering stays stable through Season 6", () => {
  const ranked = heroes.filter(hero => hero.season <= 6 && hero.cageAllowed && hero.leftSkill && hero.rarity !== "KOF")
    .map(hero => ({ name: hero.name, score: scoreJoinerLeftHero(hero, {}, {}) }))
    .sort((a,b) => b.score-a.score || a.name.localeCompare(b.name));
  const position = (name: string) => ranked.findIndex(hero => hero.name === name);
  for (const defensive of ["Whisper","Marcus","Caesar","Zoltan","Gerd","Vesaryon","Platos","Otto","Wukong"]) {
    assert.ok(position(defensive) > position("Tyronn"), `${defensive} must not outrank Tyronn without recommendation evidence`);
    assert.ok(position(defensive) > position("Worrell"), `${defensive} must not outrank Worrell without recommendation evidence`);
  }
  assert.ok(position("Worrell") < position("Kate"));
});

test("short-roster diagnostics identify exact class and LEFT-skill shortages", () => {
  const names = ["Tyronn","Ryuichi","Ada","Phoenix","Worrell","Kate"];
  const pool = heroes.filter(hero => names.includes(hero.name));
  const leader = generateLeaderFormation(pool, [], { Tyronn: 3, Phoenix: 3 });
  assert.ok(leader);
  const diagnosis = diagnoseJoinerRoster(pool, 2, leader);
  assert.ok(diagnosis.blockers.some(message => /Need 1 more .* hero/.test(message)));
  assert.ok(diagnosis.blockers.some(message => /eligible hero.*overall/.test(message)));
  assert.ok(diagnosis.bottleneck);
  assert.equal(diagnosis.heroShortage, 3);
});

test("diagnostics and generation agree across S1-S6 and requested Joiner counts", () => {
  for (let season=1; season<=6; season++) for (let requested=1; requested<=6; requested++) {
    const pool=heroes.filter(hero=>hero.season<=season&&hero.cageAllowed);
    const leader=generateLeaderFormation(pool);
    const generated=generateJoinerFormations(pool,requested,{},[],false,{},leader);
    const diagnosis=diagnoseJoinerRoster(pool,requested,leader);
    if (generated.length===requested) assert.equal(diagnosis.blockers.length,0, `S${season} J${requested}`);
    if (diagnosis.heroShortage>0) assert.ok(generated.length<requested, `S${season} J${requested} cannot fill when total heroes are short`);
  }
});

test("Main plus Joiner generation is deterministic for identical inputs", () => {
  const pool=heroes.filter(hero=>hero.season<=6&&hero.cageAllowed);
  const snapshot=()=> {
    const leader=generateLeaderFormation(pool,robots);
    const joiners=generateJoinerFormations(pool,6,{},robots,false,{},leader);
    return JSON.stringify([leader,...joiners].map(f=>f&&[f.id,f.left.name,f.middle?.name ?? null,f.right?.name ?? null,f.robot]));
  };
  assert.equal(snapshot(),snapshot());
  assert.equal(snapshot(),snapshot());
});


test("public beta badge version is sourced from package metadata", async () => {
  const source = await import("node:fs/promises").then(fs => fs.readFile(new URL("../app/page.tsx", import.meta.url), "utf8"));
  assert.match(source, /packageInfo\.version/);
  assert.doesNotMatch(source, /DEV v\d+\.\d+ BETA/);
});


test("Joiners remain usable when only LEFT heroes are available", () => {
  const leftOnly = heroes.filter(hero => ["Lofili", "Lunarl"].includes(hero.name));
  const joiners = generateJoinerFormations(leftOnly, 2, {}, [], false, {}, null);
  assert.equal(joiners.length, 2);
  assert.ok(joiners.every(formation => formation.left.leftSkill));
  assert.ok(joiners.every(formation => !formation.middle && !formation.right));
});

test("Joiner filler does not consume another protected LEFT hero when ordinary filler is available", () => {
  const selected = heroes.filter(hero => ["Lofili", "Lunarl", "Gerd", "Iwado", "Vesaryon", "Platos"].includes(hero.name));
  const joiners = generateJoinerFormations(selected, 2, {}, [], false, {}, null);
  assert.equal(joiners.length, 2);
  assert.notEqual(joiners[0].left.name, joiners[1].left.name);
});


test("Joiners are LEFT-only even when neutral support heroes are available", () => {
  const pool = heroes.filter(hero => ["Lofili", "Iwado", "Gerd", "Vesaryon"].includes(hero.name));
  const joiners = generateJoinerFormations(pool, 1);
  assert.equal(joiners.length, 1);
  assert.equal(joiners[0].middle, undefined);
  assert.equal(joiners[0].right, undefined);
  assert.notEqual(joiners[0].left.name, "Iwado");
});


test("full Joiner mode preserves LEFT recommendations and fills support without reuse", () => {
  const pool = heroes.filter(hero => hero.season <= 6 && hero.cageAllowed);
  const leader = generateLeaderFormation(pool);
  const leftOnly = generateJoinerFormations(pool, 6, {}, [], false, {}, leader, false);
  const full = generateJoinerFormations(pool, 6, {}, [], false, {}, leader, true);
  assert.deepEqual(full.map(f => f.left.name), leftOnly.map(f => f.left.name));
  const names = full.flatMap(f => [f.left.name, f.middle?.name, f.right?.name].filter((name): name is string => Boolean(name)));
  assert.equal(new Set(names).size, names.length);
});

test("LEFT-only mode leaves support slots empty", () => {
  const pool = heroes.filter(hero => hero.season <= 6 && hero.cageAllowed);
  const leader = generateLeaderFormation(pool);
  const joiners = generateJoinerFormations(pool, 6, {}, [], false, {}, leader, false);
  assert.ok(joiners.every(f => !f.middle && !f.right));
});


test("Season 6 established Main defaults remain stable", () => {
  const pool = heroes.filter(hero => hero.season <= 6 && hero.cageAllowed);
  const main = generateLeaderFormation(pool, [], { Tyronn: 3 });
  assert.ok(main);
  assert.equal(main.right?.name, "Tyronn");
  assert.equal(main.middle?.name, "Ryuichi");
  assert.equal(main.left.name, "Ada");
});

test("Season 7 Main uses screenshot-backed offensive S7 options when owned", () => {
  const names = ["Tyronn","Ryuichi","Ada","Boogie","Rin","Rex"];
  const pool = heroes.filter(hero => names.includes(hero.name));
  const main = generateLeaderFormation(pool, [], { Tyronn: 3 });
  assert.ok(main);
  assert.equal(main.right?.name, "Tyronn");
  assert.equal(main.middle?.name, "Boogie");
  assert.equal(main.left.name, "Rin");
});


test("full Joiner support excludes heroes below 3 stars", () => {
  const names = ["Lofili", "Gerd", "Iwado", "Vesaryon", "Marcus", "Ryuichi"];
  const pool = heroes.filter(hero => names.includes(hero.name));
  const stars = Object.fromEntries(names.map(name => [name, name === "Lofili" ? 5 : 2]));
  const joiners = generateJoinerFormations(pool, 1, {}, [], false, stars, null, true);
  assert.equal(joiners.length, 1);
  assert.equal(joiners[0].left.name, "Lofili");
  assert.equal(joiners[0].middle, undefined);
  assert.equal(joiners[0].right, undefined);
});

test("full Joiner support prefers eligible SSR over SR of the same class", () => {
  const names = ["Lofili", "Iwado", "Marcus", "Ryuichi"];
  const pool = heroes.filter(hero => names.includes(hero.name));
  const stars = Object.fromEntries(names.map(name => [name, 3]));
  const joiners = generateJoinerFormations(pool, 1, {}, [], false, stars, null, true);
  assert.equal(joiners.length, 1);
  const support = [joiners[0].middle, joiners[0].right].filter(Boolean);
  assert.ok(support.some(hero => hero?.name === "Marcus"));
  assert.ok(!support.some(hero => hero?.name === "Iwado"));
});

test("full Joiner support never consumes a protected LEFT recommendation", () => {
  const pool = heroes.filter(hero => hero.season <= 6 && hero.cageAllowed);
  const stars = Object.fromEntries(pool.map(hero => [hero.name, 5]));
  const leftOnly = generateJoinerFormations(pool, 6, {}, [], false, stars, null, false);
  const full = generateJoinerFormations(pool, 6, {}, [], false, stars, null, true);
  const expectedLeft = leftOnly.map(formation => formation.left.name);
  assert.deepEqual(full.map(formation => formation.left.name), expectedLeft);
  const supportNames = full.flatMap(formation => [formation.middle?.name, formation.right?.name].filter((name): name is string => Boolean(name)));
  assert.ok(expectedLeft.every(name => !supportNames.includes(name)));
});

test("LEFT-only and full Joiner generation remain available through Seasons 1-6", () => {
  for (let season = 1; season <= 6; season++) {
    const pool = heroes.filter(hero => hero.season <= season && hero.cageAllowed);
    const stars = Object.fromEntries(pool.map(hero => [hero.name, 5]));
    const leader = generateLeaderFormation(pool, [], stars);
    const leftOnly = generateJoinerFormations(pool, 6, {}, [], false, stars, leader, false);
    const full = generateJoinerFormations(pool, 6, {}, [], false, stars, leader, true);
    assert.deepEqual(full.map(formation => formation.left.name), leftOnly.map(formation => formation.left.name), `S${season}`);
    assert.ok(leftOnly.every(formation => !formation.middle && !formation.right), `S${season} LEFT-only`);
  }
});
