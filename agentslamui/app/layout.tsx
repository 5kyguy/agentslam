import type { Metadata } from "next";
import { Navigation } from "@/components/agentslam/Navigation";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import "./agentslam-bento.css";

export const metadata: Metadata = {
  title: "AgentSlam",
  description: "Simulated AI strategy battles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <Navigation />
          <main style={{ paddingTop: 54 }}>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
