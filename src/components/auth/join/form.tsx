"use client";

import * as z from "zod";
import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { RegisterSchema, PhoneLoginSchema } from "../validation";
import { register } from "./action";
import { Social } from "../social";
import { Icons } from "@/components/atom/icons";
import { ErrorToast, SuccessToast } from "@/components/atom/toast";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface RegisterFormProps extends React.ComponentPropsWithoutRef<"div"> {
  dictionary?: Dictionary;
}

export const RegisterForm = ({
  className,
  dictionary,
  ...props
}: RegisterFormProps) => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const tenant = searchParams.get("tenant");

  const [registerMethod, setRegisterMethod] = useState<'phone' | 'email'>('phone');
  const [currentStep, setCurrentStep] = useState<'username' | 'email' | 'password'>('username');
  const [isPending, startTransition] = useTransition();

  // Handle OAuth errors
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError === "OAuthAccountNotLinked") {
      ErrorToast(dictionary?.auth?.emailInUse || "Email already in use with different provider!");
    }
  }, [searchParams, dictionary]);

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      username: "",
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

    if (registerMethod === 'phone') {
      ErrorToast(dictionary?.auth?.phoneRegistrationNotAvailable || "Phone registration will be available soon. Please use email registration for now.");
      return;
    }

    // Step-by-step validation for email registration
    if (currentStep === 'username') {
      const usernameValue = form.getValues('username');
      if (!usernameValue || usernameValue.length < 1) {
        ErrorToast(dictionary?.auth?.enterName || "Please enter your name");
        return;
      }
      setCurrentStep('email');
    } else if (currentStep === 'email') {
      const emailValue = form.getValues('email');
      if (!emailValue || !emailValue.includes('@')) {
        ErrorToast(dictionary?.auth?.invalidEmail || "Please enter a valid email address");
        return;
      }
      setCurrentStep('password');
    }
  };

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    if (registerMethod === 'phone') {
      ErrorToast(dictionary?.auth?.phoneRegistrationNotAvailable || "Phone registration will be available soon. Please use email registration for now.");
      return;
    }

    // Construct callback URL with tenant if present
    let finalCallbackUrl = callbackUrl;
    if (tenant && !finalCallbackUrl?.includes('tenant=')) {
      const separator = finalCallbackUrl?.includes('?') ? '&' : '?';
      finalCallbackUrl = `${finalCallbackUrl || '/dashboard'}${separator}tenant=${tenant}`;
    }

    startTransition(() => {
      register(values, finalCallbackUrl)
        .then((data) => {
          if (data?.error) {
            form.reset();
            ErrorToast(data.error);
          }
          if (data?.success) {
            form.reset();
            SuccessToast();
          }
        })
        .catch(() => ErrorToast("Something went wrong"));
    });
  };

  const onPhoneSubmit = (values: z.infer<typeof PhoneLoginSchema>) => {
    // Phone registration handler - currently shows not available message
    ErrorToast(dictionary?.auth?.phoneRegistrationNotAvailable || "Phone registration will be available soon. Please use email registration for now.");
  };

  return (
    <div className={cn("flex flex-col gap-6 min-w-[200px] md:min-w-[450px]", className)} {...props}>
      <Card className="border-0 shadow-2xl bg-white rounded-[16px]">
        <CardHeader>
          <h4 className="text-primary">
            {dictionary?.auth?.createAccount || "إنشاء حساب جديد"}
          </h4>
          <p className='text-sm'>
            {dictionary?.auth?.signUpSubtitle || "يرجى اختيار طريقة إنشاء الحساب المفضلة لديك"}
          </p>
        </CardHeader>
        <CardContent>
          {registerMethod === 'phone' ? (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="grid gap-6">
                {/* Phone Registration Section */}
                <div className="grid gap-4">
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
                    {dictionary?.auth?.signUp || "إنشاء حساب"}
                  </Button>
                </div>

                {/* Divider */}
                <h6 className="flex items-center justify-center">
                  {dictionary?.auth?.orContinueWith || "أو التسجيل عن طريق"}
                </h6>

                {/* OAuth and Alternative Methods */}
                <div className="grid gap-3">
                  <Suspense fallback={<div className="" />}>
                    <Social />
                  </Suspense>

                  {/* Toggle to Email */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setRegisterMethod('email');
                      setCurrentStep('username');
                    }}
                    className="w-full"
                  >
                    <Icons.emailIcon className="w-5 h-5 mr-2 text-primary" />
                    {dictionary?.auth?.signInWithEmail || "البريد الإلكتروني"}
                  </Button>
                </div>

                {/* Sign In Link */}
                <div className="text-center text-sm pb-2">
                  <span className="text-[#718096]">
                    {dictionary?.auth?.alreadyHaveAccount || "لديك حساب بالفعل؟"}
                  </span>{" "}
                  <Link href="/login" className="text-primary text-sm font-medium hover:text-[#4a6a6e] transition-colors">
                    {dictionary?.auth?.signIn || "تسجيل دخول"}
                  </Link>
                </div>
              </form>
            </Form>
          ) : (
            <Form {...form}>
              <form onSubmit={
                (currentStep !== 'password') ? handleContinue : form.handleSubmit(onSubmit)
              } className="grid gap-6">
                {/* Email Registration Section */}
                <div className="grid gap-4">
                  {/* Step-by-step Email Registration Fields - Show one at a time */}
                  {currentStep === 'username' && (
                    // Show username field only
                    <div dir="rtl">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  id="username"
                                  type="text"
                                  disabled={isPending}
                                  placeholder={dictionary?.auth?.nameLabel || "الاسم"}
                                  className="pr-12 pl-4 bg-transparent border-primary placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary text-right"
                                  dir="rtl"
                                  autoFocus
                                />
                                <svg
                                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 14 14"
                                  fill="currentColor"
                                >
                                  <path d="M7 7C8.65417 7 10 5.65417 10 4C10 2.34583 8.65417 1 7 1C5.34583 1 4 2.34583 4 4C4 5.65417 5.34583 7 7 7ZM7 8.16667C4.775 8.16667 0.333333 9.28333 0.333333 11.5V12.6667C0.333333 13.0333 0.633333 13.3333 1 13.3333H13C13.3667 13.3333 13.6667 13.0333 13.6667 12.6667V11.5C13.6667 9.28333 9.225 8.16667 7 8.16667Z"/>
                                </svg>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {currentStep === 'email' && (
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
                  )}

                  {currentStep === 'password' && (
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <Button
                    disabled={isPending}
                    type="submit"
                    className="w-full"
                  >
                    {currentStep !== 'password' ?
                      (dictionary?.auth?.continue || "متابعة") :
                      (dictionary?.auth?.signUp || "إنشاء حساب")}
                  </Button>
                </div>

                {/* Divider */}
                <h6 className="flex items-center justify-center">
                  {dictionary?.auth?.orContinueWith || "أو التسجيل عن طريق"}
                </h6>

                {/* OAuth and Alternative Registration Methods */}
                <div className="grid gap-3">
                  <Suspense fallback={<div className="" />}>
                    <Social />
                  </Suspense>

                  {/* Toggle to Phone */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setRegisterMethod('phone');
                      setCurrentStep('username');
                    }}
                    className="w-full"
                  >
                    <Icons.phoneIcon className="h-5 w-5 mr-2 text-primary" />
                    <span>
                      {dictionary?.auth?.signInWithPhone || "رقم الجوال"}
                    </span>
                  </Button>
                </div>

                {/* Sign In Link */}
                <div className="text-center text-sm pb-2">
                  <span className="text-[#718096]">
                    {dictionary?.auth?.alreadyHaveAccount || "لديك حساب بالفعل؟"}
                  </span>{" "}
                  <Link href="/login" className="text-primary text-sm font-medium hover:text-[#4a6a6e] transition-colors">
                    {dictionary?.auth?.signIn || "تسجيل دخول"}
                  </Link>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
