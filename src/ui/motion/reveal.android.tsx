import { AnimatedVisibility, EnterTransition, ExitTransition } from "@expo/ui/jetpack-compose";
import type { ReactNode } from "react";

interface Props {
  visible: boolean;
  children: ReactNode;
}

/** Animated layout reveal backed by Compose's AnimatedVisibility. */
export function Reveal({ visible, children }: Props) {
  return (
    <AnimatedVisibility
      visible={visible}
      enterTransition={EnterTransition.expandVertically().plus(EnterTransition.fadeIn())}
      exitTransition={ExitTransition.shrinkVertically().plus(ExitTransition.fadeOut())}
    >
      {children}
    </AnimatedVisibility>
  );
}
