/**
 * AI Insight Service
 * Integration with Gemini API for financial analysis.
 */

const API_KEY = "AIzaSyDaGfTN7UZQ6Wo5AwVzVvI4wfn65E77zBI"; // To be provided by user
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

export const getFinancialInsights = async (transactions) => {

  if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY") {
    return "Please provide a valid Gemini API key in `src/ai/gemini.js` to enable AI insights.";
  }

  // Prepare transaction data for AI
  const summary = transactions.map(t => ({
    type: t.type,
    amount: t.amount,
    category: t.category,
    date: t.date,
    note: t.note
  }));

  const prompt = `
    Analyze these financial transactions (currency is BDT ৳) and provide 3-4 concise, actionable insights in bullet points.
    IMPORTANT: Provide the response entirely in Bengali (Bangla).
    Focus on spending habits, budget suggestions, and savings opportunities.
    Transactions: ${JSON.stringify(summary)}
  `;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error Response:", data);
      throw new Error(data.error?.message || "Failed to fetch insights from Gemini.");
    }

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error("Invalid response format from Gemini API.");
    }
  } catch (error) {
    console.error("AI Insight Error:", error);
    return `AI Insight Error: ${error.message}`;
  }
};

export const chatWithAdvisor = async (history, message, transactions) => {
  if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY") return "API Key missing.";

  const context = `
    You are an expert personal finance advisor. 
    The user's current transactions (in BDT ৳) are: ${JSON.stringify(transactions.slice(0, 50))}.
    Answer the user's questions concisely in Bengali (Bangla). 
    Help them understand their spending and provide tips.
  `;

  const chatHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          ...chatHistory,
          { role: 'user', parts: [{ text: `${context}\n\nUser Question: ${message}` }] }
        ]
      })
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Chat Error:", error);
    return "দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না।";
  }
};

export const suggestCategory = async (note) => {
  if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY" || !note) return null;

  const prompt = `Based on this transaction note: "${note}", suggest the best category from this list: Food, Shopping, Bills, Medical, Education, Entertainment, Transport, Investment. Return ONLY the category name.`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const suggestion = data.candidates[0].content.parts[0].text.trim();
    return suggestion;
  } catch (error) {
    return null;
  }
};

export const parseTransactionText = async (text) => {
  if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY" || !text) return null;

  const prompt = `
    Analyze this text and extract financial transaction details: "${text}".
    Return a JSON object with:
    - amount (number)
    - type ('income' or 'expense')
    - category (one of: Food, Shopping, Bills, Medical, Education, Entertainment, Transport, Investment)
    - note (short description)
    - date (YYYY-MM-DD, use today's date ${new Date().toISOString().split('T')[0]} if not mentioned)
    
    Return ONLY the raw JSON object. No markdown, no extra text.
  `;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    // Clean JSON from potential markdown blocks
    const cleanJson = rawText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Parse Error:", error);
    return null;
  }
};
