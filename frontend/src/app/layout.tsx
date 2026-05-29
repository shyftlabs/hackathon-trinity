import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flux | Study from the source",
  description: "Turn course material into focused study sessions with notes, cards, quizzes, audio, and maps.",
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
