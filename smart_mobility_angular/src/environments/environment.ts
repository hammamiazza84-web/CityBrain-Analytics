export const environment = {
  production: false,
  apiUrl: 'http://localhost:5001/api',
  weatherApiUrl: 'http://localhost:5002/api',
  mlflowDefaultUrl: 'http://localhost:5003',
  auth: {
    googleDeciderEmails: [
      'manager@smartmobility.ai',
      'urban@smartmobility.ai',
      'env@smartmobility.ai'
    ]
  },

  // 🗺️ Google Maps Configuration
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY',

  // 🚗 TomTom Traffic API Configuration
  tomtomApiKey: 'YOUR_TOMTOM_API_KEY',

  // 🤖 Groq AI Configuration (assistant IA via FastAPI port 5004)
  openai: {
    apiKey: 'YOUR_OPENAI_API_KEY',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    maxTokens: 500,
    enabled: true
  }
};
