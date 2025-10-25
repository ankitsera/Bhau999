import { createContext, useEffect, useState} from 'react';
import {login, signup, logOut, restoreUserState} from "../utils/AuthService"
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
          const newUser = await signup(mobileNumber, username, password);
          setUser(newUser?.user);
          navigation.navigate("Home");
        } catch (error) {
          alert(
            `Signup Failed: ${error.response?.data?.detail || "Something went wrong!"}`
          );
        }
    };
    
    const loginHandler = async (email, password, navigation) => {
        try {
            const newUser = await login(email, password);
            setUser(newUser?.user);
            navigation.navigate("Home");
        } catch (error) {
            console.error(
                `Login Failed: ${error.response?.data?.detail || "Something went wrong!"}`
            );
        }
    };

    const logoutHandler = async () => {
        try {
            await logOut();
            setUser(null);
        } catch (error) {
            alert("Logout Failed: Something went wrong!");
        }
    };

    
    return (
        <AuthContext.Provider value={{
            user,
            signup: signupHandler,
            login: loginHandler,
            logout: logoutHandler,
        }}>
            {children}
        </AuthContext.Provider>
    );
};