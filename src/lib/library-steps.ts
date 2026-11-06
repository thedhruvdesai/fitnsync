/** Step-by-step instructions, kept separate so lists and thumbnails don't download them. */
import steps from "@/data/exercise-steps.json";

const STEPS = steps as Record<string, string[]>;
export const stepsFor = (id: string): string[] => STEPS[id] ?? [];
