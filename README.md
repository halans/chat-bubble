# Chat Bubble Widget

A modern, floating chat widget that can be easily embedded into any website. It uses a Cloudflare Worker backend to communicate with the OpenAI API, ensuring your API keys remain secure.

## Features

- **Floating Bubble**: Unobtrusive chat launcher.
- **Modern UI**: Clean design with animations and responsive layout.
- **Secure Backend**: server-side processing with Cloudflare Workers.
- **Easy Integration**: Single JS file includes logic and auto-injects styles.

## Prerequisites

- [Node.js](https://nodejs.org/)
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- An [OpenAI API Key](https://platform.openai.com/)

## Setup

1.  **Clone the repository**:
- **Easy Integration**: Single JS file drop-in.
- **Smart Interface**: Floating bubble that expands into a chat window.
- **Customizable Themes**: Configure primary and accent colors to match your brand.
- **Markdown Support**: Bot responses are rendered with Markdown (code blocks, lists, headers).
- **Chat Memory**: Conversations are automatically saved to the browser's `localStorage`, allowing users to close the page and return to their session later without losing context.
- **Smart Error Handling**: Displays clear, specific error messages from the server (e.g., config errors, timeouts) directly in the chat interface.
- **Resilient Backend**: Includes a 25-second timeout protection to prevent hanging request and ensure graceful failure handling.
- **Context Awareness**: Sends recent conversation history to the AI for improved context.
- **Expandable UI**: Toggle between a standard chat window and an immersive almost-full-screen mode.
- **Control**: Clear history button and configurable header.

## Configuration
Configure the widget using `wrangler.toml` or `.dev.vars` (for local development).

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | **Required**. Your OpenAI API Key. | - |
| `OPENAI_MODEL` | The AI model to use (e.g., `gpt-3.5-turbo`, `gpt-4`). | `gpt-3.5-turbo` |
| `SYSTEM_PROMPT` | Instructions for the AI's behavior. | "You are a helpful assistant." |
| `THEME_COLOR` | Primary color for bubble and header. | `#43C76A` |
| `THEME_ACCENT_COLOR` | Accent color for icons and highlights. | `#F72C25` |
| `SHOW_HEADER` | Show or hide the "Assistant" header bar. | `true` |
| `EXPLANATION_TEXT` | Custom text displayed in the explanation box. | (You are a helpful assistant.) |
| `FRONTEND_CENTERED`| Force the widget to open in centered mode by default. | `false` |
| `FRONTEND_DEBUG_MODE` | Enable verbose console logging in the browser. | `false` |

## Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Create a `.dev.vars` file in the root directory:
   ```env
   OPENAI_API_KEY=your_api_key_here
   OPENAI_MODEL=gpt-4o
   THEME_COLOR=#4F46E5
   THEME_ACCENT_COLOR=#EF4444
   SHOW_HEADER=true
   ```

3. **Start Local Server**
   ```bash
   npm start
   ```
   The widget will be available at `http://localhost:8787`.

4. **Deploy**
   ```bash
   npm run deploy
   ```

## Usage
Add the following to your HTML file:
```html
<script src="https://your-worker-url.workers.dev/widget.js"></script>
```

**Note**: In the current setup, `widget.js` assumes `styles.css` is in the same directory. Ensure both files are deployed to the `public` bucket or adjust the CSS injection logic in `widget.js` to point to the absolute URL of your CSS file.
