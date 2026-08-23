import { Helmet } from 'react-helmet-async';

import { SendNotificationsView } from 'src/sections/sendNotifications/view';

export default function SendNotificationsPage() {
  return (
    <>
      <Helmet>
        <title> Send Notifications | Matka Admin </title>
      </Helmet>

      <SendNotificationsView />
    </>
  );
}