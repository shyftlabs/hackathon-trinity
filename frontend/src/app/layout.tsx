import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Synapse | Learning that connects.",
  description: "Teachers upload course material. Students get AI-powered study guides — notes, cards, audio, and maps — all from a single class link.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
