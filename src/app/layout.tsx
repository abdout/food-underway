import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Menu",
  description: "Electronic menu on the fly",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Root layout should not render html/body tags when using [lang] dynamic routes
  // The [lang]/layout.tsx handles the html/body tags with proper locale support
  return <>{children}</>;
}
