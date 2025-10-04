import { redirect } from "next/navigation";

export const metadata = {
  title: "Redirecting...",
};

interface PageProps {
  params: Promise<{ id: string; lang: string }>;
}

export default async function Join({ params }: PageProps) {
  const { id, lang } = await params;
  redirect(`/${lang}/onboarding/${id}/title`);
}