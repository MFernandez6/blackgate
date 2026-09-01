import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

function isNextRedirect(err: unknown) {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export default async function LoginPage() {
  try {
    const session = await getSession();
    if (session) redirect("/queue");
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    console.error("[BLACKGATE] login session check failed", err);
  }
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
