import type { Metadata } from "next";
import "./globals.css";
import "./atelier.css";
import "./outreach.css";

export const metadata: Metadata = {
  title: "Customer Segment Studio V3 | Evidence + Action",
  description:
    "Inspect the customers and evidence behind nine purchase-history groups, then export a practical action list. Deterministic RFM with optional guidance.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><a className="studio-skip" href="#main">Skip to the Studio</a>{children}</body>
    </html>
  );
}
