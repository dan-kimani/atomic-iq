import type { ReactNode } from "react";

interface Props {
  visible: boolean;
  children: ReactNode;
}

/** Non-Compose fallback; the native Android build uses the animated variant. */
export function Reveal({ visible, children }: Props) {
  return visible ? <>{children}</> : null;
}
