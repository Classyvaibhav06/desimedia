"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type MessageUserButtonProps = {
  userId: string;
};

export function MessageUserButton({ userId }: MessageUserButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function startDm() {
    if (loading) return;
    setLoading(true);

    const res = await fetch("/api/conversations/dm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: userId }),
    });

    setLoading(false);

    if (!res.ok) return;
    const data = (await res.json()) as { conversationId: string };
    router.push(`/chat/${data.conversationId}`);
  }

  return (
    <button
      type="button"
      onClick={startDm}
      disabled={loading}
      className="rounded-lg border border-[#333] bg-[#0a0a0a] text-white px-3 py-1.5 text-xs font-semibold hover:bg-[#1a1a1a] hover:border-[#555] transition-colors disabled:opacity-50"
    >
      {loading ? "Opening..." : "Message"}
    </button>
  );
}
