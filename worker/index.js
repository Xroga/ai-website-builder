// worker/index.js
export default {
  async fetch(request, env, ctx) {
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

    // 1. Generate code from DeepSeek
    const generatedCode = await generateWithDeepSeek(prompt, env.DEEPSEEK_API_KEY);

    // 2. Deploy to Railway (mock for now)
    const railwayUrl = await deployToRailway(generatedCode, env.RAILWAY_API_TOKEN);

    // 3. Handle domain (mock)
    let finalUrl = railwayUrl;
    if (domainAction === "connect" && domainName) {
      finalUrl = await connectDomain(domainName, railwayUrl, env.SPACESHIP_API_KEY);
    } else if (domainAction === "buy" && domainName) {
      finalUrl = await buyDomain(domainName, railwayUrl, env.SPACESHIP_API_KEY);
    }

    return new Response(JSON.stringify({ success: true, url: finalUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function generateWithDeepSeek(prompt, apiKey) {
  const systemPrompt = `You are an expert web developer. Generate a complete, self-contained HTML/CSS/JS website based on the user's description. The website should be responsive, modern, and visually appealing. Return only the code inside a single HTML file, no extra explanation.`;

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  let code = data.choices[0].message.content;
  code = code.replace(/```html/g, "").replace(/```/g, "").trim();
  return code;
}

async function deployToRailway(htmlCode, railwayToken) {
  // Mock implementation – replace with real Railway API calls later
  console.log("Deploying to Railway (mock)");
  const projectId = `mock-project-${Date.now()}`;
  return `https://${projectId}.up.railway.app`;
}

async function connectDomain(domain, railwayUrl, spaceshipKey) {
  console.log(`Connecting ${domain} -> ${railwayUrl} (mock)`);
  return `https://${domain}`;
}

async function buyDomain(domain, railwayUrl, spaceshipKey) {
  console.log(`Buying ${domain} (mock)`);
  return `https://${domain}`;
}
