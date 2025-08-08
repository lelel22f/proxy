export default async function handler(req, res) {
  // Enable CORS for Roblox
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=300'); // Cache for 5 minutes
  
  try {
    // Fetch the HTML page
    const response = await fetch('https://www.growagardenvalues.com/values/items.php', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // Parse the HTML to extract pet data using the correct structure
    const pets = [];
    
    // Look for item-card divs that contain pet data
    const itemCardRegex = /<div class="item-card"[^>]*onclick="openItemDetails\('([^']+)',\s*'Pet'\)"[\s\S]*?<\/div>(?=\s*(?:<div class="item-card"|$))/gi;
    
    let match;
    while ((match = itemCardRegex.exec(html)) !== null) {
      try {
        const petName = match[1]; // Pet name from onclick attribute
        const cardHtml = match[0]; // Full card HTML
        
        // Extract value - look for the span with color style containing the value
        const valueMatch = cardHtml.match(/<span style="color: #5048E5;">([^<]+)<\/span>/);
        const petValue = valueMatch ? valueMatch[1] : 'N/A';
        
        // Extract demand - look for stat-value with color #A2A2A2
        const demandMatch = cardHtml.match(/<span class="stat-value" style="color: #A2A2A2;">([^<]+)<\/span>/);
        const petDemand = demandMatch ? demandMatch[1] : 'N/A';
        
        // Extract rarity - look for rarity-badge class
        const rarityMatch = cardHtml.match(/<div class="rarity-badge rarity-([^"]+)">([^<]+)<\/div>/);
        const petRarity = rarityMatch ? rarityMatch[2] : 'N/A';
        
        pets.push({
          name: petName,
          value: petValue,
          demand: petDemand,
          rarity: petRarity
        });
        
      } catch (error) {
        console.log('Error parsing pet card:', error);
      }
    }
    
    // Alternative method: Look for all pet items regardless of category
    if (pets.length === 0) {
      // Try to find any item-card with pet-like names
      const allItemsRegex = /<div class="item-card"[^>]*onclick="openItemDetails\('([^']+)',\s*'([^']+)'\)"[\s\S]*?<\/div>(?=\s*(?:<div class="item-card"|$))/gi;
      
      let allMatch;
      while ((allMatch = allItemsRegex.exec(html)) !== null) {
        const itemName = allMatch[1];
        const itemType = allMatch[2];
        const cardHtml = allMatch[0];
        
        // Only include if it's a Pet or if the name sounds like a pet
        const petKeywords = ['Rex', 'Dragon', 'Phoenix', 'Unicorn', 'Griffin', 'Kraken', 'Hydra', 'Wolf', 'Tiger', 'Lion', 'Bear'];
        const isPet = itemType === 'Pet' || petKeywords.some(keyword => itemName.includes(keyword));
        
        if (isPet) {
          const valueMatch = cardHtml.match(/<span style="color: #5048E5;">([^<]+)<\/span>/);
          const petValue = valueMatch ? valueMatch[1] : 'N/A';
          
          const demandMatch = cardHtml.match(/<span class="stat-value" style="color: #A2A2A2;">([^<]+)<\/span>/);
          const petDemand = demandMatch ? demandMatch[1] : 'N/A';
          
          const rarityMatch = cardHtml.match(/<div class="rarity-badge rarity-([^"]+)">([^<]+)<\/div>/);
          const petRarity = rarityMatch ? rarityMatch[2] : 'N/A';
          
          pets.push({
            name: itemName,
            value: petValue,
            demand: petDemand,
            rarity: petRarity,
            type: itemType
          });
        }
      }
    }
    
    // Remove duplicates
    const uniquePets = pets.filter((pet, index, self) => 
      index === self.findIndex(p => p.name === pet.name)
    );
    
    // Extract just names for compatibility
    const petNames = uniquePets.map(pet => pet.name);
    
    res.json({
      timestamp: new Date().toISOString(),
      source: 'growagardenvalues.com',
      totalPets: uniquePets.length,
      names: petNames,
      petsWithValues: uniquePets,
      debugInfo: {
        htmlLength: html.length,
        foundPetCards: pets.length,
        uniquePets: uniquePets.length
      }
    });
    
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ 
      error: 'Failed to scrape pet data', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
