import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanitas",
  description:
    "Sanitas: a clinical document reviewer for synthetic data, currently under development.",
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
