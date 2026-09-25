import type { Metadata } from "next";
import "./globals.css";
import NavHeader from "./components/NavHeader";

export const metadata: Metadata = {
  title: "Sanitas | AI Clinical Document Reviewer",
  description:
    "Evidence-grounded clinical document review with adaptive multimodal routing and deterministic verification.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NavHeader />
        {children}
      </body>
    </html>
  );
}
