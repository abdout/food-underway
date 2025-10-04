import UnderProcess from "@/components/atom/under-process";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Dashboard",
  description: "Operator dashboard overview"
};

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Dashboard({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <UnderProcess title="Operator Dashboard" />;
}
