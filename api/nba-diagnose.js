// Helper function for retryable fetch (same as in nba-scores.js)
async function fetchWithRetry(url, options = {}, retries = 2, timeout = 8000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(error.timeoutId);
      console.log(`Attempt ${attempt} failed - ${error.message}`);
      
      if (attempt === retries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const BALLDONTLIE_API_KEY = process.env.BALLDONTLIE_API_KEY;
    const BALLDONTLIE_API = 'https://api.balldontlie.io/v1';
    const { testType = 'single' } = req.query;
    
    // Get today's date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const fetchUrl = `${BALLDONTLIE_API}/games?dates[]=${dateStr}`;
    
    // ===== TEST 1: Single Request =====
    if (testType === 'single' || testType === 'all') {
      console.log('[Diagnose] TEST 1: Single Request');
      
      const logs = [];
      logs.push(`[1] Checking API Key...`);
      logs.push(`    API Key exists: ${!!BALLDONTLIE_API_KEY}`);
      
      logs.push(`[2] Request details...`);
      logs.push(`    Date: ${dateStr}`);
      logs.push(`    URL: ${fetchUrl}`);
      
      logs.push(`[3] Making single request...`);
      
      const startTime = Date.now();
      const response = await fetch(fetchUrl, {
        headers: {
          'Authorization': BALLDONTLIE_API_KEY || 'NO_KEY'
        }
      });
      const duration = Date.now() - startTime;
      
      const responseText = await response.text();
      
      logs.push(`[4] Response received...`);
      logs.push(`    Status: ${response.status}`);
      logs.push(`    Duration: ${duration}ms`);
      logs.push(`    Size: ${responseText.length} bytes`);
      logs.push(`    Content-Type: ${response.headers.get('content-type')}`);
      
      let data = null;
      let parseSuccess = false;
      try {
        data = JSON.parse(responseText);
        parseSuccess = true;
        logs.push(`    ✓ JSON parse success`);
      } catch (e) {
        logs.push(`    ✗ JSON parse failed: ${e.message}`);
      }
      
      if (testType === 'single') {
        return res.status(200).json({
          success: response.ok,
          testType: 'single',
          logs,
          result: {
            statusCode: response.status,
            duration,
            parseSuccess,
            gamesCount: parseSuccess ? (data?.data || []).length : null,
            isError: !response.ok
          }
        });
      }
    }
    
    // ===== TEST 2: Rapid Sequential Requests =====
    if (testType === 'rapid-sequential' || testType === 'all') {
      console.log('[Diagnose] TEST 2: Rapid Sequential Requests (5 requests, 100ms apart)');
      
      const results = [];
      
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        
        try {
          const response = await fetch(fetchUrl, {
            headers: {
              'Authorization': BALLDONTLIE_API_KEY || 'NO_KEY'
            }
          });
          
          const duration = Date.now() - startTime;
          const responseText = await response.text();
          
          results.push({
            requestNumber: i + 1,
            statusCode: response.status,
            duration,
            size: responseText.length,
            success: response.ok,
            error: !response.ok ? responseText.substring(0, 100) : null
          });
          
          console.log(`[Diagnose] Request #${i + 1}: ${response.status} (${duration}ms)`);
        } catch (error) {
          const duration = Date.now() - startTime;
          results.push({
            requestNumber: i + 1,
            statusCode: 0,
            duration,
            success: false,
            error: error.message
          });
          
          console.log(`[Diagnose] Request #${i + 1}: FAILED (${error.message})`);
        }
        
        // 等待100ms后再发送下一个请求
        if (i < 4) {
          await new Promise(r => setTimeout(r, 100));
        }
      }
      
      if (testType === 'rapid-sequential') {
        return res.status(200).json({
          success: true,
          testType: 'rapid-sequential',
          results,
          summary: {
            total: results.length,
            succeeded: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            avgDuration: Math.round(results.reduce((s, r) => s + r.duration, 0) / results.length),
            hasErrors: results.some(r => !r.success)
          }
        });
      }
    }
    
    // ===== TEST 3: Parallel Requests =====
    if (testType === 'parallel' || testType === 'all') {
      console.log('[Diagnose] TEST 3: Parallel Requests (10 simultaneous)');
      
      const results = [];
      const requests = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        
        const request = fetch(fetchUrl, {
          headers: {
            'Authorization': BALLDONTLIE_API_KEY || 'NO_KEY'
          }
        })
          .then(async (response) => {
            const duration = Date.now() - startTime;
            const responseText = await response.text();
            
            results.push({
              requestNumber: i + 1,
              statusCode: response.status,
              duration,
              size: responseText.length,
              success: response.ok,
              error: !response.ok ? responseText.substring(0, 100) : null
            });
            
            console.log(`[Diagnose] Parallel #${i + 1}: ${response.status} (${duration}ms)`);
          })
          .catch((error) => {
            const duration = Date.now() - startTime;
            results.push({
              requestNumber: i + 1,
              statusCode: 0,
              duration,
              success: false,
              error: error.message
            });
            
            console.log(`[Diagnose] Parallel #${i + 1}: FAILED (${error.message})`);
          });
        
        requests.push(request);
      }
      
      await Promise.all(requests);
      
      if (testType === 'parallel') {
        return res.status(200).json({
          success: true,
          testType: 'parallel',
          results,
          summary: {
            total: results.length,
            succeeded: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            avgDuration: Math.round(results.reduce((s, r) => s + r.duration, 0) / results.length),
            minDuration: Math.min(...results.map(r => r.duration)),
            maxDuration: Math.max(...results.map(r => r.duration)),
            hasErrors: results.some(r => !r.success),
            hasRateLimiting: results.some(r => r.statusCode === 429),
            hasServerErrors: results.some(r => r.statusCode >= 500)
          }
        });
      }
    }
    
    // ===== TEST 4: All tests combined =====
    if (testType === 'all') {
      // Already ran all tests above, compile results
      return res.status(200).json({
        success: true,
        message: 'See logs in console for detailed results',
        testType: 'all',
        note: 'Run individual tests with ?testType=single, ?testType=rapid-sequential, or ?testType=parallel'
      });
    }
    
    return res.status(200).json({
      success: false,
      error: `Unknown testType: ${testType}`,
      availableTests: ['single', 'rapid-sequential', 'parallel', 'all']
    });
    
  } catch (error) {
    return res.status(200).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}
