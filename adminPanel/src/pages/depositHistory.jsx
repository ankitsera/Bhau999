import { Helmet } from 'react-helmet-async';

import { DepositHistoryView } from 'src/sections/depositHistory/view';

// ----------------------------------------------------------------------

export default function DepositHistoryPage() {
  return (
    <>
      <Helmet>
        <title> Deposit History </title>
      </Helmet>

      <DepositHistoryView />
    </>
  );
}