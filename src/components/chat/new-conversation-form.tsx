"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Users, User, Plus } from "lucide-react";

export function NewConversationForm({ currentUserId }: { currentUserId?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"DM" | "GROUP">("DM");
  const [participantIds, setParticipantIds] = useState("");
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const ids = participantIds
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: mode,
        participantIds: ids,
        groupName: mode === "GROUP" ? groupName : undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not create conversation");
      return;
    }

    const body = (await res.json()) as { conversation: { id: string } };
    setParticipantIds("");
    setGroupName("");
    router.push(`/chat/${body.conversation.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex p-1 bg-[#222] rounded-lg">
        <button
          type="button"
          onClick={() => setMode("DM")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
            mode === "DM" ? "bg-black text-white shadow-sm" : "text-[#888] hover:text-white"
          }`}
        >
          <User size={16} />
          Direct
        </button>
        <button
          type="button"
          onClick={() => setMode("GROUP")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
            mode === "GROUP" ? "bg-black text-white shadow-sm" : "text-[#888] hover:text-white"
          }`}
        >
          <Users size={16} />
          Group
        </button>
      </div>

      {mode === "GROUP" && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#888]">Group Name</label>
          <input
            required
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Meme Lords"
            className="w-full bg-black border border-[#333] text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[#888]">
          Participant IDs <span className="text-[#555]">(comma separated)</span>
        </label>
        <input
          required
          value={participantIds}
          onChange={(e) => setParticipantIds(e.target.value)}
          placeholder={mode === "DM" ? "User ID" : "User ID 1, User ID 2..."}
          className="w-full bg-black border border-[#333] text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors"
        />
      </div>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full flex items-center justify-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-lg hover:bg-[#ccc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {loading ? (
          <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" />
        ) : (
          <>
            <Plus size={18} />
            {mode === "DM" ? "Start Direct Message" : "Create Group"}
          </>
        )}
      </button>
    </form>
  );
}
