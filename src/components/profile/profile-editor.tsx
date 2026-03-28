"use client";

import { FormEvent, useState } from "react";
import { Save } from "lucide-react";

type ProfileEditorProps = {
  initialDisplayName: string;
  initialBio: string;
};

export function ProfileEditor({ initialDisplayName, initialBio }: ProfileEditorProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, bio }),
    });

    setSaving(false);
    setMessage(res.ok ? "Profile saved successfully." : "Failed to save profile.");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[#888]">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="What should we call you?"
          className="w-full bg-[#111] border border-[#333] text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[#888]">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="Write something about yourself..."
          className="w-full bg-[#111] border border-[#333] text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors resize-none"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-[#888]">
          {message}
        </p>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-white text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-[#ccc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {saving ? <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full" /> : <Save size={16} />}
          <span>{saving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>
    </form>
  );
}
