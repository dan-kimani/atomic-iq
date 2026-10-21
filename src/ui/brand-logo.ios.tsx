import { RNHostView, Row } from "@expo/ui";
import { Image } from "react-native";

const LOGO_TILE = "#F2FBF7";

interface Props {
  size?: number;
}

/**
 * SwiftUI's Icon only accepts SF Symbols, so the full-colour brand tile is
 * hosted as a React Native image inside the native header row.
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
      <RNHostView matchContents>
        <Image
          source={require("../../assets/atomic-iq-logo.png")}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </RNHostView>
    </Row>
  );
}
