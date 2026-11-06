import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Backdrop } from "@/components/Backdrop";
import IntakeForm from "./IntakeForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { plan, tier: _t, ...initial } = profile ?? {};
  const custom = plan?.training?.custom ? { days: profile!.training_days as number, equipment: profile!.equipment as string } : null;
  return (
    <>
      <Backdrop intensity={0.6} />
      <IntakeForm initial={initial} customTraining={custom} />
    </>
  );
}
