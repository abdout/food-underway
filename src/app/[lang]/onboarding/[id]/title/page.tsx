import TitleContent from "@/components/onboarding/title/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "اسم المطعم باللغة العربية",
};

interface TitlePageProps {
  params: Promise<{ lang: Locale }>
}

export default async function TitlePage({ params }: TitlePageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <TitleContent />;
}
