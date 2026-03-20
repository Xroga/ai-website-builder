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
    if (!message) throw new Error("No message provided");

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

async function generateWithGemini(message, apiKey) {
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  // List of Gemini models (only Gemini)
  const models = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-3.1-pro-preview",
  ];

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
    },
  };

  let lastError = null;
  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
      }

      const errorText = await response.text();
      lastError = `Model ${model} failed: ${response.status} - ${errorText}`;
      console.warn(lastError);
    } catch (err) {
      lastError = `Model ${model} request failed: ${err.message}`;
      console.warn(lastError);
    }
  }

  throw new Error(`All models failed. Last error: ${lastError}`);
}
