import { PasswordResetForm } from "@/components/admin/PasswordResetForm";
import { AppShell } from "@/components/shared/AppShell";
import { getPasswordResetDetails } from "@/lib/password-reset";

export default async function ResetPasswordPage(
  props: PageProps<"/reset-password">,
) {
  const searchParams = await props.searchParams;
  const tokenValue = searchParams.token;
  const token = typeof tokenValue === "string" ? tokenValue : "";
  const reset = token ? await getPasswordResetDetails(token) : null;

  return (
    <AppShell contentClassName="max-w-xl">
      <PasswordResetForm reset={reset} token={token} />
    </AppShell>
  );
}
