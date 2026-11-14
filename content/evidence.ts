/**
 * Evidence: certificates and award photographs supplied by Abhishyanth
 * (assets/incoming, 2026-11-14). Display files are optimised derivatives in
 * public/evidence/; originals for verification and download sit in
 * public/evidence/original/. Descriptions state only what each document shows.
 */

export type EvidenceKind = "certificate" | "photo";

export type EvidenceItem = {
  id: string;
  kind: EvidenceKind;
  /** Short label for buttons, e.g. "View internship certificate". */
  action: string;
  title: string;
  /** What the document itself states, in plain words. */
  caption: string;
  src: string;
  thumb: string;
  width: number;
  height: number;
  alt: string;
  /** Original file for "Open original" / "Download" (null: the display file is the original). */
  original: { href: string; label: string; download: string } | null;
};

export const evidence: Record<string, EvidenceItem> = {
  nestafar: {
    id: "nestafar",
    kind: "certificate",
    action: "View internship certificate",
    title: "Certificate of Internship, Nestafar Technologies",
    caption:
      "Internship at Nestafar Technologies Private Limited, January to March 2026 (three months). Issued April 10, 2026.",
    src: "/evidence/nestafar-internship-certificate.webp",
    thumb: "/evidence/nestafar-internship-certificate-thumb.webp",
    width: 2000,
    height: 1543,
    alt: "Certificate of Internship from Nestafar Technologies Private Limited, certifying that Abhishyanth Vemula completed an internship from January 2026 to March 2026, dated April 10, 2026.",
    original: {
      href: "/evidence/original/nestafar-internship-certificate.pdf",
      label: "Original PDF",
      download: "Abhishyanth-Vemula-Nestafar-Internship-Certificate.pdf",
    },
  },
  "nsgc-stage": {
    id: "nsgc-stage",
    kind: "photo",
    action: "Award presentation",
    title: "Best Team Member Award, on stage",
    caption: "Receiving the trophy and certificate at the NIAT Rewards & Recognition 2024–2026 ceremony.",
    src: "/evidence/nsgc-award-presentation.webp",
    thumb: "/evidence/nsgc-award-presentation-thumb.webp",
    width: 1800,
    height: 1200,
    alt: "Abhishyanth on stage receiving a trophy and a certificate in front of a red Rewards and Recognition 2024–2026 backdrop.",
    original: null,
  },
  "nsgc-award": {
    id: "nsgc-award",
    kind: "photo",
    action: "Trophy and certificate",
    title: "Certificate of Appreciation and trophy",
    caption:
      "Core Team Member, NIAT Student General Council, honoured with the Best Team Member Award for the academic year 2024–2026. Awarded 25 April 2026.",
    src: "/evidence/nsgc-award-trophy-certificate.webp",
    thumb: "/evidence/nsgc-award-trophy-certificate-thumb.webp",
    width: 1800,
    height: 1350,
    alt: "The Best Team Member trophy beside a Certificate of Appreciation for serving as Core Team Member of the NIAT Student General Council, with a NIAT gift bag and mug.",
    original: null,
  },
  inspira: {
    id: "inspira",
    kind: "certificate",
    action: "View certificate",
    title: "INSPIRA'25, Certificate of Participation",
    caption: "Participation in INSPIRA'25, a career and corporate fest at IIT Hyderabad, presented by Forge Alumnus.",
    src: "/evidence/inspira25-participation-certificate.webp",
    thumb: "/evidence/inspira25-participation-certificate-thumb.webp",
    width: 1800,
    height: 1246,
    alt: "Certificate of Participation from Forge Alumnus stating that Abhishyanth Vemula participated in INSPIRA'25, a career and corporate fest at IIT Hyderabad.",
    original: {
      href: "/evidence/original/inspira25-participation-certificate.png",
      label: "Original image",
      download: "Abhishyanth-Vemula-INSPIRA25-Certificate.png",
    },
  },
  uiux: {
    id: "uiux",
    kind: "certificate",
    action: "View certificate",
    title: "UI/UX Mega Workshop, Certificate of Accomplishment",
    caption:
      "For attending the UI/UX Mega Workshop for NIAT students and successfully redesigning an app with Figma. Issued 23 December 2024.",
    src: "/evidence/uiux-mega-workshop-certificate.webp",
    thumb: "/evidence/uiux-mega-workshop-certificate-thumb.webp",
    width: 1280,
    height: 904,
    alt: "Certificate of Accomplishment from NxtWave Institute of Advanced Technologies awarded to Abhishyanth Vemula for attending the UI/UX Mega Workshop and redesigning an app with Figma, issued 23 December 2024.",
    original: {
      href: "/evidence/original/uiux-mega-workshop-certificate.png",
      label: "Original image",
      download: "Abhishyanth-Vemula-UIUX-Workshop-Certificate.png",
    },
  },
};
