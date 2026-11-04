/** Tiny, safe markdown renderer for coach feedback (headings, bold, lists, paragraphs). */
function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <strong key={i} className="text-bone">{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>));
}

export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    out.push(
      <Tag key={out.length} className={`my-2 space-y-1.5 pl-5 ${list.ordered ? "list-decimal" : "list-disc"} marker:text-blood`}>
        {list.items.map((it, i) => <li key={i}>{inline(it)}</li>)}
      </Tag>
    );
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const ul = line.match(/^\s*[-*]\s+(.*)/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)/);
    if (ul || ol) {
      const ordered = !!ol;
      if (!list || list.ordered !== ordered) { flush(); list = { ordered, items: [] }; }
      list.items.push((ul ?? ol)![1]);
      continue;
    }
    flush();
    if (!line.trim()) continue;
    if (line.startsWith("## ") || line.startsWith("# ")) out.push(<h3 key={out.length} className="h-display mt-4 text-2xl text-bone first:mt-0">{line.replace(/^#+\s/, "")}</h3>);
    else if (line.startsWith("### ")) out.push(<h4 key={out.length} className="mt-3 font-semibold text-bone">{line.slice(4)}</h4>);
    else out.push(<p key={out.length} className="my-2">{inline(line)}</p>);
  }
  flush();
  return <div className="leading-relaxed text-bone-dim">{out}</div>;
}
