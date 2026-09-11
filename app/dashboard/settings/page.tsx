import { ensureDbUser } from "@/lib/user";
import { getUserAccess } from "@/lib/access";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const dbUser = await ensureDbUser();
  const accessInfo = dbUser ? await getUserAccess(dbUser) : null;
  
  // Format dates to strings to pass safely to Client Component
  const serializedAccessInfo = accessInfo ? {
    ...accessInfo,
    currentPeriodEnd: accessInfo.currentPeriodEnd ? new Date(accessInfo.currentPeriodEnd).toISOString() : null,
  } : null;

  return (
    <SettingsClient 
      accessInfo={serializedAccessInfo} 
      hasCustomerProfile={Boolean(dbUser?.stripe_customer_id)}
    />
  );
}

