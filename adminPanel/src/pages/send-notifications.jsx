import { Helmet } from 'react-helmet-async';

import { SendNotificationsView } from 'src/sections/sendNotifications/view';

export default function SendNotificationsPage() {
  return (
    <>
      <Helmet>
        <title> Send Notifications | Bhau999 Admin </title>
      </Helmet>

      <SendNotificationsView />
    </>
  );
}