import { test } from "node:test";
import assert from "node:assert/strict";
import { heroes, robots } from "../data/heroes";
import { generateJoinerFormations, generateLeaderFormation } from "../lib/generator";
import { buildLockedFormations } from "../lib/formation-locks";
import { normalizeSimpleSetup, normalizeStars } from "../lib/simple-setup";

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


test("verified Xuanming first War skill can lead a Joiner when Main does not reserve him", () => {
  const pool = heroes.filter(h => ["Xuanming", "Ada", "Alph"].includes(h.name));
  const joiners = generateJoinerFormations(pool, 1, { Xuanming: 4 }, [], true, { Xuanming: 3 }, null);
  assert.equal(joiners.length, 1);
  assert.equal(joiners[0].left.name, "Xuanming");
  assert.equal(joiners[0].leftSkillPercent, 20);
  assert.match(joiners[0].left.leftSkill!, /Lethality/);
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
