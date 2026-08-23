import { Helmet } from 'react-helmet-async';

import { AddFundsView } from 'src/sections/addFunds/view';

// ----------------------------------------------------------------------

export default function AddFundsPage() {
  return (
    <>
      <Helmet>
        <title> Add Funds </title>
      </Helmet>

      <AddFundsView />
    </>
  );
}
