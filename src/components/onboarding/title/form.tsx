"use client";

import React, { useState, useTransition, useImperativeHandle, forwardRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { titleSchema, type TitleFormData } from "./validation";
import { updateSchoolTitle } from "./actions";
import { FORM_LIMITS } from "../constants.client";
import { generateSubdomain } from "@/lib/subdomain";

interface TitleFormProps {
  schoolId: string;
  initialData?: Partial<TitleFormData>;
  onSuccess?: () => void;
  onTitleChange?: (title: string) => void;
  dictionary?: any;
}

export interface TitleFormRef {
  saveAndNext: () => Promise<void>;
}

export const TitleForm = forwardRef<TitleFormRef, TitleFormProps>(({ schoolId, initialData, onSuccess, onTitleChange, dictionary }, ref) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const dict = dictionary?.onboarding || {};

  const form = useForm<TitleFormData>({
    resolver: zodResolver(titleSchema),
    defaultValues: {
      title: initialData?.title || "",
      subdomain: initialData?.subdomain || "",
    },
  });

  const saveAndNext = async () => {
    const data = form.getValues();
    console.log("🎯 [TITLE FORM] saveAndNext called", {
      schoolId,
      data,
      timestamp: new Date().toISOString()
    });
    
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          setError("");
          console.log("📤 [TITLE FORM] Calling updateSchoolTitle", {
            schoolId,
            title: data.title,
            timestamp: new Date().toISOString()
          });
          
          const result = await updateSchoolTitle(schoolId, data);
          
          console.log("📥 [TITLE FORM] updateSchoolTitle response", {
            success: result.success,
            error: result.error,
            data: result.data,
            timestamp: new Date().toISOString()
          });
          
          if (result.success) {
            console.log("✅ [TITLE FORM] Update successful, calling onSuccess callback");
            onSuccess?.();
            resolve();
          } else {
            console.log("❌ [TITLE FORM] Update failed", {
              error: result.error,
              errors: result.errors
            });
            setError(result.error || "Failed to update school name");
            if (result.errors) {
              Object.entries(result.errors).forEach(([field, message]) => {
                form.setError(field as keyof TitleFormData, { message });
              });
            }
            reject(new Error(result.error || "Failed to update school name"));
          }
        } catch (err) {
          setError(dict.unexpectedError || "An unexpected error occurred");
          reject(err);
        }
      });
    });
  };

  useImperativeHandle(ref, () => ({
    saveAndNext
  }));

  const titleValue = form.watch("title");
  const subdomainValue = form.watch("subdomain");
  const maxLength = FORM_LIMITS.TITLE_MAX_LENGTH;

  // Auto-generate subdomain from title in real-time
  React.useEffect(() => {
    if (titleValue && titleValue.trim().length >= FORM_LIMITS.TITLE_MIN_LENGTH) {
      const generated = generateSubdomain(titleValue);
      form.setValue("subdomain", generated);
    }
  }, [titleValue, form]);

  // Notify parent of title changes
  React.useEffect(() => {
    onTitleChange?.(titleValue);
  }, [titleValue, onTitleChange]);

  return (
    <Form {...form}>
      <div className="space-y-6">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}
        
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={dict.schoolNamePlaceholder || "e.g., Al-Azhar International School"}
                  className="w-full h-[80px] sm:h-[100px] p-4 sm:p-6 border border-input rounded-lg resize-none focus:outline-none focus:border-ring transition-colors text-sm sm:text-base"
                  maxLength={maxLength}
                  disabled={isPending}
                />
              </FormControl>
              <div className="flex justify-between items-center">
                <FormMessage />
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {titleValue.length}/{maxLength}
                </div>
              </div>
            </FormItem>
          )}
        />

        {/* Subdomain field */}
        <FormField
          control={form.control}
          name="subdomain"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-muted-foreground">
                {dict.schoolAvailableAt || "Your school will be available at:"}
              </FormLabel>
              <FormControl>
                <div className="flex items-center border border-input rounded-lg focus-within:border-ring transition-colors" dir="ltr">
                  <Input
                    {...field}
                    placeholder={dict.subdomainPlaceholder || "your-school"}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-r-none"
                    disabled={isPending}
                  />
                  <span className="px-3 py-2 bg-muted text-muted-foreground border-l font-mono text-sm rounded-r-lg">
                    @databayt.org
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
});

TitleForm.displayName = "TitleForm";