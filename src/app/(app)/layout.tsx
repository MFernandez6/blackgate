import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await getSession();
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    console.error("[BLACKGATE] staff session check failed", err);
    redirect("/login");
  }
  if (!session?.user) redirect("/login");
  return <AppShell user={session.user}>{children}</AppShell>;
}
