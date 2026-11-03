import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3色読書ノート",
  description: "紙の本もKindleも、3色で記録して、考えと行動につなげる読書ノート",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f6f3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full">
        <div className="mx-auto min-h-full w-full max-w-xl">{children}</div>
      </body>
    </html>
  );
}
