"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  // CardDescription,
  CardHeader,
  // CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { LoginSchema, PhoneLoginSchema } from "../validation";
import { login } from "./action";
import { ErrorToast, SuccessToast } from "@/components/atom/toast";

import { Social } from "../social";
import { Suspense } from "react";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import { ChevronDown } from "lucide-react";
import { Icons } from "@/components/atom/icons";

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  dictionary?: Dictionary;
}

export const LoginForm = ({
  className,
  dictionary,
  ...props
}: LoginFormProps) => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const tenant = searchParams.get("tenant");

  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Handle OAuth errors
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError === "OAuthAccountNotLinked") {
      ErrorToast("Email already in use with different provider!");
    }
  }, [searchParams]);

  // Handle tenant redirect after successful login (now handled in onSubmit)

  // Use a single form for email login
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const phoneForm = useForm<z.infer<typeof PhoneLoginSchema>>({
    resolver: zodResolver(PhoneLoginSchema),
    defaultValues: {
      phone: "",
    },
  });

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();

    // Get email value directly
    const emailValue = form.getValues('email');
    if (!emailValue || !emailValue.includes('@')) {
      ErrorToast(dictionary?.auth?.invalidEmail || "Please enter a valid email address");
      return;
    }

    // Show password field
    setShowPasswordField(true);
  };

  const onSubmit = (values: any) => {

    // If phone login, show placeholder message for now
    if (loginMethod === 'phone') {
      ErrorToast(dictionary?.auth?.phoneLoginNotAvailable || "Phone login will be available soon. Please use email login for now.");
      return;
    }

    // Construct callback URL with tenant if present
    let finalCallbackUrl = callbackUrl;
    if (tenant && !finalCallbackUrl?.includes('tenant=')) {
      const separator = finalCallbackUrl?.includes('?') ? '&' : '?';
      finalCallbackUrl = `${finalCallbackUrl || '/dashboard'}${separator}tenant=${tenant}`;
    }

    console.log('📋 LOGIN FORM SUBMIT:', {
      tenant,
      callbackUrl,
      finalCallbackUrl,
      hasValues: !!values
    });

    startTransition(() => {
      login(values, finalCallbackUrl)
        .then((data) => {
          if (data?.error) {
            form.reset();
            ErrorToast(data.error);
          }
          if (data?.success) {
            form.reset();
            SuccessToast();
          }
          if (data?.twoFactor) {
            setShowTwoFactor(true);
          }
        })
        .catch(() => ErrorToast("Something went wrong"));
    });
  };

  return (
    <div className={cn("flex flex-col gap-6 min-w-[200px] md:min-w-[450px]", className)} {...props}>
      <Card className="border-0 shadow-2xl bg-white rounded-[16px] ">
        <CardHeader>
          <h4 className="text-primary">
            {dictionary?.auth?.loginTitle || "تسجيل الدخول"}
          </h4>
          <p className='text-sm'>
            {dictionary?.auth?.loginSubtitle || "يرجى اختيار طريقة تسجيل الدخول المفضلة لديك"}
          </p>
        </CardHeader>
        <CardContent>
          {loginMethod === 'phone' ? (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onSubmit)} className="grid gap-6">
                {/* Phone Login Section */}
                <div className="grid gap-4">
                  {/* Phone Input with Country Code */}
                  <div dir="rtl">
                    <FormField
                      control={phoneForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type="tel"
                                placeholder={dictionary?.auth?.phoneLabel || "رقم الجوال"}
                                disabled={isPending}
                                className="pr-12 pl-[100px] bg-transparent border-primary placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary text-right"
                                dir="ltr"
                              />
                              <Icons.phoneIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />

                              {/* Country code selector - integrated with vertical divider */}
                              <div className="absolute left-[1px] top-1/2 -translate-y-1/2 flex items-center h-[16px]">
                                <div className="h-full w-[2px] bg-muted mr-2" />
                                <button
                                  type="button"
                                  className="flex items-center gap-1 px-3 h-full hover:bg-[#f1f3f5] rounded-l-md transition-colors"
                                  disabled={isPending}
                                >
                                  <span className="text-[15px] font-medium text-[#2c3e50]">+966</span>
                                  <ChevronDown className="h-4 w-4 text-[#718096]" />
                                </button>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    disabled={isPending}
                    type="submit"
                    className="w-full"
                  >
                    {dictionary?.auth?.signIn || "تسجيل دخول"}
                  </Button>
                </div>

                {/* Divider */}
                <h6 className="flex items-center justify-center">
                  {dictionary?.auth?.orContinueWith || "أو التسجيل عن طريق"}
                </h6>

                {/* OAuth and Alternative Login Methods */}
                <div className="grid gap-3">
                  <Suspense fallback={<div className="" />}>
                    <Social />
                  </Suspense>

                  {/* Toggle to Email */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setLoginMethod('email');
                      setShowPasswordField(false);
                    }}
                    className="w-full"
                  >
                    <Icons.emailIcon className="w-5 h-5 mr-2 text-primary" />
                    {dictionary?.auth?.signInWithEmail || "البريد الإلكتروني"}
                  </Button>
                </div>

                {/* Sign Up Link */}
                <div className="text-center text-sm pb-2">
                  <span className="text-[#718096]">
                    {dictionary?.auth?.dontHaveAccountPrefix || "ليس لديك حساب؟"}
                  </span>{" "}
                  <Link href="/join" className="text-primary text-sm font-medium hover:text-[#4a6a6e] transition-colors">
                    {dictionary?.auth?.createAccount || "إنشاء حساب جديد"}
                  </Link>
                </div>
              </form>
            </Form>
          ) : (
            <Form {...form}>
              <form onSubmit={
                (!showPasswordField) ? handleContinue : form.handleSubmit(onSubmit)
              } className="grid gap-6">
                {/* Email Login Section */}
                <div className="grid gap-4">
                  {showTwoFactor ? (
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem className="grid gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isPending}
                              placeholder={dictionary?.auth?.twoFactorCode || "Two Factor Code"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <>
                      {/* Email & Password Fields - Show one at a time */}
                      {!showPasswordField ? (
                        // Show email field only
                        <div dir="rtl">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      {...field}
                                      id="email"
                                      type="email"
                                      disabled={isPending}
                                      placeholder={dictionary?.auth?.emailLabel || "البريد الإلكتروني"}
                                      className="pr-12 pl-4 bg-transparent border-primary placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary text-right"
                                      dir="ltr"
                                      autoFocus
                                    />
                                    <Icons.emailIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ) : (
                        // Show password field only
                        <div dir="rtl">
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      {...field}
                                      id="password"
                                      type="password"
                                      disabled={isPending}
                                      placeholder={dictionary?.auth?.passwordLabel || "كلمة المرور"}
                                      className="pr-12 pl-4 bg-transparent border-primary placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary text-right"
                                      dir="ltr"
                                      autoFocus
                                    />
                                    <svg
                                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 14 14"
                                      fill="currentColor"
                                    >
                                      <path d="M11.0833 5.83333H10.5V4.08333C10.5 2.29417 9.03917 0.833333 7.25 0.833333C5.46083 0.833333 4 2.29417 4 4.08333V5.83333H3.41667C2.8875 5.83333 2.5 6.22083 2.5 6.75V11.4167C2.5 11.9458 2.8875 12.3333 3.41667 12.3333H11.0833C11.6125 12.3333 12 11.9458 12 11.4167V6.75C12 6.22083 11.6125 5.83333 11.0833 5.83333ZM5.16667 4.08333C5.16667 2.93583 6.10333 2 7.25 2C8.39667 2 9.33333 2.93583 9.33333 4.08333V5.83333H5.16667V4.08333ZM10.8333 11.1667H3.66667V7H10.8333V11.1667Z"/>
                                    </svg>
                                  </div>
                                </FormControl>
                                <Link
                                  href="/reset"
                                  className="text-sm text-primary hover:underline underline-offset-4 inline-block mt-2"
                                >
                                  {dictionary?.auth?.forgotPassword || "نسيت كلمة المرور؟"}
                                </Link>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </>
                  )}

                  <Button
                    disabled={isPending}
                    type="submit"
                    className="w-full"
                  >
                    {showTwoFactor ? (dictionary?.auth?.confirm || "Confirm") :
                     !showPasswordField ? (dictionary?.auth?.continue || "متابعة") :
                     (dictionary?.auth?.signIn || "تسجيل دخول")}
                  </Button>
                </div>

                {/* Divider */}
                <h6 className="flex items-center justify-center">
                  {dictionary?.auth?.orContinueWith || "أو التسجيل عن طريق"}
                </h6>

                {/* OAuth and Alternative Login Methods */}
                <div className="grid gap-3">
                  <Suspense fallback={<div className="" />}>
                    <Social />
                  </Suspense>

                  {/* Toggle to Phone */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setLoginMethod('phone');
                      setShowPasswordField(false);
                    }}
                    className="w-full"
                  >
                    <Icons.phoneIcon className="h-5 w-5 mr-2 text-primary" />
                    <span>
                      {dictionary?.auth?.signInWithPhone || "رقم الجوال"}
                    </span>
                  </Button>
                </div>

                {/* Sign Up Link */}
                <div className="text-center text-sm pb-2">
                  <span className="text-[#718096]">
                    {dictionary?.auth?.dontHaveAccountPrefix || "ليس لديك حساب؟"}
                  </span>{" "}
                  <Link href="/join" className="text-primary text-sm font-medium hover:text-[#4a6a6e] transition-colors">
                    {dictionary?.auth?.createAccount || "إنشاء حساب جديد"}
                  </Link>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      {/* <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        By clicking continue, you agree to our <br/> <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div> */}
    </div>
  );
};
