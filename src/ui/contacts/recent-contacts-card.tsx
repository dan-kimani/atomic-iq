import { Column, Row, Spacer } from "@expo/ui";
import { Fragment } from "react";

import { Card } from "../card";
import { useTheme } from "../theme";
import { ContactRow, type RecentContact } from "./contact-row";

interface Props {
  contacts: RecentContact[];
  width: number;
  getContactName: (contact: RecentContact) => string | undefined;
  onSelect: (contact: RecentContact) => void;
  onMenu: (contact: RecentContact) => void;
  onWhatsApp: (contact: RecentContact) => void;
}

export function RecentContactsCard({
  contacts,
  width,
  getContactName,
  onSelect,
  onMenu,
  onWhatsApp,
}: Props) {
  const { colors } = useTheme();

  return (
    <Card width={width} padding={0} gap={0} cornerRadius={20}>
      {contacts.map((contact, index) => (
        <Fragment key={contact.phoneNumber}>
          <ContactRow
            contact={contact}
            contactName={getContactName(contact)}
            width={width}
            onSelect={() => onSelect(contact)}
            onMenu={() => onMenu(contact)}
            onWhatsApp={() => onWhatsApp(contact)}
          />
          {index < contacts.length - 1 ? (
            <Row style={{ width }}>
              <Spacer style={{ width: 64 }} />
              <Column style={{ width: width - 64, height: 1, backgroundColor: colors.border }} />
            </Row>
          ) : null}
        </Fragment>
      ))}
    </Card>
  );
}
