import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Bricolage_Grotesque } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders/AppProviders";
import { APP_DESCRIPTION, APP_NAME } from "@/config/app";
import { theme } from "@/theme/theme";

// Self-hosted at build time, so the fonts also work offline. Exposed as CSS variables for the theme.
const headingFont = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading",
  display: "swap",
});

const bodyFont = Atkinson_Hyperlegible({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL("https://mycrohnie.vercel.app"),
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: "/",
    siteName: APP_NAME,
    type: "website",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: APP_NAME }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: theme.colors.primary,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" dir="ltr" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
