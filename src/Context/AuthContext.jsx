import { createContext } from "react";
import { useState } from "react";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(localStorage.getItem("currentUserEmail")
        ? { email: localStorage.getItem("currentUserEmail") }
        : null
    );

    const signUp = (username, email, password) => {
        // Implementation for sign-up logic
        const users = JSON.parse(localStorage.getItem("users") || "[]");

        // check if the user already exists
        if (users.find((u) => u.email === email || u.username === username)) {
            return { success: false, error: "Email or username already exist" };
        }
        const newUser = { username, email, password };
        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));
        localStorage.setItem("currentUserEmail", email);

        setUser({ email });
        return { success: true };
    };

    const login = (email, password) => {
        const users = JSON.parse(localStorage.getItem("users") || "[]");
        const user = users.find(
            (u) => u.email === email && u.password === password
        );

        if (!user) {
            return { success: false, error: "Invalid email or password" }
        }

        localStorage.setItem("currentUserEmail", email);
        setUser({ email });

        return { success: true };
    }

    const logout = () => {
        localStorage.removeItem("currentUserEmail");
        setUser(null);
    }
    return <AuthContext.Provider value={{ signUp, user, logout, login }}>{children}</AuthContext.Provider>;
}