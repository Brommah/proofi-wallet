module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const walletJson = process.env.DDC_WALLET_JSON;
  const password = process.env.DDC_WALLET_PASSWORD;
  const bucketId = process.env.DDC_BUCKET_ID;
  
  res.status(200).json({
    hasWalletJson: !!walletJson,
    walletJsonLength: walletJson?.length || 0,
    walletJsonPreview: walletJson ? walletJson.slice(0, 50) + '...' : null,
    hasPassword: !!password,
    passwordLength: password?.length || 0,
    passwordPreview: password ? password.slice(0, 3) + '***' : null,
    bucketId: bucketId || null,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  });
};
