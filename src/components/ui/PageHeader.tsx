import { Text, View } from "react-native";

import BackButton from "./BackButton";

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, right }: Props) {
  return (
    <View className="px-4 py-3">
      <View className="flex-row items-center">
        <BackButton />
        <Text className="flex-1 text-center text-lg font-bold text-gray-900 dark:text-gray-100">
          {title}
        </Text>
        {right ?? <View style={{ width: 38 }} />}
      </View>
      {subtitle && (
        <Text className="mt-1 text-center text-sm leading-5 text-gray-500 dark:text-gray-400">
          {subtitle}
        </Text>
      )}
    </View>
  );
}
