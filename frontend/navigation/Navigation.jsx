import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer, NavigationContainerRef} from "@react-navigation/native";
import { HeaderButtonsProvider } from "react-navigation-header-buttons/HeaderButtonsProvider";
import { useTheme } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import { lightTheme, darkTheme } from '../contexts/Themes';
import { View, ActivityIndicator } from 'react-native';
import Home from "../screens/Home";
import UserCheck from "../screens/Auth/UserCheck";
import Signup from "../screens/Auth/Signup";
import Login from "../screens/Auth/Login";
import AddMoney from "../screens/Sidebar/AddMoney";
import WithdrawMoney from "../screens/Sidebar/WithdrawMoney";
import MyBids from "../screens/Sidebar/MyBids";
import Passbook from "../screens/Sidebar/Passbook";
import Funds from "../screens/Sidebar/Funds";
import Notifications from "../screens/Sidebar/Notifications";
import BankDetails from "../screens/BankDetails";
import AddFundHistory from "../screens/AddFundHistory";
import Charts from "../screens/Sidebar/Charts";
import GameRate from "../screens/Sidebar/GameRate";
import TimeTable from "../screens/Sidebar/TimeTable";
import NoticeBoard from "../screens/Sidebar/NoticeBoard";
import Settings from "../screens/Sidebar/Settings";
import HowToPlay from "../screens/Sidebar/HowToPlay";

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
  const { isDarkMode } = useTheme();
  const { user, isLoading } = useContext(AuthContext);
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  // Wait for user state to be restored before deciding which screen to show
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3FA16C" />
      </View>
    );
  }
  
  // Determine initial route based on user presence
  const initialRouteName = user ? "Home" : "UserCheck";
  
  return (
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
        <Stack.Screen name="Add Money" component={AddMoney} options={{ headerShown: false }} /> 
        <Stack.Screen name="Withdraw Money" component={WithdrawMoney} options={{ headerShown: false }} /> 
        <Stack.Screen name="My Bids" component={MyBids} options={{ headerShown: false }} /> 
        <Stack.Screen name="Passbook" component={Passbook} options={{ headerShown: false }} />
        <Stack.Screen name="Funds" component={Funds} options={{ headerShown: false }} /> 
        <Stack.Screen name="Notifications" component={Notifications} options={{ headerShown: false }} /> 
        <Stack.Screen name="Bank Details" component={BankDetails} options={{ headerShown: false }} />
        <Stack.Screen name="Add Fund History" component={AddFundHistory} options={{ headerShown: false }} /> 
        <Stack.Screen name="Charts" component={Charts} options={{ headerShown: false }} />
        <Stack.Screen name="Game Rate" component={GameRate} options={{ headerShown: false }} />
        <Stack.Screen name="Time Table" component={TimeTable} options={{ headerShown: false }} /> 
        <Stack.Screen name="Notice board / Rules" component={NoticeBoard} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={Settings} options={{ headerShown: false }} />
        <Stack.Screen name="How to Play" component={HowToPlay} options={{ headerShown: false }} />
        </Stack.Navigator>
      </HeaderButtonsProvider>
    </NavigationContainer>
  );
}

export default Navigation;
