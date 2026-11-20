import { BirthdaysView } from "@/components/birthdays/birthdays-view";

export const metadata = { title: "Birthdays · Imvelaphi" };

// Every page waits for the sign-in check, so there is no instant shell to validate.
export const instant = false;

export default function BirthdaysPage() {
  return <BirthdaysView />;
}
