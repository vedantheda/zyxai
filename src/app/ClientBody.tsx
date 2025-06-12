"use client";

import { usePathname } from "next/navigation";

export function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // For the SaaS app, we don't need the marketing navigation
  // The dashboard has its own layout with sidebar navigation
  if (pathname.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  // For auth pages, return clean layout
  if (pathname === '/login' || pathname === '/register') {
    return <>{children}</>;
  }

  // Default layout for any other pages (redirect to dashboard)
  return <>{children}</>;
}
