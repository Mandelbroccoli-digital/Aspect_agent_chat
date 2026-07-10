import { createClient } from "npm:@supabase/supabase-js@2.45.4";

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
    const { tool_name, input } = await req.json();

    let result: unknown;

    switch (tool_name) {
      case "web_crawl":
        result = await webCrawl(input as { url: string; extract_mode?: string; max_depth?: number });
        break;
      case "web_search":
        result = await webSearch(input as { query: string; max_results?: number });
        break;
      case "github_search_repos":
        result = await githubSearchRepos(input as { query: string; sort?: string });
        break;
      case "github_get_file":
        result = await githubGetFile(input as { owner: string; repo: string; path: string; branch?: string });
        break;
      case "github_get_readme":
        result = await githubGetReadme(input as { owner: string; repo: string });
        break;
      case "github_list_issues":
        result = await githubListIssues(input as { owner: string; repo: string; state?: string; limit?: number });
        break;
      case "fs_read_file":
      case "fs_write_file":
      case "fs_list_directory":
      case "fs_search_files":
        result = await fsOperation(tool_name, input as Record<string, string>);
        break;
      default:
        result = { error: `Unknown tool: ${tool_name}` };
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

async function webCrawl(input: { url: string; extract_mode?: string; max_depth?: number }) {
  const { url, extract_mode = "text", max_depth = 1 } = input;
  const response = await fetch(url, {
    headers: { "User-Agent": "AspectAI-Crawler/1.0" },
  });

  if (!response.ok) {
    return { error: `Failed to fetch ${url}: ${response.status}` };
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
  }

  return result;
}

async function webSearch(input: { query: string; max_results?: number }) {
  const { query, max_results = 5 } = input;
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(searchUrl, {
    headers: { "User-Agent": "AspectAI-Search/1.0" },
  });

  if (!response.ok) {
    return { error: `Search failed: ${response.status}` };
  }

  const html = await response.text();
  const results: { title: string; url: string; snippet: string }[] = [];

  const resultRegex = /<a[^>]+class="result__a"[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>(.*?)<\/a>/gi;
  let match;
  while ((match = resultRegex.exec(html)) !== null && results.length < max_results) {
    const url = match[1].replace(/\/\/duckduckgo.com\/l\/\?uddg=/, "").replace(/&rut=.*/, "");
    const title = match[2].replace(/<[^>]+>/g, "").trim();
    const snippet = match[3].replace(/<[^>]+>/g, "").trim();
    results.push({ title, url: decodeURIComponent(url), snippet });
  }

  return { query, results };
}

async function githubSearchRepos(input: { query: string; sort?: string }) {
  const { query, sort = "stars" } = input;
  const token = Deno.env.get("GITHUB_TOKEN") || "";
  const response = await fetch(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&per_page=10`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    return { error: `GitHub API error: ${response.status}` };
  }

  const data = await response.json();
  return {
    total_count: data.total_count,
    repos: (data.items || []).map((r: Record<string, unknown>) => ({
      name: r.full_name,
      description: r.description,
      stars: r.stargazers_count,
      url: r.html_url,
    })),
  };
}

async function githubGetFile(input: { owner: string; repo: string; path: string; branch?: string }) {
  const { owner, repo, path, branch = "main" } = input;
  const token = Deno.env.get("GITHUB_TOKEN") || "";
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    return { error: `GitHub API error: ${response.status}` };
  }

  const data = await response.json();
  if (data.encoding === "base64" && data.content) {
    const decoded = atob(data.content.replace(/\n/g, ""));
    return { path: data.path, content: decoded, size: data.size };
  }
  return { path: data.path, content: data.content, size: data.size };
}

async function githubGetReadme(input: { owner: string; repo: string }) {
  const { owner, repo } = input;
  const token = Deno.env.get("GITHUB_TOKEN") || "";
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/readme`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    return { error: `GitHub API error: ${response.status}` };
  }

  const data = await response.json();
  const decoded = data.content ? atob(data.content.replace(/\n/g, "")) : "";
  return { repo: `${owner}/${repo}`, readme: decoded };
}

async function githubListIssues(input: { owner: string; repo: string; state?: string; limit?: number }) {
  const { owner, repo, state = "open", limit = 10 } = input;
  const token = Deno.env.get("GITHUB_TOKEN") || "";
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=${limit}`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    return { error: `GitHub API error: ${response.status}` };
  }

  const data = await response.json();
  return {
    issues: (data || []).map((i: Record<string, unknown>) => ({
      number: i.number,
      title: i.title,
      state: i.state,
      url: i.html_url,
      labels: (i.labels as Array<{ name: string }>)?.map((l) => l.name) || [],
    })),
  };
}

async function fsOperation(tool: string, input: Record<string, string>) {
  const sandboxRoot = Deno.env.get("FS_SANDBOX_ROOT") || "/tmp/aspect-sandbox";

  try {
    await Deno.mkdir(sandboxRoot, { recursive: true });
  } catch {
    // already exists
  }

  const safeJoin = (base: string, path: string): string => {
    const resolved = `${base}/${path}`.replace(/\/+/g, "/");
    const normalized = resolved.replace(/\.\./g, "").replace(/\/+/g, "/");
    if (!normalized.startsWith(base)) {
      throw new Error("Path traversal detected");
    }
    return normalized;
  };

  switch (tool) {
    case "fs_read_file": {
      const filePath = safeJoin(sandboxRoot, input.path);
      try {
        const content = await Deno.readTextFile(filePath);
        return { path: input.path, content };
      } catch {
        return { error: `File not found: ${input.path}` };
      }
    }
    case "fs_write_file": {
      const filePath = safeJoin(sandboxRoot, input.path);
      const dirPath = filePath.substring(0, filePath.lastIndexOf("/"));
      try {
        await Deno.mkdir(dirPath, { recursive: true });
      } catch {
        // exists
      }
      await Deno.writeTextFile(filePath, input.content || "");
      return { path: input.path, written: true, bytes: (input.content || "").length };
    }
    case "fs_list_directory": {
      const dirPath = safeJoin(sandboxRoot, input.path || ".");
      try {
        const entries = [];
        for await (const entry of Deno.readDir(dirPath)) {
          entries.push({
            name: entry.name,
            isDirectory: entry.isDirectory,
            isFile: entry.isFile,
            size: entry.isFile ? (await Deno.stat(`${dirPath}/${entry.name}`)).size : 0,
          });
        }
        return { path: input.path || ".", entries };
      } catch {
        return { error: `Directory not found: ${input.path}` };
      }
    }
    case "fs_search_files": {
      const pattern = input.pattern || "*";
      const regexPattern = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".");
      const regex = new RegExp(regexPattern);
      const results: string[] = [];

      async function walkDir(dir: string, relPath: string) {
        try {
          for await (const entry of Deno.readDir(dir)) {
            const fullRel = relPath ? `${relPath}/${entry.name}` : entry.name;
            if (entry.isFile && regex.test(entry.name)) {
              results.push(fullRel);
            }
            if (entry.isDirectory) {
              await walkDir(`${dir}/${entry.name}`, fullRel);
            }
          }
        } catch {
          // skip
        }
      }

      await walkDir(sandboxRoot, "");
      return { pattern, matches: results.slice(0, 100) };
    }
    default:
      return { error: `Unknown filesystem operation: ${tool}` };
  }
}
