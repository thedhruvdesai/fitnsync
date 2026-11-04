import type { WeekSummary } from "./report";
import type { Targets } from "./types";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Minimal markdown → email-safe HTML */
function mdToHtml(md: string) {
  const lines = md.split("\n");
  let html = "";
  let inList: "ul" | "ol" | null = null;
  const close = () => {
    if (inList) html += `</${inList}>`;
    inList = null;
  };
  const inline = (t: string) => esc(t).replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#F4F1EC">$1</strong>');
  for (const l of lines) {
    const ul = l.match(/^\s*[-*]\s+(.*)/);
    const ol = l.match(/^\s*\d+[.)]\s+(.*)/);
    if (ul || ol) {
      const type = ul ? "ul" : "ol";
      if (inList !== type) {
        close();
        html += `<${type} style="padding-left:20px;margin:8px 0">`;
        inList = type;
      }
      html += `<li style="margin:4px 0">${inline((ul ?? ol)![1])}</li>`;
      continue;
    }
    close();
    if (!l.trim()) continue;
    if (/^#{1,3}\s/.test(l)) html += `<h3 style="font-size:20px;color:#F4F1EC;margin:20px 0 6px">${inline(l.replace(/^#+\s/, ""))}</h3>`;
    else html += `<p style="margin:8px 0">${inline(l)}</p>`;
  }
  close();
  return html;
}

export function weeklyEmailHtml(opts: { name: string; tier: string; s: WeekSummary; t: Targets; site: string; coach?: string }) {
  const { name, tier, s, t, site, coach } = opts;
  const full = tier === "pro" || tier === "elite";
  const stat = (k: string, v: string, sub: string) =>
    `<td style="padding:6px;width:50%"><div style="background:#121214;border:1px solid #222;border-radius:14px;padding:14px"><div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6B6862">${k}</div><div style="font-size:24px;font-weight:800;color:#F4F1EC;margin-top:4px">${v}</div><div style="font-size:12px;color:#6B6862">${sub}</div></div></td>`;

  const rows = [
    [stat("Avg calories", s.avgKcal.toLocaleString(), `target ${t.kcal.toLocaleString()}`), stat("Avg protein", `${s.avgProtein} g`, `target ${t.protein_g} g`)],
    [stat("Workouts", `${s.workouts}/${s.plannedWorkouts}`, "sessions done"), stat("Weight", s.weightChange == null ? "—" : `${s.weightChange > 0 ? "+" : ""}${s.weightChange} kg`, s.endWeight ? `now ${s.endWeight} kg` : "log your weight")],
  ];
  if (full)
    rows.push([stat("Calorie adherence", `${s.kcalAdherence}%`, "days within ±10%"), stat("Protein adherence", `${s.proteinAdherence}%`, "days ≥ 90% target")]);

  const focus =
    s.daysLogged < 4
      ? "Log at least 5 days this week. Your plan can only adjust to what it can see."
      : s.proteinAdherence < 60
      ? `Protein is the lever: hit ${t.protein_g} g on at least 5 days. Add a protein source to every meal.`
      : s.workouts < s.plannedWorkouts
      ? `Book your ${s.plannedWorkouts} sessions into your calendar now, like appointments.`
      : "You nailed the basics. Push for one extra rep or 2.5 kg on your main lifts.";

  return `<!doctype html><html><body style="margin:0;background:#0A0A0B;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#A8A49D">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0B"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
<tr><td style="font-size:22px;font-weight:800;color:#F4F1EC;padding-bottom:28px">Fit<span style="color:#E11D2E">&amp;</span>Sync</td></tr>
<tr><td style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#E11D2E">Your week · ${esc(s.start)} → ${esc(s.end)}</td></tr>
<tr><td style="font-size:34px;line-height:1.05;font-weight:800;color:#F4F1EC;padding:8px 0 6px">${esc(name || "Hey")}, you scored <span style="color:#E11D2E">${s.score}</span>/100.</td></tr>
<tr><td style="font-size:15px;padding-bottom:18px">You logged ${s.daysLogged} of 7 days. Here's how the week stacked up.</td></tr>
<tr><td><table width="100%" cellpadding="0" cellspacing="0">${rows.map((r) => `<tr>${r.join("")}</tr>`).join("")}</table></td></tr>
<tr><td style="padding:18px 0"><div style="border-left:3px solid #E11D2E;padding:6px 0 6px 14px"><div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6B6862">This week's focus</div><div style="font-size:16px;color:#F4F1EC;margin-top:4px">${esc(focus)}</div></div></td></tr>
${coach ? `<tr><td style="background:#121214;border:1px solid #222;border-radius:16px;padding:20px;font-size:15px;line-height:1.6"><div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#E11D2E;margin-bottom:6px">Fit&amp;Sync Coach (AI) · weekly review</div>${mdToHtml(coach)}</td></tr><tr><td style="height:16px"></td></tr>` : ""}
${!full ? `<tr><td style="padding:8px 0 16px;font-size:14px">Want the full breakdown with adherence, trends and a PDF? <a href="${site}/app/billing?plan=pro" style="color:#E11D2E">Upgrade to Pro</a>.</td></tr>` : ""}
<tr><td style="padding:8px 0 28px"><a href="${site}/app${full ? "/reports" : ""}" style="display:inline-block;background:#E11D2E;color:#fff;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:999px">${full ? "Open full report" : "Log today"}</a></td></tr>
<tr><td style="font-size:12px;color:#6B6862;border-top:1px solid #1f1f22;padding-top:18px">General fitness guidance, not medical advice. <a href="${site}/app/billing" style="color:#6B6862">Email settings</a></td></tr>
</table></td></tr></table></body></html>`;
}
