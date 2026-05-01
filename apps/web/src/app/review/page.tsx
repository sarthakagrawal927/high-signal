import { requireSignedIn } from "@/lib/require-auth";
import ReviewClient from "./ReviewClient";

export default async function ReviewPage() {
  await requireSignedIn();
  return <ReviewClient />;
}
