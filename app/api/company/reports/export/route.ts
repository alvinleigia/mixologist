import { requireRole } from "@/lib/auth";
import { companyAdminRoles } from "@/lib/role-access";
import {
  exportOperationalReportCsv,
  getCompanyOperationalReport,
  type ReportRange,
} from "@/lib/saas-reports";

function getReportRange(request: Request): ReportRange {
  const value = new URL(request.url).searchParams.get("range");

  if (value === "today" || value === "7d" || value === "30d" || value === "all") {
    return value;
  }

  return "30d";
}

export async function GET(request: Request) {
  const session = await requireRole([...companyAdminRoles]);

  if (!session?.user.organizationId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const range = getReportRange(request);
  const report = await getCompanyOperationalReport(session.user.organizationId, range);
  const csv = exportOperationalReportCsv(report, "Company operational report");

  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="company-operational-report-${range}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
