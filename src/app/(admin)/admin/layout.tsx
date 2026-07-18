import type { Metadata } from "next";
import { Anton, Be_Vietnam_Pro, Cairo } from "next/font/google";
import "@/app/globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});
// "Be Vietnam" is the body typeface named in the ROMZ brand book (page 8).
const beVietnam = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-body",
});
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "ROMZ Admin",
  description: "ROMZ Athletic Wear — admin dashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${anton.variable} ${beVietnam.variable} ${cairo.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
