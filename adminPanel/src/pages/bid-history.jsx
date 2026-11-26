import { Helmet } from 'react-helmet-async';

import { BidHistoryView } from 'src/sections/bidHistory/view';

// ----------------------------------------------------------------------

export default function BidHistoryPage() {
  return (
    <>
      <Helmet>
        <title> Bid History | Bhau999 Admin </title>
      </Helmet>

      <BidHistoryView />
    </>
  );
}
