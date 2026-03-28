import { redirect } from "next/navigation";
import Link from "next/link";
import { UserPlus, Search, Eye } from "lucide-react";

import { FollowButton } from "@/components/social/follow-button";
import { MessageUserButton } from "@/components/social/message-user-button";
import { getRequiredUserId } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";

export default async function DiscoverPage() {
  const userId = await getRequiredUserId();
  if (!userId) {
    redirect("/auth/login");
  }

  const users = await prisma.user.findMany({
    where: { id: { not: userId } },
    select: {
      id: true,
      displayName: true,
      username: true,
      bio: true,
      avatarUrl: true,
    },
    take: 30,
    orderBy: { createdAt: "desc" },
  });

  const following = await prisma.userRelationship.findMany({
    where: {
      followerId: userId,
      status: "FOLLOWING",
    },
    select: { followingId: true },
  });
  const followingIds = new Set(following.map((r) => r.followingId));

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="p-4 md:p-8 flex flex-col gap-6 max-w-2xl mx-auto w-full">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">Discover</h1>
          <p className="text-sm text-[#888]">Find friends and communities to join.</p>
        </div>

        {/* Fake Search Input for aesthetics */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" size={18} />
          <input 
            type="text" 
            placeholder="Search users..." 
            className="w-full bg-[#111] border border-[#222] text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#444] transition-colors placeholder:text-[#555]"
          />
        </div>

        <div className="flex flex-col gap-3">
          {users.map((u) => {
            const isFollowing = followingIds.has(u.id);
            return (
              <div
                key={u.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#111]/50 border border-[#222] hover:border-[#333] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-tr from-[#222] to-[#333] flex items-center justify-center border border-[#444] text-white font-bold text-lg">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.username} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      u.displayName?.charAt(0).toUpperCase() || "U"
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-base font-semibold text-white truncate">
                      {u.displayName || u.username}
                    </p>
                    <p className="text-sm text-[#888] truncate">@{u.username}</p>
                    {u.bio && (
                      <p className="mt-1.5 text-sm text-[#ccc] line-clamp-2">
                        {u.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <Link
                    href={`/users/${u.id}`}
                    className="px-3 py-1.5 border border-[#444] text-[#888] hover:text-white rounded-lg hover:border-[#666] transition-colors text-xs font-medium flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </Link>
                  <FollowButton
                    userId={u.id}
                    initialFollowing={isFollowing}
                  />
                  <MessageUserButton userId={u.id} />
                </div>
              </div>
            );
          })}
          {users.length === 0 && (
            <div className="py-12 text-center border border-dashed border-[#333] rounded-xl flex flex-col items-center justify-center gap-3">
              <UserPlus size={32} className="text-[#555]" />
              <p className="text-sm text-[#888]">No other users found right now.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
