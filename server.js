import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NutriTrack API is running' });
});

// OpenAI Vision API - Analyze Food Image
app.post('/api/analyze-food', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file' 
      });
    }

    const payload = {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this food image and provide nutritional information. Return ONLY a JSON object with this exact structure:
{
  "food_name": "name of the food",
  "estimated_calories": number,
  "protein": number (in grams),
  "carbs": number (in grams),
  "fat": number (in grams),
  "portion_estimation": "description of portion size (e.g., '1 medium apple', '200g chicken breast')"
}

Be as accurate as possible with the nutritional values based on standard portions.`
            },
            {
              type: "image_url",
              image_url: { url: image }
            }
          ]
        }
      ],
      max_tokens: 500
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API Error:', data);
      return res.status(500).json({ 
        success: false, 
        error: data.error?.message || 'OpenAI API request failed' 
      });
    }

    if (data.choices && data.choices[0]) {
      let content = data.choices[0].message.content;
      
      // Clean up the response - remove markdown code blocks if present
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        const analysis = JSON.parse(content);
        res.json({ success: true, analysis });
      } catch (parseError) {
        console.error('JSON Parse Error:', content);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to parse AI response',
          raw: content 
        });
      }
    } else {
      res.status(500).json({ success: false, error: 'No response from AI' });
    }

  } catch (error) {
    console.error('Error analyzing food:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Edamam Food Database API
app.get('/api/food/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter required' });
    }

    if (!process.env.EDAMAM_APP_ID || !process.env.EDAMAM_APP_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'Edamam API credentials not configured' 
      });
    }

    const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${process.env.EDAMAM_APP_ID}&app_key=${process.env.EDAMAM_APP_KEY}&ingr=${encodeURIComponent(query)}&nutrition-type=cooking`;

    const response = await fetch(url);
    const data = await response.json();

    res.json({ success: true, data });

  } catch (error) {
    console.error('Error searching food:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Spoonacular API - Get detailed nutrition
app.get('/api/food/spoonacular', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter required' });
    }

    if (!process.env.SPOONACULAR_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'Spoonacular API key not configured' 
      });
    }

    const url = `https://api.spoonacular.com/food/ingredients/search?apiKey=${process.env.SPOONACULAR_API_KEY}&query=${encodeURIComponent(query)}&number=10`;

    const response = await fetch(url);
    const data = await response.json();

    res.json({ success: true, data });

  } catch (error) {
    console.error('Error searching Spoonacular:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NutriTrack API Server running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  
  // Check for API keys
  const apiKeys = {
    OpenAI: !!process.env.OPENAI_API_KEY,
    Edamam: !!(process.env.EDAMAM_APP_ID && process.env.EDAMAM_APP_KEY),
    Spoonacular: !!process.env.SPOONACULAR_API_KEY
  };
  
  console.log('\n🔑 API Keys Status:');
  Object.entries(apiKeys).forEach(([name, configured]) => {
    console.log(`   ${configured ? '✅' : '❌'} ${name}`);
  });
  
  if (!apiKeys.OpenAI) {
    console.log('\n⚠️  Warning: OpenAI API key not found. AI food recognition will not work.');
  }
});
