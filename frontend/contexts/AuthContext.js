import { createContext, useEffect, useState} from 'react';
import {login, signup, userCheck, logOut, restoreUserState} from "../utils/AuthService"
import Snackbar from 'react-native-snackbar';
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Track loading state

    // Restore user state on app start
    useEffect(() => {
        const initializeUser = async () => {
        try {
            const storedState = await restoreUserState();
            if (storedState) {
                setUser(storedState.user);
                // Optionally verify token here if you want to ensure it's still valid
            }
        } catch (error) {
            console.error("Failed to restore user state:", error);
        } finally {
            setIsLoading(false);
        }
        };
        initializeUser();
    }, []);

    const signupHandler = async (mobileNumber, username, password, navigation) => {
        try {
            const result = await signup(mobileNumber, username, password);

            const dateSignup = new Date().toISOString();
            setUser({ mobileNumber, username, dateSignup });

            Snackbar.show({
                text: result?.message || "Account created successfully ✅",
                duration: Snackbar.LENGTH_SHORT,
                backgroundColor: "#388e3c",
            });

            navigation.navigate("Home");
        } catch (error) {
            Snackbar.show({
                text: error?.message || "Something went wrong!",
                duration: Snackbar.LENGTH_SHORT,
                backgroundColor: "#d32f2f",
            });
        }
    };
    
    const loginHandler = async (mobileNumber, password, navigation) => {
        try {
            const user = await login(mobileNumber, password); // returns user object
            setUser(user);
            navigation.navigate("Home");
        } catch (error) {
            console.error("Login Failed:", error);
            Snackbar.show({
            text: error?.message || "Something went wrong!",
            duration: Snackbar.LENGTH_SHORT,
            backgroundColor: "#d32f2f",
            });
        }
    };

    const userCheckHandler = async (mobileNumber, navigation) => {
        try {
            const exists = await userCheck(mobileNumber);

            if (exists) {
                navigation.navigate("Login", { mobileNumber });
            } else {
                navigation.navigate("Signup", { mobileNumber });
            }
        } catch (err) {
            console.error("User check failed:", err);
            Snackbar.show({
                text: err?.message || "Error checking user. Please try again.",
                duration: Snackbar.LENGTH_SHORT,
                backgroundColor: "#d32f2f",
            });
        }
    };

    const logoutHandler = async (navigation) => {
        try {
            await logOut();
            setUser(null);
            navigation.navigate("UserCheck");
        } catch (error) {
            alert("Logout Failed: Something went wrong!");
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            signup: signupHandler,
            login: loginHandler,
            logout: logoutHandler,
            userCheck: userCheckHandler,
        }}>
            {children}
        </AuthContext.Provider>
    );
};