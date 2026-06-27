import { AppShell } from "@/components/shared/AppShell";
import { InviteAcceptForm } from "@/components/admin/InviteAcceptForm";

export default async function InvitePage(props: PageProps<"/invite">) {
  const searchParams = await props.searchParams;
  const tokenValue = searchParams.token;
  const token = typeof tokenValue === "string" ? tokenValue : "";

  return (
    <AppShell contentClassName="max-w-xl">
      <InviteAcceptForm token={token} />
    </AppShell>
  );
}
