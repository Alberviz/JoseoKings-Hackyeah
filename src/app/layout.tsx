import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/components/providers/AppProviders/AppProviders";
import { APP_DESCRIPTION, APP_NAME } from "@/config/app";
import { theme } from "@/theme/theme";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
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
    <html lang="en" dir="ltr">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
