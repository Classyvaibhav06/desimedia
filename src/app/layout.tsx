import type { Metadata } from "next";
import "./globals.css";
import { GlobalCallUI } from "@/components/chat/global-call-ui";
import { SocketProvider } from "@/components/providers/socket-provider";
import Providers from "./providers"; // assuming they have standard providers

export const metadata: Metadata = {
  title: "DesiMedia",
  description: "Realtime groups, DMs, and meme sharing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased">
        <Providers>
          <SocketProvider>
            {children}
            <GlobalCallUI />
          </SocketProvider>
        </Providers>
      </body>
    </html>
  );
}
