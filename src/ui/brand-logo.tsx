import { Image, View } from "react-native";

const LOGO_TILE = "#F2FBF7";

interface Props {
  size?: number;
}

/** Web build of the brand mark. Native builds use the compose/swift hosts. */
export function BrandLogo({ size = 48 }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        backgroundColor: LOGO_TILE,
        borderWidth: 1,
        borderColor: "#DDF2E8",
      }}
    >
      <Image
        source={require("../../assets/atomic-iq-logo.png")}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}
