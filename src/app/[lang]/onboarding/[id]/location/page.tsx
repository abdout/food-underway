import LocationContent from "@/components/onboarding/location/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "School Location | Onboarding",
  description: "Set your school's location and address details.",
};

interface PageProps {
  params: Promise<{ lang: Locale }>
}

export default async function Location({ params }: PageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <LocationContent dictionary={dictionary.school} />;
}