import { PeopleDirectory } from "@/components/people/people-directory";

export const metadata = { title: "People · Imvelaphi" };

// Every page waits for the sign-in check, so there is no instant shell to validate.
export const instant = false;

export default function PeoplePage() {
  return <PeopleDirectory />;
}
