import type { Metadata } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ChatProvider } from "@/components/chat/chat-context";
import { ConvexAuthNextjsServerProvider } from "@/lib/auth/convexAuth";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Imvelaphi · Family Tree",
  description: "Where we come from: your family, its stories and its roots.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="h-full">
        {/* The auth provider reads the session cookie, so it renders per request. */}
        <Suspense fallback={null}>
          <ConvexAuthNextjsServerProvider>
            <ChatProvider>
              <AppShell>{children}</AppShell>
            </ChatProvider>
          </ConvexAuthNextjsServerProvider>
        </Suspense>
      </body>
    </html>
  );
}
