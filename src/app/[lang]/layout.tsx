import type { Metadata } from "next";
import { Inter, Tajawal } from "next/font/google";
import { type Locale, localeConfig, i18n } from "@/components/internationalization/config";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/atom/theme-provider";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import "../globals.css";

// Configure fonts
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  variable: '--font-tajawal',
  weight: ['200', '300', '400', '500', '700', '800', '900'],
  display: 'swap'
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  const config = localeConfig[lang];

  return {
    title: dictionary.metadata?.title || "Menu - Electronic menu on the fly",
    description: dictionary.metadata?.description || "Electronic menu on the fly",
    other: {
      'accept-language': lang,
    },
    alternates: {
      languages: {
        'en': '/en',
        'ar': '/ar',
        'x-default': '/en',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const session = await auth();
  const config = localeConfig[lang];
  const isRTL = config.dir === 'rtl';

  return (
    <html lang={lang} dir={config.dir} suppressHydrationWarning>
      <body
        className={`${isRTL ? tajawal.className : inter.className} ${inter.variable} ${tajawal.variable} antialiased`}
      >
        <SessionProvider session={session}>
            <ThemeProvider>
              {children}
              <Toaster />
            </ThemeProvider>
         
        </SessionProvider>
      </body>
    </html>
  );
}

// Generate static params for all supported locales
export function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}