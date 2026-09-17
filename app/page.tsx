'use client';

import { useMemo, useState } from 'react';

type Hero = { name:string; cls:'Shield'|'Bomber'|'Shooter'; season:number; left?:string; score?:number };
const heroes: Hero[] = [
  {name:'Tyronn',cls:'Shield',season:1,left:'+25% damage class',score:100},
  {name:'Phoenix',cls:'Shield',season:1,left:'+25% damage class',score:99},
  {name:'Koschevoi',cls:'Bomber',season:5,left:'+25% all troop DMG',score:100},
  {name:'Ryuichi',cls:'Bomber',season:5,left:'+25% ATK/Crit class',score:90},
  {name:'Worrell',cls:'Bomber',season:6,left:'+25% Basic Attack DMG',score:100},
  {name:'Lunarl',cls:'Bomber',season:1,left:'+25% damage class',score:98},
  {name:'Vivian',cls:'Bomber',season:3,left:'+25% ATK class',score:90},
  {name:'Ada',cls:'Shooter',season:5,score:95},
  {name:'Kate',cls:'Shooter',season:6,left:'+25% all troop ATK',score:96},
  {name:'Veronica',cls:'Shooter',season:4,left:'+25% damage (proc)',score:94},
  {name:'Lofili',cls:'Shooter',season:1,left:'+25% ATK class',score:90},
  {name:'Mireya',cls:'Shooter',season:3,score:82},
];

export default function Home(){
 const [mode,setMode]=useState<'leader'|'joiner'>('joiner');
 const [season,setSeason]=useState(6);
 const [owned,setOwned]=useState<string[]>(heroes.map(h=>h.name));
 const [generated,setGenerated]=useState(false);
 const available=useMemo(()=>heroes.filter(h=>h.season<=season&&owned.includes(h.name)),[season,owned]);
 const left=[...available].filter(h=>h.left).sort((a,b)=>(b.score||0)-(a.score||0));
 const toggle=(n:string)=>setOwned(v=>v.includes(n)?v.filter(x=>x!==n):[...v,n]);
 const pick=(cls:Hero['cls'], exclude:string[]=[])=>available.find(h=>h.cls===cls&&!exclude.includes(h.name));
 const bestLeft=left[0];
 const formation= mode==='leader'
  ? {left:'Ada',mid:'Ryuichi',right:'Tyronn',ratio:'0 / 10 / 90',note:'Baseline leader formation — compare new S6 heroes with controlled tests.'}
  : bestLeft ? {left:bestLeft.name,mid:pick(bestLeft.cls==='Bomber'?'Shooter':'Bomber',[bestLeft.name])?.name||'—',right:pick(bestLeft.cls==='Shield'?'Shooter':'Shield',[bestLeft.name])?.name||'—',ratio:'0 / 0 / 100',note:`LEFT skill: ${bestLeft.left}. 100k joiner troops.`} : null;
 return <main>
  <header><div><span className="eyebrow">CCW TOOLS</span><h1>Trial Cage <b>Formation Generator</b></h1><p>Built for Lands of Jail • evidence-based Cage formations</p></div><div className="badge">BETA v0.1</div></header>
  <section className="panel controls">
   <div><label>MODE</label><div className="tabs"><button className={mode==='leader'?'active':''} onClick={()=>setMode('leader')}>Rally Leader</button><button className={mode==='joiner'?'active':''} onClick={()=>setMode('joiner')}>Rally Joiner</button></div></div>
   <div><label>SERVER SEASON</label><select value={season} onChange={e=>setSeason(+e.target.value)}>{[1,2,3,4,5,6].map(s=><option key={s}> {s}</option>)}</select></div>
  </section>
  <section className="panel"><div className="title"><div><label>YOUR HEROES</label><h2>Select available heroes</h2></div><span>{available.length} selected</span></div><div className="heroes">{heroes.filter(h=>h.season<=season).map(h=><button key={h.name} onClick={()=>toggle(h.name)} className={owned.includes(h.name)?'hero selected':'hero'}><i>{h.cls[0]}</i><strong>{h.name}</strong><small>{h.cls} • S{h.season}</small>{h.left&&<em>LEFT ★</em>}</button>)}</div></section>
  <button className="generate" onClick={()=>setGenerated(true)}>GENERATE CAGE FORMATION</button>
  {generated&&formation&&<section className="result"><label>RECOMMENDED {mode.toUpperCase()} FORMATION</label><div className="slots"><div className="slot left"><span>LEFT • ACTIVE RALLY SKILL</span><b>{formation.left}</b></div><div className="slot"><span>MIDDLE</span><b>{formation.mid}</b></div><div className="slot"><span>RIGHT</span><b>{formation.right}</b></div></div><div className="ratio"><span>TROOPS • Shield / Bomber / Shooter</span><strong>{formation.ratio}</strong></div><p>{formation.note}</p></section>}
  <footer>Community tool • Not affiliated with Lands of Jail. Recommendations improve as real Cage test data is added.</footer>
 </main>
}
