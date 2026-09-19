import type { Formation } from "./generator";

export async function downloadFormationImage(
  formations: Formation[],
  player: string,
  stars: Record<string, number>,
  iconPath: (name: string) => string | null,
): Promise<void> {
  if (!formations.length) throw new Error("Generate a formation before downloading.");
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 130 + formations.length * 320;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot create a formation image.");
  ctx.fillStyle = "#091522"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffd44a"; ctx.font = "bold 30px sans-serif";
  ctx.fillText("LANDS OF JAIL — TRIAL CAGE FORMATIONS", 30, 46);
  ctx.fillStyle = "#ffffff"; ctx.font = "18px sans-serif";
  ctx.fillText("Beta v1.73 • LEFT / MIDDLE / RIGHT • " + player.slice(0, 45), 30, 80);
  const wrap = (text: string, x: number, y: number, width: number) => {
    let line = "";
    for (const word of text.split(" ")) {
      if (ctx.measureText(line + word).width > width && line) {
        ctx.fillText(line, x, y); y += 22; line = "";
      }
      line += word + " ";
    }
    ctx.fillText(line, x, y);
  };
  for (let i = 0; i < formations.length; i++) {
    const f = formations[i], y = 120 + i * 320;
    ctx.fillStyle = "#ffd44a"; ctx.font = "bold 24px sans-serif";
    ctx.fillText(f.id + " · " + f.status.toUpperCase(), 30, y);
    for (const [j, h] of [f.left, f.middle, f.right].entries()) {
      const x = 30 + j * 390, path = iconPath(h.name);
      ctx.fillStyle = "#183047"; ctx.fillRect(x, y + 18, 72, 90);
      if (path) {
        const image = new window.Image();
        image.src = path;
        try { await image.decode(); ctx.drawImage(image, x, y + 18, 72, 90); } catch { /* Name remains visible when a portrait is unavailable. */ }
      }
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 20px sans-serif";
      wrap(h.name, x + 82, y + 42, 280);
      ctx.font = "18px sans-serif"; ctx.fillStyle = "#ffd44a";
      ctx.fillText(stars[h.name] ? "★".repeat(stars[h.name]) : "Stars not set", x + 82, y + 94);
      ctx.fillStyle = "#b8c7d6"; ctx.fillText(h.cls, x, y + 134);
    }
    ctx.fillStyle = "#ffffff"; ctx.font = "18px sans-serif";
    wrap(f.troopText, 30, y + 171, 1130);
    ctx.fillText("Robot: " + (f.robot ?? "None") + (f.id !== "MAIN" ? " · LEFT War skill Lv" + f.leftSkillLevel : ""), 30, y + 227);
    const messages = f.alerts.filter(a => a.severity !== "info");
    ctx.fillStyle = "#ffd44a"; ctx.font = "16px sans-serif";
    wrap(messages.length ? "Review: " + messages.map(a => a.message).join(" ").slice(0, 230) : "No blocking or review alerts.", 30, y + 255, 1120);
  }
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Image export failed.")), "image/png"));
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = "trial-cage-formations.png"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
