import "./globals.css";
import type { Metadata } from "next";
import { ClientBody } from "./ClientBody";

export const metadata: Metadata = {
  title: "Nubien - Premium AI Agency & Studio",
  description:
    "Nubien is a premium AI agency and landing page template, perfect for showcasing your brand with a sleek, modern design, responsive layouts, and easy customization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
