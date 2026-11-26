import { Helmet } from 'react-helmet-async';

import { GameResultsView } from 'src/sections/gameResults/view';

// ----------------------------------------------------------------------

export default function GameResultsPage() {
  return (
    <>
      <Helmet>
        <title> Declare Result | Bhau999 Admin </title>
      </Helmet>

      <GameResultsView />
    </>
  );
}
