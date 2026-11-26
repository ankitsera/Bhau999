import { Helmet } from 'react-helmet-async';

import { ReportView } from 'src/sections/report/view';

// ----------------------------------------------------------------------

export default function GameSettingPage() {
  return (
    <>
      <Helmet>
        <title> Report Management | Bhau999 Admin </title>
      </Helmet>

      <ReportView />
    </>
  );
}