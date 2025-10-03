import InformationContent from "@/components/onboarding/information/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Information",
};

interface InformationPageProps {
  params: Promise<{ lang: Locale }>
}

export default async function Information({ params }: InformationPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <InformationContent dictionary={dictionary.school} />;
}