import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";

export async function getRequiredUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
