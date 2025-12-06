# 🌳 Zen Bonsai Shop

A mock ecommerce site for bonsai products, built as a demo in the SDK Playground. This example shows a complete ecommerce experience with product catalog, search, shopping cart, and checkout - perfect for later adding AI agent capabilities.

## Features

- **20 Bonsai Products**: Trees, towels, hats, and pet sweaters
- **Product Search**: Search by name, description, or category
- **Category Filters**: Filter by product type
- **Shopping Cart**: Add/remove items, adjust quantities
- **Checkout Flow**: Mock checkout process (no real payment)
- **AI-Generated Images**: Product images generated using Gemini API

## Routes

- **Main Page**: `/bonsai-shop` - The ecommerce storefront
- **API**: `/api/search-products` - Product search endpoint (POST)

## Product Data

Products are stored in `data/products.json` with the following structure:

```json
{
  "id": "1",
  "name": "Classic Japanese Maple Bonsai",
  "category": "tree",
  "price": 299.99,
  "description": "A stunning Japanese Maple...",
  "inStock": true,
  "imagePrompt": "a beautiful miniature Japanese Maple...",
  "imagePath": "/images/products/product-1.png"
}
```

## Generating Product Images (One-Time Setup)

Product images are generated once using the Gemini API and saved to the filesystem.

### Prerequisites

- Gemini API key (already included in the script: `AIzaSyAOdMii09jTGaaJEawIPQfYxaaG1PMgq_U`)
- `ts-node` installed (included in devDependencies)

### Generate Images

```bash
# Install dependencies if needed
pnpm install

# Run the image generation script (one-time)
pnpm generate-product-images
```

This will:
1. Read all products from `data/products.json`
2. Generate an image for each product using its `imagePrompt`
3. Save images to `public/images/products/product-{id}.png`
4. Update `data/products.json` with the image paths
5. Add a 2-second delay between requests to avoid rate limiting

**Note**: This is a one-time operation. Once images are generated, they're static files that the app loads normally.

### What the Script Does

- Generates 20 product images (one per product)
- Uses Gemini Imagen 3.0 model
- Saves as PNG files in `public/images/products/`
- Updates the JSON file with image paths
- Takes ~60 seconds total (with 2s delays between requests)

### If Image Generation Fails

If any image fails to generate, the script will:
- Log the error
- Set a placeholder path for that product
- Continue with the next product

The site will still work - products without images will show emoji icons as fallbacks.

## Running the Site

```bash
# Start the dev server
pnpm dev

# Visit the site
# Open http://localhost:3500/bonsai-shop
```

## API Usage

### Search Products

```typescript
POST /api/search-products
Content-Type: application/json

{
  "query": "maple",      // optional: search term
  "category": "tree"     // optional: 'all', 'tree', 'towel', 'hat', 'pet-sweater'
}
```

Response:
```json
[
  {
    "id": "1",
    "name": "Classic Japanese Maple Bonsai",
    "category": "tree",
    "price": 299.99,
    "description": "...",
    "inStock": true,
    "imagePath": "/images/products/product-1.png"
  }
]
```

## Future Enhancements (AI Agent Integration)

This is a foundation for adding AI agent capabilities:

- **AI Shopping Assistant**: Help users find products
- **Product Recommendations**: AI-powered suggestions based on preferences
- **Smart Search**: Natural language product queries
- **Order Tracking**: AI agent to check order status
- **Customer Support**: Chatbot for common questions

The structure is ready - just add BotDojo Chat SDK integration!

## File Structure

```
sdk-playground/
├── pages/
│   ├── bonsai-shop.tsx              # Main ecommerce page
│   └── api/
│       └── search-products.ts       # Product search API
├── data/
│   └── products.json                # Product catalog
├── scripts/
│   └── generate-product-images.ts   # One-time image generation
└── public/
    └── images/
        └── products/                # Generated product images
            ├── product-1.png
            ├── product-2.png
            └── ...
```

## Tech Stack

- **Next.js**: React framework
- **TypeScript**: Type safety
- **Gemini API**: AI image generation
- **JSON Storage**: Simple product database

## Notes

- This is a **demo/mock** ecommerce site
- No real payment processing
- No database - products stored in JSON
- Images generated once and stored as static files
- Perfect foundation for adding AI agent features later

