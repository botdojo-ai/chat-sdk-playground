/**
 * Weather Widget HTML Generator
 * 
 * Generates a beautiful weather display as an MCP App HTML widget.
 * Uses data from the National Weather Service API.
 */

export interface WeatherData {
  location: string;
  forecast: any;
}

/**
 * Get weather emoji icon based on forecast conditions
 */
function getWeatherIcon(shortForecast: string): string {
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
 * Generate beautiful weather HTML for the MCP App
 */
export function generateWeatherHtml(weatherData: WeatherData | null): string {
  if (!weatherData) {
    return `<!DOCTYPE html>
<html><body style="font-family: sans-serif; padding: 20px; text-align: center; color: #666;">
  <div style="font-size: 32px; margin-bottom: 12px;">🌤️</div>
  <div>Loading weather data...</div>
</body></html>`;
  }

  const forecast = weatherData.forecast;
  const location = weatherData.location;
  
  const periods = forecast?.properties?.periods || [];
  const current = periods[0];
  const upcoming = periods.slice(1, 5);

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 280px;
      max-width: 280px;
      overflow-x: hidden;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100%;
      padding: 12px;
      color: white;
    }
    .weather-container {
      width: 100%;
    }
    .weather-card {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .location {
      font-size: 12px;
      opacity: 0.9;
      margin-bottom: 4px;
    }
    .current-temp {
      font-size: 48px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 4px;
    }
    .current-condition {
      font-size: 14px;
      opacity: 0.95;
    }
    .weather-icon {
      font-size: 36px;
    }
    .details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(255,255,255,0.2);
    }
    .detail-item {
      display: flex;
      flex-direction: column;
    }
    .detail-label {
      font-size: 10px;
      text-transform: uppercase;
      opacity: 0.7;
      letter-spacing: 0.5px;
    }
    .detail-value {
      font-size: 13px;
      font-weight: 600;
    }
    .forecast-title {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
      opacity: 0.9;
    }
    .forecast-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    }
    .forecast-item {
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 8px 6px;
      text-align: center;
    }
    .forecast-day {
      font-size: 10px;
      opacity: 0.8;
      margin-bottom: 2px;
    }
    .forecast-icon {
      font-size: 18px;
      margin-bottom: 2px;
    }
    .forecast-temp {
      font-size: 12px;
      font-weight: 600;
    }
    .powered-by {
      text-align: center;
      margin-top: 12px;
      font-size: 9px;
      opacity: 0.6;
    }
  </style>
</head>
<body>
  <div class="weather-container">
    <div class="weather-card">
      <div class="location">📍 ${location || 'Current Location'}</div>
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div class="current-temp">${current?.temperature || '--'}°${current?.temperatureUnit || 'F'}</div>
          <div class="current-condition">
            ${current?.shortForecast || 'Loading...'}
          </div>
        </div>
        <div class="weather-icon">${getWeatherIcon(current?.shortForecast || '')}</div>
      </div>
      <div class="details">
        <div class="detail-item">
          <span class="detail-label">Wind</span>
          <span class="detail-value">${current?.windSpeed || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Humidity</span>
          <span class="detail-value">${current?.relativeHumidity?.value || 'N/A'}%</span>
        </div>
      </div>
    </div>
    
    <div class="weather-card">
      <div class="forecast-title">Forecast</div>
      <div class="forecast-grid">
        ${upcoming.slice(0, 4).map((period: any) => `
          <div class="forecast-item">
            <div class="forecast-day">${period.name?.split(' ')[0] || ''}</div>
            <div class="forecast-icon">${getWeatherIcon(period.shortForecast || '')}</div>
            <div class="forecast-temp">${period.temperature}°</div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="powered-by">National Weather Service API</div>
  </div>
</body>
</html>`;
}



