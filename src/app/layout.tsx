import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hiring Assessment",
  description: "Candidate interviews and HR assessment review",
  referrer: "no-referrer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
