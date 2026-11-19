import { Welcome } from "@/components/welcome";

// The front door. The dashboard lives at /overview.
// Every page waits for the sign-in check, so there is no instant shell to validate.
export const instant = false;

export default function Home() {
  return <Welcome />;
}
