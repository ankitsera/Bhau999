import { Helmet } from 'react-helmet-async';

import { NoticeBoardView } from 'src/sections/noticeboard/view';

// ----------------------------------------------------------------------

export default function NoticeBoardPage() {
  return (
    <>
      <Helmet>
        <title> NoticeBoard | Bhau999 Admin </title>
      </Helmet>

      <NoticeBoardView />
    </>
  );
}
