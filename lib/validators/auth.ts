import { z } from "zod";

const namePart = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80, "Must be 80 characters or fewer");

export const campusRoleSchema = z.enum(["student", "staff", "faculty"], {
  message: "Select whether you are a student, staff member, or faculty",
});

export type CampusRole = z.infer<typeof campusRoleSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine((value) => /[0-9]/.test(value) && /[a-zA-Z]/i.test(value), {
    message: "Include at least one letter and one number",
  });

export const signupCredentialsSchema = z
  .object({
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export type SignupCredentialsValues = z.infer<typeof signupCredentialsSchema>;

export const idSignupStep1Schema = z.object({
  firstName: namePart,
  lastName: namePart,
  enrollmentNo: z
    .string()
    .trim()
    .min(1, "Enrollment number is required")
    .max(40, "Must be 40 characters or fewer"),
  campusRole: campusRoleSchema,
});

export type IdSignupStep1Values = z.infer<typeof idSignupStep1Schema>;

export const signupSchema = z
  .object({
    firstName: namePart,
    lastName: namePart,
    campusRole: campusRoleSchema,
    studentId: z.string().trim().max(40, "Must be 40 characters or fewer"),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;
