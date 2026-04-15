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

    // Set a manual timeout (e.g., 30 seconds) so the request doesn't hang forever
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Gemini Timeout")), 30000)
      )
    ]);

    const response = await result.response;
    const text = response.text();

    res.status(200).json({ message: text });

  } catch (error) {
    console.error("Gemini API Error:", error);

    // 1. Check for specific Gemini/Google API errors (Rate limiting)
    if (error.message?.includes("429") || error.status === 429) {
      return res.status(429).json({ 
        message: "Ally is currently experiencing high traffic. Please try again in a moment." 
      });
    }

    // 2. Check for timeouts or general service unavailability
    if (error.message === "Gemini Timeout" || error.status === 503) {
      return res.status(503).json({ 
        message: "Gemini is overloaded right now. This is a technical issue on their end, not the chatbot's." 
      });
    }

    // 3. Fallback for any other error
    res.status(500).json({ 
      message: "I'm having trouble connecting to my brain right now. Please try again." 
    });
  }
};