import { Instagram, type LucideIcon, Mail } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  instagram: Instagram,
  email: Mail,
};

export function getSocialIcon(platform: string): LucideIcon {
  return iconMap[platform] || Mail;
}
