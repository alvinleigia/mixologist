"use client";

import Link from "next/link";
import { useState } from "react";
import { KeyRoundIcon, LogInIcon } from "lucide-react";
import { toast } from "sonner";

import { getCaughtErrorMessage, requestJson } from "@/lib/api-client";
import { ButtonLabel } from "@/components/shared/ButtonLabel";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PasswordResetFormProps = {
  reset: {
    email: string;
    name: string;
    username: string;
  } | null;
  token: string;
};

export function PasswordResetForm({ reset, token }: PasswordResetFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token || !reset) {
    return (
      <Card className="rounded-xl border-stone-200 bg-white">
        <CardHeader className="px-6 pt-6">
          <h1 className="text-3xl font-semibold text-stone-950">
            Invalid reset link
          </h1>
        </CardHeader>
        <CardContent className="px-6 pb-6 text-sm text-stone-600">
          This password reset link is missing, invalid or expired.
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    return (
      <Card className="rounded-xl border-stone-200 bg-white">
        <CardHeader className="px-6 pt-6">
          <h1 className="text-3xl font-semibold text-stone-950">
            Password updated
          </h1>
        </CardHeader>
        <CardContent className="grid gap-4 px-6 pb-6">
          <p className="text-sm text-stone-600">
            Your password has been reset. You can now sign in with the new password.
          </p>
          <Button asChild className="rounded-lg bg-stone-950 text-white hover:bg-stone-800">
            <Link href="/staff/login">
              <ButtonLabel icon={LogInIcon}>Go to login</ButtonLabel>
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border-stone-200 bg-white">
      <CardHeader className="px-6 pt-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[rgb(199,76,0)]">
          Password Reset
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-stone-950">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          {reset.name} - {reset.email}
        </p>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();

            if (password !== confirmPassword) {
              setError("Passwords do not match.");
              return;
            }

            setIsSubmitting(true);

            try {
              await requestJson("/api/password-reset", {
                body: { token, password },
                fallbackError: "Could not reset password.",
              });
            } catch (caught) {
              const message = getCaughtErrorMessage(caught, "Could not reset password.");
              setError(message);
              toast.error(message);
              setIsSubmitting(false);
              return;
            }

            setError(null);
            setIsComplete(true);
            setIsSubmitting(false);
          }}
        >
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <FormField label="New password">
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 characters"
            />
          </FormField>
          <FormField label="Confirm password">
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter password"
            />
          </FormField>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-stone-950 text-white hover:bg-stone-800"
          >
            <ButtonLabel icon={KeyRoundIcon}>
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </ButtonLabel>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
