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
import { FormError } from "../error/form-error";
import { FormSuccess } from "../form-success";
import { Social } from "../social";
import { Suspense } from "react";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import { Phone, Mail, ChevronDown } from "lucide-react";

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
  const urlError = searchParams.get("error") === "OAuthAccountNotLinked"
    ? "Email already in use with different provider!"
    : "";

  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  // Handle tenant redirect after successful login
  useEffect(() => {
    const tenant = searchParams.get('tenant');
    
    if (tenant && success) {
      // Redirect back to tenant subdomain after successful login
      const tenantUrl = process.env.NODE_ENV === 'production'
        ? `https://${tenant}.databayt.org/dashboard`
        : `http://${tenant}.localhost:3000/dashboard`;
      
      console.log('🔄 Redirecting to tenant after login:', tenantUrl);
      window.location.href = tenantUrl;
    }
  }, [success, searchParams]);

  // Use different forms based on login method
  const emailForm = useForm<z.infer<typeof LoginSchema>>({
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

  // Use the appropriate form based on login method
  const form = loginMethod === 'email' ? emailForm : phoneForm as any;

  const onSubmit = (values: any) => {
    setError("");
    setSuccess("");

    // If phone login, show placeholder message for now
    if (loginMethod === 'phone') {
      setError(dictionary?.auth?.phoneLoginNotAvailable || "Phone login will be available soon. Please use email login for now.");
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
            setError(data.error);
          }
          if (data?.success) {
            form.reset();
            setSuccess(data.success);
          }
          if (data?.twoFactor) {
            setShowTwoFactor(true);
          }
        })
        .catch(() => setError("Something went wrong"));
    });
  };

  return (
    <div className={cn("flex flex-col gap-6 min-w-[200px] md:min-w-[450px]", className)} {...props}>
      <Card className="border-0 shadow-2xl bg-white rounded-[16px]">
        <CardHeader className="text-center space-y-2 pb-6 pt-8">
          <h2 className="text-[32px] font-bold text-[#2c3e50]">
            {dictionary?.auth?.loginTitle || "تسجيل الدخول"}
          </h2>
          <p className="text-[15px] text-[#718096] font-normal px-4">
            {dictionary?.auth?.loginSubtitle || "يرجى اختيار طريقة تسجيل الدخول المفضلة لديك"}
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
              {/* Phone/Email Login Section */}
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
                ) : loginMethod === 'phone' ? (
                  <>
                    {/* Phone Input with Country Code */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#718096] block text-right">
                        {dictionary?.auth?.phoneLabel || "رقم الجوال"}
                      </label>
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    className="flex items-center gap-2 px-3 py-3 bg-[#f8f9fa] border border-[#e2e8f0] rounded-lg hover:bg-[#f1f3f5] transition-colors"
                                    disabled={isPending}
                                  >
                                    <span className="text-[15px] font-medium text-[#2c3e50]">+966</span>
                                    <ChevronDown className="h-4 w-4 text-[#718096]" />
                                  </button>
                                  <div className="relative flex-1">
                                    <Input
                                      {...field}
                                      type="tel"
                                      placeholder={dictionary?.auth?.enterPhone || "رقم الجوال"}
                                      disabled={isPending}
                                      className="h-[48px] pr-10 bg-[#f8f9fa] border-[#e2e8f0] placeholder:text-[#a0aec0] focus:border-[#597c80] focus:ring-1 focus:ring-[#597c80] text-right"
                                      dir="ltr"
                                    />
                                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#718096]" />
                                  </div>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Email & Password Fields */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="grid gap-2">
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                id="email"
                                type="email"
                                disabled={isPending}
                                placeholder={dictionary?.auth?.email || "Email"}
                                className="pr-10"
                              />
                              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="grid gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              id="password"
                              type="password"
                              disabled={isPending}
                              placeholder={dictionary?.auth?.password || "Password"}
                            />
                          </FormControl>
                          <Link
                            href="/reset"
                            className="text-start hover:underline underline-offset-4"
                          >
                            {dictionary?.auth?.forgotPassword || "Forgot password?"}
                          </Link>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
                <FormError message={error || urlError} />
                <FormSuccess message={success} />

                <Button
                  disabled={isPending}
                  type="submit"
                  className="w-full h-[52px] bg-[#597c80] hover:bg-[#4a6a6e] text-white rounded-lg font-medium text-[16px] transition-colors"
                >
                  {showTwoFactor ? (dictionary?.auth?.confirm || "Confirm") : (dictionary?.auth?.signIn || "تسجيل دخول")}
                </Button>
              </div>

              {/* Divider and Toggle Section */}
              <div className="relative text-center py-2">
                <div className="absolute inset-0 top-1/2 -translate-y-1/2">
                  <div className="w-full border-t border-[#e2e8f0]"></div>
                </div>
                <span className="relative bg-white px-4 text-[14px] text-[#718096]">
                  {dictionary?.auth?.orContinueWith || "أو التسجيل عن طريق"}
                </span>
              </div>

              {/* OAuth and Alternative Login Methods */}
              <div className="grid gap-3">
                <Suspense fallback={<div className="h-10" />}>
                  <Social />
                </Suspense>

                {/* Toggle Button for Email/Phone */}
                {loginMethod === 'phone' ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLoginMethod('email')}
                    className="w-full h-[48px] rounded-lg border-[#e2e8f0] hover:bg-[#f8f9fa] transition-colors"
                  >
                    <Mail className="h-5 w-5 mr-2 text-[#718096]" />
                    <span className="text-[15px] font-medium text-[#2c3e50]">
                      {dictionary?.auth?.signInWithEmail || "البريد الإلكتروني"}
                    </span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLoginMethod('phone')}
                    className="w-full h-[48px] rounded-lg border-[#e2e8f0] hover:bg-[#f8f9fa] transition-colors"
                  >
                    <Phone className="h-5 w-5 mr-2 text-[#718096]" />
                    <span className="text-[15px] font-medium text-[#2c3e50]">
                      {dictionary?.auth?.signInWithPhone || "رقم الجوال"}
                    </span>
                  </Button>
                )}
              </div>

              {/* Sign Up Link */}
              <div className="text-center text-[14px] pb-2">
                <span className="text-[#718096]">
                  {dictionary?.auth?.dontHaveAccountPrefix || "ليس لديك حساب؟"}
                </span>{" "}
                <Link href="/join" className="text-[#597c80] font-medium hover:text-[#4a6a6e] transition-colors">
                  {dictionary?.auth?.createAccount || "إنشاء حساب جديد"}
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      {/* <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        By clicking continue, you agree to our <br/> <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div> */}
    </div>
  );
};
