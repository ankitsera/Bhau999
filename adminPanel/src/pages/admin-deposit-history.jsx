import { Helmet } from 'react-helmet-async';

import { AdminDepositHistoryView } from 'src/sections/adminDepositHistory/view';

// ----------------------------------------------------------------------

export default function AdminDepositHistoryPage() {
  return (
    <>
      <Helmet>
        <title> Admin Deposit History </title>
      </Helmet>

      <AdminDepositHistoryView />
    </>
  );
}
