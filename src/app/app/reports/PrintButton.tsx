"use client";
export function PrintButton() {
  return <button className="btn-ghost no-print !py-2" onClick={() => window.print()}>Download PDF</button>;
}
