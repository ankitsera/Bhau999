import { Helmet } from 'react-helmet-async';

import { GameSettingsView } from 'src/sections/gameSettings/view';

// ----------------------------------------------------------------------

export default function GameSettingPage() {
  return (
    <>
      <Helmet>
        <title> Game Settings | Bhau999 Admin </title>
      </Helmet>

      <GameSettingsView />
    </>
  );
}
