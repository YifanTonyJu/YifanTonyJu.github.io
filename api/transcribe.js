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
      console.error('❌ API key not configured');
      return res.status(500).json({ success: false, error: 'API key not configured' });
    }

    // 解码 base64 音频
    const audioBuffer = Buffer.from(audio, 'base64');
    console.log('📦 Audio buffer size:', audioBuffer.length, 'bytes');
    console.log('🎤 Audio data preview:', audio.substring(0, 50) + '...');

    // 使用更简单的方式：直接发送二进制数据
    // Whisper API 也接受直接的音频二进制数据
    
    // 构建 multipart/form-data - 使用更标准的方式
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    
    const parts = [];
    
    // 添加 file 部分
    parts.push(`--${boundary}`);
    parts.push('Content-Disposition: form-data; name="file"; filename="audio.webm"');
    parts.push('Content-Type: audio/webm');
    parts.push('');
    
    const bodyParts = [];
    bodyParts.push(Buffer.from(parts.join('\r\n') + '\r\n'));
    bodyParts.push(audioBuffer);
    bodyParts.push(Buffer.from('\r\n'));
    
    // 添加 model 部分
    bodyParts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n`));
    
    // 添加 language 部分
    bodyParts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\nen\r\n`));
    
    // 结束边界
    bodyParts.push(Buffer.from(`--${boundary}--\r\n`));
    
    const body = Buffer.concat(bodyParts);
    
    console.log('📤 Total payload size:', body.length, 'bytes');
    console.log('🔄 Sending to Whisper API...');

    return new Promise((resolve) => {
      const options = {
        hostname: 'api.openai.com',
        path: '/v1/audio/transcriptions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
        },
      };

      const request = https.request(options, (response) => {
        let responseData = '';

        response.on('data', (chunk) => {
          responseData += chunk;
        });

        response.on('end', () => {
          console.log('📊 Whisper API response status:', response.statusCode);
          console.log('📝 Whisper API response:', responseData.substring(0, 200));

          if (response.statusCode !== 200) {
            console.error('❌ Whisper API error response:', responseData);
            return resolve(res.status(response.statusCode).json({
              success: false,
              error: `Whisper API error: ${response.statusCode}`,
              details: responseData
            }));
          }

          try {
            const result = JSON.parse(responseData);
            console.log('✅ Transcription success:', result.text);
            return resolve(res.status(200).json({
              success: true,
              text: result.text,
            }));
          } catch (e) {
            console.error('❌ JSON parse error:', e.message);
            return resolve(res.status(500).json({
              success: false,
              error: 'Failed to parse API response',
              raw: responseData
            }));
          }
        });
      });

      request.on('error', (error) => {
        console.error('❌ HTTP request error:', error.message);
        return resolve(res.status(500).json({
          success: false,
          error: 'HTTP request failed',
          details: error.message
        }));
      });

      request.write(body);
      request.end();
    });
  } catch (error) {
    console.error('❌ Transcription error details:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};
