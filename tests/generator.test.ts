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
  const pinned = buildLockedFormations(pool, 1, { "0:left": "Phoenix" }, {}, [], false, null, "leader")[0];
  assert.equal(pinned.left.name, "Phoenix");
  const joiners = generateJoinerFormations(pool, 6, {}, [], false, {}, pinned);
  assert.ok(joiners.every(formation => ![formation.left, formation.middle, formation.right].some(hero => hero.name === "Phoenix")));
});

test("a partial roster returns only legal, non-repeating Joiners", () => {
  const pool = heroes.filter(hero => ["Tyronn", "Ryuichi", "Ada", "Phoenix", "Worrell", "Kate"].includes(hero.name));
  const leader = generateLeaderFormation(pool);
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
