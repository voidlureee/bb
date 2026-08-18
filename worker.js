
const ROBLOX_API =
    "https://apis.roblox.com/game-passes/v1/universes";

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    };
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...corsHeaders(),
            "Content-Type": "application/json"
        }
    });
}

export default {
    async fetch(request, env) {

        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders()
            });
        }

        const url = new URL(request.url);

        if (
            url.pathname === "/api/create-pass" &&
            request.method === "POST"
        ) {

            if (!env.ROBLOX_API_KEY) {
                return json({
                    error: "ROBLOX_API_KEY is missing."
                }, 500);
            }

            let body;

            try {
                body = await request.json();
            } catch {
                return json({
                    error: "Invalid JSON."
                }, 400);
            }

            const universeId =
                String(body.universeId || "").trim();

            const name =
                String(body.name || "").trim();

            const description =
                String(body.description || "").trim();

            const price =
                Number(body.price);

            if (!/^\d+$/.test(universeId)) {
                return json({
                    error: "Invalid Universe ID."
                }, 400);
            }

            if (!name || name.length > 50) {
                return json({
                    error: "Name must be 1–50 characters."
                }, 400);
            }

            if (description.length > 1000) {
                return json({
                    error: "Description is too long."
                }, 400);
            }

            if (!Number.isInteger(price) || price < 1) {
                return json({
                    error: "Invalid price."
                }, 400);
            }

            const response = await fetch(
                `${ROBLOX_API}/${universeId}/game-passes`,
                {
                    method: "POST",
                    headers: {
                        "x-api-key": env.ROBLOX_API_KEY,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name,
                        description,
                        price
                    })
                }
            );

            const text = await response.text();

            let data;

            try {
                data = JSON.parse(text);
            } catch {
                data = {
                    raw: text
                };
            }

            if (!response.ok) {
                return json({
                    error: "Roblox rejected the request.",
                    status: response.status,
                    details: data
                }, response.status);
            }

            return json(data);
        }

        /*
         * Everything else is handled by Cloudflare Static Assets.
         */
        if (env.ASSETS) {
            return env.ASSETS.fetch(request);
        }

        return json({
            error: "Not found."
        }, 404);
    }
};

