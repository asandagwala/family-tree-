import { AlbumView } from "@/components/album-view";

export const metadata = { title: "Album · Imvelaphi" };

// Every page waits for the sign-in check, so there is no instant shell to validate.
export const instant = false;

export default function AlbumPage() {
  return <AlbumView />;
}
