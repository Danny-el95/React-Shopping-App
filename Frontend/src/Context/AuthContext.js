import { createContext, useContext } from "react";

const AuthContext = createContext(null);

export function useAuth() {
    const auth = useContext(AuthContext);

    if (!auth) {
        throw new Error('useAuth must be used inside AuthProvider');
    }

    return auth;
}
export default AuthContext;
