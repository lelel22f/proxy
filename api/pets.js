export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=300');
  
  try {
    let response = await fetch('https://www.game.guide/wp-content/uploads/items-list-json/grow-a-garden-pet-page-1.json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.game.guide/',
        'Origin': 'https://www.game.guide'
      }
    });
    
    if (!response.ok) {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent('https://www.game.guide/wp-content/uploads/items-list-json/grow-a-garden-pet-page-1.json')}`;
      response = await fetch(proxyUrl);
      
      if (response.ok) {
        const proxyData = await response.json();
        const data = JSON.parse(proxyData.contents);
        return res.json({
          timestamp: new Date().toISOString(),
          method: 'proxy',
          data: data
        });
      }
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    res.json({
      timestamp: new Date().toISOString(),
      method: 'direct',
      data: data
    });
    
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
