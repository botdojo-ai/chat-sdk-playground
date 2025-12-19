/**
 * Hook to access the shared temporary JWT token.
 * 
 * This hook re-exports from the TokenContext for backwards compatibility.
 * The token is fetched once when the app loads, stored in a cookie,
 * and automatically refreshed every 30 seconds when it expires.
 * 
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const { token, loading, error } = useTemporaryToken();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (error || !token) return <div>Error: {error}</div>;
 *   
 *   return <BotDojoChat apiKey={token} />;
 * }
 * ```
 */
export { useToken as useTemporaryToken } from '@/contexts/TokenContext';
