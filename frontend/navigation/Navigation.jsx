import React, { useContext, useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer, NavigationContainerRef} from "@react-navigation/native";
import { HeaderButtonsProvider } from "react-navigation-header-buttons/HeaderButtonsProvider";
import { useTheme } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import { lightTheme, darkTheme } from '../contexts/Themes';
import { getSelectedLanguage } from '../utils/LanguagePreference';
import { canUseFeature, FEATURES } from '../utils/Features';
import LoadingView from '../components/LoadingView';
import Home from "../screens/Home";
import UserCheck from "../screens/Auth/UserCheck";
import Signup from "../screens/Auth/Signup";
import Login from "../screens/Auth/Login";
import AddMoney from "../screens/Sidebar/AddMoney";
import WithdrawMoney from "../screens/Sidebar/WithdrawMoney";
import MyBids from "../screens/Sidebar/MyBids";
import Funds from "../screens/Sidebar/Funds";
import Notifications from "../screens/Sidebar/Notifications";
import BankDetails from "../screens/BankDetails";
import Charts from "../screens/Sidebar/Charts";
import MatkaChart from "../screens/MatkaChart";
import GameChartPanel from "../screens/GameChartPanel";
import GameRate from "../screens/Sidebar/GameRate";
import TimeTable from "../screens/Sidebar/TimeTable";
import NoticeBoard from "../screens/Sidebar/NoticeBoard";
import Settings from "../screens/Sidebar/Settings";
import HowToPlay from "../screens/Sidebar/HowToPlay";
import LanguageSelect from "../screens/LanguageSelect";
import LanguageSwitcher from "../components/LanguageSwitcher";

//Fund History Screens
import Passbook from "../screens/Sidebar/Passbook";
import AddFundHistory from "../screens/AddFundHistory";
import WithdrawFundHistory from "../screens/WithdrawFundHistory";

//Bid History
import BidHistory from "../screens/BidHistory";

//Result Screen
import GameResults from "../screens/GameResults";

import GamesSubTypes from "../screens/GamesSubTypes";

//Games Screens
import SingleDigit from "../screens/SubGames/SingleDigit";
import SingleDigitBulk from "../screens/SubGames/SingleDigitBulk";
import Jodi from "../screens/SubGames/Jodi";
import JodiBulk from "../screens/SubGames/JodiBulk";
import SinglePana from "../screens/SubGames/SinglePana";
import SinglePanaBulk from "../screens/SubGames/SinglePanaBulk";
import DoublePana from "../screens/SubGames/DoublePana";
import DoublePanaBulk from "../screens/SubGames/DoublePanaBulk";
import TriplePana from "../screens/SubGames/TriplePana";
import FullSangam from "../screens/SubGames/FullSangam";
import HalfSangamA from "../screens/SubGames/HalfSangamA";
import HalfSangamB from "../screens/SubGames/HalfSangamB";
import SpDpTp from "../screens/SubGames/SpDpTp";
import TwoDigitPana from "../screens/SubGames/TwoDigitPana";
import RedJodi from "../screens/SubGames/RedJodi";
import OddEven from "../screens/SubGames/OddEven";
import SpMotor from "../screens/SubGames/SpMotor";
import DpMotor from "../screens/SubGames/DpMotor";
import SpCommon from "../screens/SubGames/SpCommon";
import DpCommon from "../screens/SubGames/DpCommon";
import DigitBasedJodi from "../screens/SubGames/DigitBasedJodi";

// Lucky Starline and Lucky Jackpot
import LuckyStarline from "../screens/LuckyGames/LuckyStarline";
import LuckyJackpot from "../screens/LuckyGames/LuckyJackpot";
import LuckyStarlineBidHistory from "../screens/LuckyGames/LuckyStarlineBidHistory";
import LuckyJackpotBidHistory from "../screens/LuckyGames/LuckyJackpotBidHistory";
import LuckyStarlineResultHistory from "../screens/LuckyGames/LuckyStarlineResultHistory";
import LuckyJackpotResultHistory from "../screens/LuckyGames/LuckyJackpotResultHistory";

