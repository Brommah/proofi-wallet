// Vercel Serverless Function: ProofiDrop Inbox
const drops = global.proofiDrops || (global.proofiDrops = new Map());

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { wallet } = req.query;

    const files = [];
    
    for (const [dropId, drop] of drops.entries()) {
      // Check if this drop is for this wallet (recipient matches or no recipient specified)
      if (drop.recipient === wallet || (drop.recipient === null && drop.sender !== wallet)) {
        // Check expiration
        if (drop.expiresAt && Date.now() > drop.expiresAt) {
          drops.delete(dropId);
          continue;
        }
        
        // Check download limit
        if (drop.maxDownloads > 0 && drop.downloadCount >= drop.maxDownloads) {
          continue;
        }

        files.push({
          dropId: drop.dropId,
          fileName: drop.fileName,
          fileSize: drop.fileSize,
          sender: drop.sender,
          createdAt: drop.createdAt,
          expired: false,
        });
      }
    }

    return res.status(200).json({ ok: true, files });

  } catch (e) {
    console.error('Inbox error:', e);
    return res.status(500).json({ error: e.message || 'Failed to load inbox' });
  }
}
