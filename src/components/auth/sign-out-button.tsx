"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/auth/login" })}
      className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-black/5"
    >
      Sign out
    </button>
  );
}
