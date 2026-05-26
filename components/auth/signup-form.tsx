"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { PasswordInput } from "@/components/auth/password-input";
import { StudentIdScanner } from "@/components/auth/student-id-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES } from "@/constants/site";
import type { IdScanResult } from "@/lib/id-scan/actions";
import { logIdScanResult } from "@/lib/id-scan/log-scan";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  type CampusRole,
  type IdSignupStep1Values,
  idSignupStep1Schema,
  type SignupCredentialsValues,
  type SignupFormValues,
  signupCredentialsSchema,
  signupSchema,
} from "@/lib/validators/auth";

const CAMPUS_ROLES: { value: CampusRole; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "staff", label: "Staff" },
  { value: "faculty", label: "Faculty" },
];

type CampusRolePickerProps = {
  value: CampusRole;
  onChange: (value: CampusRole) => void;
  error?: string;
  disabled?: boolean;
  idPrefix: string;
};

function CampusRolePicker({ value, onChange, error, disabled, idPrefix }: CampusRolePickerProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-foreground">I am a</legend>
      <RadioGroup
        value={value}
        onValueChange={(next) => onChange(next as CampusRole)}
        className="flex flex-row gap-2"
        disabled={disabled}
      >
        {CAMPUS_ROLES.map((role) => (
          <div
            key={role.value}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-2 py-2.5 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-primary/5 sm:px-3"
          >
            <RadioGroupItem value={role.value} id={`${idPrefix}-campus-role-${role.value}`} />
            <Label
              htmlFor={`${idPrefix}-campus-role-${role.value}`}
              className="cursor-pointer text-xs font-normal sm:text-sm"
            >
              {role.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const safeFrom =
    from && from.startsWith("/") && !from.startsWith("//") ? from : ROUTES.menu;

  const [serverError, setServerError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const [signupMode, setSignupMode] = useState<"manual" | "id">("manual");
  const [idStep, setIdStep] = useState<1 | 2>(1);
  const [idProfile, setIdProfile] = useState<IdSignupStep1Values | null>(null);

  const manualForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      campusRole: "student",
      studentId: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const idStep1Form = useForm<IdSignupStep1Values>({
    resolver: zodResolver(idSignupStep1Schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      enrollmentNo: "",
      campusRole: "student",
    },
  });

  const idStep2Form = useForm<SignupCredentialsValues>({
    resolver: zodResolver(signupCredentialsSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    register: registerManual,
    handleSubmit: handleManualSubmit,
    setValue: setManualValue,
    watch: watchManual,
    formState: { errors: manualErrors, isSubmitting: isManualSubmitting },
  } = manualForm;

  const {
    register: registerIdStep1,
    handleSubmit: handleIdStep1Submit,
    setValue: setIdStep1Value,
    watch: watchIdStep1,
    formState: { errors: idStep1Errors, isSubmitting: isIdStep1Submitting },
  } = idStep1Form;

  const {
    register: registerIdStep2,
    handleSubmit: handleIdStep2Submit,
    formState: { errors: idStep2Errors, isSubmitting: isIdStep2Submitting },
  } = idStep2Form;

  const campusRole = watchIdStep1("campusRole");
  const manualCampusRole = watchManual("campusRole");
  const isSubmitting = isManualSubmitting || isIdStep1Submitting || isIdStep2Submitting;

  function handleIdScanComplete(result: IdScanResult) {
    logIdScanResult(result);

    if (result.firstName) setIdStep1Value("firstName", result.firstName, { shouldValidate: true });
    if (result.lastName) setIdStep1Value("lastName", result.lastName, { shouldValidate: true });
    if (result.studentId) setIdStep1Value("enrollmentNo", result.studentId, { shouldValidate: true });

    const providerLabel = result.provider === "google" ? "Google Vision" : "Tesseract";
    setScanNotice(
      `Name and enrollment number pre-filled using ${providerLabel} (${result.confidence} confidence). Review the details, choose your role, then continue.`
    );
    setServerError(null);
  }

  function handleSignupModeChange(mode: "manual" | "id") {
    setSignupMode(mode);
    setScanNotice(null);
    setServerError(null);
    setNotice(null);
    setIdStep(1);
    setIdProfile(null);
    idStep2Form.reset();
  }

  function onIdStep1Complete(values: IdSignupStep1Values) {
    setIdProfile(values);
    setIdStep(2);
    setServerError(null);
    setScanNotice(null);
  }

  async function onManualSubmit(values: SignupFormValues) {
    await createAccount({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      enrollmentNo: values.studentId?.trim() || undefined,
      campusRole: values.campusRole,
    });
  }

  async function onIdStep2Complete(values: SignupCredentialsValues) {
    if (!idProfile) {
      setIdStep(1);
      return;
    }

    await createAccount({
      firstName: idProfile.firstName,
      lastName: idProfile.lastName,
      email: values.email,
      password: values.password,
      enrollmentNo: idProfile.enrollmentNo,
      campusRole: idProfile.campusRole,
    });
  }

  async function createAccount({
    firstName,
    lastName,
    email,
    password,
    enrollmentNo,
    campusRole,
  }: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    enrollmentNo?: string;
    campusRole?: CampusRole;
  }) {
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
    const fullName = `${firstName} ${lastName}`.trim();

    const { data, error: signError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          ...(enrollmentNo ? { enrollment_no: enrollmentNo, student_id: enrollmentNo } : {}),
          ...(campusRole ? { campus_role: campusRole } : {}),
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

  const manualFormFields = (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="signup-first-name">First name</Label>
          <Input
            id="signup-first-name"
            type="text"
            autoComplete="given-name"
            aria-invalid={Boolean(manualErrors.firstName)}
            className={cn(manualErrors.firstName && "border-destructive")}
            {...registerManual("firstName")}
            placeholder="Alex"
            disabled={isSubmitting}
          />
          {manualErrors.firstName ? (
            <p className="text-xs text-destructive" role="alert">
              {manualErrors.firstName.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-last-name">Last name</Label>
          <Input
            id="signup-last-name"
            type="text"
            autoComplete="family-name"
            aria-invalid={Boolean(manualErrors.lastName)}
            className={cn(manualErrors.lastName && "border-destructive")}
            {...registerManual("lastName")}
            placeholder="Rivera"
            disabled={isSubmitting}
          />
          {manualErrors.lastName ? (
            <p className="text-xs text-destructive" role="alert">
              {manualErrors.lastName.message}
            </p>
          ) : null}
        </div>
      </div>

      <CampusRolePicker
        idPrefix="manual"
        value={manualCampusRole ?? "student"}
        onChange={(value) => setManualValue("campusRole", value, { shouldValidate: true })}
        error={manualErrors.campusRole?.message}
        disabled={isSubmitting}
      />

      <div className="space-y-2">
        <Label htmlFor="signup-student-id">Student ID (optional)</Label>
        <Input
          id="signup-student-id"
          type="text"
          autoComplete="off"
          aria-invalid={Boolean(manualErrors.studentId)}
          className={cn(manualErrors.studentId && "border-destructive")}
          {...registerManual("studentId")}
          placeholder="e.g. CS2024001"
          disabled={isSubmitting}
        />
        {manualErrors.studentId ? (
          <p className="text-xs text-destructive" role="alert">
            {manualErrors.studentId.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(manualErrors.email)}
          className={cn(manualErrors.email && "border-destructive")}
          {...registerManual("email")}
          placeholder="you@university.edu"
          disabled={isSubmitting}
        />
        {manualErrors.email ? (
          <p className="text-xs text-destructive" role="alert">
            {manualErrors.email.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <PasswordInput
          id="signup-password"
          autoComplete="new-password"
          aria-invalid={Boolean(manualErrors.password)}
          className={cn(manualErrors.password && "border-destructive")}
          {...registerManual("password")}
          placeholder="e.g. CampusR0cks"
          disabled={isSubmitting}
        />
        {manualErrors.password ? (
          <p className="text-xs text-destructive" role="alert">
            {manualErrors.password.message}
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
          aria-invalid={Boolean(manualErrors.confirmPassword)}
          className={cn(manualErrors.confirmPassword && "border-destructive")}
          {...registerManual("confirmPassword")}
          placeholder="Same as password"
          disabled={isSubmitting}
        />
        {manualErrors.confirmPassword ? (
          <p className="text-xs text-destructive" role="alert">
            {manualErrors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      {serverError && signupMode === "manual" ? (
        <p className="text-xs text-destructive" role="alert">
          {serverError}
        </p>
      ) : null}
      {notice && signupMode === "manual" ? (
        <p className="text-xs text-muted-foreground" role="status">
          {notice}
        </p>
      ) : null}

      <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
        {isManualSubmitting ? (
          <>
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </div>
  );

  const idStep1Fields = (
    <div className="flex flex-col gap-5">
      <StudentIdScanner onScanComplete={handleIdScanComplete} disabled={isSubmitting} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="id-signup-first-name">First name</Label>
          <Input
            id="id-signup-first-name"
            type="text"
            autoComplete="given-name"
            aria-invalid={Boolean(idStep1Errors.firstName)}
            className={cn(idStep1Errors.firstName && "border-destructive")}
            {...registerIdStep1("firstName")}
            placeholder="Alex"
            disabled={isSubmitting}
          />
          {idStep1Errors.firstName ? (
            <p className="text-xs text-destructive" role="alert">
              {idStep1Errors.firstName.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="id-signup-last-name">Last name</Label>
          <Input
            id="id-signup-last-name"
            type="text"
            autoComplete="family-name"
            aria-invalid={Boolean(idStep1Errors.lastName)}
            className={cn(idStep1Errors.lastName && "border-destructive")}
            {...registerIdStep1("lastName")}
            placeholder="Rivera"
            disabled={isSubmitting}
          />
          {idStep1Errors.lastName ? (
            <p className="text-xs text-destructive" role="alert">
              {idStep1Errors.lastName.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="id-signup-enrollment-no">Enrollment number</Label>
        <Input
          id="id-signup-enrollment-no"
          type="text"
          autoComplete="off"
          aria-invalid={Boolean(idStep1Errors.enrollmentNo)}
          className={cn(idStep1Errors.enrollmentNo && "border-destructive")}
          {...registerIdStep1("enrollmentNo")}
          placeholder="e.g. 452010 or CS2024001"
          disabled={isSubmitting}
        />
        {idStep1Errors.enrollmentNo ? (
          <p className="text-xs text-destructive" role="alert">
            {idStep1Errors.enrollmentNo.message}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Filled automatically when you scan your campus ID. You can edit it if needed.
          </p>
        )}
      </div>

      <CampusRolePicker
        idPrefix="id"
        value={campusRole}
        onChange={(value) => setIdStep1Value("campusRole", value, { shouldValidate: true })}
        error={idStep1Errors.campusRole?.message}
        disabled={isSubmitting}
      />

      {scanNotice ? (
        <p className="text-xs text-muted-foreground" role="status">
          {scanNotice}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        Continue to email &amp; password
      </Button>
    </div>
  );

  const idStep2Fields = (
    <div className="flex flex-col gap-5">
      {idProfile ? (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">
            {idProfile.firstName} {idProfile.lastName}
          </p>
          <p className="text-muted-foreground">
            {CAMPUS_ROLES.find((role) => role.value === idProfile.campusRole)?.label} · Enrollment{" "}
            {idProfile.enrollmentNo}
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="id-signup-email">Email</Label>
        <Input
          id="id-signup-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(idStep2Errors.email)}
          className={cn(idStep2Errors.email && "border-destructive")}
          {...registerIdStep2("email")}
          placeholder="you@university.edu"
          disabled={isSubmitting}
        />
        {idStep2Errors.email ? (
          <p className="text-xs text-destructive" role="alert">
            {idStep2Errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="id-signup-password">Password</Label>
        <PasswordInput
          id="id-signup-password"
          autoComplete="new-password"
          aria-invalid={Boolean(idStep2Errors.password)}
          className={cn(idStep2Errors.password && "border-destructive")}
          {...registerIdStep2("password")}
          placeholder="e.g. CampusR0cks"
          disabled={isSubmitting}
        />
        {idStep2Errors.password ? (
          <p className="text-xs text-destructive" role="alert">
            {idStep2Errors.password.message}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            At least 8 characters, with at least one letter and one number.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="id-signup-confirm-password">Confirm password</Label>
        <PasswordInput
          id="id-signup-confirm-password"
          autoComplete="new-password"
          aria-invalid={Boolean(idStep2Errors.confirmPassword)}
          className={cn(idStep2Errors.confirmPassword && "border-destructive")}
          {...registerIdStep2("confirmPassword")}
          placeholder="Same as password"
          disabled={isSubmitting}
        />
        {idStep2Errors.confirmPassword ? (
          <p className="text-xs text-destructive" role="alert">
            {idStep2Errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      {serverError && signupMode === "id" ? (
        <p className="text-xs text-destructive" role="alert">
          {serverError}
        </p>
      ) : null}
      {notice && signupMode === "id" ? (
        <p className="text-xs text-muted-foreground" role="status">
          {notice}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="sm:flex-1"
          disabled={isSubmitting}
          onClick={() => {
            setIdStep(1);
            setServerError(null);
            setNotice(null);
          }}
        >
          Back
        </Button>
        <Button type="submit" className="gap-2 sm:flex-1" disabled={isSubmitting}>
          {isIdStep2Submitting ? (
            <>
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Create your account</h2>
        <p className="text-sm text-muted-foreground">
          Join to browse the canteen menu and place orders.
        </p>
      </div>

      <Tabs value={signupMode} onValueChange={(v) => handleSignupModeChange(v as "manual" | "id")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" disabled={isSubmitting}>
            Manual
          </TabsTrigger>
          <TabsTrigger value="id" disabled={isSubmitting}>
            Scan campus ID
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4">
          <form onSubmit={handleManualSubmit(onManualSubmit)} noValidate aria-busy={isManualSubmitting}>
            {manualFormFields}
          </form>
        </TabsContent>

        <TabsContent value="id" className="mt-4 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Step {idStep} of 2 · {idStep === 1 ? "Campus ID details" : "Email & password"}
          </p>
          {idStep === 1 ? (
            <form
              onSubmit={handleIdStep1Submit(onIdStep1Complete)}
              noValidate
              aria-busy={isIdStep1Submitting}
            >
              {idStep1Fields}
            </form>
          ) : (
            <form
              onSubmit={handleIdStep2Submit(onIdStep2Complete)}
              noValidate
              aria-busy={isIdStep2Submitting}
            >
              {idStep2Fields}
            </form>
          )}
        </TabsContent>
      </Tabs>

      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`${ROUTES.login}${from ? `?from=${encodeURIComponent(from)}` : ""}`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
