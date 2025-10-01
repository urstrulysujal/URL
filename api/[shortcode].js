import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { shortcode } = req.query;
  const originalUrl = await kv.get(shortcode);
  if (originalUrl) {
    res.redirect(302, originalUrl);
  } else {
    res.status(404).send("Short code not found");
  }
}
