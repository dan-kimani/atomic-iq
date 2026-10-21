import { Column, Host, Row } from "@expo/ui";
import { BlurTargetView } from "expo-blur";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { Animated, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";

import { saveContact as saveRecentContact, updateContactNote, updateContactTags } from "../db";
import { haptics, NotificationFeedbackType } from "../lib/haptics";
import { useAppStore } from "../store/useAppStore";
import { prepareReminderForm } from "../store/useReminderStore";
import { ActionSheet, type SheetAction } from "../ui/action-sheet";
import { AppText } from "../ui/app-text";
import { ConfirmSheet, type ConfirmAction } from "../ui/confirm-sheet";
import { type RecentContact } from "../ui/contacts/contact-row";
import { NoteSheet } from "../ui/contacts/note-sheet";
import { RecentContactsCard } from "../ui/contacts/recent-contacts-card";
import { FadeHeader, useScrollFade } from "../ui/fade-header";
import { HeroCard } from "../ui/home/hero-card";
import { PhoneCard } from "../ui/home/phone-card";
import { QuickActions } from "../ui/home/quick-actions";
import { HomeHeader } from "../ui/page-header";
import { ReminderSheet } from "../ui/reminders/reminder-sheet";
import { EmptyState } from "../ui/section-header";
import { useMetrics, useTheme, withAlpha } from "../ui/theme";
import { showToast } from "../ui/toast";

export default function HomeScreen() {
  const { colors, scheme } = useTheme();
  const { contentWidth, insets } = useMetrics();
  const recentContacts = useAppStore((state) => state.recentContacts);
  const selectRecentContact = useAppStore((state) => state.selectRecentContact);
  const deleteRecentContact = useAppStore((state) => state.deleteRecentContact);
  const openWhatsApp = useAppStore((state) => state.openWhatsApp);
  const openDialer = useAppStore((state) => state.openDialer);
  const saveContact = useAppStore((state) => state.saveContact);
  const contactNames = useAppStore((state) => state.contactNames);
  const loadRecentContacts = useAppStore((state) => state.loadRecentContacts);
  const loadMoreRecentContacts = useAppStore((state) => state.loadMoreRecentContacts);
  const recentContactsHasMore = useAppStore((state) => state.recentContactsHasMore);
  const addCustomTag = useAppStore((state) => state.addCustomTag);
  const customTags = useAppStore((state) => state.customTags);
  const rawPhoneNumber = useAppStore((state) => state.rawPhoneNumber);
  const selectedCountry = useAppStore((state) => state.selectedCountry);

  const [menuTarget, setMenuTarget] = useState<RecentContact | null>(null);
  const [noteTarget, setNoteTarget] = useState<{
    phoneNumber: string;
    countryCode: string;
    contactName?: string;
    initialNote: string;
    initialTags: string[];
    country?: string;
    flag?: string;
    ensureSaved?: boolean;
  } | null>(null);
  const [reminderTarget, setReminderTarget] = useState<{
    phoneNumber: string;
    countryCode: string;
    contactName?: string;
  } | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const lastRecentLoadAt = useRef(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMounted, setSearchMounted] = useState(false);
  const [headerProgress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.timing(headerProgress, {
      toValue: searchOpen ? 1 : 0,
      duration: searchOpen ? 220 : 160,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !searchOpen) setSearchMounted(false);
    });
    return () => animation.stop();
  }, [headerProgress, searchOpen]);

  const normalHeaderStyle = {
    opacity: headerProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    transform: [
      {
        translateX: headerProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }),
      },
    ],
  };
  const searchHeaderStyle = {
    opacity: headerProgress,
    transform: [
      {
        translateX: headerProgress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
      },
    ],
  };

  // Startup data is hydrated in the root layout before the navigator mounts;
  // this screen only reloads after local mutations.
  const getContactName = (contact: RecentContact) =>
    contactNames[`${contact.countryCode}${contact.phoneNumber}`.replace(/\D/g, "")] ||
    contactNames[contact.phoneNumber];

  const handleSaveNote = (note: string, tags: string[]) => {
    if (!noteTarget) return;
    if (noteTarget.ensureSaved) {
      saveRecentContact(
        noteTarget.phoneNumber,
        noteTarget.countryCode,
        noteTarget.country ?? "",
        noteTarget.flag ?? "",
      ).catch(() => {});
    }
    updateContactNote(noteTarget.phoneNumber, note || null);
    updateContactTags(noteTarget.phoneNumber, tags.length > 0 ? tags.join(",") : null);
    for (const tag of tags) addCustomTag(tag);
    loadRecentContacts();
    setNoteTarget(null);
    showToast({ kind: "success", title: "Details saved" });
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleSelectRecent = (contact: RecentContact) => {
    selectRecentContact(contact);
    if (searchOpen) closeSearch();
  };

  const menuActions: SheetAction[] = menuTarget
    ? [
        {
          label: "Call",
          icon: "phone",
          onPress: () => openDialer(menuTarget.countryCode, menuTarget.phoneNumber),
        },
        {
          label: "WhatsApp",
          icon: "whatsapp",
          onPress: () => openWhatsApp(menuTarget.countryCode, menuTarget.phoneNumber),
        },
        {
          label: "Send SMS",
          icon: "sms",
          onPress: () => {
            const digits = `${menuTarget.countryCode}${menuTarget.phoneNumber}`.replace(/\D/g, "");
            Linking.openURL(`sms:+${digits}`);
            haptics.notificationAsync(NotificationFeedbackType.Success);
          },
        },
        {
          label: "Save to contacts",
          icon: "save-contact",
          onPress: () => saveContact(menuTarget.countryCode, menuTarget.phoneNumber),
        },
        {
          label: "Add note & tags",
          icon: "edit",
          onPress: () =>
            setNoteTarget({
              phoneNumber: menuTarget.phoneNumber,
              countryCode: menuTarget.countryCode,
              contactName: getContactName(menuTarget) || undefined,
              initialNote: menuTarget.notes ?? "",
              initialTags: menuTarget.tags
                ? menuTarget.tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                : [],
            }),
        },
        {
          label: "Set reminder",
          icon: "bell",
          onPress: () => {
            prepareReminderForm(null, customTags);
            setReminderTarget({
              phoneNumber: menuTarget.phoneNumber,
              countryCode: menuTarget.countryCode,
              contactName: getContactName(menuTarget) || undefined,
            });
          },
        },
        {
          label: "Delete from recents",
          icon: "trash",
          destructive: true,
          onPress: () =>
            setConfirmAction({
              title: "Delete contact?",
              description: "This removes the number from recent contacts. This cannot be undone.",
              confirmLabel: "Delete",
              onConfirm: () => deleteRecentContact(menuTarget.phoneNumber),
            }),
        },
      ]
    : [];

  const query = searchQuery.trim().toLowerCase();
  const queryDigits = query.replace(/\D/g, "");
  const matchedContacts = query
    ? recentContacts.filter((contact) => {
        const name = getContactName(contact)?.toLowerCase() ?? "";
        const digits = `${contact.countryCode}${contact.phoneNumber}`.replace(/\D/g, "");
        return name.includes(query) || (queryDigits.length > 0 && digits.includes(queryDigits));
      })
    : recentContacts;
  const recentTitle = query ? "Search results" : searchOpen ? "Search contacts" : "Recent";

  const headerHeight = insets.top + 12 + 61;
  const contentTop = headerHeight + 12;
  const { opacity: headerOpacity, onScroll } = useScrollFade(40, searchOpen);
  const blurTargetRef = useRef<ComponentRef<typeof View>>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    onScroll(event);
    if (searchOpen || !recentContactsHasMore) return;

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height < contentSize.height - 280) return;

    const now = Date.now();
    if (now - lastRecentLoadAt.current < 400) return;
    lastRecentLoadAt.current = now;
    loadMoreRecentContacts();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: headerHeight - 16,
          left: -100,
          right: -100,
          height: 460,
          experimental_backgroundImage: `radial-gradient(ellipse at 50% 30%, ${withAlpha(colors.brand, 0.1)} 0%, ${withAlpha(colors.brand, 0.035)} 38%, ${withAlpha(colors.background, 0)} 70%)`,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: headerHeight - 16,
          left: 0,
          right: 0,
          height: 170,
          experimental_backgroundImage: `linear-gradient(to bottom, ${withAlpha(colors.background, 1)} 0%, ${withAlpha(colors.background, 0.82)} 28%, ${withAlpha(colors.background, 0)} 100%)`,
        }}
      />

      <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
        <Animated.ScrollView
          key={searchOpen ? "search" : "home"}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: contentTop,
            paddingBottom: insets.bottom + 112,
            paddingHorizontal: 16,
          }}
        >
          <View style={{ width: contentWidth, gap: 10 }}>
            {searchOpen ? null : (
              <>
                <Host
                  colorScheme={scheme}
                  seedColor={colors.accent}
                  matchContents={{ vertical: true }}
                  style={{ width: contentWidth }}
                >
                  <HeroCard width={contentWidth} />
                </Host>

                <Host
                  colorScheme={scheme}
                  seedColor={colors.accent}
                  matchContents={{ vertical: true }}
                  style={{ width: contentWidth }}
                >
                  <PhoneCard
                    width={contentWidth}
                    onAddNote={() =>
                      setNoteTarget({
                        phoneNumber: rawPhoneNumber,
                        countryCode: selectedCountry.code,
                        initialNote: "",
                        initialTags: [],
                        country: selectedCountry.country,
                        flag: selectedCountry.flag,
                        ensureSaved: true,
                      })
                    }
                    onSetReminder={() => {
                      prepareReminderForm(null, customTags);
                      setReminderTarget({
                        phoneNumber: rawPhoneNumber,
                        countryCode: selectedCountry.code,
                      });
                    }}
                  />
                </Host>

                <Host
                  colorScheme={scheme}
                  seedColor={colors.accent}
                  matchContents={{ vertical: true }}
                  style={{ width: contentWidth }}
                >
                  <QuickActions width={contentWidth} />
                </Host>
              </>
            )}

            <Host
              colorScheme={scheme}
              seedColor={colors.accent}
              matchContents={{ vertical: true }}
              style={{ width: contentWidth }}
            >
              <Column spacing={8} style={{ width: contentWidth }}>
                <Row alignment="center" style={{ width: contentWidth, height: 28 }}>
                  <AppText variant="headline" numberOfLines={1}>
                    {recentTitle}
                  </AppText>
                </Row>

                {recentContacts.length === 0 ? (
                  <EmptyState
                    icon="message"
                    title="No recent numbers"
                    message="Numbers you message or call will appear here."
                    width={contentWidth}
                  />
                ) : matchedContacts.length === 0 ? (
                  <EmptyState
                    icon="search"
                    title="No contacts found"
                    message="Try another name or number."
                    width={contentWidth}
                  />
                ) : (
                  <RecentContactsCard
                    contacts={matchedContacts}
                    width={contentWidth}
                    getContactName={(contact) => getContactName(contact)}
                    onSelect={handleSelectRecent}
                    onMenu={setMenuTarget}
                    onWhatsApp={(contact) => openWhatsApp(contact.countryCode, contact.phoneNumber)}
                  />
                )}
              </Column>
            </Host>
          </View>
        </Animated.ScrollView>
      </BlurTargetView>

      <FadeHeader
        height={headerHeight}
        opacity={headerOpacity}
        glowHeight={headerHeight + 130}
        blurTarget={blurTargetRef}
      >
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
          <View style={{ height: 61 }}>
            <Animated.View
              style={[{ position: "absolute", left: 0, right: 0, top: 0 }, normalHeaderStyle]}
            >
              <Host colorScheme={scheme} seedColor={colors.accent} matchContents>
                <HomeHeader
                  onSettings={() => router.push("/settings")}
                  onSearch={() => {
                    setSearchMounted(true);
                    setSearchOpen(true);
                  }}
                />
              </Host>
            </Animated.View>
            {searchMounted ? (
              <Animated.View
                style={[{ position: "absolute", left: 0, right: 0, top: 0 }, searchHeaderStyle]}
              >
                <Host colorScheme={scheme} seedColor={colors.accent} matchContents>
                  <HomeHeader
                    onSearchClose={closeSearch}
                    onSearchChange={setSearchQuery}
                    searchActive
                    searchQuery={searchQuery}
                  />
                </Host>
              </Animated.View>
            ) : null}
          </View>
        </View>
      </FadeHeader>

      <ActionSheet
        visible={menuTarget !== null}
        onClose={() => setMenuTarget(null)}
        title={menuTarget ? getContactName(menuTarget) || "Recent contact" : undefined}
        subtitle={menuTarget ? `${menuTarget.countryCode} ${menuTarget.phoneNumber}` : undefined}
        actions={menuActions}
      />
      <NoteSheet
        visible={noteTarget !== null}
        phoneNumber={noteTarget?.phoneNumber ?? ""}
        countryCode={noteTarget?.countryCode ?? ""}
        contactName={noteTarget?.contactName}
        initialNote={noteTarget?.initialNote ?? ""}
        initialTags={noteTarget?.initialTags ?? []}
        onClose={() => setNoteTarget(null)}
        onSave={handleSaveNote}
      />
      <ReminderSheet
        visible={reminderTarget !== null}
        phoneNumber={reminderTarget?.phoneNumber ?? ""}
        countryCode={reminderTarget?.countryCode ?? ""}
        contactName={reminderTarget?.contactName}
        onClose={() => setReminderTarget(null)}
      />
      <ConfirmSheet action={confirmAction} onClose={() => setConfirmAction(null)} />
    </View>
  );
}
