import { router } from "expo-router";
import { Bell, ClipboardList, Megaphone, MessageCircle, MessageSquareText } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AppHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top + 16 }} className="px-6 pb-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.push("/settings")}
          className="flex-row items-center active:opacity-70"
        >
          <View className="mr-3 rounded-xl bg-gray-100 p-2 dark:bg-gray-800">
            <MessageCircle size={24} color="#059669" />
          </View>
          <View>
            <Text className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              Atomic IQ
            </Text>
          </View>
        </Pressable>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => router.push("/reminders")}
            className="rounded-xl bg-gray-100 p-2 active:bg-gray-200 dark:bg-gray-700 dark:active:bg-gray-600"
          >
            <Bell size={20} color="#6b7280" />
          </Pressable>
          <Pressable
            onPress={() => router.push("/templates")}
            className="rounded-xl bg-gray-100 p-2 active:bg-gray-200 dark:bg-gray-700 dark:active:bg-gray-600"
          >
            <MessageSquareText size={20} color="#6b7280" />
          </Pressable>
          <Pressable
            onPress={() => router.push("/business-events")}
            className="rounded-xl bg-gray-100 p-2 active:bg-gray-200 dark:bg-gray-700 dark:active:bg-gray-600"
          >
            <ClipboardList size={20} color="#6b7280" />
          </Pressable>
          <Pressable
            onPress={() => router.push("/broadcast")}
            className="rounded-xl bg-emerald-100 p-2 active:bg-emerald-200 dark:bg-emerald-900/40 dark:active:bg-emerald-900/60"
          >
            <Megaphone size={20} color="#059669" />
          </Pressable>
        </View>
      </View>
      <Text className="text-base leading-6 text-gray-500 dark:text-gray-400">
        Open a chat with any number — nothing saved to your contacts.
      </Text>
    </View>
  );
}
