import { Helmet } from 'react-helmet-async';

import { WithdrawView } from 'src/sections/withdraw/view';

// ----------------------------------------------------------------------

export default function WithdrawPage() {
  return (
    <>
      <Helmet>
        <title> Withdraw Request </title>
      </Helmet>

      <WithdrawView />
    </>
  );
}