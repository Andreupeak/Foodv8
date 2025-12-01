import React, { useState, useEffect, useRef } from 'https://cdn.skypack.dev/react@18.2.0';
import ReactDOM from 'https://cdn.skypack.dev/react-dom@18.2.0';

// ============= UTILITY FUNCTIONS =============
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getStoredLogs = () => {
  const logs = localStorage.getItem('foodLogs');
  return logs ? JSON.parse(logs) : {};
};

const saveFoodLog = (foodItem) => {
  const logs = getStoredLogs();
  const dateKey = getCurrentDate();
  
  if (!logs[dateKey]) {
    logs[dateKey] = [];
  }
  
  logs[dateKey].push({
    id: Date.now(),
    ...foodItem,
    timestamp: new Date().toISOString()
  });
  
  localStorage.setItem('foodLogs', JSON.stringify(logs));
};

const deleteFoodLog = (date, logId) => {
  const logs = getStoredLogs();
  if (logs[date]) {
    logs[date] = logs[date].filter(item => item.id !== logId);
    localStorage.setItem('foodLogs', JSON.stringify(logs));
  }
};

const getTodayStats = () => {
  const logs = getStoredLogs();
  const today = getCurrentDate();
  const todayLogs = logs[today] || [];
  
  return todayLogs.reduce((acc, item) => ({
    calories: acc.calories + (item.calories || 0),
    protein: acc.protein + (item.protein || 0),
    carbs: acc.carbs + (item.carbs || 0),
    fat: acc.fat + (item.fat || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
};

// ============= DASHBOARD COMPONENT =============
const Dashboard = ({ onAddFood }) => {
  const [stats, setStats] = useState(getTodayStats());
  const [logs, setLogs] = useState([]);
  const [goals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65
  });

  useEffect(() => {
    const allLogs = getStoredLogs();
    const today = getCurrentDate();
    setLogs(allLogs[today] || []);
    setStats(getTodayStats());
    
    // Refresh every minute
    const interval = setInterval(() => {
      setStats(getTodayStats());
      setLogs(getStoredLogs()[today] || []);
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleDelete = (logId) => {
    deleteFoodLog(getCurrentDate(), logId);
    setLogs(getStoredLogs()[getCurrentDate()] || []);
    setStats(getTodayStats());
  };

  const CircularProgress = ({ value, max, label, color }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const circumference = 2 * Math.PI * 36;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24">
          <svg className="transform -rotate-90 w-24 h-24">
            <circle
              cx="48"
              cy="48"
              r="36"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="48"
              cy="48"
              r="36"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={color}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold">{Math.round(value)}</span>
            <span className="text-xs text-gray-500">of {max}</span>
          </div>
        </div>
        <span className="text-sm font-medium mt-2 text-gray-700">{label}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar content-safe-area">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Today's Summary</h1>
        <p className="text-green-100 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Main Calorie Ring */}
      <div className="bg-white p-6 -mt-4 rounded-t-3xl shadow-lg">
        <div className="flex justify-center mb-6">
          <CircularProgress 
            value={stats.calories} 
            max={goals.calories} 
            label="Calories" 
            color="text-green-500"
          />
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <div className="text-2xl font-bold text-blue-600">{Math.round(stats.protein)}g</div>
            <div className="text-xs text-gray-600 mt-1">Protein</div>
            <div className="text-xs text-gray-400">{goals.protein}g goal</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-xl">
            <div className="text-2xl font-bold text-yellow-600">{Math.round(stats.carbs)}g</div>
            <div className="text-xs text-gray-600 mt-1">Carbs</div>
            <div className="text-xs text-gray-400">{goals.carbs}g goal</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-xl">
            <div className="text-2xl font-bold text-red-600">{Math.round(stats.fat)}g</div>
            <div className="text-xs text-gray-600 mt-1">Fat</div>
            <div className="text-xs text-gray-400">{goals.fat}g goal</div>
          </div>
        </div>

        {/* Quick Add Button */}
        <button 
          onClick={onAddFood}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-semibold shadow-lg flex items-center justify-center space-x-2 mb-6"
        >
          <i className="fa-solid fa-plus"></i>
          <span>Log Food</span>
        </button>

        {/* Recent Meals */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3">Today's Meals</h3>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <i className="fa-solid fa-utensils text-4xl mb-2"></i>
              <p>No meals logged yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{log.name}</h4>
                    <p className="text-xs text-gray-500">{log.serving || '1 serving'}</p>
                  </div>
                  <div className="text-right mr-2">
                    <div className="font-bold text-green-600">{Math.round(log.calories)} cal</div>
                    <div className="text-xs text-gray-500">
                      P: {Math.round(log.protein)}g C: {Math.round(log.carbs)}g F: {Math.round(log.fat)}g
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(log.id)}
                    className="text-red-400 hover:text-red-600 p-2"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { Dashboard, saveFoodLog, API_BASE_URL };

// ============= SEARCH COMPONENT =============
const Search = ({ onFoodSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [servingSize, setServingSize] = useState(100);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length > 2) fetchFood();
    }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchFood = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1&page_size=15`);
      const data = await res.json();
      setResults(data.products || []);
    } catch (err) {
      console.error("Error fetching food", err);
    }
    setLoading(false);
  };

  const handleAddFood = () => {
    if (!details) return;
    
    const multiplier = servingSize / 100;
    const foodItem = {
      name: details.product_name || 'Unknown Food',
      serving: `${servingSize}g`,
      calories: (details.nutriments?.['energy-kcal_100g'] || 0) * multiplier,
      protein: (details.nutriments?.proteins_100g || 0) * multiplier,
      carbs: (details.nutriments?.carbohydrates_100g || 0) * multiplier,
      fat: (details.nutriments?.fat_100g || 0) * multiplier
    };
    
    saveFoodLog(foodItem);
    setDetails(null);
    setServingSize(100);
    alert('Food logged successfully!');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-gray-50 z-10 sticky top-0">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-2">Food Search</h2>
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-3.5 text-gray-400"></i>
          <input 
            type="text" 
            className="w-full pl-10 pr-4 py-3 rounded-xl border-none shadow-sm bg-white focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="Search for food..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setDetails(null); }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 content-safe-area">
        {loading && <div className="text-center text-gray-500 mt-4"><i className="fa-solid fa-spinner fa-spin"></i> Searching...</div>}
        
        {!details ? (
          <div className="space-y-3 pb-20">
            {results.map(item => (
              <div 
                key={item._id} 
                onClick={() => setDetails(item)} 
                className="bg-white p-3 rounded-xl shadow-sm flex items-center space-x-3 active:scale-95 transition-transform cursor-pointer"
              >
                <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image_front_small_url ? (
                    <img src={item.image_front_small_url} alt={item.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <i className="fa-solid fa-utensils text-xl"></i>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">{item.product_name || "Unknown"}</h3>
                  <p className="text-xs text-gray-500 truncate">{item.brands || "No Brand"}</p>
                </div>
                <div className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full whitespace-nowrap">
                  {Math.round(item.nutriments?.['energy-kcal_100g'] || 0)} cal
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden pb-4 mb-20">
            <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
              {details.image_front_url && <img src={details.image_front_url} className="w-full h-full object-contain" />}
              <button 
                onClick={() => setDetails(null)} 
                className="absolute top-3 left-3 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white"
              >
                <i className="fa-solid fa-arrow-left"></i>
              </button>
            </div>
            <div className="p-4">
              <h2 className="text-xl font-bold mb-1">{details.product_name}</h2>
              <p className="text-gray-500 text-sm mb-4">{details.brands}</p>
              
              {/* Serving Size Selector */}
              <div className="bg-gray-50 p-4 rounded-xl mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Serving Size (grams)</label>
                <input 
                  type="number" 
                  value={servingSize}
                  onChange={(e) => setServingSize(Number(e.target.value))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  min="1"
                />
              </div>

              <h3 className="font-semibold mb-3 text-gray-700">Nutrition Info ({servingSize}g)</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-orange-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round((details.nutriments['energy-kcal_100g'] || 0) * servingSize / 100)}
                  </div>
                  <div className="text-xs text-gray-600">Calories</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {((details.nutriments.proteins_100g || 0) * servingSize / 100).toFixed(1)}g
                  </div>
                  <div className="text-xs text-gray-600">Protein</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {((details.nutriments.carbohydrates_100g || 0) * servingSize / 100).toFixed(1)}g
                  </div>
                  <div className="text-xs text-gray-600">Carbs</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {((details.nutriments.fat_100g || 0) * servingSize / 100).toFixed(1)}g
                  </div>
                  <div className="text-xs text-gray-600">Fat</div>
                </div>
              </div>

              <button 
                onClick={handleAddFood}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-semibold shadow-lg"
              >
                <i className="fa-solid fa-plus mr-2"></i>
                Add to Log
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============= SCANNER COMPONENT =============
const Scanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [product, setProduct] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [servingSize, setServingSize] = useState(100);

  useEffect(() => {
    let html5QrcodeScanner;
    if (isScanning && !scanResult) {
      html5QrcodeScanner = new Html5Qrcode("reader");
      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0 
      };
      html5QrcodeScanner.start(
        { facingMode: "environment" }, 
        config, 
        onScanSuccess
      ).catch(err => console.log("Camera error", err));
    }
    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => html5QrcodeScanner.clear());
      }
    };
  }, [isScanning]);

  const onScanSuccess = (decodedText) => {
    setScanResult(decodedText);
    setIsScanning(false);
    fetchProduct(decodedText);
  };

  const fetchProduct = async (barcode) => {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      if (data.status === 1) setProduct(data.product);
      else alert("Product not found in database.");
    } catch (e) {
      console.error(e);
      alert("Error fetching product");
    }
  };

  const handleAddProduct = () => {
    if (!product) return;
    
    const multiplier = servingSize / 100;
    const foodItem = {
      name: product.product_name || 'Unknown Product',
      serving: `${servingSize}g`,
      calories: (product.nutriments?.['energy-kcal_100g'] || 0) * multiplier,
      protein: (product.nutriments?.proteins_100g || 0) * multiplier,
      carbs: (product.nutriments?.carbohydrates_100g || 0) * multiplier,
      fat: (product.nutriments?.fat_100g || 0) * multiplier
    };
    
    saveFoodLog(foodItem);
    setScanResult(null);
    setProduct(null);
    setServingSize(100);
    alert('Product logged successfully!');
  };

  return (
    <div className="p-4 h-full flex flex-col content-safe-area">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-2">Barcode Scanner</h2>
      
      {!scanResult && !isScanning && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-8">
            <i className="fa-solid fa-barcode text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-600">Scan product barcode to get nutrition info</p>
          </div>
          <button 
            onClick={() => setIsScanning(true)} 
            className="bg-green-500 hover:bg-green-600 text-white rounded-full w-32 h-32 flex flex-col items-center justify-center shadow-lg transform transition active:scale-95"
          >
            <i className="fa-solid fa-camera text-3xl mb-2"></i>
            <span className="font-semibold">Start Scan</span>
          </button>
        </div>
      )}

      {isScanning && (
        <div className="flex-1 overflow-hidden rounded-xl bg-black relative">
          <div id="reader" className="w-full h-full"></div>
          <button 
            onClick={() => setIsScanning(false)} 
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full shadow-lg font-semibold"
          >
            <i className="fa-solid fa-stop mr-2"></i>
            Stop Scanning
          </button>
        </div>
      )}

      {product && (
        <div className="mt-4 bg-white p-4 rounded-xl shadow-lg">
          <div className="flex items-center space-x-4 mb-4">
            {product.image_front_small_url && (
              <img src={product.image_front_small_url} className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
            )}
            <div className="flex-1">
              <h3 className="font-bold text-lg">{product.product_name}</h3>
              <p className="text-sm text-gray-500">{product.brands}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Serving Size (grams)</label>
            <input 
              type="number" 
              value={servingSize}
              onChange={(e) => setServingSize(Number(e.target.value))}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              min="1"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
            <div className="bg-orange-50 p-2 rounded text-center">
              <div className="font-bold text-orange-600">
                {Math.round((product.nutriments?.['energy-kcal_100g'] || 0) * servingSize / 100)}
              </div>
              <div className="text-xs text-gray-600">Calories</div>
            </div>
            <div className="bg-blue-50 p-2 rounded text-center">
              <div className="font-bold text-blue-600">
                {((product.nutriments?.proteins_100g || 0) * servingSize / 100).toFixed(1)}g
              </div>
              <div className="text-xs text-gray-600">Protein</div>
            </div>
            <div className="bg-yellow-50 p-2 rounded text-center">
              <div className="font-bold text-yellow-600">
                {((product.nutriments?.carbohydrates_100g || 0) * servingSize / 100).toFixed(1)}g
              </div>
              <div className="text-xs text-gray-600">Carbs</div>
            </div>
            <div className="bg-red-50 p-2 rounded text-center">
              <div className="font-bold text-red-600">
                {((product.nutriments?.fat_100g || 0) * servingSize / 100).toFixed(1)}g
              </div>
              <div className="text-xs text-gray-600">Fat</div>
            </div>
          </div>

          <div className="flex space-x-2">
            <button 
              onClick={handleAddProduct}
              className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              Add to Log
            </button>
            <button 
              onClick={() => { setScanResult(null); setProduct(null); }} 
              className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
            >
              <i className="fa-solid fa-redo"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export { Search, Scanner };

// ============= AI VISION COMPONENT =============
const AI_Vision = () => {
  const [image, setImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    setLoading(true);
    try {
      // Call backend API which will handle OpenAI request
      const response = await fetch(`${API_BASE_URL}/analyze-food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image })
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        alert(data.error || 'Error analyzing image');
      }
    } catch (error) {
      console.error(error);
      alert('Error analyzing image. Make sure the backend server is running.');
    }
    setLoading(false);
  };

  const handleAddFood = () => {
    if (!analysis) return;
    
    const foodItem = {
      name: analysis.food_name,
      serving: analysis.portion_estimation,
      calories: analysis.estimated_calories * servingMultiplier,
      protein: analysis.protein * servingMultiplier,
      carbs: analysis.carbs * servingMultiplier,
      fat: analysis.fat * servingMultiplier
    };
    
    saveFoodLog(foodItem);
    setImage(null);
    setAnalysis(null);
    setServingMultiplier(1);
    alert('Food logged successfully!');
  };

  return (
    <div className="p-4 h-full overflow-y-auto content-safe-area">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-2">AI Food Recognition</h2>

      {!image ? (
        <div className="space-y-4">
          <div 
            onClick={() => fileInputRef.current.click()} 
            className="border-2 border-dashed border-gray-300 rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition bg-white"
          >
            <i className="fa-solid fa-camera text-5xl text-gray-400 mb-3"></i>
            <p className="text-gray-600 font-medium">Take or Upload Photo</p>
            <p className="text-gray-400 text-sm mt-1">AI will identify the food</p>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              capture="environment"
              className="hidden" 
              onChange={handleImageUpload} 
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <i className="fa-solid fa-lightbulb text-blue-500 text-xl mt-1"></i>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">How it works</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Take a photo of your meal</li>
                  <li>• AI identifies the food items</li>
                  <li>• Get instant nutrition estimates</li>
                  <li>• Adjust portions and log it</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative h-64 rounded-xl overflow-hidden bg-black shadow-lg">
            <img src={image} className="w-full h-full object-contain" alt="Food" />
            <button 
              onClick={() => { setImage(null); setAnalysis(null); }} 
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white w-10 h-10 rounded-full flex items-center justify-center"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>

          {!analysis && (
            <button 
              onClick={analyzeImage} 
              disabled={loading} 
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
              }`}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
                  Analyze Nutrition
                </>
              )}
            </button>
          )}
        </div>
      )}

      {analysis && (
        <div className="mt-6 space-y-4">
          <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-800 capitalize">{analysis.food_name}</h3>
                <p className="text-gray-500 text-sm mt-1">
                  <i className="fa-solid fa-scale-balanced mr-1"></i>
                  {analysis.portion_estimation}
                </p>
              </div>
              <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                AI Detected
              </div>
            </div>

            {/* Serving Multiplier */}
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adjust Portion
              </label>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setServingMultiplier(Math.max(0.25, servingMultiplier - 0.25))}
                  className="bg-white border border-gray-300 rounded-lg px-4 py-2 font-bold hover:bg-gray-50"
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold text-purple-600">{servingMultiplier}x</span>
                </div>
                <button 
                  onClick={() => setServingMultiplier(servingMultiplier + 0.25)}
                  className="bg-white border border-gray-300 rounded-lg px-4 py-2 font-bold hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Nutrition Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <span className="text-gray-600 text-xs block mb-1">CALORIES</span>
                <span className="text-2xl font-bold text-orange-600">
                  {Math.round(analysis.estimated_calories * servingMultiplier)}
                </span>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <span className="text-gray-600 text-xs block mb-1">PROTEIN</span>
                <span className="text-2xl font-bold text-blue-600">
                  {Math.round(analysis.protein * servingMultiplier)}g
                </span>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                <span className="text-gray-600 text-xs block mb-1">CARBS</span>
                <span className="text-2xl font-bold text-yellow-600">
                  {Math.round(analysis.carbs * servingMultiplier)}g
                </span>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                <span className="text-gray-600 text-xs block mb-1">FAT</span>
                <span className="text-2xl font-bold text-red-600">
                  {Math.round(analysis.fat * servingMultiplier)}g
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button 
                onClick={handleAddFood}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-xl font-semibold shadow-lg"
              >
                <i className="fa-solid fa-plus mr-2"></i>
                Add to Log
              </button>
              <button 
                onClick={() => { setImage(null); setAnalysis(null); setServingMultiplier(1); }}
                className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl"
              >
                <i className="fa-solid fa-redo"></i>
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
            <i className="fa-solid fa-info-circle mr-1"></i>
            AI estimates may vary. Adjust portions for accuracy.
          </div>
        </div>
      )}
    </div>
  );
};

export { AI_Vision };

// ============= SETTINGS COMPONENT =============
const Settings = () => {
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('nutritionGoals');
    return saved ? JSON.parse(saved) : {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 65
    };
  });

  const handleGoalChange = (field, value) => {
    const newGoals = { ...goals, [field]: Number(value) };
    setGoals(newGoals);
    localStorage.setItem('nutritionGoals', JSON.stringify(newGoals));
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all logged food? This cannot be undone.')) {
      localStorage.removeItem('foodLogs');
      alert('All data cleared!');
      window.location.reload();
    }
  };

  return (
    <div className="p-4 space-y-4 content-safe-area overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-2">Settings</h2>

      {/* Daily Goals */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <i className="fa-solid fa-bullseye text-green-500 mr-2"></i>
          Daily Goals
        </h3>
        
        <div className="space-y-4">
          {[
            { label: "Calories", field: "calories", icon: "fire", color: "orange" },
            { label: "Protein (g)", field: "protein", icon: "drumstick-bite", color: "blue" },
            { label: "Carbs (g)", field: "carbs", icon: "bread-slice", color: "yellow" },
            { label: "Fat (g)", field: "fat", icon: "cheese", color: "red" }
          ].map(({ label, field, icon, color }) => (
            <div key={field}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className={`fa-solid fa-${icon} text-${color}-500 mr-2`}></i>
                {label}
              </label>
              <input
                type="number"
                value={goals[field]}
                onChange={(e) => handleGoalChange(field, e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                min="0"
              />
            </div>
          ))}
        </div>
      </div>

      {/* App Info */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <i className="fa-solid fa-info-circle text-blue-500 mr-2"></i>
          About
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Data Storage:</strong> Local (on your device)</p>
          <p className="pt-2 border-t">
            <i className="fa-solid fa-shield-halved text-green-500 mr-1"></i>
            Your data is stored locally and never leaves your device (except when using AI features).
          </p>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <i className="fa-solid fa-database text-purple-500 mr-2"></i>
          Data Management
        </h3>
        <button 
          onClick={clearAllData}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold"
        >
          <i className="fa-solid fa-trash mr-2"></i>
          Clear All Data
        </button>
      </div>

      {/* API Info */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
        <h3 className="text-sm font-bold text-gray-800 mb-2">
          <i className="fa-solid fa-server mr-1"></i>
          Backend Setup Required
        </h3>
        <p className="text-xs text-gray-600 mb-2">
          For AI food recognition to work, make sure your backend server is running with your OpenAI API key configured.
        </p>
        <p className="text-xs text-gray-500">
          Check the README.md for setup instructions.
        </p>
      </div>
    </div>
  );
};

// ============= MAIN APP COMPONENT =============
const App = () => {
  const [activeTab, setActiveTab] = useState('home');

  const NavBtn = ({ icon, label, active, onClick, highlight }) => (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center justify-center w-16 space-y-1 transition-all ${
        active ? 'text-green-600 scale-110' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <i className={`fa-solid ${icon} text-xl ${highlight && !active ? 'animate-pulse' : ''}`}></i>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && <Dashboard onAddFood={() => setActiveTab('search')} />}
        {activeTab === 'search' && <Search />}
        {activeTab === 'scanner' && <Scanner />}
        {activeTab === 'camera' && <AI_Vision />}
        {activeTab === 'settings' && <Settings />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 nav-safe-bottom z-50 shadow-lg">
        <div className="flex justify-around items-center h-16 px-2">
          <NavBtn 
            icon="fa-house" 
            label="Home" 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
          />
          <NavBtn 
            icon="fa-magnifying-glass" 
            label="Search" 
            active={activeTab === 'search'} 
            onClick={() => setActiveTab('search')} 
          />
          
          {/* Center AI Camera Button */}
          <div className="relative -top-6">
            <button 
              onClick={() => setActiveTab('camera')} 
              className={`w-16 h-16 rounded-full shadow-xl flex items-center justify-center text-white text-2xl transition-all ${
                activeTab === 'camera' 
                  ? 'bg-gradient-to-br from-purple-700 to-purple-900 scale-110' 
                  : 'bg-gradient-to-br from-purple-600 to-purple-800 hover:scale-105'
              }`}
            >
              <i className="fa-solid fa-camera"></i>
            </button>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <i className="fa-solid fa-sparkles text-white text-xs"></i>
            </div>
          </div>
          
          <NavBtn 
            icon="fa-barcode" 
            label="Scan" 
            active={activeTab === 'scanner'} 
            onClick={() => setActiveTab('scanner')} 
          />
          <NavBtn 
            icon="fa-gear" 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </div>
      </nav>
    </div>
  );
};

// Render App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
