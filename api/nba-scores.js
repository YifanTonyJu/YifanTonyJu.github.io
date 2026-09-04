/**
 * NBA Scores API with intelligent rate limit handling
 */

async function fetchWithRateLimitHandling(url, options = {}, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[NBA API] Attempt ${attempt}/${maxRetries}: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // 处理429限流错误 - 重试而不是失败
      if (response.status === 429) {
        console.log(`[NBA API] Rate limited (429) on attempt ${attempt}`);
        
        if (attempt < maxRetries) {
          // 计算指数退避延迟：2秒, 4秒, 8秒
          const delayMs = Math.pow(2, attempt) * 1000;
          console.log(`[NBA API] Waiting ${delayMs}ms before retry...`);
          await new Promise(r => setTimeout(r, delayMs));
          continue; // 继续下一次尝试
        } else {
          // 最后一次尝试仍然429，返回特殊标记让前端使用缓存
          return {
            status: 429,
            rateLimited: true,
            response: response
          };
        }
      }
      
      // 其他状态码直接返回
      return response;
      
    } catch (error) {
      console.log(`[NBA API] Fetch error on attempt ${attempt}: ${error.message}`);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 网络错误也要重试
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const BALLDONTLIE_API_KEY = process.env.BALLDONTLIE_API_KEY;
    const BALLDONTLIE_API = 'https://api.balldontlie.io/v1';
    
    // Check if API key is configured
    if (!BALLDONTLIE_API_KEY) {
      console.error('BALLDONTLIE_API_KEY is not configured');
      return res.status(500).json({ 
        error: 'API key not configured',
        games: []
      });
    }

    // Get today's date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Fetch NBA games from BALLDONTLIE API with rate limit handling
    const url = `${BALLDONTLIE_API}/games?dates[]=${dateStr}`;
    console.log(`[NBA API] Fetching games for ${dateStr}`);
    
    const response = await fetchWithRateLimitHandling(url, {
      headers: {
        'Authorization': BALLDONTLIE_API_KEY
      }
    }, 3);
    
    // 处理限流情况 - 返回特殊响应，让前端知道该用缓存
    if (response.rateLimited) {
      console.warn('[NBA API] Still rate limited after retries, signaling client to use cache');
      return res.status(200).json({ 
        error: 'Rate limited - using cache',
        games: [],
        success: false,
        rateLimited: true,
        useCache: true
      });
    }
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`[NBA API] Error: ${response.status} - ${responseText.substring(0, 500)}`);
      return res.status(500).json({ 
        error: `BALLDONTLIE API error: ${response.status}`,
        games: []
      });
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[NBA API] Failed to parse JSON response');
      return res.status(500).json({ 
        error: 'Invalid JSON response from BALLDONTLIE',
        games: []
      });
    }
    
    console.log(`[NBA API] Successfully parsed ${(data.data || []).length} games`);
    
    // Transform BALLDONTLIE data to our format
    const games = (data.data || []).map(game => ({
      id: game.id,
      date: game.date,
      status: game.status,
      home_team: game.home_team.name,
      home_team_abbreviation: game.home_team.abbreviation,
      home_score: game.home_team_score,
      visitor_team: game.visitor_team.name,
      visitor_team_abbreviation: game.visitor_team.abbreviation,
      visitor_score: game.visitor_team_score
    }));
    
    return res.status(200).json({ 
      games: games,
      date: dateStr,
      count: games.length,
      success: true,
      rateLimited: false
    });
    
  } catch (error) {
    console.error('[NBA API] Error:', error.message);
    return res.status(500).json({ 
      error: error.message,
      games: [],
      success: false
    });
  }
}
