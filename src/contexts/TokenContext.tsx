import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useMemo } from 'react';

// Cookie helpers
function setCookie(name: string, value: string, expiresAt: string) {
  const expires = new Date(expiresAt);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

const TOKEN_COOKIE_NAME = 'botdojo_chat_token';
const EXPIRY_COOKIE_NAME = 'botdojo_chat_token_expiry';
const REFRESH_INTERVAL_MS = 30 * 1000; // Check every 30 seconds
const EXPIRY_BUFFER_MS = 60 * 1000; // Refresh 1 minute before expiry

interface TokenState {
  token: string | null;
  expiresAt: string | null;
  loading: boolean;
  error: string | null;
}

type TokenAction =
  | { type: 'SET_TOKEN'; token: string; expiresAt: string }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_CACHED'; token: string; expiresAt: string };

function tokenReducer(state: TokenState, action: TokenAction): TokenState {
  switch (action.type) {
    case 'SET_TOKEN':
      return { token: action.token, expiresAt: action.expiresAt, loading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_CACHED':
      return { token: action.token, expiresAt: action.expiresAt, loading: false, error: null };
    default:
      return state;
  }
}

interface TokenContextValue {
  /** The temporary JWT token */
  token: string | null;
  /** ISO timestamp when the token expires */
  expiresAt: string | null;
  /** Whether the token is being fetched */
  loading: boolean;
  /** Error message if token fetch failed */
  error: string | null;
  /** Manually refresh the token */
  refreshToken: () => Promise<void>;
}

const TokenContext = createContext<TokenContextValue | null>(null);

interface TokenProviderProps {
  children: React.ReactNode;
}

export function TokenProvider({ children }: TokenProviderProps) {
  const [state, dispatch] = useReducer(tokenReducer, {
    token: null,
    expiresAt: null,
    loading: true,
    error: null,
  });

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);
  const initializedRef = useRef(false);

  // Check if token is expired or about to expire (pure function, no hook needed)
  const isTokenExpiredOrExpiring = (expiry: string | null): boolean => {
    if (!expiry) return true;
    const expiryTime = new Date(expiry).getTime();
    const now = Date.now();
    return now >= expiryTime - EXPIRY_BUFFER_MS;
  };

  // Fetch a new token from the API
  const fetchToken = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const response = await fetch('/api/get-chat-token');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch token: ${response.status}`);
      }
      const data = await response.json();
      
      // Store in cookies
      setCookie(TOKEN_COOKIE_NAME, data.token, data.expiresAt);
      setCookie(EXPIRY_COOKIE_NAME, data.expiresAt, data.expiresAt);
      
      // Single dispatch - single render
      dispatch({ type: 'SET_TOKEN', token: data.token, expiresAt: data.expiresAt });
      
      console.log('[TokenProvider] Token fetched, expires at:', data.expiresAt);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
      console.error('[TokenProvider] Error fetching token:', errorMessage);
      // Clear invalid cookies
      deleteCookie(TOKEN_COOKIE_NAME);
      deleteCookie(EXPIRY_COOKIE_NAME);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Manual refresh function
  const refreshToken = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loading: true });
    await fetchToken();
  }, [fetchToken]);

  // Initial load - check cookies first (runs only once)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const storedToken = getCookie(TOKEN_COOKIE_NAME);
    const storedExpiry = getCookie(EXPIRY_COOKIE_NAME);

    if (storedToken && storedExpiry && !isTokenExpiredOrExpiring(storedExpiry)) {
      // Use cached token - single dispatch
      console.log('[TokenProvider] Using cached token from cookie');
      dispatch({ type: 'SET_CACHED', token: storedToken, expiresAt: storedExpiry });
    } else {
      // Need to fetch a new token
      console.log('[TokenProvider] No valid cached token, fetching new one');
      fetchToken();
    }
  }, [fetchToken]);

  // Set up polling interval to check expiry (runs only once)
  useEffect(() => {
    // Start polling after initial load
    refreshIntervalRef.current = setInterval(() => {
      const storedExpiry = getCookie(EXPIRY_COOKIE_NAME);
      if (isTokenExpiredOrExpiring(storedExpiry)) {
        console.log('[TokenProvider] Token expired or expiring, refreshing...');
        fetchToken();
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchToken]);

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const value: TokenContextValue = useMemo(() => ({
    token: state.token,
    expiresAt: state.expiresAt,
    loading: state.loading,
    error: state.error,
    refreshToken,
  }), [state.token, state.expiresAt, state.loading, state.error]);

  return (
    <TokenContext.Provider value={value}>
      {children}
    </TokenContext.Provider>
  );
}

/**
 * Hook to access the shared temporary JWT token.
 * 
 * The token is fetched once when the app loads, stored in a cookie,
 * and automatically refreshed when it expires.
 * 
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const { token, loading, error } = useToken();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (error || !token) return <div>Error: {error}</div>;
 *   
 *   return <BotDojoChat apiKey={token} />;
 * }
 * ```
 */
export function useToken(): TokenContextValue {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useToken must be used within a TokenProvider');
  }
  return context;
}
