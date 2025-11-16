import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer, NavigationContainerRef} from "@react-navigation/native";
import { HeaderButtonsProvider } from "react-navigation-header-buttons/HeaderButtonsProvider";
import { useTheme } from '../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../contexts/Themes';
import Home from "../screens/Home";
import UserCheck from "../screens/Auth/UserCheck";
import Signup from "../screens/Auth/Signup";
import Login from "../screens/Auth/Login";
import AddMoney from "../screens/Sidebar/AddMoney";
import WithdrawMoney from "../screens/Sidebar/WithdrawMoney";
import MyBids from "../screens/Sidebar/MyBids";
import Funds from "../screens/Sidebar/Funds";
import BankDetails from "../screens/BankDetails";
import AddFundHistory from "../screens/AddFundHistory";
import Charts from "../screens/Sidebar/Charts";
import GameRate from "../screens/Sidebar/GameRate";
import TimeTable from "../screens/Sidebar/TimeTable";
import NoticeBoard from "../screens/Sidebar/NoticeBoard";
import Settings from "../screens/Sidebar/Settings";

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
  const theme = isDarkMode ? darkTheme : lightTheme;
  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <HeaderButtonsProvider stackType={"native"}>
        <Stack.Navigator
          initialRouteName="Home"
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
        <Stack.Screen name="AddMoney" component={AddMoney} options={{ headerShown: false }} /> 
        <Stack.Screen name="WithdrawMoney" component={WithdrawMoney} options={{ headerShown: false }} /> 
        <Stack.Screen name="MyBids" component={MyBids} options={{ headerShown: false }} /> 
        <Stack.Screen name="Funds" component={Funds} options={{ headerShown: false }} /> 
        <Stack.Screen name="BankDetails" component={BankDetails} options={{ headerShown: false }} />
        <Stack.Screen name="AddFundHistory" component={AddFundHistory} options={{ headerShown: false }} /> 
        <Stack.Screen name="Charts" component={Charts} options={{ headerShown: false }} />
        <Stack.Screen name="GameRate" component={GameRate} options={{ headerShown: false }} />
        <Stack.Screen name="TimeTable" component={TimeTable} options={{ headerShown: false }} /> 
        <Stack.Screen name="NoticeBoard" component={NoticeBoard} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={Settings} options={{ headerShown: false }} />
        </Stack.Navigator>
      </HeaderButtonsProvider>
    </NavigationContainer>
  );
}

export default Navigation;
