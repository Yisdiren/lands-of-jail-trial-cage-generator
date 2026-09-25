"use client";

import type { Formation } from "../lib/generator";

type Props = {
  formations: Formation[];
  copyFormation: (formation: Formation, kind: "Main" | "Joiner") => void;
};

export default function FormationQuickList({ formations, copyFormation }: Props) {
  if (!formations.length) return null;
  return (
    <section className="panel formation-quick-list" aria-labelledby="formation-quick-heading">
      <div className="title"><div><label>QUICK FORMATION LIST</label><h2 id="formation-quick-heading">Generated marches at a glance</h2></div></div>
      <div className="formation-quick-grid">
        {formations.map((formation,index)=><div key={formation.id}>
          <b>{formation.id}</b>
          <span>{[formation.left.name, formation.middle?.name, formation.right?.name].filter(Boolean).join(" / ")}</span>
          <button type="button" className="mini-copy" onClick={()=>copyFormation(formation,index===0?"Main":"Joiner")}>COPY</button>
        </div>)}
      </div>
    </section>
  );
}
