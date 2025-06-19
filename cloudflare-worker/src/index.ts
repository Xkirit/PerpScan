import { Redis } from "@upstash/redis/cloudflare";

export interface Env {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  SECRET_TOKEN: string; // optional; protects your worker from public misuse
}

const DEFAULT_TTL = 60; // seconds to keep each response in Redis

export default {
  // -------- fetch handler -----------------------------------------------------
  async fetch(request: Request, env: Env): Promise<Response> {
    // Optional bearer-token guard so random users cannot abuse your proxy.
    if (env.SECRET_TOKEN) {
      const authHeader = request.headers.get("authorization") || "";
      if (authHeader !== `Bearer ${env.SECRET_TOKEN}`) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const url = new URL(request.url);

    // Expect ?url=<encoded_upstream_url>
    if (url.pathname !== "/fetch") {
      return new Response("Not found", { status: 404 });
    }

    const upstream = url.searchParams.get("url");
    if (!upstream) {
      return new Response("Missing 'url' query parameter", { status: 400 });
    }

    const redis = Redis.fromEnv(env);
    const cacheKey = `proxy:${upstream}`;

    // ---------- Try cache first ----------------------------------------------
    try {
      const cached = await redis.get<string>(cacheKey);
      if (cached) {
        return new Response(cached, {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Cache": "HIT"
          }
        });
      }
    } catch (_) {
      // Ignore Redis errors – fall through to live fetch
    }

    // ---------- Live fetch ----------------------------------------------------
    const upstreamResp = await fetch(upstream);
    const body = await upstreamResp.text();

    // ---------- Cache it (fire-and-forget) -----------------------------------
    redis.setex(cacheKey, DEFAULT_TTL, body).catch(() => {});

    return new Response(body, {
      status: upstreamResp.status,
      headers: {
        "Content-Type": upstreamResp.headers.get("content-type") || "application/json",
        "X-Cache": "MISS"
      }
    });
  }
}; 