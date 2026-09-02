export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const BALLDONTLIE_API_KEY = process.env.BALLDONTLIE_API_KEY;
    const BALLDONTLIE_API = 'https://api.balldontlie.io/v1';
    
    // Get today's date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Log 1: API Key check
    const logs = [];
    logs.push(`[1] Checking API Key...`);
    logs.push(`    API Key exists: ${!!BALLDONTLIE_API_KEY}`);
    if (BALLDONTLIE_API_KEY) {
      logs.push(`    API Key (first 8 chars): ${BALLDONTLIE_API_KEY.substring(0, 8)}...`);
    }
    
    // Log 2: Request details
    logs.push(`[2] Request details...`);
    logs.push(`    Date: ${dateStr}`);
    logs.push(`    API URL: ${BALLDONTLIE_API}/games?dates[]=${dateStr}`);
    
    // Log 3: Make request
    logs.push(`[3] Fetching from BALLDONTLIE...`);
    
    const fetchUrl = `${BALLDONTLIE_API}/games?dates[]=${dateStr}`;
    const fetchOptions = {
      headers: {
        'Authorization': BALLDONTLIE_API_KEY || 'NO_KEY_PROVIDED'
      }
    };
    
    logs.push(`    Fetch URL: ${fetchUrl}`);
    logs.push(`    Headers: Authorization = ${BALLDONTLIE_API_KEY ? 'provided' : 'NOT PROVIDED'}`);
    
    const response = await fetch(fetchUrl, fetchOptions);
    
    logs.push(`[4] Response received...`);
    logs.push(`    Status: ${response.status}`);
    logs.push(`    Content-Type: ${response.headers.get('content-type')}`);
    
    // Log 5: Try to read response
    logs.push(`[5] Reading response...`);
    const responseText = await response.text();
    logs.push(`    Response length: ${responseText.length} bytes`);
    logs.push(`    First 200 chars: ${responseText.substring(0, 200)}`);
    
    // Log 6: Try to parse
    logs.push(`[6] Parsing response...`);
    let data;
    try {
      data = JSON.parse(responseText);
      logs.push(`    ✓ Successfully parsed JSON`);
      logs.push(`    Data type: ${typeof data}`);
      logs.push(`    Data.data length: ${(data.data || []).length}`);
    } catch (e) {
      logs.push(`    ✗ Failed to parse JSON: ${e.message}`);
      logs.push(`    Response is HTML: ${responseText.includes('<!DOCTYPE')}`);
    }
    
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      logs: logs,
      diagnostics: {
        apiKeyConfigured: !!BALLDONTLIE_API_KEY,
        dateStr: dateStr,
        responseStatus: response.status,
        responseLength: responseText.length,
        isHtml: responseText.includes('<!DOCTYPE')
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
