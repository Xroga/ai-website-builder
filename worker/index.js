// worker/index.js
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const url = new URL(request.url);
    if (url.pathname === "/ask" && request.method === "POST") {
      return handleAsk(request, env);
    }

    return new Response("Xroga AI Assistant Worker is running", { status: 200 });
  },
};

async function handleAsk(request, env) {
  try {
    const { message } = await request.json();
    if (!message) {
      throw new Error("No message provided");
    }

    const reply = await generateWithGemini(message, env.GEMINI_API_KEY);

    return new Response(JSON.stringify({ success: true, reply }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}

/**
 * Call Gemini API with a user message and return the text response.
 * Uses stable model "gemini-pro" to avoid 404 errors.
 */
async function generateWithGemini(message, apiKey) {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const systemInstruction = `You are a helpful, friendly AI assistant. Answer the user's question in a concise but thorough manner.`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: systemInstruction },
          { text: `User: ${message}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
      topP: 0.95,
    },
  };

  // Use the stable model "gemini-pro"
  const model = "gemini-pro";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  // The response structure: data.candidates[0].content.parts[0].text
  const reply = data.candidates[0].content.parts[0].text;
  return reply;
}
