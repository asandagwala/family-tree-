import { Dashboard } from "@/components/dashboard/dashboard";

export const metadata = { title: "Overview · Imvelaphi" };

// Every page waits for the sign-in check, so there is no instant shell to validate.
export const instant = false;

export default function OverviewPage() {
  return <Dashboard />;
}
