export default {
    async fetch(request, env, ctx) {
        // CORS Headers
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        // Handle OPTIONS (Preflight)
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);

        // CONFIG Endpoint (Frontend settings)
        if (url.pathname === "/api/config" && request.method === "GET") {
            return new Response(JSON.stringify({
                centered: env.FRONTEND_CENTERED === "true",
                debug: env.FRONTEND_DEBUG_MODE === "true",
                themeColor: env.THEME_COLOR,
                themeAccentColor: env.THEME_ACCENT_COLOR,
                explanationText: env.EXPLANATION_TEXT,
                showHeader: env.SHOW_HEADER === "true"
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Handle Chat Endpoint
        if (url.pathname === "/api/chat" && request.method === "POST") {
            try {
                if (!env.OPENAI_API_KEY) {
                    throw new Error("Missing OPENAI_API_KEY environment variable");
                }

                const { messages } = await request.json();

                // Configurable Model and Prompt
                const model = env.OPENAI_MODEL || "gpt-3.5-turbo";
                const systemPrompt = env.SYSTEM_PROMPT || "You are a helpful assistant.";

                // Construct full context
                let openAIMessages = [
                    { role: "system", content: systemPrompt },
                    ...(Array.isArray(messages) ? messages : [])
                ];

                // Validate and Sanitize
                // Ensure no null content is passed to OpenAI
                openAIMessages = openAIMessages.filter(msg => {
                    return msg && typeof msg.content === 'string' && msg.content.trim().length > 0;
                });

                // If for some reason we filtered everything out (unlikely with system prompt), ensure at least system prompt
                if (openAIMessages.length === 0) {
                    openAIMessages.push({ role: "system", content: systemPrompt });
                }

                // Call OpenAI API with Timeout
                const TIMEOUT_MS = 25000; // 25 seconds (Cloudflare worker limit is often 30s)

                const fetchPromise = fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${env.OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: openAIMessages
                    })
                });

                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("Gateway Timeout")), TIMEOUT_MS);
                });

                const openAIResponse = await Promise.race([fetchPromise, timeoutPromise]);

                if (!openAIResponse.ok) {
                    const errorText = await openAIResponse.text();
                    console.error("OpenAI Error:", errorText);
                    throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
                }

                const data = await openAIResponse.json();
                const reply = data.choices[0].message.content;

                return new Response(JSON.stringify({ reply }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });

            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
        }

        // Try to serve static assets
        if (env.ASSETS) {
            try {
                return await env.ASSETS.fetch(request);
            } catch (e) {
                // fall through to 404
            }
        }

        // 404 for everything else
        return new Response("Not Found", { status: 404, headers: corsHeaders });
    }
};