const Stack = createNativeStackNavigator();

//It will allow native stack to behave as web stack so that we could see the url and navigate using browser buttons
const linking = {
  prefixes: ['/'],
  config: {
    screens: {
      Home: '',
      //Add any other screen which requires id to be passed in the url
      //e.g - 
      // DoctorResultShow: 'doctor/:id'
      // where id could be user id or any specific detail of user
    },
  },
};

const Navigation = ({ navigationRef }) => {
  const { isDarkMode, colors } = useTheme();
  const { user, isLoading } = useContext(AuthContext);
  const theme = isDarkMode ? darkTheme : lightTheme;
  // Screens a limited-view user cannot use are not registered at all, so nothing
  // (a stray button, a deep link) can open them.
  const canPay = canUseFeature(user, FEATURES.PAYMENTS);
  const canBet = canUseFeature(user, FEATURES.BETTING);
  
  const [languageReady, setLanguageReady] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadLanguagePreference = async () => {
      try {
        const lang = await getSelectedLanguage();
        if (mounted) {
          setSelectedLanguage(lang);
        }
      } catch (e) {
        console.log('Language preference load error:', e?.message);
      } finally {
        if (mounted) {
          setLanguageReady(true);
        }
      }
    };

    loadLanguagePreference();

    return () => {
      mounted = false;
    };
  }, []);

  // Wait for user state to be restored before deciding which screen to show
  const loading = isLoading || !languageReady;
  
  // Determine initial route based on user presence
  const initialRouteName = user ? "Home" : selectedLanguage ? "UserCheck" : "Language Select";
  
  return (
    <LoadingView loading={loading}>
      <NavigationContainer ref={navigationRef} linking={linking}>
      <HeaderButtonsProvider stackType={"native"}>
        <Stack.Navigator
          initialRouteName={initialRouteName}
            screenOptions={{
              headerStyle: {
                backgroundColor: theme.container.backgroundColor,
              },
              headerTintColor: theme.text.color,
            }}
        >
        <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} /> 
        <Stack.Screen name="UserCheck" component={UserCheck} options={{ headerShown: false }} /> 
        <Stack.Screen name="Signup" component={Signup} options={{ headerShown: false }} /> 
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} /> 
        <Stack.Screen name="Notifications" component={Notifications} options={{ headerShown: false }} /> 
        <Stack.Screen name="Charts" component={Charts} options={{ headerShown: false }} />
        <Stack.Screen name="Matka Chart" component={MatkaChart} options={{ headerShown: false }} />
        <Stack.Screen name="GameChartPanel" component={GameChartPanel} options={{ headerShown: false }} />
        <Stack.Screen name="Game Rate" component={GameRate} options={{ headerShown: false }} />
        <Stack.Screen name="Time Table" component={TimeTable} options={{ headerShown: false }} /> 
        <Stack.Screen name="Notice board / Rules" component={NoticeBoard} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={Settings} options={{ headerShown: false }} />
        <Stack.Screen name="How to Play" component={HowToPlay} options={{ headerShown: false }} />
        <Stack.Screen name="Language Select" component={LanguageSelect} options={{ headerShown: false }} />
        <Stack.Screen name="Language" component={LanguageSwitcher} options={{ headerShown: false }} />

        {/* Result Screen */}
        <Stack.Screen name="Game Results" component={GameResults} options={{ headerShown: false }} />

        {/* Payment Screens */}
        {canPay && (
          <Stack.Group>
            <Stack.Screen name="Add Money" component={AddMoney} options={{ headerShown: false }} />
            <Stack.Screen name="Withdraw Money" component={WithdrawMoney} options={{ headerShown: false }} />
            <Stack.Screen name="Funds" component={Funds} options={{ headerShown: false }} />
            <Stack.Screen name="Bank Details" component={BankDetails} options={{ headerShown: false }} />

            {/* Fund History Screens */}
            <Stack.Screen name="Passbook" component={Passbook} options={{ headerShown: false }} />
            <Stack.Screen name="Add Fund History" component={AddFundHistory} options={{ headerShown: false }} />
            <Stack.Screen name="Withdraw Fund History" component={WithdrawFundHistory} options={{ headerShown: false }} />
          </Stack.Group>
        )}

        {/* Betting Screens */}
        {canBet && (
          <Stack.Group>
            <Stack.Screen name="My Bids" component={MyBids} options={{ headerShown: false }} />
            <Stack.Screen name="Games Sub Types" component={GamesSubTypes} options={{ headerShown: false }} />

            {/* Bid History Screen */}
            <Stack.Screen name="Bid History" component={BidHistory} options={{ headerShown: false }} />

            {/* Sub-Games */}
            <Stack.Screen name="SingleDigit" component={SingleDigit} options={{ headerShown: false }} />
            <Stack.Screen name="SingleDigitBulk" component={SingleDigitBulk} options={{ headerShown: false }} />
            <Stack.Screen name="Jodi" component={Jodi} options={{ headerShown: false }} />
            <Stack.Screen name="JodiBulk" component={JodiBulk} options={{ headerShown: false }} />
            <Stack.Screen name="SinglePana" component={SinglePana} options={{ headerShown: false }} />
            <Stack.Screen name="SinglePanaBulk" component={SinglePanaBulk} options={{ headerShown: false }} />
            <Stack.Screen name="DoublePana" component={DoublePana} options={{ headerShown: false }} />
            <Stack.Screen name="DoublePanaBulk" component={DoublePanaBulk} options={{ headerShown: false }} />
            <Stack.Screen name="TriplePana" component={TriplePana} options={{ headerShown: false }} />
            <Stack.Screen name="FullSangam" component={FullSangam} options={{ headerShown: false }} />
            <Stack.Screen name="HalfSangamA" component={HalfSangamA} options={{ headerShown: false }} />
            <Stack.Screen name="HalfSangamB" component={HalfSangamB} options={{ headerShown: false }} />
            <Stack.Screen name="SpDpTp" component={SpDpTp} options={{ headerShown: false }} />
            <Stack.Screen name="TwoDigitPana" component={TwoDigitPana} options={{ headerShown: false }} />
            <Stack.Screen name="RedJodi" component={RedJodi} options={{ headerShown: false }} />
            <Stack.Screen name="OddEven" component={OddEven} options={{ headerShown: false }} />
            <Stack.Screen name="SpMotor" component={SpMotor} options={{ headerShown: false }} />
            <Stack.Screen name="DpMotor" component={DpMotor} options={{ headerShown: false }} />
            <Stack.Screen name="SpCommon" component={SpCommon} options={{ headerShown: false }} />
            <Stack.Screen name="DpCommon" component={DpCommon} options={{ headerShown: false }} />
            <Stack.Screen name="DigitBasedJodi" component={DigitBasedJodi} options={{ headerShown: false }} />

            { /* Lucky Starline and Lucky Jackpot*/}
            <Stack.Screen name="LuckyStarline" component={LuckyStarline} options={{ headerShown: false }} />
            <Stack.Screen name="LuckyJackpot" component={LuckyJackpot} options={{ headerShown: false }} />
            <Stack.Screen name="LuckyStarline Bid History" component={LuckyStarlineBidHistory} options={{ headerShown: false }} />
            <Stack.Screen name="LuckyJackpot Bid History" component={LuckyJackpotBidHistory} options={{ headerShown: false }} />
            <Stack.Screen name="LuckyStarline Result History" component={LuckyStarlineResultHistory} options={{ headerShown: false }} />
            <Stack.Screen name="LuckyJackpot Result History" component={LuckyJackpotResultHistory} options={{ headerShown: false }} />
          </Stack.Group>
        )}
        </Stack.Navigator>
      </HeaderButtonsProvider>
    </NavigationContainer>
    </LoadingView>
  );
}

export default Navigation;
