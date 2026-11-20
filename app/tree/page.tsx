import { TreeView } from "@/components/tree/tree-view";

export const metadata = { title: "Family tree · Imvelaphi" };

// Every page waits for the sign-in check, so there is no instant shell to validate.
export const instant = false;

export default function TreePage() {
  return <TreeView />;
}
