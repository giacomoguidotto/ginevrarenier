import { z } from "zod";

export const inquirySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  inquiryType: z.enum([
    "collaboration",
    "commission",
    "exhibition",
    "press",
    "other",
  ]),
  message: z.string().min(1),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
