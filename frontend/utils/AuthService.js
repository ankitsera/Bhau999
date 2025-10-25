import AsyncStorage from "@react-native-async-storage/async-storage";

export const signup = async (mobileNumber, username, password) => {
  const response = await fetch(`${API_URL}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mobileNumber, username, password }),
  });

  if (!response.ok) {
    throw new Error("Signup failed");
  }

  const data = await response.json();
  const { user } = data;
  
  await AsyncStorage.setItem("@user", JSON.stringify(user));
  return user;
};

export const login = async (mobileNumber, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mobileNumber, password }),
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  const data = await response.json();
  const { user } = data;

  await AsyncStorage.setItem("@user", JSON.stringify(user));

  return { user };
};

export const logOut = async (setUser) => {
  await AsyncStorage.removeItem("@user");
};

export const restoreUserState = async () => {
  const user = await AsyncStorage.getItem("@user");
  if (user) {
    return { user: JSON.parse(user) };
  }
  return null;
};
