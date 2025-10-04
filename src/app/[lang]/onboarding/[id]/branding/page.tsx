import BrandingContent from "@/components/onboarding/branding/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "شعار المطعم",
};

interface BrandingPageProps {
  params: Promise<{ lang: Locale }>
}

export default async function BrandingPage({ params }: BrandingPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <BrandingContent />;
}
