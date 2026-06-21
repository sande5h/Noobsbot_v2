import "./globals.css";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import PCBBackground from "./components/PCBBackground";
import Nav from "./components/Nav";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata = {
  title: "Noobsbot",
  description: "Noobsbot website (v2).",
};

// Start at 100% scale. user-scalable left on so people can still pinch-zoom
// (locking it down hurts accessibility).
export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>
        <PCBBackground />
        <div className="screen">
          <Nav />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
