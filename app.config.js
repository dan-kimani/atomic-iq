const pkg = require("./package.json");

module.exports = {
  expo: {
    name: "Atomic IQ",
    slug: "atomiciq",
    version: pkg.version,
    scheme: "atomiciq",
    jsEngine: "hermes",
    userInterfaceStyle: "automatic",
    orientation: "default",
    web: {
      output: "static",
    },
    icon: "./assets/icon.png",
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF",
      },
      package: "com.atomiciq.com",
      versionCode: 2,
      permissions: [
        "READ_CONTACTS",
        "WRITE_CONTACTS",
        "android.permission.READ_CONTACTS",
        "android.permission.WRITE_CONTACTS",
      ],
    },
    extra: {
      router: {},
      eas: {
        projectId: "9cdcb651-7454-4daa-a465-de5c3941483b",
      },
    },
    plugins: [
      "expo-router",
      "expo-sqlite",
      "expo-status-bar",
      [
        "expo-splash-screen",
        {
          image: "./assets/splash-icon.png",
          imageWidth: 120,
          resizeMode: "contain",
          backgroundColor: "#043D2C",
          dark: {
            image: "./assets/splash-icon.png",
            backgroundColor: "#043D2C",
          },
        },
      ],
      [
        "expo-contacts",
        {
          contactsPermission:
            "Allow Atomic IQ to read your contacts to show names for recent numbers.",
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            // Galaxy S23 Ultra is arm64-v8a; shipping other ABIs only inflates the APK.
            buildArchs: ["arm64-v8a"],
            enableMinifyInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
            enablePngCrunchInReleaseBuilds: true,
            // Compress .so files and the JS bundle inside the APK instead of storing them.
            useLegacyPackaging: true,
            enableBundleCompression: true,
            // The app renders no React Native <Image>, so drop the GIF/WebP decoders.
            gifEnabled: false,
            webpEnabled: false,
          },
        },
      ],
    ],
  },
};
