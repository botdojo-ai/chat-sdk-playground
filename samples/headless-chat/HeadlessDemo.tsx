import { useMemo, useState } from 'react';
import { BotDojoChatProvider, type ModelContext } from '@botdojo/chat-sdk';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useTemporaryToken } from '@/hooks/useTemporaryToken';

const config = {
  baseUrl: process.env.NEXT_PUBLIC_IFRAME_URL || 'https://embed.botdojo.com',
};

interface HeadlessDemoProps {
  onNewChat?: () => void;
}

// Simple city coordinate lookup
const cityCoords: Record<string, { lat: number; lon: number; name: string }> = {
  'new york': { lat: 40.7128, lon: -74.0060, name: 'New York, NY' },
  'los angeles': { lat: 34.0522, lon: -118.2437, name: 'Los Angeles, CA' },
  'chicago': { lat: 41.8781, lon: -87.6298, name: 'Chicago, IL' },
  'houston': { lat: 29.7604, lon: -95.3698, name: 'Houston, TX' },
  'phoenix': { lat: 33.4484, lon: -112.0740, name: 'Phoenix, AZ' },
  'philadelphia': { lat: 39.9526, lon: -75.1652, name: 'Philadelphia, PA' },
  'san antonio': { lat: 29.4241, lon: -98.4936, name: 'San Antonio, TX' },
  'san diego': { lat: 32.7157, lon: -117.1611, name: 'San Diego, CA' },
  'dallas': { lat: 32.7767, lon: -96.7970, name: 'Dallas, TX' },
  'san francisco': { lat: 37.7749, lon: -122.4194, name: 'San Francisco, CA' },
  'seattle': { lat: 47.6062, lon: -122.3321, name: 'Seattle, WA' },
  'denver': { lat: 39.7392, lon: -104.9903, name: 'Denver, CO' },
  'boston': { lat: 42.3601, lon: -71.0589, name: 'Boston, MA' },
  'miami': { lat: 25.7617, lon: -80.1918, name: 'Miami, FL' },
  'atlanta': { lat: 33.7490, lon: -84.3880, name: 'Atlanta, GA' },
  'washington': { lat: 38.8894, lon: -77.0352, name: 'Washington, DC' },
  'washington dc': { lat: 38.8894, lon: -77.0352, name: 'Washington, DC' },
};

