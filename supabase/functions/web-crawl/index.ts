const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { url, extract_mode = "text", max_depth = 1 } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'url' parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: `Invalid URL: ${url}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(parsedUrl.href, {
      headers: { "User-Agent": "AspectAI-Crawler/1.0" },
      redirect: "follow",
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch ${url}: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();
    const title = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.trim() || url;

    const metaTags: Record<string, string> = {};
    const metaRegex = /<meta\s+(?:name|property)=["']([^"']+)["']\s+content=["']([^"']*)["']/gi;
    let metaMatch;
    while ((metaMatch = metaRegex.exec(html)) !== null) {
      metaTags[metaMatch[1]] = metaMatch[2];
    }

    const textContent = html
      .replace(/<script[^>]*>.*?<\/script>/gis, "")
      .replace(/<style[^>]*>.*?<\/style>/gis, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 10000);

    const links: { text: string; href: string }[] = [];
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      const linkText = linkMatch[2].replace(/<[^>]+>/g, "").trim();
      if (linkText && linkMatch[1].startsWith("http")) {
        links.push({ text: linkText.slice(0, 200), href: linkMatch[1] });
      }
    }

    const result: Record<string, unknown> = { url, title };

    switch (extract_mode) {
      case "text":
        result.text = textContent;
        break;
      case "links":
        result.links = links.slice(0, 100);
        break;
      case "metadata":
        result.metadata = { title, metaTags };
        break;
      case "full":
        result.text = textContent;
        result.links = links.slice(0, 100);
        result.metadata = { title, metaTags };
        break;
      default:
        result.text = textContent;
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
