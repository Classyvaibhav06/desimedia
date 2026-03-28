import { redirect } from "next/navigation";

import { getRequiredUserId } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { DiscoverContent } from "@/components/social/discover-content";

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
  const followingIds = following.map((r) => r.followingId);

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="p-4 md:p-8 flex flex-col gap-6 max-w-2xl mx-auto w-full">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">Discover</h1>
          <p className="text-sm text-[#888]">Find friends and communities to join.</p>
        </div>

        <DiscoverContent 
          initialUsers={users} 
          followingIds={followingIds} 
        />
      </div>
    </div>
  );
}
