/**
 * NBA API Stress Test
 * 用来检测快速连续刷新时是否出现500错误
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      total: 10,
      success: 0,
      failed: 0,
      errors: []
    }
  };

  try {
    const BALLDONTLIE_API_KEY = process.env.BALLDONTLIE_API_KEY;
    const BALLDONTLIE_API = 'https://api.balldontlie.io/v1';
    
    if (!BALLDONTLIE_API_KEY) {
      return res.status(200).json({
        success: false,
        error: 'API Key not configured',
        testResults
      });
    }

    // Get today's date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const url = `${BALLDONTLIE_API}/games?dates[]=${dateStr}`;
    
    console.log(`[Stress Test] Starting 10 rapid requests to ${url}`);
    
    // 发起10个快速连续请求（不等待，全部同时发起）
    const requests = [];
    for (let i = 0; i < 10; i++) {
      const requestTime = Date.now();
      
      const request = fetch(url, {
        headers: {
          'Authorization': BALLDONTLIE_API_KEY
        }
      })
        .then(async (response) => {
          const duration = Date.now() - requestTime;
          const responseText = await response.text();
          
          const testResult = {
            requestNumber: i + 1,
            timestamp: new Date().toISOString(),
            statusCode: response.status,
            duration: duration,
            responseSize: responseText.length,
            success: response.ok,
            errorMessage: !response.ok ? responseText.substring(0, 200) : null
          };
          
          if (response.ok) {
            try {
              const data = JSON.parse(responseText);
              testResult.gamesCount = (data.data || []).length;
              testResult.parseSuccess = true;
            } catch (e) {
              testResult.parseSuccess = false;
              testResult.parseError = e.message;
            }
          }
          
          testResults.tests.push(testResult);
          
          if (response.ok) {
            testResults.summary.success++;
          } else {
            testResults.summary.failed++;
            testResults.summary.errors.push(`Request #${i + 1}: HTTP ${response.status}`);
          }
          
          return testResult;
        })
        .catch((error) => {
          const duration = Date.now() - requestTime;
          const testResult = {
            requestNumber: i + 1,
            timestamp: new Date().toISOString(),
            statusCode: 0,
            duration: duration,
            success: false,
            errorMessage: error.message
          };
          
          testResults.tests.push(testResult);
          testResults.summary.failed++;
          testResults.summary.errors.push(`Request #${i + 1}: ${error.message}`);
          
          return testResult;
        });
      
      requests.push(request);
    }
    
    // 等待所有请求完成
    await Promise.all(requests);
    
    console.log(`[Stress Test] Completed. Success: ${testResults.summary.success}/10, Failed: ${testResults.summary.failed}/10`);
    
    // 分析结果
    const analysis = {
      allPassed: testResults.summary.failed === 0,
      hasRateLimiting: testResults.tests.some(t => t.statusCode === 429),
      hasServerErrors: testResults.tests.some(t => t.statusCode >= 500),
      hasAuthErrors: testResults.tests.some(t => t.statusCode === 401 || t.statusCode === 403),
      hasTimeouts: testResults.tests.some(t => t.statusCode === 0 && t.errorMessage.includes('timeout')),
      avgResponseTime: Math.round(
        testResults.tests.reduce((sum, t) => sum + t.duration, 0) / testResults.tests.length
      ),
      minResponseTime: Math.min(...testResults.tests.map(t => t.duration)),
      maxResponseTime: Math.max(...testResults.tests.map(t => t.duration))
    };
    
    testResults.analysis = analysis;
    
    // 打印分析结果
    console.log('[Stress Test] Analysis:');
    console.log(`  - All Passed: ${analysis.allPassed}`);
    console.log(`  - Has Rate Limiting (429): ${analysis.hasRateLimiting}`);
    console.log(`  - Has Server Errors (5xx): ${analysis.hasServerErrors}`);
    console.log(`  - Has Auth Errors: ${analysis.hasAuthErrors}`);
    console.log(`  - Has Timeouts: ${analysis.hasTimeouts}`);
    console.log(`  - Avg Response Time: ${analysis.avgResponseTime}ms`);
    console.log(`  - Min/Max: ${analysis.minResponseTime}/${analysis.maxResponseTime}ms`);
    
    return res.status(200).json({
      success: true,
      testResults
    });
    
  } catch (error) {
    console.error('[Stress Test] Fatal Error:', error);
    
    return res.status(200).json({
      success: false,
      error: error.message,
      stack: error.stack,
      testResults
    });
  }
}
