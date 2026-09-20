import type { Formation } from "./generator";

export async function downloadFormationImage(
  formations: Formation[],
  context: string,
  stars: Record<string, number>,
  iconPath: (name: string) => string | null,
): Promise<void> {
  if (!formations.length) throw new Error("Generate a formation before downloading.");

  const cardHeight = 300;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 145 + formations.length * cardHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot create a formation image.");

  const wrap = (text: string, x: number, y: number, width: number, lineHeight = 21) => {
    let line = "";
    for (const word of text.split(" ")) {
      const candidate = line + word + " ";
      if (ctx.measureText(candidate).width > width && line) {
        ctx.fillText(line.trim(), x, y);
        y += lineHeight;
        line = "";
      }
      line += word + " ";
    }
    if (line) ctx.fillText(line.trim(), x, y);
    return y;
  };

  ctx.fillStyle = "#070b0d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1b1f21";
  ctx.fillRect(0, 0, canvas.width, 118);
  ctx.fillStyle = "#d5a43a";
  ctx.fillRect(0, 115, canvas.width, 3);
  ctx.font = "bold 30px sans-serif";
  ctx.fillText("LANDS OF JAIL — TRIAL CAGE FORMATIONS", 30, 44);
  ctx.fillStyle = "#e7d8b5";
  ctx.font = "17px sans-serif";
  ctx.fillText(`${context} • LEFT / MIDDLE / RIGHT`, 30, 77);
  ctx.fillStyle = "#9fb1c3";
  ctx.fillText("Main Rally uses maximum troops • Joiners use 10k Bombers + 90k Shooters or 100k Shooters", 30, 101);

  for (let i = 0; i < formations.length; i++) {
    const f = formations[i];
    const y = 132 + i * cardHeight;
    ctx.fillStyle = "#101719";
    ctx.fillRect(22, y, 1156, cardHeight - 16);
    ctx.strokeStyle = f.status === "ready" ? "#52713c" : f.status === "review" ? "#8a682d" : "#873d35";
    ctx.lineWidth = 2;
    ctx.strokeRect(22, y, 1156, cardHeight - 16);

    ctx.fillStyle = "#d5a43a";
    ctx.font = "bold 23px sans-serif";
    ctx.fillText(f.id, 38, y + 34);
    ctx.fillStyle = "#e7d8b5";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText(f.status.toUpperCase(), 104, y + 33);

    for (const [j, hero] of [f.left, f.middle, f.right].entries()) {
      const x = 38 + j * 378;
      const slotY = y + 52;
      ctx.fillStyle = j === 0 && f.id !== "MAIN" ? "#33291a" : "#172126";
      ctx.fillRect(x, slotY, 356, 126);
      ctx.strokeStyle = j === 0 && f.id !== "MAIN" ? "#d5a43a" : "#4d4435";
      ctx.strokeRect(x, slotY, 356, 126);

      const path = iconPath(hero.name);
      ctx.fillStyle = "#26343b";
      ctx.fillRect(x + 10, slotY + 10, 70, 88);
      if (path) {
        const image = new window.Image();
        image.src = path;
        try {
          await image.decode();
          ctx.drawImage(image, x + 10, slotY + 10, 70, 88);
        } catch {
          // Keep text usable when an icon cannot be decoded.
        }
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";
      wrap(hero.name, x + 92, slotY + 31, 248, 20);
      ctx.fillStyle = "#f0ce75";
      ctx.font = "15px sans-serif";
      ctx.fillText(stars[hero.name] ? "★".repeat(stars[hero.name]) : "Stars not set", x + 92, slotY + 77);
      ctx.fillStyle = "#9fb1c3";
      ctx.fillText(hero.cls, x + 92, slotY + 100);

      if (j === 0 && f.id !== "MAIN") {
        ctx.fillStyle = "#d5a43a";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(`LEFT SKILL • Lv${f.leftSkillLevel ?? "?"} • ${hero.leftSkillVerified ? "VERIFIED" : "UNVERIFIED"}`, x + 10, slotY + 118);
      }
    }

    ctx.fillStyle = "#e7d8b5";
    ctx.font = "16px sans-serif";
    wrap(f.troopText, 38, y + 205, 1120);
    ctx.fillStyle = "#f0ce75";
    ctx.fillText(`Robot: ${f.robot ?? "None"}`, 38, y + 235);

    const messages = f.alerts.filter(alert => alert.severity !== "info");
    ctx.fillStyle = messages.length ? "#f0cf7a" : "#9fb1c3";
    ctx.font = "14px sans-serif";
    wrap(messages.length ? `Review: ${messages.map(alert => alert.message).join(" ")}` : "No blocking or review alerts.", 38, y + 262, 1120, 18);
  }

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(value => value ? resolve(value) : reject(new Error("Image export failed.")), "image/png"),
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const slug = context.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  link.href = url;
  link.download = `trial-cage-formations-${slug || "setup"}.png`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
