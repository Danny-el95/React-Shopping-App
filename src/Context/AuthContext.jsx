import { createContext, useContext } from "react";
import { useState } from "react";

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
    // const [user, setUser] = useState(localStorage.getItem("currentUserEmail")
    //     ? { email: localStorage.getItem("currentUserEmail") }
    //     : null
    // );

    const [user, setUser] = useState(() => {
        const savedEmail = localStorage.getItem("currentUserEmail");
        if (savedEmail) {
            const users = JSON.parse(localStorage.getItem("users") || "[]");
            const matched = users.find((u) => u.email === savedEmail);
            if (matched) return { username: matched.username, email: matched.email }
        }
        return null;
    });

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

        setUser({ username, email });
        return { success: true };
    };

    const login = (email, password) => {
        const users = JSON.parse(localStorage.getItem("users") || "[]");
        const matchedUser = users.find(
            (u) => u.email === email && u.password === password
        );

        if (!matchedUser) {
            return { success: false, error: "Invalid email or password" }
        }

        localStorage.setItem("currentUserEmail", email);
        setUser({ username: matchedUser.username, email: matchedUser.email });

        return { success: true };
    }

    const logout = () => {
        localStorage.removeItem("currentUserEmail");
        setUser(null);
    }
    return <AuthContext.Provider value={{ signUp, user, logout, login }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    return context;
}