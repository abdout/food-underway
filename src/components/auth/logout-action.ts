"use server";

import { signOut } from "@/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const logout = async () => {
  console.log('🚪 LOGOUT ACTION TRIGGERED');

  // Get the locale from cookies
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE');
  const locale = localeCookie?.value || 'ar'; // Default to Arabic

  console.log('🚪 LOGOUT - Locale from cookie:', locale);

  // Sign out without redirect (we'll handle it manually)
  await signOut({
    redirect: false
  });

  // Manually redirect to home page with locale
  console.log('🚪 LOGOUT - Redirecting to:', `/${locale}`);
  redirect(`/${locale}`);
};
