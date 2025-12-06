import type { NextApiRequest, NextApiResponse } from 'next';
import products from '../examples/chat-sdk/bonsai-shop/data/products.json';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, category } = req.body;

  let filtered = products;

  // Filter by category if provided
  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }

  // Filter by search query if provided
  if (query && query.trim()) {
    const searchTerm = query.toLowerCase().trim();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm)
    );
  }

  return res.status(200).json(filtered);
}

