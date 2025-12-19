import { useEffect, useRef } from 'react';
import { useMcpApp } from '@botdojo/chat-sdk/mcp-app-view/react';

interface WeatherData {
  location: string;
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  windSpeed: string;
  windDirection?: string;
  humidity?: number;
  forecast: ForecastPeriod[];
  error?: string;
}

interface ForecastPeriod {
  name: string;
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
}

/**
 * Get weather emoji icon based on forecast conditions
 */
function getWeatherIcon(shortForecast: string | undefined): string {
  if (!shortForecast) return '🌤️';
  const lower = shortForecast.toLowerCase();
  if (lower.includes('sunny') || lower.includes('clear')) return '☀️';
  if (lower.includes('cloud')) return '☁️';
  if (lower.includes('rain') || lower.includes('shower')) return '🌧️';
  if (lower.includes('snow')) return '❄️';
  if (lower.includes('thunder') || lower.includes('storm')) return '⛈️';
  if (lower.includes('fog')) return '🌫️';
  if (lower.includes('wind')) return '💨';
  if (lower.includes('partly')) return '⛅';
  return '🌤️';
}

/**
 * Weather MCP App Widget
 * 
 * This widget uses useMcpApp to receive tool results from the host.
 * The tool execute function (in HeadlessDemo) fetches the weather data,
 * and this widget simply displays it.
 */
function WeatherWidget() {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const {
    isInitialized,
    tool,
    reportSize,
  } = useMcpApp({
    containerRef: cardRef,
    autoReportSize: true,
    debug: true,
  });

  // Weather data comes from tool.result (set when tool execution completes)
  const weatherData = tool.result as WeatherData | null;
  const hasError = weatherData?.error;

  // Debug logging
  useEffect(() => {
    console.log('[WeatherWidget] State:', {
      isInitialized,
      toolName: tool.name,
      toolStatus: tool.status,
      toolIsStreaming: tool.isStreaming,
      hasResult: !!tool.result,
      result: tool.result,
      arguments: tool.arguments,
    });
  }, [isInitialized, tool.name, tool.status, tool.isStreaming, tool.result, tool.arguments]);
  // Report size after data loads
  useEffect(() => {
    if (weatherData && cardRef.current) {
      const timer = setTimeout(() => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          reportSize(Math.ceil(rect.width), Math.ceil(rect.height));
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [weatherData, reportSize]);

  // Show loading if streaming or no data yet
  const showLoading = tool.isStreaming || !weatherData;

  return (
    <div
      ref={cardRef}
      style={{
        width: '280px',
        maxWidth: '280px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: showLoading ? '150px' : undefined,
        padding: '12px',
        borderRadius: '16px',
        color: 'white',
      }}
    >
      {hasError ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '32px' }}>⚠️</div>
          <div style={{ fontSize: '13px', textAlign: 'center', opacity: 0.9 }}>
            {weatherData.error}
          </div>
        </div>
      ) : showLoading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '20px',
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: '13px', opacity: 0.9 }}>
            {!isInitialized ? 'Initializing...' : 'Fetching weather...'}
          </span>
        </div>
      ) : (
        <>
          {/* Current Weather Card */}
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '12px',
          }}>
            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>
              📍 {weatherData.location}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '48px', fontWeight: 700, lineHeight: 1 }}>
                  {weatherData.temperature}°{weatherData.temperatureUnit}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.95 }}>
                  {weatherData.shortForecast ?? 'Loading...'}
                </div>
              </div>
              <div style={{ fontSize: '36px' }}>
                {getWeatherIcon(weatherData.shortForecast)}
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255,255,255,0.2)',
            }}>
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.7, letterSpacing: '0.5px' }}>
                  Wind
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>
                  {weatherData.windSpeed}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.7, letterSpacing: '0.5px' }}>
                  Humidity
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>
                  {weatherData.humidity !== undefined ? `${weatherData.humidity}%` : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Forecast Card */}
          {weatherData.forecast && weatherData.forecast.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '16px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', opacity: 0.9 }}>
                Forecast
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '6px',
              }}>
                {weatherData.forecast.map((period, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    padding: '8px 6px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '2px' }}>
                      {period.name?.split(' ')[0]}
                    </div>
                    <div style={{ fontSize: '18px', marginBottom: '2px' }}>
                      {getWeatherIcon(period.shortForecast)}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>
                      {period.temperature}°
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '9px', opacity: 0.6 }}>
            National Weather Service API
          </div>
        </>
      )}
    </div>
  );
}

export default function WeatherWidgetPage() {
  return (
    <div style={{ margin: 0, padding: 0, background: 'transparent' }}>
      <WeatherWidget />
    </div>
  );
}
