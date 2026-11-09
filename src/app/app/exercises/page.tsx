import { ExerciseBrowser } from "./ExerciseBrowser";

export const metadata = { title: "Exercise library · Liftkai" };

export default async function ExercisesPage(props: { searchParams: Promise<{ g?: string; q?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Library</p>
        <h1 className="h-display mt-1 text-4xl md:text-5xl">Exercises</h1>
        <p className="mt-2 max-w-xl text-sm text-bone-dim">The moves coaches actually program, for gym and home. Tap any exercise for a demo, step-by-step form guide and your PRs.</p>
      </div>
      <ExerciseBrowser initialGroup={searchParams.g} initialQuery={searchParams.q} />
    </div>
  );
}
