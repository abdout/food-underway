import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/join/form";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface RegisterPageProps {
  params: Promise<{ lang: Locale }>
}

const RegisterPage = async ({ params }: RegisterPageProps) => {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <Suspense fallback={<div className="h-10" />}>
      <RegisterForm dictionary={dictionary} />
    </Suspense>
  );
}

export default RegisterPage;