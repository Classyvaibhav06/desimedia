"use client";

import { useState } from "react";

type FollowButtonProps = {
  userId: string;
  initialFollowing: boolean;
};

export function FollowButton({ userId, initialFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    setLoading(true);

    const method = isFollowing ? "DELETE" : "POST";
    const res = await fetch(`/api/users/${userId}/follow`, { method });

    if (res.ok) {
      setIsFollowing((prev) => !prev);
    }

    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={
        isFollowing
          ? "rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold"
          : "rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white"
      }
    >
      {loading ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
