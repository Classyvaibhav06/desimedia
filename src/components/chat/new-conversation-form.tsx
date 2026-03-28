"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import { Users, User, Plus, Search, X, Check } from "lucide-react";

type FetchedUser = {
  id: string;
  displayName: string | null;
  username: string;
  avatarUrl: string | null;
};

export function NewConversationForm({ currentUserId }: { currentUserId?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"DM" | "GROUP">("DM");
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User Selection State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FetchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<FetchedUser[]>([]);

  // Toggle mode should reset selections if moving from GROUP -> DM and we have > 1 selected
  const handleModeChange = (newMode: "DM" | "GROUP") => {
    setMode(newMode);
    if (newMode === "DM" && selectedUsers.length > 1) {
      setSelectedUsers([selectedUsers[0]]);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchUsers = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/users?q=${encodeURIComponent(searchQuery)}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (active) {
          setSearchResults(data.users || []);
        }
      } catch (err) {
        if (active) setSearchResults([]);
      } finally {
        if (active) setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      fetchUsers();
    }, 300); // 300ms debounce

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const toggleUserSelection = (user: FetchedUser) => {
    if (mode === "DM") {
      // In DM mode, only one user can be selected
      setSelectedUsers([user]);
      setSearchQuery(""); // clear search query on select for better UX
    } else {
      // Group mode
      const isSelected = selectedUsers.some((u) => u.id === user.id);
      if (isSelected) {
        setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
      } else {
        setSelectedUsers([...selectedUsers, user]);
      }
    }
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedUsers.length === 0) {
      setError("Please select at least one user.");
      return;
    }
    setError(null);
    setLoading(true);

    const ids = selectedUsers.map((u) => u.id);

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
    setSelectedUsers([]);
    setGroupName("");
    setSearchQuery("");
    router.push(`/chat/${body.conversation.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 max-h-[70vh]">
      <div className="flex p-1 bg-[#222] rounded-lg shrink-0">
        <button
          type="button"
          onClick={() => handleModeChange("DM")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
            mode === "DM" ? "bg-black text-white shadow-sm" : "text-[#888] hover:text-white"
          }`}
        >
          <User size={16} />
          Direct
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("GROUP")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
            mode === "GROUP" ? "bg-black text-white shadow-sm" : "text-[#888] hover:text-white"
          }`}
        >
          <Users size={16} />
          Group
        </button>
      </div>

      {mode === "GROUP" && (
        <div className="flex flex-col gap-2 shrink-0">
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

      {/* Selected Users Chips */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 shrink-0">
          {selectedUsers.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-2 bg-[#222] border border-[#333] rounded-full pl-2 pr-1 py-1"
            >
              {u.avatarUrl ? (
                <img src={u.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#444] text-xs flex items-center justify-center font-bold">
                  {u.displayName?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <span className="text-xs font-medium text-white max-w-[100px] truncate">
                {u.displayName || u.username}
              </span>
              <button
                type="button"
                onClick={() => removeUser(u.id)}
                className="w-5 h-5 rounded-full hover:bg-[#444] flex items-center justify-center text-[#aaa] hover:text-white transition-colors shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 min-h-0 flex-1">
        <label className="text-sm font-medium text-[#888]">
          {mode === "DM" ? "Select User" : "Add Participants"}
        </label>
        
        {/* Search Input */}
        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" size={16} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full bg-black border border-[#333] text-white rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-white transition-colors"
          />
          {isSearching && (
             <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#888] border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto mt-2 border border-[#222] rounded-lg bg-black">
          {searchResults.length === 0 && !isSearching ? (
             <div className="p-4 text-center text-xs text-[#555]">
               {searchQuery ? "No users found" : "Type to see available users"}
             </div>
          ) : (
             <div className="flex flex-col divide-y divide-[#222]">
               {searchResults.map((u) => {
                 const isSelected = selectedUsers.some(sel => sel.id === u.id);
                 return (
                   <div 
                     key={u.id}
                     onClick={() => toggleUserSelection(u)}
                     className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                       isSelected ? "bg-[#161616]" : "hover:bg-[#111]"
                     }`}
                   >
                     <div className="relative">
                       {u.avatarUrl ? (
                         <img src={u.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#333]" />
                       ) : (
                         <div className="w-9 h-9 rounded-full bg-[#222] border border-[#333] text-sm flex items-center justify-center font-bold text-[#eaebec]">
                           {u.displayName?.charAt(0).toUpperCase() || "U"}
                         </div>
                       )}
                       {isSelected && (
                         <div className="absolute -bottom-1 -right-1 bg-white text-black rounded-full p-0.5 border-2 border-black">
                           <Check size={10} strokeWidth={4} />
                         </div>
                       )}
                     </div>
                     <div className="flex flex-col min-w-0 flex-1">
                       <span className={`text-sm font-semibold truncate ${isSelected ? "text-white" : "text-[#eaebec]"}`}>
                         {u.displayName || u.username}
                       </span>
                       <span className="text-xs text-[#888] truncate">
                         @{u.username}
                       </span>
                     </div>
                   </div>
                 );
               })}
             </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500 font-medium shrink-0">{error}</p>}

      <button
        type="submit"
        disabled={loading || selectedUsers.length === 0}
        className="mt-2 w-full flex shrink-0 items-center justify-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-lg hover:bg-[#ccc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
