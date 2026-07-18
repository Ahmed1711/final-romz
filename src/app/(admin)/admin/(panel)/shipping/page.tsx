import { getShippingZones } from "@/lib/api";
import { getStorefrontSettings } from "@/lib/storefrontSettings";
import ShippingClient from "./ShippingClient";

export default async function AdminShippingPage() {
  const [zones, settings] = await Promise.all([
    getShippingZones(),
    getStorefrontSettings(),
  ]);
  return (
    <ShippingClient
      zones={zones}
      freeShippingThreshold={settings.freeShippingThreshold}
    />
  );
}
