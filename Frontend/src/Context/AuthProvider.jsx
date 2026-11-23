import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, loginUser, getCurrentUser, logoutUser, invalidateSessionRequests } from '../api/server';
import { getAuthError } from '../api/getAuthError';
import AuthContext from './AuthContext';


const AUTH_EVENT_KEY = 'nutshop.auth.event';

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionError, setSessionError] = useState(null);
    const navigate = useNavigate();

    // Refs let asynchronous responses check whether their result is still current.
    const currentUser = useRef(null);
    const authRevision = useRef(0);
    const mounted = useRef(false);
    const authActionPending = useRef(false);
    const channel = useRef(null);
    const lastSignal = useRef(null);

    const applyUser = useCallback((nextUser) => {
        currentUser.current = nextUser;
        setUser(nextUser);
    }, []);

    // Broadcast a signal only. Other tabs must verify their cookie with the backend.
    const notifyTabs = useCallback(() => {
        const signal = { type: 'session-changed', id: crypto.randomUUID() };
        channel.current?.postMessage(signal);
        try {
            // Fallback for browsers without BroadcastChannel. No user/token is stored.
            localStorage.setItem(AUTH_EVENT_KEY, JSON.stringify(signal));
        } catch {
            // Focus checks still work if browser storage is unavailable.
        }
    }, []);

    // Cancel outdated auth results and immediately remove private user state.
    const clearAuthentication = useCallback((message = null) => {
        authRevision.current += 1;
        invalidateSessionRequests();
        applyUser(null);
        setSessionError(message);
        setLoading(false);
    }, [applyUser]);

    // Recheck the real session; network failures alone do not mean "logged out".
    const refreshSession = useCallback(() => {
        const revision = ++authRevision.current;

        return getCurrentUser().then(({ data }) => {
            if (!mounted.current || revision !== authRevision.current) return;

            const nextUser = { id: data.user.id, username: data.user.username, email: data.user.email };
            if (currentUser.current?.id !== nextUser.id) invalidateSessionRequests();
            applyUser(nextUser);
            setSessionError(null);
        }).catch((error) => {
            if (!mounted.current || revision !== authRevision.current) return;

            if (error.response?.status === 401) {
                invalidateSessionRequests();
                applyUser(null);
                setSessionError(null);
            } else {
                setSessionError(getAuthError(error));
            }
        }).finally(() => {
            if (mounted.current && revision === authRevision.current) setLoading(false);
        });
    }, [applyUser]);

    // Restore login, listen for other tabs, and recheck on focus or reconnect.
    useEffect(() => {
        mounted.current = true;
        const authChannel = typeof BroadcastChannel !== 'undefined'
            ? new BroadcastChannel('nutshop-auth')
            : null;
        channel.current = authChannel;

        function handleSignal(signal) {
            if (signal?.type !== 'session-changed' || typeof signal.id !== 'string' || signal.id === lastSignal.current) return;
            lastSignal.current = signal.id;
            invalidateSessionRequests();
            applyUser(null);
            setLoading(true);
            refreshSession();
        }

        function handleStorage(event) {
            if (event.key !== AUTH_EVENT_KEY || !event.newValue) return;
            try { handleSignal(JSON.parse(event.newValue)); } catch { /* Ignore malformed signals. */ }
        }

        function handleFocus() {
            if (!document.hidden && !authActionPending.current) refreshSession();
        }

        function handleExpiredSession() {
            clearAuthentication('Your session has expired. Please log in again.');
            notifyTabs();
        }

        if (authChannel) authChannel.onmessage = (event) => handleSignal(event.data);
        window.addEventListener('storage', handleStorage);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('online', handleFocus);
        window.addEventListener('auth:expired', handleExpiredSession);
        document.addEventListener('visibilitychange', handleFocus);
        refreshSession();

        return () => {
            mounted.current = false;
            authRevision.current += 1;
            authChannel?.close();
            channel.current = null;
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('online', handleFocus);
            window.removeEventListener('auth:expired', handleExpiredSession);
            document.removeEventListener('visibilitychange', handleFocus);
        };
    }, [applyUser, clearAuthentication, notifyTabs, refreshSession]);

    // Share login/signup handling while ignoring results superseded by another tab.
    async function authenticate(request, successMessage) {
        if (authActionPending.current) return { success: false, error: 'Please wait for the current sign-in request.' };
        authActionPending.current = true;
        const revision = ++authRevision.current;
        invalidateSessionRequests();

        try {
            const { data } = await request();
            notifyTabs();
            if (!mounted.current) return { success: false };
            if (revision !== authRevision.current) {
                setLoading(true);
                await refreshSession();
                return { success: false, error: 'Your sign-in state changed in another tab. Please try again.' };
            }

            applyUser({ id: data.user.id, username: data.user.username, email: data.user.email });
            setSessionError(null);
            setLoading(false);
            return { success: true, message: successMessage || data.message };
        } catch (error) {
            // A wrong password must not clear an otherwise valid session.
            return { success: false, error: getAuthError(error) };
        } finally {
            authActionPending.current = false;
        }
    }

    const signUp = (username, email, password) => authenticate(
        () => registerUser({ username, email, password }),
    );
    const login = (email, password) => authenticate(
        () => loginUser({ email, password }), 'Logged in successfully',
    );

    // Clear local state and notify other tabs only after logout is confirmed.
    const logout = async () => {
        if (authActionPending.current) return;
        authActionPending.current = true;
        const revision = ++authRevision.current;
        invalidateSessionRequests();

        try {
            await logoutUser();
            notifyTabs();
            if (!mounted.current) return;
            if (revision !== authRevision.current) {
                setLoading(true);
                await refreshSession();
                return;
            }
            clearAuthentication();
            navigate('/auth');
        } catch (error) {
            if (!mounted.current) return;
            if (error.response?.status === 401) {
                clearAuthentication();
                notifyTabs();
                navigate('/auth');
            } else {
                setSessionError(getAuthError(error));
            }
        } finally {
            authActionPending.current = false;
        }
    };

    return (
        <AuthContext.Provider value={{ signUp, user, logout, login, loading, refreshSession }}>
            {sessionError && <p role='alert'>{sessionError}</p>}
            {loading ? <p role='status'>Checking your account...</p> : children}
        </AuthContext.Provider>
    );
}

