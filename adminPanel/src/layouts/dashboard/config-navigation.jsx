import SvgColor from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />
);

const navConfig = [
  {
    title: 'dashboard',
    path: '/dashboard',
    icon: icon('ic_analytics'),
  },
  {
    title: 'user',
    path: '/user',
    icon: icon('ic_user'),
  },
  {
    title: 'Report Management',
    icon: icon('ic_analytics'),
    children: [
      {
        title: 'Deposit History',
        path: '/deposit-history',
      },
      {
        title: 'Admin Deposit History',
        path: '/admin-deposit-history',
      },
      {
        title: 'Bid History',
        path: '/bid-history',
      },
      {
        title: 'Winning History',
        path: '/winning-history',
      },
    ],
  },
  {
    title: 'Game Results',
    path: '/game-results',
    icon: icon('ic_cart'),
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: icon('ic_blog'),
  },
  {
    title: 'Game Settings',
    path: '/game-setting',
    icon: icon('ic_blog'),
  },
  {
    title: 'Withdraw Requests',
    path: '/withdraw',
    icon: icon('ic_lock'),
  },
  {
    title: 'Add Funds',
    path: '/add-funds',
    icon: icon('ic_disabled'),
  },
  {
    title: 'Send Notifications',
    path: '/send-notifications',
    icon: icon('ic_blog'),
  },
  {
    title: 'NoticeBoard',
    path: '/noticeboard',
    icon: icon('ic_blog'),
  },
];

export default navConfig;
