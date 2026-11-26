import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import AddCardRoundedIcon from '@mui/icons-material/AddCardRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';

// ----------------------------------------------------------------------

const iconSx = { width: 1, height: 1 };

const navConfig = [
  {
    title: 'dashboard',
    path: '/dashboard',
    icon: <DashboardRoundedIcon sx={iconSx} />,
  },
  {
    title: 'user',
    path: '/user',
    icon: <PeopleAltRoundedIcon sx={iconSx} />,
  },
  {
    title: 'Report Management',
    icon: <AssessmentRoundedIcon sx={iconSx} />,
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
    icon: <EmojiEventsRoundedIcon sx={iconSx} />,
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: <SettingsRoundedIcon sx={iconSx} />,
  },
  {
    title: 'Game Settings',
    path: '/game-setting',
    icon: <TuneRoundedIcon sx={iconSx} />,
  },
  {
    title: 'Withdraw Requests',
    path: '/withdraw',
    icon: <PaymentsRoundedIcon sx={iconSx} />,
  },
  {
    title: 'Add Funds',
    path: '/add-funds',
    icon: <AddCardRoundedIcon sx={iconSx} />,
  },
  {
    title: 'Send Notifications',
    path: '/send-notifications',
    icon: <NotificationsActiveRoundedIcon sx={iconSx} />,
  },
  {
    title: 'NoticeBoard',
    path: '/noticeboard',
    icon: <CampaignRoundedIcon sx={iconSx} />,
  },
];

export default navConfig;
