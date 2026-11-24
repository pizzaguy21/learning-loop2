"use client";

import { useState } from "react";
import { signInWithGoogle, useAuth } from "@/lib/auth";
import { Button, ErrorBox, friendlyError, Spinner } from "./ui";

export function GoogleButton() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-3">
      <Button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await signInWithGoogle();
          } catch (err) {
            setError(friendlyError(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        Masuk dengan Google
      </Button>
      {error && <ErrorBox>{error}</ErrorBox>}
    </div>
  );
}

/** Renders children only for a signed-in user; otherwise a sign-in prompt. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user)
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-stone-700">Masuk dulu untuk membuka halaman ini.</p>
        <div className="flex justify-center">
          <GoogleButton />
        </div>
      </div>
    );
  return <>{children}</>;
}
