import { Helmet } from 'react-helmet-async';

import { SettingsView } from 'src/sections/settings/view';

// ----------------------------------------------------------------------

export default function SettingsPage() {
  return (
    <>
      <Helmet>
        <title> Settings | Bhau999 Admin </title>
      </Helmet>

      <SettingsView />
    </>
  );
}
