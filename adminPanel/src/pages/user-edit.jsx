import { Helmet } from 'react-helmet-async';

import UserEditPage from 'src/sections/user/user-edit';

// ----------------------------------------------------------------------

export default function UserEdit() {
  return (
    <>
      <Helmet>
        <title> User Edit | Bhau999 Admin </title>
      </Helmet>

      <UserEditPage />
    </>
  );
}
