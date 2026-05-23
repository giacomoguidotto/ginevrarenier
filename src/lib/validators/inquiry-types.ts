export const inquiryTypes = [
  "collaboration",
  "commission",
  "exhibition",
  "press",
  "other",
] as const;

export type InquiryType = (typeof inquiryTypes)[number];
