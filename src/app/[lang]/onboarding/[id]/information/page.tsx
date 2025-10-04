import { redirect } from "next/navigation";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Redirecting...",
};

interface InformationPageProps {
  params: Promise<{ lang: Locale; id: string }>;
}

export default async function Information({ params }: InformationPageProps) {
  const { lang, id } = await params;
  redirect(`/${lang}/onboarding/${id}/title`);
}