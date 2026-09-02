const BALLDONTLIE_API_KEY = process.env.BALLDONTLIE_API_KEY;
const BALLDONTLIE_API = 'https://api.balldontlie.io/v1';

export default async function handler(req, res) {
  // Check if API key is configured
  if (!BALLDONTLIE_API_KEY) {
    console.error('BALLDONTLIE_API_KEY is not configured');
    return res.status(500).json({ 
      error: 'API key not configured',
      games: []
    });
  }

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get today's date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Fetch NBA games from BALLDONTLIE API
    const response = await fetch(
      `${BALLDONTLIE_API}/games?dates[]=${dateStr}`,
      {
        headers: {
          'Authorization': BALLDONTLIE_API_KEY
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`BALLDONTLIE API error: ${response.status}`);
    }
    
    const data = await response.json();
    
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
    
    res.status(200).json({ 
      games: games,
      date: dateStr,
      count: games.length
    });
  } catch (error) {
    console.error('Error fetching NBA scores:', error);
    res.status(500).json({ 
      error: 'Failed to fetch NBA scores',
      games: []
    });
  }
}
