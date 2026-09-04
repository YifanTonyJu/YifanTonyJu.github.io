/**
 * NBA API Request Logger
 * 记录所有API请求的详细信息，用于诊断问题
 */

let requestLog = [];
const MAX_LOG_ENTRIES = 100;

function logRequest(method, url, status, duration, error = null, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    method,
    url,
    status,
    duration,
    error,
    details,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  
  requestLog.push(entry);
  
  // Keep only last 100 entries
  if (requestLog.length > MAX_LOG_ENTRIES) {
    requestLog = requestLog.slice(-MAX_LOG_ENTRIES);
  }
  
  console.log(`[NBA API Log] ${entry.id}: ${method} ${url} -> ${status} (${duration}ms)`);
  if (error) {
    console.log(`[NBA API Log] Error: ${error}`);
  }
  
  return entry;
}

export function getRequestLog() {
  return requestLog;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const BALLDONTLIE_API_KEY = process.env.BALLDONTLIE_API_KEY;
    const BALLDONTLIE_API = 'https://api.balldontlie.io/v1';
    
    // 获取查询参数
    const { action } = req.query;
    
    // Action: 获取请求日志
    if (action === 'get-log') {
      return res.status(200).json({
        success: true,
        logSize: requestLog.length,
        log: requestLog
      });
    }
    
    // Action: 清空日志
    if (action === 'clear-log') {
      const oldSize = requestLog.length;
      requestLog = [];
      return res.status(200).json({
        success: true,
        message: `Cleared ${oldSize} log entries`
      });
    }
    
    // Check if API key is configured
    if (!BALLDONTLIE_API_KEY) {
      const error = 'API key not configured';
      logRequest('GET', `${BALLDONTLIE_API}/games`, 0, 0, error);
      return res.status(500).json({
        error: error,
        games: []
      });
    }

    // Get today's date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const url = `${BALLDONTLIE_API}/games?dates[]=${dateStr}`;
    
    // 记录请求开始
    const startTime = Date.now();
    let response;
    let fetchError = null;
    
    try {
      response = await fetch(url, {
        headers: {
          'Authorization': BALLDONTLIE_API_KEY
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logRequest('GET', url, 0, duration, error.message, {
        errorType: 'FETCH_ERROR',
        errorName: error.name,
        errorMessage: error.message
      });
      
      return res.status(500).json({
        error: `Fetch error: ${error.message}`,
        games: [],
        fetchFailed: true
      });
    }
    
    const duration = Date.now() - startTime;
    const responseText = await response.text();
    
    // 记录响应
    logRequest('GET', url, response.status, duration, null, {
      responseSize: responseText.length,
      contentType: response.headers.get('content-type')
    });
    
    if (!response.ok) {
      logRequest('GET', url, response.status, duration, `HTTP Error ${response.status}`, {
        responsePreview: responseText.substring(0, 200)
      });
      
      return res.status(500).json({
        error: `BALLDONTLIE API error: ${response.status}`,
        games: [],
        apiError: true
      });
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      logRequest('GET', url, response.status, duration, `JSON Parse Error: ${parseError.message}`, {
        responsePreview: responseText.substring(0, 200)
      });
      
      return res.status(500).json({
        error: 'Invalid JSON response from BALLDONTLIE',
        games: [],
        parseError: true
      });
    }

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
      success: true
    });
    
  } catch (error) {
    const duration = Date.now();
    logRequest('GET', 'unknown', 0, duration, `Uncaught Error: ${error.message}`);
    
    return res.status(500).json({ 
      error: error.message,
      games: [],
      uncaughtError: true
    });
  }
}
