import type { Metadata } from "next";
import "@/styles/globals.css";
import Header from "@/components/header";
import { space_grotesk } from "@/data/fonts";

export const metadata: Metadata = {
  title: {
    default: "COSKETCH",
    template: `%s | COSKETCH`,
  },

  description:
    "A real-time collaborative sketching tool for teams to brainstorm, draw, and create together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Favicons */}
      <link
        rel="icon"
        type="image/png"
        href="/favicons/favicon-96x96.png"
        sizes="96x96"
      />
      <link rel="icon" type="image/svg+xml" href="/favicons/favicon.svg" />
      <link rel="shortcut icon" href="/favicons/favicon.ico" />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/favicons/apple-touch-icon.png"
      />
      <meta name="apple-mobile-web-app-title" content="CoSketch" />
      <link rel="manifest" href="/favicons/site.webmanifest" />

      <body className={`${space_grotesk.className} antialiased`}>
        <Header />
        {children}
      </body>
    </html>
  );
}
