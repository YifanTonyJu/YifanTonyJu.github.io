// Vercel Serverless Function - 语音转文字 API
// 使用 OpenAI Whisper API 将音频转换为文本

const https = require('https');

module.exports = async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 仅允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { audio } = req.body;

    // 验证请求
    if (!audio) {
      return res.status(400).json({ success: false, error: 'No audio data provided' });
    }

    // 从环境变量获取密钥
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('API key not configured');
      return res.status(500).json({ success: false, error: 'API key not configured' });
    }

    // 解码 base64 音频
    const audioBuffer = Buffer.from(audio, 'base64');
    console.log('Audio buffer size:', audioBuffer.length);

    // 构建 multipart/form-data
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 16);
    const body = [];

    // 添加 file 字段
    body.push(`--${boundary}`);
    body.push('Content-Disposition: form-data; name="file"; filename="audio.webm"');
    body.push('Content-Type: audio/webm');
    body.push('');
    body.push(audioBuffer.toString('binary'));
    body.push('');

    // 添加 model 字段
    body.push(`--${boundary}`);
    body.push('Content-Disposition: form-data; name="model"');
    body.push('');
    body.push('whisper-1');
    body.push('');

    // 添加 language 字段
    body.push(`--${boundary}`);
    body.push('Content-Disposition: form-data; name="language"');
    body.push('');
    body.push('en');
    body.push('');

    // 结束边界
    body.push(`--${boundary}--`);
    body.push('');

    const bodyBinary = Buffer.from(body.join('\r\n'), 'binary');

    console.log('Sending to Whisper API...');

    // 使用 Promise 包装 HTTPS 请求
    return new Promise((resolve) => {
      const options = {
        hostname: 'api.openai.com',
        path: '/v1/audio/transcriptions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': bodyBinary.length,
        },
      };

      const request = https.request(options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          console.log('Whisper API response status:', response.statusCode);

          if (response.statusCode !== 200) {
            console.error('Whisper API error:', data);
            return resolve(res.status(response.statusCode).json({
              success: false,
              error: `Whisper API error: ${response.statusCode}`,
              details: data
            }));
          }

          try {
            const result = JSON.parse(data);
            console.log('Transcription result:', result.text);
            return resolve(res.status(200).json({
              success: true,
              text: result.text,
            }));
          } catch (e) {
            console.error('JSON parse error:', e);
            return resolve(res.status(500).json({
              success: false,
              error: 'Failed to parse API response'
            }));
          }
        });
      });

      request.on('error', (error) => {
        console.error('HTTP request error:', error);
        return resolve(res.status(500).json({
          success: false,
          error: 'HTTP request failed',
          details: error.message
        }));
      });

      request.write(bodyBinary);
      request.end();
    });
  } catch (error) {
    console.error('Transcription error details:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};
