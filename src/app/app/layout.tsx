import { AppNav } from "@/components/AppNav";
import { requireProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  return (
    <div className="relative z-10 min-h-screen">
      <AppNav tier={profile.tier} name={profile.full_name} />
      <div className="px-5 pb-28 pt-6 md:ml-60 md:px-10 md:pb-12 md:pt-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </div>
    </div>
  );
}
