import "server-only";
import { join } from "node:path";
import { Font } from "@react-pdf/renderer";

// The built-in PDF fonts lack Turkish glyphs (ş, ğ, ı, İ), so Geist is embedded from the package.
const FONT_DIR = join(process.cwd(), "node_modules", "geist", "dist", "fonts", "geist-sans");
// Every route that renders a PDF must list these files in next.config outputFileTracingIncludes.

Font.register({
  family: "Geist",
  fonts: [
    { src: join(FONT_DIR, "Geist-Regular.ttf"), fontWeight: 400 },
    { src: join(FONT_DIR, "Geist-SemiBold.ttf"), fontWeight: 600 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);
