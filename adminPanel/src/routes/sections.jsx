import dayjs from 'dayjs';
import { lazy, Suspense, useState } from 'react';
import { Outlet, Navigate, useRoutes } from 'react-router-dom';
import logo from 'src/components/logo';
import { getToken, removeToken } from 'src/helper';

import DashboardLayout from 'src/layouts/dashboard';

export const IndexPage = lazy(() => import('src/pages/app'));
export const SettingsPage = lazy(() => import('src/pages/settings'));
export const UserPage = lazy(() => import('src/pages/user'));
export const UserEditPage = lazy(() => import('src/pages/user-edit'));
export const LoginPage = lazy(() => import('src/pages/login'));
export const GameResultsPage = lazy(() => import('src/pages/gameResults'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));
export const WithdrawPage = lazy(() => import('src/pages/withdraw'));
export const AddFundsPage = lazy(() => import('src/pages/addFunds'));
export const GameSettingPage = lazy(() => import('src/pages/gameSetting'));
export const DepositHistoryPage = lazy(() => import('src/pages/depositHistory'));
export const AdminDepositHistoryPage = lazy(() => import('src/pages/admin-deposit-history'));
export const SendNotificationsPage = lazy(() => import('src/pages/send-notifications'));
export const NoticeBoardPage = lazy(() => import('src/pages/noticeboard'));
export const BidHistoryPage = lazy(() => import('src/pages/bid-history'));
export const WinningHistoryPage = lazy(() => import('src/pages/winning-history'));

// ----------------------------------------------------------------------
const ProtectedRoute = () => {
  const getVerification = () => {
    const token = getToken();

    // Check if token exists
    if (!token || token === '' || token === null || token === undefined) {
      return false;
    }

    // Check if login timestamp exists
    const create_time = window.localStorage.getItem("logged_at");
    if (!create_time || create_time === null) {
      removeToken();
      return false;
    }

    // Check if token has expired (2 hours)
    if (dayjs().diff(create_time, 'minute') > 120) {
      removeToken();
      localStorage.removeItem("logged_at");
      return false;
    }

    return true;
  };

  // If not authenticated, redirect to login page
  if (!getVerification()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
export default function Router() {
  const routes = useRoutes([
    {
      element: (
        <DashboardLayout>
          <Suspense>
            <ProtectedRoute />
          </Suspense>
        </DashboardLayout>
      ),
      children: [
        { path: 'dashboard', element: <IndexPage /> },
        { path: 'user', element: <UserPage /> },
        { path: 'user/:mobileNumber', element: <UserEditPage /> },
        { path: 'game-results', element: <GameResultsPage /> },
        { path: 'settings', element: <SettingsPage /> },
        { path: 'withdraw', element: <WithdrawPage /> },
        { path: 'add-funds', element: <AddFundsPage /> },
        { path: 'game-setting', element: <GameSettingPage /> },
        { path: 'deposit-history', element: <DepositHistoryPage /> },
        { path: 'admin-deposit-history', element: <AdminDepositHistoryPage /> },
        { path: 'bid-history', element: <BidHistoryPage /> },
        { path: 'winning-history', element: <WinningHistoryPage /> },
        { path: 'send-notifications', element: <SendNotificationsPage /> },
        { path: 'noticeboard', element: <NoticeBoardPage /> },
      ],
    },
    {
      path: '/',
      element: <LoginPage />,
    },
    {
      path: '404',
      element: <Page404 />,
    },
    {
      path: '*',
      element: <Navigate to="/404" replace />,
    },
  ]);

  return routes;
}
