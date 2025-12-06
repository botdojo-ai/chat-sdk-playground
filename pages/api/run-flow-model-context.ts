import type { NextApiRequest, NextApiResponse } from 'next';
import { runFlowWithSSE } from '../../lib/flowRunner';

/**
 * API Route: Run Flow with Model Context
 * 
 * This endpoint demonstrates how to use Model Context with the BotDojo SDK.
 * Model Context allows you to define custom tools that the agent can use.
 * 
 * Example Model Context Tool: Tracking Number Validator
 * - Tool Name: validateTrackingNumber
 * - Description: Validates a shipping tracking number and returns shipment details
 * - Parameters: { trackingNumber: string }
 * - Returns: { carrier, status, location, estimatedDelivery, etc. }
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, sessionId } = req.body;
  
  console.log('[Model Context API] Received request:', { 
    input: input?.substring(0, 50), 
    sessionId,
    hasSessionId: !!sessionId 
  });

  if (!input) {
    return res.status(400).json({ error: 'Input is required' });
  }

  const apiKey = process.env.NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_API;
  const apiUrl = process.env.NEXT_PUBLIC_BOTDOJO_API_URL;

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Model Context API key not configured. Please run: pnpm setup-playground' 
    });
  }

  if (!apiUrl) {
    return res.status(500).json({ 
      error: 'API URL not configured' 
    });
  }

  try {
    // Define Model Context: Custom Tools
    const modelContext = {
      name: 'shipping-assistant',
      description: 'Tools for tracking and validating shipping packages',
      tools: [
        {
          name: 'validateTrackingNumber',
          description: 'Validates a shipping tracking number and returns detailed shipment information including carrier, status, location, and estimated delivery date.',
          inputSchema: {
            type: 'object',
            properties: {
              trackingNumber: {
                type: 'string',
                description: 'The shipping tracking number to validate (e.g., 1Z999AA10123456784 for UPS, 9400100000000000000000 for USPS)',
              },
            },
            required: ['trackingNumber'],
          },
          execute: async (args: { trackingNumber: string }) => {
            console.log('[Model Context] ==========================================');
            console.log('[Model Context] validateTrackingNumber called with:', args);
            console.log('[Model Context] ==========================================');
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const trackingNumber = args.trackingNumber.trim();
            
            // Determine carrier based on tracking number pattern
            let carrier = 'Unknown';
            let trackingFormat = 'Unknown';
            
            if (trackingNumber.match(/^1Z[0-9A-Z]{16}$/)) {
              carrier = 'UPS';
              trackingFormat = 'UPS Format';
            } else if (trackingNumber.match(/^(94|93|92|94|95)[0-9]{20}$/)) {
              carrier = 'USPS';
              trackingFormat = 'USPS Format';
            } else if (trackingNumber.match(/^[0-9]{12}$/)) {
              carrier = 'FedEx';
              trackingFormat = 'FedEx 12-digit';
            } else if (trackingNumber.match(/^[0-9]{15}$/)) {
              carrier = 'FedEx';
              trackingFormat = 'FedEx 15-digit';
            } else if (trackingNumber.length >= 10) {
              carrier = 'Generic Carrier';
              trackingFormat = 'Generic Format';
            }
            
            // Generate mock shipment data
            const statuses = ['In Transit', 'Out for Delivery', 'Delivered', 'Processing', 'Picked Up'];
            const locations = [
              { city: 'Memphis', state: 'TN', country: 'US' },
              { city: 'Louisville', state: 'KY', country: 'US' },
              { city: 'Atlanta', state: 'GA', country: 'US' },
              { city: 'Los Angeles', state: 'CA', country: 'US' },
              { city: 'Chicago', state: 'IL', country: 'US' },
            ];
            
            // Use tracking number to seed "random" data (consistent for same tracking #)
            const seed = trackingNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const statusIndex = seed % statuses.length;
            const locationIndex = seed % locations.length;
            const daysUntilDelivery = (seed % 5) + 1; // 1-5 days
            
            const status = statuses[statusIndex];
            const currentLocation = locations[locationIndex];
            
            // Calculate estimated delivery date
            const estimatedDelivery = new Date();
            estimatedDelivery.setDate(estimatedDelivery.getDate() + daysUntilDelivery);
            const deliveryDateString = estimatedDelivery.toISOString().split('T')[0]; // YYYY-MM-DD
            
            // Generate tracking events
            const events = [
              {
                timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
                status: 'Picked Up',
                location: 'Origin Facility',
                description: 'Package picked up by carrier',
              },
              {
                timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                status: 'In Transit',
                location: `${currentLocation.city}, ${currentLocation.state}`,
                description: 'Package in transit to destination',
              },
              {
                timestamp: new Date().toISOString(),
                status: status,
                location: `${currentLocation.city}, ${currentLocation.state}`,
                description: status === 'Delivered' ? 'Package delivered' : 'Latest update',
              },
            ];
            
            const result = {
              valid: true,
              trackingNumber: trackingNumber,
              carrier: carrier,
              trackingFormat: trackingFormat,
              status: status,
              currentLocation: currentLocation,
              estimatedDelivery: deliveryDateString,
              estimatedDeliveryFormatted: estimatedDelivery.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              daysUntilDelivery: daysUntilDelivery,
              events: events,
              lastUpdate: new Date().toISOString(),
            };
            
            console.log('[Model Context] ==========================================');
            console.log('[Model Context] validateTrackingNumber result:', JSON.stringify(result, null, 2));
            console.log('[Model Context] ==========================================');
            
            return result;
          },
        },
      ],
    };

    console.log('[Model Context API] Model Context:', modelContext.name, 'with tools:', modelContext.tools.map(t => t.name));

    // Use shared flow runner utility with model context
    await runFlowWithSSE(res, {
      apiKey,
      apiUrl,
      input,
      sessionId,
      modelContext, // Pass model context with custom tools
      debug: false,
    });
  } catch (error) {
    console.error('[Model Context API] Error setting up flow:', error);
    
    // If headers not sent yet, send JSON error
    if (!res.headersSent) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to run flow with model context';
      res.status(500).json({ error: errorMessage });
    }
  }
}

