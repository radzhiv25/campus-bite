"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { LoginAuthSkeleton } from "@/components/auth/auth-form-skeleton";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants/site";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { type LoginFormValues, loginSchema } from "@/lib/validators/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const safeFrom =
    from && from.startsWith("/") && !from.startsWith("//") ? from : ROUTES.menu;

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      setServerError(
        "Missing Supabase configuration. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local."
      );
      return;
    }
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (signError) {
      setServerError(signError.message);
      return;
    }
    router.push(safeFrom);
    router.refresh();
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
          Welcome back
        </h2>
        <p className="text-sm text-muted-foreground">
          Sign in with your campus email to open the menu.
        </p>
      </div>

      {searchParams.get("error") === "config" ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Supabase is not configured. Add{" "}
          <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          to <code className="rounded bg-muted px-1">.env.local</code>.
        </p>
      ) : null}
      {searchParams.get("error") === "auth" ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Email link sign-in failed or expired. Try again.
        </p>
      ) : null}

      <div className="relative">
        <div
          className={cn(
            "flex flex-col gap-5 transition-opacity duration-200",
            isSubmitting && "pointer-events-none opacity-35"
          )}
        >
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              className={cn(errors.email && "border-destructive")}
              {...register("email")}
              placeholder="you@university.edu"
            />
            {errors.email ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.email.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              className={cn(errors.password && "border-destructive")}
              {...register("password")}
              placeholder="••••••••"
            />
            {errors.password ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {serverError ? (
            <p className="text-xs text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </div>

        {isSubmitting ? (
          <div
            className="absolute inset-0 z-10 flex flex-col gap-3 rounded-lg border border-border/50 bg-background/90 p-3 shadow-sm backdrop-blur-sm"
            role="status"
            aria-live="polite"
          >
            <p className="text-xs font-medium text-muted-foreground">Signing you in…</p>
            <LoginAuthSkeleton />
          </div>
        ) : null}
      </div>

      <p
        className={cn(
          "text-center text-xs text-muted-foreground",
          isSubmitting && "pointer-events-none opacity-50"
        )}
      >
        New here?{" "}
        <Link
          href={`${ROUTES.signup}${from ? `?from=${encodeURIComponent(from)}` : ""}`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
