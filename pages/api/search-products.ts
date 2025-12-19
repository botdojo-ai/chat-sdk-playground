import type { NextApiRequest, NextApiResponse } from 'next';
import products from '../examples/bonsai-shop/data/products.json';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, category } = req.body;
  const forwardedProto = (req.headers['x-forwarded-proto'] as string) || '';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  const protocol = forwardedProto.split(',')[0]?.trim() || ((req.socket as any).encrypted ? 'https' : 'http');
  const origin = host ? `${protocol}://${host}` : '';

  const toAbsoluteImage = (path?: string) => {
    if (!path) return path;
    if (/^https?:\/\//i.test(path)) return path;
    if (!origin) return path;
    // Ensure single slash join
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  };

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

  const withAbsoluteImages = filtered.map(p => ({
    ...p,
    imagePath: toAbsoluteImage(p.imagePath),
    imageUrl: toAbsoluteImage((p as any).imageUrl || p.imagePath),
  }));

  return res.status(200).json(withAbsoluteImages);
}
