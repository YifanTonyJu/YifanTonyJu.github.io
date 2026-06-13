// Vercel Serverless Function - API代理
// 安全地调用OpenAI API，隐藏密钥

module.exports = async function handler(req, res) {
  // 仅允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  // 验证请求
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  // 从环境变量获取密钥（不会在前端暴露）
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // 调用OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.error.message });
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;
    
    // Truncate to first sentence, but only if there are multiple sentences
    const sentences = assistantMessage.match(/[^.!?]*[.!?]/g);
    const truncatedMessage = sentences && sentences.length > 1 ? sentences[0].trim() : assistantMessage;

    return res.status(200).json({
      success: true,
      message: truncatedMessage,
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
