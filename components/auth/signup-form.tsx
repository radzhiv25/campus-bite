"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants/site";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { type SignupFormValues, signupSchema } from "@/lib/validators/auth";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const safeFrom =
    from && from.startsWith("/") && !from.startsWith("//") ? from : ROUTES.menu;

  const [serverError, setServerError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignupFormValues) {
    setServerError(null);
    setNotice(null);
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      setServerError(
        "Missing Supabase configuration. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local."
      );
      return;
    }
    const origin = window.location.origin;
    const fullName = `${values.firstName} ${values.lastName}`.trim();
    const { data, error: signError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          first_name: values.firstName,
          last_name: values.lastName,
          full_name: fullName,
        },
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeFrom)}`,
      },
    });
    if (signError) {
      setServerError(signError.message);
      return;
    }
    if (data.session) {
      router.push(safeFrom);
      router.refresh();
      return;
    }
    setNotice(
      "Check your email for a confirmation link from Supabase. After confirming, sign in here."
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full max-w-sm flex-col gap-5"
      noValidate
      aria-busy={isSubmitting}
    >
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Create your account
        </h2>
        <p className="text-sm text-muted-foreground">
          Join to browse the canteen menu and place orders.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="signup-first-name">First name</Label>
            <Input
              id="signup-first-name"
              type="text"
              autoComplete="given-name"
              aria-invalid={Boolean(errors.firstName)}
              className={cn(errors.firstName && "border-destructive")}
              {...register("firstName")}
              placeholder="Alex"
              disabled={isSubmitting}
            />
            {errors.firstName ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.firstName.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-last-name">Last name</Label>
            <Input
              id="signup-last-name"
              type="text"
              autoComplete="family-name"
              aria-invalid={Boolean(errors.lastName)}
              className={cn(errors.lastName && "border-destructive")}
              {...register("lastName")}
              placeholder="Rivera"
              disabled={isSubmitting}
            />
            {errors.lastName ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.lastName.message}
              </p>
            ) : null}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            className={cn(errors.email && "border-destructive")}
            {...register("email")}
            placeholder="you@university.edu"
            disabled={isSubmitting}
          />
          {errors.email ? (
            <p className="text-xs text-destructive" role="alert">
              {errors.email.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <PasswordInput
            id="signup-password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            className={cn(errors.password && "border-destructive")}
            {...register("password")}
            placeholder="e.g. CampusR0cks"
            disabled={isSubmitting}
          />
          {errors.password ? (
            <p className="text-xs text-destructive" role="alert">
              {errors.password.message}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              At least 8 characters, with at least one letter and one number.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-confirm-password">Confirm password</Label>
          <PasswordInput
            id="signup-confirm-password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            className={cn(errors.confirmPassword && "border-destructive")}
            {...register("confirmPassword")}
            placeholder="Same as password"
            disabled={isSubmitting}
          />
          {errors.confirmPassword ? (
            <p className="text-xs text-destructive" role="alert">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        {serverError ? (
          <p className="text-xs text-destructive" role="alert">
            {serverError}
          </p>
        ) : null}
        {notice ? (
          <p className="text-xs text-muted-foreground" role="status">
            {notice}
          </p>
        ) : null}

        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`${ROUTES.login}${from ? `?from=${encodeURIComponent(from)}` : ""}`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
