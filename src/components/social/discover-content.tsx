"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserPlus, Search, Eye } from "lucide-react";

import { FollowButton } from "@/components/social/follow-button";
import { MessageUserButton } from "@/components/social/message-user-button";

type DiscoverUser = {
  id: string;
  displayName: string | null;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  isFollowing?: boolean;
};

type Props = {
  initialUsers: DiscoverUser[];
  followingIds: string[];
};

export function DiscoverContent({ initialUsers, followingIds }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<DiscoverUser[]>(
    initialUsers.map((u) => ({
      ...u,
      isFollowing: followingIds.includes(u.id),
    }))
  );
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setUsers(
        initialUsers.map((u) => ({
          ...u,
          isFollowing: followingIds.includes(u.id),
        }))
      );
      return;
    }

    let active = true;
    const fetchUsers = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/users?q=${encodeURIComponent(searchQuery)}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (active) {
          setUsers(data.users || []);
        }
      } catch (err) {
        if (active) setUsers([]);
      } finally {
        if (active) setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, initialUsers, followingIds]);

  return (
    <>
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users by name or username..."
          className="w-full bg-[#111] border border-[#222] text-white rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#444] transition-colors placeholder:text-[#555]"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#888] border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <div className="flex flex-col gap-3">
        {users.map((u) => {
          return (
            <div
              key={u.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#111]/50 border border-[#222] hover:border-[#333] transition-colors"
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-tr from-[#222] to-[#333] flex items-center justify-center border border-[#444] text-white font-bold text-lg">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.username} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    u.displayName?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <p className="text-base font-semibold text-white truncate">
                    {u.displayName || u.username}
                  </p>
                  <p className="text-sm text-[#888] truncate">@{u.username}</p>
                  {u.bio && (
                    <p className="mt-1.5 text-sm text-[#ccc] line-clamp-2 pb-1">
                      {u.bio}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 mt-2 sm:mt-0">
                <Link
                  href={`/users/${u.id}`}
                  className="px-3 py-1.5 border border-[#444] text-[#888] hover:text-white rounded-lg hover:border-[#666] transition-colors text-xs font-medium flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Eye size={14} />
                  <span>View</span>
                </Link>
                <FollowButton userId={u.id} initialFollowing={!!u.isFollowing} />
                <MessageUserButton userId={u.id} />
              </div>
            </div>
          );
        })}
        {users.length === 0 && (
          <div className="py-12 text-center border border-dashed border-[#333] rounded-xl flex flex-col items-center justify-center gap-3">
            <UserPlus size={32} className="text-[#555]" />
            <p className="text-sm text-[#888]">
              {searchQuery ? "No matching users found." : "No other users found right now."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
