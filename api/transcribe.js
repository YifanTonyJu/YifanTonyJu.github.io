// Vercel Serverless Function - 语音转文字 API
// 使用 OpenAI Whisper API 将音频转换为文本

module.exports = async function handler(req, res) {
  // 仅允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { audio } = req.body;

  // 验证请求
  if (!audio) {
    return res.status(400).json({ error: 'No audio data provided' });
  }

  // 从环境变量获取密钥
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // 解码 base64 音频
    const audioBuffer = Buffer.from(audio, 'base64');

    // 创建 FormData
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', audioBuffer, 'audio.webm');
    form.append('model', 'whisper-1');
    form.append('language', 'en');

    // 调用 Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Whisper API error:', error);
      return res.status(response.status).json({ 
        success: false,
        error: error.error?.message || 'Transcription failed' 
      });
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      text: data.text,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
};
