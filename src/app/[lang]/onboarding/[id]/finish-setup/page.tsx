import FinishSetupContent from "@/components/onboarding/finish-setup/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Complete Setup",
};

interface FinishSetupPageProps {
  params: Promise<{ lang: Locale }>
}

export default async function FinishSetupPage({ params }: FinishSetupPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <FinishSetupContent dictionary={dictionary.school} />;
}
