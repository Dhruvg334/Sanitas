import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanitas",
  description: "AI Clinical Document Reviewer",
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
