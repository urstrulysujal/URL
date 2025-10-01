import { kv } from '@vercel/kv';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { url, shortCode } = req.body;
    if (!url) {
      res.status(400).json({ error: "No URL provided" });
      return;
    }
    let finalShortCode = shortCode || crypto.randomBytes(4).toString('hex');
    await kv.set(finalShortCode, url);
    res.status(200).json({ shortCode: finalShortCode });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
