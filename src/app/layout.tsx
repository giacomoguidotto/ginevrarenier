import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

// Root layout is minimal - locale layout handles everything
export default function RootLayout({ children }: Props) {
  return children;
}
