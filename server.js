{\rtf1\ansi\ansicpg1252\cocoartf2867
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // server.js - Unified backend for FoodLog PWA\
import express from 'express';\
import dotenv from 'dotenv';\
import path from 'path';\
import cors from 'cors';\
import multer from 'multer';\
import fs from 'fs';\
import \{ fileURLToPath \} from 'url';\
import \{ dirname \} from 'path';\
import axios from 'axios';\
import OAuth from 'oauth-1.0a';\
import crypto from 'crypto';\
import OpenAI from 'openai';\
\
dotenv.config();\
\
const __filename = fileURLToPath(import.meta.url);\
const __dirname = dirname(__filename);\
\
const app = express();\
const upload = multer(\{ dest: 'uploads/' \});\
const PORT = process.env.PORT || 3000;\
\
app.use(cors());\
app.use(express.json(\{ limit: '50mb' \}));\
app.use(express.urlencoded(\{ extended: true \}));\
app.use('/', express.static(path.join(__dirname, 'public')));\
\
// API Keys\
const EDAMAM_FOOD_ID = process.env.EDAMAM_FOOD_APP_ID;\
const EDAMAM_FOOD_KEY = process.env.EDAMAM_FOOD_APP_KEY;\
const EDAMAM_NUTRITION_ID = process.env.EDAMAM_NUTRITION_APP_ID;\
const EDAMAM_NUTRITION_KEY = process.env.EDAMAM_NUTRITION_APP_KEY;\
const EDAMAM_RECIPE_ID = process.env.EDAMAM_RECIPE_APP_ID;\
const EDAMAM_RECIPE_KEY = process.env.EDAMAM_RECIPE_APP_KEY;\
const SPOONACULAR_KEY = process.env.SPOONACULAR_API_KEY;\
const FATSECRET_KEY = process.env.FATSECRET_KEY;\
const FATSECRET_SECRET = process.env.FATSECRET_SECRET;\
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;\
\
// OpenAI client\
const openai = new OpenAI(\{ apiKey: OPENAI_API_KEY \});\
\
// FatSecret OAuth setup\
const oauth = OAuth(\{\
  consumer: \{ key: FATSECRET_KEY || '', secret: FATSECRET_SECRET || '' \},\
  signature_method: 'HMAC-SHA1',\
  hash_function(base_string, key) \{\
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');\
  \}\
\});\
\
/* ==================== EDAMAM ENDPOINTS ==================== */\
\
// Food Database Parser\
app.post('/api/edamam/food-parser', async (req, res) => \{\
  try \{\
    const \{ text \} = req.body;\
    if (!text) return res.status(400).json(\{ error: 'text required' \});\
    \
    const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=$\{EDAMAM_FOOD_ID\}&app_key=$\{EDAMAM_FOOD_KEY\}&ingr=$\{encodeURIComponent(text)\}`;\
    const response = await axios.get(url);\
    res.json(response.data);\
  \} catch (err) \{\
    res.status(500).json(\{ error: err.message || String(err) \});\
  \}\
\});\
\
// Nutrition Analysis\
app.post('/api/edamam/nutrition', async (req, res) => \{\
  try \{\
    const \{ ingredients \} = req.body;\
    if (!ingredients) return res.status(400).json(\{ error: 'ingredients required' \});\
    \
    const url = `https://api.edamam.com/api/nutrition-details?app_id=$\{EDAMAM_NUTRITION_ID\}&app_key=$\{EDAMAM_NUTRITION_KEY\}`;\
    const body = \{\
      title: 'User Recipe',\
      ingr: Array.isArray(ingredients) ? ingredients : [ingredients]\
    \};\
    const response = await axios.post(url, body, \{ headers: \{ 'Content-Type': 'application/json' \} \});\
    res.json(response.data);\
  \} catch (err) \{\
    res.status(500).json(\{ error: err.message || String(err) \});\
  \}\
\});\
\
// Recipe Search\
app.post('/api/edamam/recipes', async (req, res) => \{\
  try \{\
    const \{ q, calories, diet \} = req.body;\
    let url = `https://api.edamam.com/api/recipes/v2?type=public&app_id=$\{EDAMAM_RECIPE_ID\}&app_key=$\{EDAMAM_RECIPE_KEY\}`;\
    if (q) url += `&q=$\{encodeURIComponent(q)\}`;\
    if (calories) url += `&calories=$\{encodeURIComponent(calories)\}`;\
    if (diet) url += `&diet=$\{encodeURIComponent(diet)\}`;\
    \
    const response = await axios.get(url);\
    res.json(response.data);\
  \} catch (err) \{\
    res.status(500).json(\{ error: err.message || String(err) \});\
  \}\
\});\
\
/* ==================== SPOONACULAR ENDPOINTS ==================== */\
\
app.post('/api/spoonacular/search-recipes', async (req, res) => \{\
  try \{\
    const \{ ingredients \} = req.body;\
    if (!ingredients) return res.status(400).json(\{ error: 'ingredients required' \});\
    \
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=$\{encodeURIComponent(ingredients)\}&number=6&apiKey=$\{SPOONACULAR_KEY\}`;\
    const response = await axios.get(url);\
    res.json(response.data);\
  \} catch (err) \{\
    res.status(500).json(\{ error: err.message || String(err) \});\
  \}\
\});\
\
/* ==================== FATSECRET ENDPOINTS ==================== */\
\
app.post('/api/fatsecret/search', async (req, res) => \{\
  try \{\
    const \{ query \} = req.body;\
    if (!query) return res.status(400).json(\{ error: 'query required' \});\
    \
    const BASE = 'https://platform.fatsecret.com/rest/server.api';\
    const request_data = \{\
      url: BASE,\
      method: 'POST',\
      data: \{\
        method: 'foods.search',\
        format: 'json',\
        search_expression: query\
      \}\
    \};\
    \
    const headers = oauth.toHeader(oauth.authorize(request_data));\
    const params = new URLSearchParams();\
    params.append('method', 'foods.search');\
    params.append('search_expression', query);\
    params.append('format', 'json');\
    \
    const response = await axios.post(BASE, params.toString(), \{\
      headers: \{ ...headers, 'Content-Type': 'application/x-www-form-urlencoded' \}\
    \});\
    \
    res.json(response.data);\
  \} catch (err) \{\
    const msg = err.response && err.response.data ? JSON.stringify(err.response.data) : err.message;\
    res.status(500).json(\{ error: 'FatSecret API error: ' + msg \});\
  \}\
\});\
\
/* ==================== OPENAI VISION ENDPOINTS ==================== */\
\
app.post('/api/vision/scan', upload.single('image'), async (req, res) => \{\
  try \{\
    if (!req.file) return res.status(400).json(\{ error: 'image required' \});\
    \
    const imageBuffer = fs.readFileSync(req.file.path);\
    const base64 = imageBuffer.toString('base64');\
    \
    const response = await openai.chat.completions.create(\{\
      model: 'gpt-4o-mini',\
      messages: [\
        \{\
          role: 'user',\
          content: [\
            \{\
              type: 'image_url',\
              image_url: \{\
                url: `data:image/jpeg;base64,$\{base64\}`\
              \}\
            \},\
            \{\
              type: 'text',\
              text: 'Identify foods in this photo and estimate portions. Be specific about quantities.'\
            \}\
          ]\
        \}\
      ]\
    \});\
    \
    fs.unlinkSync(req.file.path);\
    \
    res.json(\{\
      success: true,\
      result: response.choices?.[0]?.message?.content || 'No response'\
    \});\
  \} catch (err) \{\
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);\
    res.status(500).json(\{ error: err.message || String(err) \});\
  \}\
\});\
\
/* ==================== LEGACY OPENAI VISION (from original) ==================== */\
\
app.post('/api/openai/vision', upload.single('image'), async (req, res) => \{\
  try \{\
    if (!req.file) return res.status(400).json(\{ error: 'Missing file' \});\
    \
    const imageBuffer = req.file.buffer || fs.readFileSync(req.file.path);\
    const base64 = imageBuffer.toString('base64');\
    const dataUrl = `data:$\{req.file.mimetype || 'image/jpeg'\};base64,$\{base64\}`;\
    \
    const response = await openai.chat.completions.create(\{\
      model: 'gpt-4o-mini',\
      messages: [\
        \{\
          role: 'user',\
          content: [\
            \{ type: 'image_url', image_url: \{ url: dataUrl \} \},\
            \{ type: 'text', text: 'Identify the primary food or dish in this image. Reply with a short name only.' \}\
          ]\
        \}\
      ],\
      temperature: 0.0\
    \});\
    \
    const text = (response.choices[0]?.message?.content || '').trim();\
    \
    if (req.file.path) fs.unlinkSync(req.file.path);\
    \
    res.json(\{ foodName: text \});\
  \} catch (e) \{\
    if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);\
    console.error('OpenAI vision error', e.message || e);\
    res.status(500).json(\{ error: e.message || 'Vision failed' \});\
  \}\
\});\
\
/* ==================== LEGACY NUTRITION LOOKUP (from original) ==================== */\
\
app.get('/api/nutrition/:tab', async (req, res) => \{\
  try \{\
    const tab = Number(req.params.tab);\
    const q = req.query.q;\
    if (!q) return res.status(400).json(\{ error: 'Missing q' \});\
    \
    let result;\
    \
    switch (tab) \{\
      case 2: // Edamam Food DB\
        const url2 = `https://api.edamam.com/api/food-database/v2/parser?app_id=$\{EDAMAM_FOOD_ID\}&app_key=$\{EDAMAM_FOOD_KEY\}&ingr=$\{encodeURIComponent(q)\}`;\
        const res2 = await axios.get(url2);\
        const data = res2.data || \{\};\
        const food = (data.parsed && data.parsed[0] && data.parsed[0].food) || (data.hints && data.hints[0] && data.hints[0].food);\
        if (!food) throw new Error('Food not found in Edamam Food DB');\
        const n = food.nutrients || \{\};\
        result = \{\
          calories: n.ENERC_KCAL || 0,\
          protein: n.PROCNT || 0,\
          carbs: n.CHOCDF || 0,\
          fat: n.FAT || 0,\
          micros: n\
        \};\
        break;\
        \
      case 4: // OpenFoodFacts\
        const res4 = await axios.get('https://world.openfoodfacts.org/cgi/search.pl', \{\
          params: \{ search_terms: q, search_simple: 1, action: 'process', json: 1, page_size: 1 \},\
          timeout: 8000\
        \});\
        const p = res4.data.products && res4.data.products[0];\
        if (!p) throw new Error('OpenFoodFacts: not found');\
        const n4 = p.nutriments || \{\};\
        result = \{\
          calories: n4['energy-kcal'] || n4['energy_kcal'] || 0,\
          protein: n4.proteins || 0,\
          carbs: n4.carbohydrates || 0,\
          fat: n4.fat || 0,\
          micros: n4\
        \};\
        break;\
        \
      case 5: // Spoonacular\
        const search = await axios.get('https://api.spoonacular.com/food/ingredients/search', \{\
          params: \{ query: q, number: 1, apiKey: SPOONACULAR_KEY \},\
          timeout: 10000\
        \});\
        const results = search.data.results || [];\
        if (!results.length) throw new Error('Spoonacular: ingredient not found');\
        const id = results[0].id;\
        const info = await axios.get(`https://api.spoonacular.com/food/ingredients/$\{id\}/information`, \{\
          params: \{ amount: 100, unit: 'g', apiKey: SPOONACULAR_KEY \},\
          timeout: 10000\
        \});\
        const nutr = info.data && info.data.nutrition && info.data.nutrition.nutrients;\
        const find = name => (nutr || []).find(x => x.name && x.name.toLowerCase().includes(name))?.amount || 0;\
        result = \{\
          calories: find('calories') || 0,\
          protein: find('protein') || 0,\
          carbs: find('carbohydrate') || 0,\
          fat: find('fat') || 0,\
          micros: nutr\
        \};\
        break;\
        \
      case 6: // OpenAI Estimate\
        const prompt = `Provide nutrition estimates PER 100g for "$\{q\}". Return strictly valid JSON: \{ "calories": number, "protein": number, "carbs": number, "fat": number \}`;\
        const resp = await openai.chat.completions.create(\{\
          model: 'gpt-4o-mini',\
          messages: [\{ role: 'user', content: prompt \}],\
          temperature: 0.0\
        \});\
        const out = resp.choices[0]?.message?.content || '';\
        const first = out.indexOf('\{'), last = out.lastIndexOf('\}');\
        if (first < 0 || last < 0) throw new Error('Invalid OpenAI response');\
        result = JSON.parse(out.slice(first, last + 1));\
        break;\
        \
      default:\
        return res.status(400).json(\{ error: 'Invalid provider tab (use 2,4,5,6)' \});\
    \}\
    \
    res.json(\{ foodName: q, nutrition: result \});\
  \} catch (e) \{\
    console.error(e);\
    res.status(500).json(\{ error: e.message || 'Lookup failed' \});\
  \}\
\});\
\
/* ==================== ANALYZE IMAGE (from original) ==================== */\
\
app.post('/api/analyze-image', async (req, res) => \{\
  try \{\
    const \{ image, tab, portion, unit \} = req.body;\
    if (!image || !tab) return res.status(400).json(\{ error: 'Missing image or tab' \});\
    \
    // Strip base64 prefix if present\
    const base64Only = image.includes('base64,') ? image.split('base64,')[1] : image;\
    const dataUrl = `data:image/jpeg;base64,$\{base64Only\}`;\
    \
    // Recognize food name\
    const visionResp = await openai.chat.completions.create(\{\
      model: 'gpt-4o-mini',\
      messages: [\
        \{\
          role: 'user',\
          content: [\
            \{ type: 'image_url', image_url: \{ url: dataUrl \} \},\
            \{ type: 'text', text: 'Identify the primary food or dish in this image. Reply with a short name only.' \}\
          ]\
        \}\
      ],\
      temperature: 0.0\
    \});\
    \
    const foodName = (visionResp.choices[0]?.message?.content || '').trim();\
    let nutrition = null;\
    \
    const tabNum = Number(tab);\
    \
    // Get nutrition based on provider\
    if (tabNum === 6) \{\
      // OpenAI image nutrition estimation\
      const openaiEst = await openai.chat.completions.create(\{\
        model: 'gpt-4o-mini',\
        messages: [\
          \{\
            role: 'user',\
            content: [\
              \{ type: 'image_url', image_url: \{ url: dataUrl \} \},\
              \{ type: 'text', text: 'Estimate calories, protein (g), carbs (g), fat (g) PER 100g. Return strict JSON with calories, protein, carbs, fat.' \}\
            ]\
          \}\
        ],\
        temperature: 0.0\
      \});\
      \
      const out = openaiEst.choices[0]?.message?.content || '';\
      const f = out.indexOf('\{'), l = out.lastIndexOf('\}');\
      nutrition = (f >= 0 && l >= 0) ? JSON.parse(out.slice(f, l + 1)) : \{ calories: 0, protein: 0, carbs: 0, fat: 0 \};\
    \} else \{\
      // Use the /api/nutrition/:tab endpoint logic\
      const nutritionRes = await axios.get(`http://localhost:$\{PORT\}/api/nutrition/$\{tabNum\}?q=$\{encodeURIComponent(foodName)\}`);\
      nutrition = nutritionRes.data.nutrition;\
    \}\
    \
    // Scale nutrition\
    const per100 = nutrition || \{ calories: 0, protein: 0, carbs: 0, fat: 0 \};\
    let scale = 1.0;\
    \
    if (unit === 'g' || unit === 'ml') \{\
      scale = (portion || 100) / 100.0;\
    \} else if (unit === 'portion') \{\
      scale = portion || 1;\
    \}\
    \
    const scaled = \{\
      calories: Math.round((per100.calories || 0) * scale * 10) / 10,\
      protein: Math.round((per100.protein || 0) * scale * 10) / 10,\
      carbs: Math.round((per100.carbs || 0) * scale * 10) / 10,\
      fat: Math.round((per100.fat || 0) * scale * 10) / 10\
    \};\
    \
    res.json(\{\
      foodName,\
      nutrition: scaled,\
      raw: nutrition,\
      portion: \{ value: portion, unit \}\
    \});\
  \} catch (e) \{\
    console.error(e);\
    res.status(500).json(\{ error: e.message || 'Analyze failed' \});\
  \}\
\});\
\
/* ==================== HEALTH CHECK ==================== */\
\
app.get('/api/health', (_, res) => res.json(\{ status: 'ok' \}));\
app.get('/health', (_, res) => res.json(\{ status: 'ok' \}));\
\
/* ==================== SPA FALLBACK ==================== */\
\
app.get('*', (req, res) => \{\
  res.sendFile(path.join(__dirname, 'public', 'index.html'));\
\});\
\
/* ==================== START SERVER ==================== */\
\
app.listen(PORT, () => console.log(`\uc0\u55357 \u56960  FoodLog PWA server running on port $\{PORT\}`));}
