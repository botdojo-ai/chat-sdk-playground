import { useEffect, useRef } from 'react';
import { useMcpApp } from '@botdojo/chat-sdk/mcp-app-view/react';

interface WeatherData {
  location: string;
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  windSpeed: string;
  humidity?: number;
  forecast: ForecastPeriod[];
  error?: string;
}

interface ForecastPeriod {
  name: string;
  temperature: number;
  shortForecast: string;
}

function getWeatherIcon(forecast: string): string {
  const lower = forecast.toLowerCase();
  if (lower.includes('sunny') || lower.includes('clear')) return '☀️';
  if (lower.includes('cloud')) return '☁️';
  if (lower.includes('rain')) return '🌧️';
  if (lower.includes('snow')) return '❄️';
  return '🌤️';
}

/**
 * Weather MCP App Widget
 * 
 * This widget uses useMcpApp to receive tool results from the host.
 * The tool's execute function fetches weather data and returns it.
 * This widget simply displays the result from tool.result.
 * 
 * Flow:
 * 1. LLM calls get_weather tool with city argument
 * 2. Tool execute function (in HeadlessDemo) fetches weather from API
 * 3. Tool result is passed to widget via tool.result
 * 4. Widget displays the weather data
 */
function WeatherWidget() {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // useMcpApp handles all MCP App protocol communication
  const {
    isInitialized,
    tool,
    reportSize,
  } = useMcpApp({
    containerRef: cardRef,
    autoReportSize: true,
  });

  // Weather data comes from tool.result (set when tool execution completes)
  const weatherData = tool.result as WeatherData | null;
  const hasError = weatherData?.error;

  // Report size when content changes
  useEffect(() => {
    if (weatherData && cardRef.current) {
      const timer = setTimeout(() => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (rect) reportSize(Math.ceil(rect.width), Math.ceil(rect.height));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [weatherData, reportSize]);

  const isLoading = tool.isStreaming || !weatherData;

  return (
    <div
      ref={cardRef}
      style={{
        width: '280px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '12px',
        borderRadius: '16px',
        color: 'white',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {hasError ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '32px' }}>⚠️</div>
          <div style={{ fontSize: '13px' }}>{weatherData.error}</div>
        </div>
      ) : isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>
            {!isInitialized ? 'Initializing...' : 'Fetching weather...'}
          </div>
        </div>
      ) : (
        <>
          {/* Current Weather */}
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '12px',
          }}>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>📍 {weatherData.location}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '48px', fontWeight: 700 }}>
                  {weatherData.temperature}°{weatherData.temperatureUnit}
                </div>
                <div style={{ fontSize: '14px' }}>{weatherData.shortForecast}</div>
              </div>
              <div style={{ fontSize: '36px' }}>{getWeatherIcon(weatherData.shortForecast)}</div>
            </div>
          </div>
          
          {/* Forecast */}
          {weatherData.forecast?.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '16px',
              padding: '16px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Forecast</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {weatherData.forecast.map((p, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    padding: '8px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '10px' }}>{p.name?.split(' ')[0]}</div>
                    <div style={{ fontSize: '18px' }}>{getWeatherIcon(p.shortForecast)}</div>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>{p.temperature}°</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function WeatherWidgetPage() {
  return <WeatherWidget />;
}