export default function HeadlessDemo({ onNewChat }: HeadlessDemoProps = {}) {
  // Get temporary JWT token for secure API access
  const { token, loading: tokenLoading, error: tokenError } = useTemporaryToken();
  
  // Session key to force new session
  const [sessionKey, setSessionKey] = useState(0);
  
  const handleNewChat = () => {
    setSessionKey(prev => prev + 1);
    onNewChat?.();
  };

  // Define ModelContext with weather tool and resource
  const modelContext: ModelContext = useMemo(() => ({
    name: 'weather_service',
    description: 'Frontend MCP that provides weather information using the National Weather Service API',
    toolPrefix: 'weather',
    uri: 'weather://context',
    
    // Define resources - what the agent can "see"
    resources: [
      {
        uri: 'ui://headless-chat/context/cache_buster/weather',
        name: 'Weather Display Widget',
        description: 'Beautiful weather display MCP App showing current conditions and forecast',
        mimeType: 'text/html;profile=mcp-app',
        getContent: async () => {
          const { fetchMcpAppHtml } = await import('@/utils/fetchMcpApp');
          return {
            uri: 'ui://headless-chat/context/cache_buster/weather',
            mimeType: 'text/html;profile=mcp-app',
            text: await fetchMcpAppHtml('weather'),
          };
        },
      },
    ],
    
    // Define tools - what the agent can "do"
    tools: [
      {
        name: 'get_weather',
        description: 'Get current weather and forecast for a location. Uses the National Weather Service API. Provide latitude and longitude, or a city name (will use approximate coordinates for major US cities).',
        inputSchema: {
          type: 'object',
          properties: {
            latitude: { type: 'number', description: 'Latitude of the location (e.g., 38.8894 for Washington DC)' },
            longitude: { type: 'number', description: 'Longitude of the location (e.g., -77.0352 for Washington DC)' },
            city: { type: 'string', description: 'City name (optional, will use approximate coordinates for major US cities)' },
          },
        },
        // Reference the UI resource - this tells the system to render the MCP App
        _meta: {
          ui: {
            resourceUri: 'ui://headless-chat/context/cache_buster/weather',
            prefersProxy: true,
          },
          'botdojo/display-name': 'Get Weather',
        },
        // Tool execute fetches weather data and returns it to the widget
        execute: async (params: { latitude?: number; longitude?: number; city?: string }) => {
          try {
            // Default to Washington DC if no coordinates provided
            let lat = params.latitude || 38.8894;
            let lon = params.longitude || -77.0352;
            let locationName = params.city || 'Washington, DC';
            
            if (params.city) {
              const cityKey = params.city.toLowerCase();
              const found = cityCoords[cityKey];
              if (found) {
                lat = found.lat;
                lon = found.lon;
                locationName = found.name;
              } else {
                locationName = params.city;
              }
            }
            
            // Step 1: Get grid point from coordinates
            const pointsResponse = await fetch(
              `https://api.weather.gov/points/${lat},${lon}`,
              {
                headers: {
                  'User-Agent': '(BotDojo SDK Playground, contact@botdojo.com)',
                  'Accept': 'application/geo+json',
                },
              }
            );
            
            if (!pointsResponse.ok) {
              throw new Error(`Weather API error: ${pointsResponse.status}`);
            }
            
            const pointsData = await pointsResponse.json();
            const forecastUrl = pointsData.properties?.forecast;
            
            if (!forecastUrl) {
              throw new Error('Could not get forecast URL from weather service');
            }
            
            // Step 2: Get forecast
            const forecastResponse = await fetch(forecastUrl, {
              headers: {
                'User-Agent': '(BotDojo SDK Playground, contact@botdojo.com)',
                'Accept': 'application/geo+json',
              },
            });
            
            if (!forecastResponse.ok) {
              throw new Error(`Forecast API error: ${forecastResponse.status}`);
            }
            
            const forecastData = await forecastResponse.json();
            const periods = forecastData.properties?.periods || [];
            const current = periods[0];

            // Return structured weather data for the widget to display
            return {
              location: locationName,
              temperature: current?.temperature || 0,
              temperatureUnit: current?.temperatureUnit || 'F',
              shortForecast: current?.shortForecast || 'Unknown',
              windSpeed: current?.windSpeed || 'N/A',
              windDirection: current?.windDirection || '',
              humidity: current?.relativeHumidity?.value,
              forecast: periods.slice(1, 5).map((p: any) => ({
                name: p.name,
                temperature: p.temperature,
                temperatureUnit: p.temperatureUnit,
                shortForecast: p.shortForecast,
              })),
            };
          } catch (error) {
            return {
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        },
      },
    ],
    
    prompts: [],
  }), []);

  if (tokenLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#f9fafb',
        borderRadius: '12px',
        padding: '24px',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #e5e7eb',
      }}>
        <div style={{ color: '#6b7280', fontWeight: 600 }}>Loading...</div>
      </div>
    );
  }

  if (tokenError || !token) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#fef2f2',
        borderRadius: '12px',
        padding: '24px',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #fecaca',
      }}>
        <div style={{ color: '#991b1b', fontWeight: 600, marginBottom: '8px' }}>Missing API key</div>
        <div style={{ color: '#b91c1c', fontSize: '14px', textAlign: 'center' }}>
          Run <code style={{ background: 'white', padding: '2px 6px', borderRadius: '4px' }}>pnpm setup-playground</code> or set <code style={{ background: 'white', padding: '2px 6px', borderRadius: '4px' }}>BOTDOJO_MODEL_CONTEXT_API</code>
        </div>
      </div>
    );
  }

  return (
    <BotDojoChatProvider
      key={sessionKey}
      apiKey={token}
      baseUrl={config.baseUrl}
      newSession={sessionKey > 0}
      modelContext={modelContext}
      debug={true}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#f9fafb',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
      }}>
        {/* Welcome message with prompt buttons */}
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>
              🌤️ Weather Assistant
            </div>
            <button
              onClick={handleNewChat}
              style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ✨ New Chat
            </button>
          </div>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '12px' }}>
            Ask me about the weather in any US city!
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <QuickButton text="What's the weather in Seattle?" />
            <QuickButton text="Weather forecast for Miami" />
            <QuickButton text="Is it sunny in Denver?" />
          </div>
        </div>
        
        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <MessageList />
        </div>

        {/* Input */}
        <ChatInput />
      </div>
    </BotDojoChatProvider>
  );
}

// Quick action button component
function QuickButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => {
        // Dispatch a custom event that ChatInput can listen for
        window.dispatchEvent(new CustomEvent('quick-message', { detail: text }));
      }}
      style={{
        padding: '6px 12px',
        background: 'rgba(255,255,255,0.2)',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '16px',
        color: 'white',
        fontSize: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
      }}
    >
      {text}
    </button>
  );
}
