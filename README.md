# AI Website Builder

Generate a complete website from a natural language prompt using AI, deploy it to Railway, and manage domains via Spaceship.

## Features

- 🎨 Glassmorphism UI with Tailwind CSS and Lucide icons
- 🤖 DeepSeek AI to generate HTML/CSS/JS code
- 🚀 Automatic deployment to Railway (mock for now)
- 🌐 Domain management with Spaceship API (mock for now)
- ☁️ Serverless backend on Cloudflare Workers
- 📄 Frontend hosted on Cloudflare Pages
- 🔄 CI/CD with GitHub Actions

## Setup

1. Clone the repository.
2. Add your API keys as secrets in Cloudflare Workers (DeepSeek, Railway, Spaceship).
3. Deploy frontend and worker manually or let GitHub Actions do it.

## Usage

1. Visit the frontend URL.
2. Describe your website.
3. Click "Create Website".
4. Receive a live URL.

## License

MIT
