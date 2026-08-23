import { Helmet } from 'react-helmet-async';

import { WinningHistoryView } from 'src/sections/winningHistory/view';

// ----------------------------------------------------------------------

export default function WinningHistoryPage() {
  return (
    <>
      <Helmet>
        <title> Winning History </title>
      </Helmet>

      <WinningHistoryView />
    </>
  );
}
