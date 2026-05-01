"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

export function AuthNav() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <div className="fixed right-5 top-5 z-20 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
      {isLoaded && !isSignedIn ? (
        <>
          <SignInButton mode="modal">
            <button className="border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">
              sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="border border-[var(--color-accent)] bg-[var(--color-accent)] px-3 py-2 text-black">
              request access
            </button>
          </SignUpButton>
        </>
      ) : null}
      {isSignedIn ? (
        <>
          <div className="border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-muted)]">
            member
          </div>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "size-8",
              },
            }}
          />
        </>
      ) : null}
    </div>
  );
}
