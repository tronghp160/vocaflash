// api/sync.js — Serverless Vercel Cloud Sync API for VocaFlash

const memoryStore = new Map();

export default async function handler(req, res) {
  // Enable CORS for all domains & origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { key } = req.query;

  if (req.method === 'POST') {
    try {
      const syncKey = (req.body?.syncKey || key || 'default').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (!syncKey) {
        return res.status(400).json({ success: false, message: 'Mã không hợp lệ' });
      }

      global._vocaFlashStore = global._vocaFlashStore || {};
      global._vocaFlashStore[syncKey] = {
        updatedAt: new Date().toISOString(),
        payload: req.body?.payload || req.body,
      };

      return res.status(200).json({
        success: true,
        syncKey,
        message: `Đã lưu thành công dữ liệu mã: "${syncKey}"`,
      });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  if (req.method === 'GET') {
    const syncKey = (key || 'default').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    global._vocaFlashStore = global._vocaFlashStore || {};
    const record = global._vocaFlashStore[syncKey];

    if (!record) {
      return res.status(404).json({ success: false, message: `Chưa có dữ liệu cho mã: "${syncKey}"` });
    }

    return res.status(200).json({
      success: true,
      syncKey,
      updatedAt: record.updatedAt,
      data: record.payload,
    });
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
