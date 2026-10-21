import { Image, Text, View } from "react-native";

const LOGO = require("../../assets/atomic-iq-logo.png");

/** Branded startup screen shown while the local store hydrates. */
export function SplashScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#043D2C",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          experimental_backgroundImage:
            "radial-gradient(ellipse at 50% 38%, rgba(64, 220, 160, 0.20) 0%, rgba(4, 61, 44, 0) 64%)",
        }}
      />

      <Image
        source={LOGO}
        style={{ width: 116, height: 116, borderRadius: 30 }}
        resizeMode="contain"
      />

      <Text
        style={{
          marginTop: 26,
          color: "#FFFFFF",
          fontSize: 30,
          fontWeight: "700",
          letterSpacing: -0.6,
        }}
      >
        Atomic IQ
      </Text>
      <Text
        style={{
          marginTop: 7,
          color: "rgba(255, 255, 255, 0.62)",
          fontSize: 14,
          fontWeight: "500",
        }}
      >
        Message. Call. Organize.
      </Text>
    </View>
  );
}
