import type { Metadata } from "next";
import { HeroLab } from "@/components/lab/HeroLab";

export const metadata: Metadata = { title: "Hero lab", robots: { index: false, follow: false } };

/** Internal bench: hero sculpture candidates in the real hero layout. Not linked from the site. */
export default function Page() {
  return <HeroLab />;
}
