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
    // 自动调整参数
    let maxTokens = 100;
    const tokenIncrement = 50;
    const maxAttempts = 5;
    let lastMessage = '';
    
    // 循环调用，直到信息完整或达到最大尝试次数
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
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
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json({ error: error.error.message });
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;
      const finishReason = data.choices[0].finish_reason;
      
      lastMessage = assistantMessage;
      
      // 如果正常完成（finish_reason === 'stop'），直接返回
      if (finishReason === 'stop') {
        return res.status(200).json({
          success: true,
          message: assistantMessage,
        });
      }
      
      // 如果因为 token 限制被截断（finish_reason === 'length'），增加 max_tokens 再试
      if (finishReason === 'length') {
        maxTokens += tokenIncrement;
        console.log(`Response truncated, trying again with max_tokens: ${maxTokens}`);
        continue;
      }
      
      // 其他 finish_reason，直接返回
      return res.status(200).json({
        success: true,
        message: assistantMessage,
      });
    }
    
    // 超过最大尝试次数，返回最后的结果
    return res.status(200).json({
      success: true,
      message: lastMessage,
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
