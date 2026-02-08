// Vercel Serverless Function: ProofiDrop Download
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
    const { dropId } = req.query;
    const wallet = req.query.wallet;

    const drop = drops.get(dropId);
    
    if (!drop) {
      return res.status(404).json({ error: 'Drop not found or expired' });
    }

    // Check expiration
    if (drop.expiresAt && Date.now() > drop.expiresAt) {
      drops.delete(dropId);
      return res.status(410).json({ error: 'This drop has expired' });
    }

    // Check recipient restriction
    if (drop.recipient && wallet && drop.recipient !== wallet) {
      return res.status(403).json({ error: 'This drop is restricted to a specific recipient' });
    }

    // Check download limit
    if (drop.maxDownloads > 0 && drop.downloadCount >= drop.maxDownloads) {
      return res.status(410).json({ error: 'Download limit reached' });
    }

    // Increment download count
    drop.downloadCount++;

    console.log(`📥 ProofiDrop downloaded: ${dropId} (${drop.downloadCount}/${drop.maxDownloads || '∞'})`);

    return res.status(200).json({
      ok: true,
      fileName: drop.fileName,
      fileType: drop.fileType,
      fileSize: drop.fileSize,
      fileData: drop.fileData,
      sender: drop.sender,
      cid: drop.cid,
    });

  } catch (e) {
    console.error('Drop download error:', e);
    return res.status(500).json({ error: e.message || 'Download failed' });
  }
}
