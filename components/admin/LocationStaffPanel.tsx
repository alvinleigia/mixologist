import { StaffInviteForm } from "@/components/admin/StaffInviteForm";

type LocationStaffPanelProps = {
  backHref: string;
  locationId: string;
  locationName: string;
  restaurantId: string;
};

export function LocationStaffPanel({
  backHref,
  locationId,
  locationName,
  restaurantId,
}: LocationStaffPanelProps) {
  return (
    <StaffInviteForm
      apiPath={`/api/company/restaurants/${restaurantId}/locations/${locationId}/staff`}
      backHref={backHref}
      backLabel="Back to locations"
      defaultRole="RESTAURANT_MANAGER"
      description={`Invite a manager or operator specifically to ${locationName}.`}
      roles={[
        { label: "Restaurant Manager", value: "RESTAURANT_MANAGER" },
        { label: "Order Operator", value: "ORDER_OPERATOR" },
      ]}
      title="Staff access"
    />
  );
}
