import type { Metadata } from "next";
import { SculptureLab } from "@/components/lab/SculptureLab";

export const metadata: Metadata = { title: "Sculpture lab", robots: { index: false, follow: false } };

/** Internal prototype bench for the hero sculpture. Not linked from the site. */
export default function Page() {
  return <SculptureLab />;
}
