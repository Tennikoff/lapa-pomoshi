import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "Лапа Помощи — Платформа помощи животным",
  description:
    "Умная платформа для координации волонтёрской помощи бездомным животным",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body
        className={manrope.className}
        style={{ margin: 0, background: "#f7f8fb" }}
      >
        {children}
      </body>
    </html>
  );
}
