import { Row } from "@expo/ui";
import { Icon } from "@expo/ui/jetpack-compose";

const LOGO_TILE = "#F2FBF7";

interface Props {
  size?: number;
}

/**
 * The brand tile is already a rounded, mint-backed asset. Render it untinted
 * with the compose image loader and reserve the slot synchronously.
 */
export function BrandLogo({ size = 48 }: Props) {
  return (
    <Row
      alignment="center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        backgroundColor: LOGO_TILE,
        borderWidth: 1,
        borderColor: "#DDF2E8",
      }}
    >
      <Icon source={require("../../assets/atomic-iq-logo.png")} size={size} tint={null} />
    </Row>
  );
}
