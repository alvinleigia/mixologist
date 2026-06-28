import { requireRole } from "@/lib/auth";
import { restaurantAdminRoles } from "@/lib/role-access";
import {
  exportOperationalReportCsv,
  getRestaurantOperationalReport,
  type ReportRange,
} from "@/lib/saas-reports";
import { getCurrentTenantContext } from "@/lib/tenant-context";

function getReportRange(request: Request): ReportRange {
  const value = new URL(request.url).searchParams.get("range");

  if (value === "today" || value === "7d" || value === "30d" || value === "all") {
    return value;
  }

  return "30d";
}

export async function GET(request: Request) {
  const session = await requireRole([...restaurantAdminRoles]);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantContext = await getCurrentTenantContext();
  const range = getReportRange(request);
  const report = await getRestaurantOperationalReport(tenantContext.organizationId, range);
  const csv = exportOperationalReportCsv(report, "Restaurant operational report");

  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="restaurant-operational-report-${range}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
