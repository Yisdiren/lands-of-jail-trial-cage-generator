'use client';

import { useMemo, useState } from 'react';
import { felons, heroes, robots } from '../data/heroes';
import { generateJoinerFormations, generateLeaderFormation, type TroopPreset, type WarSkillLevels } from '../lib/generator';

type Mode = 'leader' | 'joiner';

export default function Home() {
  const [mode, setMode] = useState<Mode>('joiner');
  const [season, setSeason] = useState(6);
  const [owned, setOwned] = useState<string[]>(heroes.filter(h => h.cageAllowed).map(h => h.name));
  const [troopPreset, setTroopPreset] = useState<TroopPreset>('shooters');
  const [joinCount, setJoinCount] = useState(6);
  const [warSkillLevels, setWarSkillLevels] = useState<WarSkillLevels>(() => Object.fromEntries(heroes.filter(h => h.leftSkill).map(h => [h.name, 5])));
  const [generated, setGenerated] = useState(false);

  const seasonHeroes = useMemo(() => heroes.filter(h => h.season === 0 || h.season <= season), [season]);
  const available = useMemo(() => seasonHeroes.filter(h => owned.includes(h.name) && h.cageAllowed), [seasonHeroes, owned]);
  const joinerFormations = useMemo(() => generateJoinerFormations(available, joinCount, troopPreset, warSkillLevels), [available, joinCount, troopPreset, warSkillLevels]);
  const leaderFormation = useMemo(() => generateLeaderFormation(available), [available]);

  const toggle = (name: string) => { setGenerated(false); setOwned(current => current.includes(name) ? current.filter(x => x !== name) : [...current, name]); };
  const selectAll = () => { setOwned(seasonHeroes.filter(h => h.cageAllowed).map(h => h.name)); setGenerated(false); };
  const clearAll = () => { setOwned([]); setGenerated(false); };
  const setSkillLevel = (name: string, level: number) => { setWarSkillLevels(current => ({ ...current, [name]: level })); setGenerated(false); };

  return (
    <main>
      <header><div><span className="eyebrow">CCW TOOLS</span><h1>Trial Cage <b>Formation Generator</b></h1><p>Lands of Jail • class-legal formations • LEFT-slot aware • no hero reuse</p></div><div className="badge">BETA v0.3</div></header>

      <section className="panel controls">
        <div><label>MODE</label><div className="tabs"><button className={mode === 'leader' ? 'active' : ''} onClick={() => { setMode('leader'); setGenerated(false); }}>Rally Leader</button><button className={mode === 'joiner' ? 'active' : ''} onClick={() => { setMode('joiner'); setGenerated(false); }}>Rally Joiner</button></div></div>
        <div><label>SERVER SEASON</label><select value={season} onChange={e => { setSeason(+e.target.value); setGenerated(false); }}>{[1,2,3,4,5,6].map(s => <option key={s} value={s}>Season {s}</option>)}</select></div>
        {mode === 'joiner' && <><div><label>JOINER TROOPS</label><select value={troopPreset} onChange={e => { setTroopPreset(e.target.value as TroopPreset); setGenerated(false); }}><option value="shooters">100k Shooters</option><option value="10-90">10k Bomber / 90k Shooter</option></select></div><div><label>JOINER MARCHES</label><select value={joinCount} onChange={e => { setJoinCount(+e.target.value); setGenerated(false); }}>{[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}</select></div></>}
      </section>

      <section className="panel">
        <div className="title"><div><label>YOUR HEROES</label><h2>Select heroes this account owns</h2></div><span>{available.length} usable</span></div>
        <div className="quick-actions"><button onClick={selectAll}>Select all usable</button><button onClick={clearAll}>Clear</button></div>
        <div className="heroes">
          {seasonHeroes.map(hero => {
            const selected = owned.includes(hero.name); const disabled = !hero.cageAllowed;
            return <div key={hero.name}>
              <button onClick={() => !disabled && toggle(hero.name)} disabled={disabled} className={`${selected ? 'hero selected' : 'hero'} ${disabled ? 'disabled' : ''}`} title={hero.notes || ''}>
                <i>{hero.cls[0]}</i><strong>{hero.name}</strong><small>{hero.cls} • {hero.season === 0 ? 'Legacy' : `S${hero.season}`} • {hero.rarity}</small>{hero.leftSkill && <em>LEFT ★ {hero.leftTier?.toUpperCase()}</em>}{!hero.cageAllowed && <em>EXCLUDED</em>}
              </button>
              {mode === 'joiner' && selected && hero.leftSkill && !disabled && <label style={{display:'block', marginTop:6, fontSize:12}}>LEFT War skill Lv <select value={warSkillLevels[hero.name] ?? 5} onChange={e => setSkillLevel(hero.name, +e.target.value)} style={{marginLeft:6}}>{[1,2,3,4,5].map(l => <option key={l} value={l}>{l}</option>)}</select></label>}
            </div>;
          })}
        </div>
      </section>

      <button className="generate" onClick={() => setGenerated(true)}>GENERATE CAGE FORMATION{mode === 'joiner' ? 'S' : ''}</button>

      {generated && mode === 'leader' && (leaderFormation ? <section className="result"><label>RECOMMENDED LEADER BASELINE</label><div className="slots"><div className="slot"><span>SHOOTER</span><b>{leaderFormation.left.name}</b></div><div className="slot"><span>BOMBER</span><b>{leaderFormation.middle.name}</b></div><div className="slot"><span>SHIELD</span><b>{leaderFormation.right.name}</b></div></div><div className="ratio"><span>TROOPS • Shield / Bomber / Shooter</span><strong>{leaderFormation.troopText}</strong></div><p>Current controlled-test baseline is Ada / Ryuichi / Tyronn at 0/10/90 when all three are owned. S6 swaps should be tested one change at a time.</p><div className="mini-grid"><div><b>Robot baseline</b><span>{robots[0]}</span></div><div><b>Yard Time locks</b><span>{felons[0].name} + {felons[1].name}</span></div><div><b>3rd felon</b><span>Rage Fist if rally fills; Devil if capacity would be wasted</span></div></div></section> : <section className="result warning"><b>Not enough heroes.</b><p>You need at least one usable Shield, Bomber and Shooter.</p></section>)}

      {generated && mode === 'joiner' && <section className="result"><label>GENERATED JOINER FORMATIONS</label><p className="result-intro">Every march uses exactly one Shield, one Bomber and one Shooter. The first hero shown is physically LEFT. LEFT War skill levels now affect recommendation priority.</p>{joinerFormations.length === 0 && <div className="warning-box">Not enough compatible heroes to build a legal joiner formation.</div>}<div className="formation-list">{joinerFormations.map(f => <article className="formation-card" key={f.id}><div className="formation-head"><b>{f.id}</b><span>{f.troopText}</span></div><div className="slots"><div className="slot left"><span>LEFT • ACTIVE RALLY SKILL • Lv{f.leftSkillLevel}</span><b>{f.left.name}</b><small>{f.left.leftSkill}</small></div><div className="slot"><span>MIDDLE • {f.middle.cls}</span><b>{f.middle.name}</b></div><div className="slot"><span>RIGHT • {f.right.cls}</span><b>{f.right.name}</b></div></div>{f.warning && <p className="warn">⚠ {f.warning}</p>}</article>)}</div>{joinerFormations.length < joinCount && joinerFormations.length > 0 && <div className="warning-box">Only {joinerFormations.length} legal non-repeating formation{joinerFormations.length === 1 ? '' : 's'} could be built from the selected roster.</div>}</section>}

      <section className="panel notes"><div><label>RULES CURRENTLY ENFORCED</label><p>✓ 1 Shield + 1 Bomber + 1 Shooter &nbsp; ✓ LEFT-slot skill priority &nbsp; ✓ LEFT War skill level &nbsp; ✓ no hero reuse across J1–J6 &nbsp; ✓ 100k joiner presets &nbsp; ✓ KOF excluded</p></div></section>
      <footer>Community tool • Not affiliated with Lands of Jail. Unknown season numbers are marked “Legacy” instead of being guessed.</footer>
    </main>
  );
}
