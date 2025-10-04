import OnboardingContent from '@/components/onboarding/content';
import { getDictionary } from '@/components/internationalization/dictionaries';
import { type Locale } from '@/components/internationalization/config';
import type { Metadata } from 'next';

interface OnboardingPageProps {
  params: Promise<{ lang: Locale }>
}

export async function generateMetadata({ params }: OnboardingPageProps): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  
  return {
    title: dictionary.marketing?.hero?.title || "Menu",
    description: dictionary.metadata?.description || "Cloud-based menu on the fly",
  };
}

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <OnboardingContent dictionary={dictionary} locale={lang} />;
}