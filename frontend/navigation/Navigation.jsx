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
        </Stack.Navigator>
      </HeaderButtonsProvider>
    </NavigationContainer>
  );
}

export default Navigation;
