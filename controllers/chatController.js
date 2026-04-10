const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initializing the model with System Instructions
const model = genAI.getGenerativeModel({ 
  model: "gemini-3.1-flash-lite-preview", // Recommended stable model, or use your preview model
  systemInstruction: "Your name is Ally. You are a helpful career assistant for the 'Student Ally' platform. Your goal is to guide students in their career paths, help with resume tips, job search strategies, and provide information about platform resources like alumni networking and events. Be encouraging, professional, and student-focused.",
});

exports.getGeminiResponse = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    // The systemInstruction is already baked into the 'model' object above
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ message: text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
};