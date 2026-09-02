import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/supabase/auth";

export default async function Home() {
  const user = await getAuthenticatedUser();
  redirect(user ? "/dashboard" : "/login");
}
