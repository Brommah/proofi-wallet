// Vercel Serverless Function: ProofiDrop Upload
// In-memory store for demo (resets on cold start)
// TODO: Add Vercel KV or DDC HTTP gateway for persistence

const drops = global.proofiDrops || (global.proofiDrops = new Map());

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileType, fileSize, fileData, sender, recipient, expiresIn, maxDownloads } = req.body;

    if (!fileName || !fileData || !sender) {
      return res.status(400).json({ error: 'fileName, fileData, and sender required' });
    }

    // Limit file size (100MB base64 ~ 133MB)
    if (fileData.length > 140 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large. Max 100MB.' });
    }

    // Generate drop ID and fake CID
    const dropId = 'drop_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    const fakeCid = `baf${Buffer.from(dropId).toString('hex').slice(0, 56)}`;
    const expiresAt = expiresIn && expiresIn > 0 ? Date.now() + (expiresIn * 1000) : null;

    drops.set(dropId, {
      dropId,
      cid: fakeCid,
      fileName,
      fileType: fileType || 'application/octet-stream',
      fileSize: fileSize || 0,
      fileData,
      sender,
      recipient: recipient || null,
      expiresAt,
      maxDownloads: maxDownloads || 0,
      downloadCount: 0,
      createdAt: Date.now(),
    });

    console.log(`📦 ProofiDrop uploaded: ${dropId} (${fileName}) from ${sender.slice(0,8)}...`);

    return res.status(200).json({ 
      ok: true, 
      dropId,
      cid: fakeCid,
    });

  } catch (e) {
    console.error('Drop upload error:', e);
    return res.status(500).json({ error: e.message || 'Upload failed' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '150mb',
    },
  },
};
