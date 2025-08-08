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
    
    // Parse the HTML to extract pet data
    const pets = [];
    
    // Look for patterns that match the pet cards
    // Based on your screenshot, we need to find divs with pet info
    const petMatches = html.match(/<div[^>]*class="[^"]*item[^"]*"[^>]*>[\s\S]*?<\/div>/gi) || [];
    
    for (const match of petMatches) {
      try {
        // Extract pet name (looking for text between tags that looks like a name)
        const nameMatch = match.match(/<[^>]*>([^<]+)<\/[^>]*>/g);
        let petName = '';
        let petValue = '';
        let petDemand = '';
        
        // Look for the pet name and values in the HTML structure
        if (nameMatch) {
          for (const tag of nameMatch) {
            const text = tag.replace(/<[^>]*>/g, '').trim();
            
            // Pet name is usually the largest text or in a specific class
            if (text && !text.includes('Value') && !text.includes('Demand') && !text.includes('DIVINE') && text.length > 2 && text.length < 50) {
              if (!petName || text.length > petName.length) {
                petName = text;
              }
            }
            
            // Look for value (usually follows "Value" or contains numbers with decimal)
            if (text.match(/^\d+\.?\d*$/)) {
              if (!petValue) petValue = text;
            }
            
            // Look for demand (usually like "8/10")
            if (text.match(/^\d+\/\d+$/)) {
              petDemand = text;
            }
          }
        }
        
        if (petName && petValue) {
          pets.push({
            name: petName,
            value: petValue,
            demand: petDemand || 'N/A'
          });
        }
      } catch (error) {
        console.log('Error parsing pet:', error);
      }
    }
    
    // Alternative parsing method if the first one doesn't work well
    if (pets.length === 0) {
      // Try to find JSON data embedded in the page
      const jsonMatch = html.match(/var\s+items\s*=\s*(\[.*?\]);/s) || 
                       html.match(/data\s*:\s*(\[.*?\])/s) ||
                       html.match(/items\s*:\s*(\[.*?\])/s);
      
      if (jsonMatch) {
        try {
          const itemsData = JSON.parse(jsonMatch[1]);
          for (const item of itemsData) {
            if (item.name && item.value) {
              pets.push({
                name: item.name,
                value: item.value,
                demand: item.demand || 'N/A'
              });
            }
          }
        } catch (error) {
          console.log('Failed to parse embedded JSON:', error);
        }
      }
    }
    
    // If still no pets found, try a simpler text-based extraction
    if (pets.length === 0) {
      // Look for common pet names in Grow a Garden
      const commonPets = ['T-Rex'];
      for (const petName of commonPets) {
        if (html.includes(petName)) {
          // Try to find the value near this pet name
          const petSection = html.substring(html.indexOf(petName) - 200, html.indexOf(petName) + 200);
          const valueMatch = petSection.match(/(\d+\.?\d*)/g);
          if (valueMatch) {
            pets.push({
              name: petName,
              value: valueMatch[0],
              demand: 'N/A'
            });
          }
        }
      }
    }
    
    // Extract just names for compatibility
    const petNames = pets.map(pet => pet.name);
    
    res.json({
      timestamp: new Date().toISOString(),
      source: 'growagardenvalues.com',
      totalPets: pets.length,
      names: petNames,
      petsWithValues: pets,
      debugInfo: {
        htmlLength: html.length,
        foundMatches: petMatches.length
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
