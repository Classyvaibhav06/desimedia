"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, MessageCircle } from "lucide-react";

interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  _count: {
    followers: number;
    following: number;
  };
}

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (!res.ok) {
          setError("User not found");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-black p-4 md:p-8 justify-center items-center">
        <div className="animate-pulse">
          <div className="h-32 w-32 bg-[#222] rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col h-full bg-black p-4 md:p-8 justify-center items-center gap-4">
        <h1 className="text-xl font-bold text-white">Profile Not Found</h1>
        <Link href="/discover" className="text-[#eaebec] hover:text-white transition-colors">
          ← Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto p-4 md:p-8 pb-20">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#888] hover:text-white transition-colors mb-6"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        {/* Profile Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 md:p-8 rounded-2xl bg-[#111] border border-[#222]">
          <div className="relative">
            <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full overflow-hidden bg-gradient-to-tr from-[#222] to-[#333] border-4 border-[#111] text-white flex items-center justify-center text-4xl font-bold shadow-xl">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                user?.displayName?.charAt(0).toUpperCase() || "U"
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight truncate">
              {user?.displayName}
            </h1>
            <p className="text-sm md:text-base text-[#888] font-medium mt-1 truncate">
              @{user?.username}
            </p>

            {user?.bio && (
              <p className="text-sm text-[#ccc] mt-3 line-clamp-2">
                {user.bio}
              </p>
            )}

            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#222]/50">
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-xl font-bold text-white">{user?._count.followers}</span>
                <span className="text-xs text-[#888] font-medium uppercase tracking-wider">Followers</span>
              </div>
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-xl font-bold text-white">{user?._count.following}</span>
                <span className="text-xs text-[#888] font-medium uppercase tracking-wider">Following</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#222]/50">
              <button className="flex-1 sm:flex-none px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-[#ccc] transition-colors text-sm">
                Follow
              </button>
              <button className="flex-1 sm:flex-none px-6 py-2 border border-[#333] text-white font-semibold rounded-lg hover:border-[#555] hover:bg-[#111] transition-colors text-sm flex items-center justify-center gap-2">
                <MessageCircle size={16} />
                Message
              </button>
            </div>
          </div>
        </div>

        {/* Joined Info */}
        <div className="mt-8 p-4 md:p-6 rounded-xl bg-[#111] border border-[#222]">
          <p className="text-sm text-[#888]">
            Joined {new Date(user.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
