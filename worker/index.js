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
    if (url.pathname === "/create-site" && request.method === "POST") {
      return handleCreateSite(request, env);
    }
    return new Response("Xroga AI Worker is running", { status: 200 });
  },
};

async function handleCreateSite(request, env) {
  try {
    const { prompt, domainAction, domainName } = await request.json();

    // 1. Generate code from Gemini
    const generatedCode = await generateWithGemini(prompt, env.GEMINI_API_KEY);

    // 2. Deploy to Railway (mock)
    const railwayUrl = await deployToRailway(generatedCode, env.RAILWAY_API_TOKEN);

    // 3. Handle domain (mock)
    let finalUrl = railwayUrl;
    if (domainAction === "connect" && domainName) {
      finalUrl = await connectDomain(domainName, railwayUrl, env.SPACESHIP_API_KEY);
    } else if (domainAction === "buy" && domainName) {
      finalUrl = await buyDomain(domainName, railwayUrl, env.SPACESHIP_API_KEY);
    }

    // Return with CORS headers
    return new Response(JSON.stringify({ success: true, url: finalUrl }), {
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
 * Generate website HTML using Google Gemini API.
 * Uses gemini-1.5-flash model.
 */
async function generateWithGemini(prompt, apiKey) {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const systemInstruction = `You are an expert web developer. Generate a complete, self-contained HTML/CSS/JS website based on the user's description. The website should be responsive, modern, and visually appealing. Return only the code inside a single HTML file, no extra explanation.`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: systemInstruction },
          { text: `User request: ${prompt}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4000,
      topP: 0.95,
      topK: 40,
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
  let code = data.candidates[0].content.parts[0].text;
  // Remove markdown code fences if present
  code = code.replace(/```html/g, "").replace(/```/g, "").trim();
  return code;
}

/**
 * Mock deployment to Railway.
 * Replace with actual Railway API calls when ready.
 */
async function deployToRailway(htmlCode, railwayToken) {
  console.log("Deploying to Railway (mock)");
  // Simulate a unique project ID
  const projectId = `mock-project-${Date.now()}`;
  // In reality, you would upload the HTML code and get a real URL.
  return `https://${projectId}.up.railway.app`;
}

/**
 * Mock connecting an existing domain via Spaceship.
 * Replace with actual Spaceship API calls when ready.
 */
async function connectDomain(domain, railwayUrl, spaceshipKey) {
  console.log(`Connecting ${domain} -> ${railwayUrl} (mock)`);
  // In reality, you would update DNS records to point to Railway.
  return `https://${domain}`;
}

/**
 * Mock buying a new domain via Spaceship.
 * Replace with actual Spaceship API calls when ready.
 */
async function buyDomain(domain, railwayUrl, spaceshipKey) {
  console.log(`Buying ${domain} and pointing to ${railwayUrl} (mock)`);
  // In reality, you would purchase the domain and set DNS.
  return `https://${domain}`;
}
