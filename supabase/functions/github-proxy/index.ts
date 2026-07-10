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
    const { action, params } = await req.json();

    const token = Deno.env.get("GITHUB_TOKEN") || "";
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let endpoint = "";
    let method = "GET";
    let body: string | undefined;

    switch (action) {
      case "search_repos": {
        const { query, sort = "stars" } = params;
        endpoint = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&per_page=10`;
        break;
      }
      case "get_file": {
        const { owner, repo, path, branch = "main" } = params;
        endpoint = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
        break;
      }
      case "get_readme": {
        const { owner, repo } = params;
        endpoint = `https://api.github.com/repos/${owner}/${repo}/readme`;
        break;
      }
      case "list_issues": {
        const { owner, repo, state = "open", limit = 10 } = params;
        endpoint = `https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=${limit}`;
        break;
      }
      case "get_repo": {
        const { owner, repo } = params;
        endpoint = `https://api.github.com/repos/${owner}/${repo}`;
        break;
      }
      case "list_branches": {
        const { owner, repo } = params;
        endpoint = `https://api.github.com/repos/${owner}/${repo}/branches`;
        break;
      }
      case "create_issue": {
        const { owner, repo, title, body: issueBody, labels } = params;
        endpoint = `https://api.github.com/repos/${owner}/${repo}/issues`;
        method = "POST";
        body = JSON.stringify({ title, body: issueBody, labels });
        break;
      }
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const response = await fetch(endpoint, { method, headers, body });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: `GitHub API error (${response.status}): ${errText}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    let result: unknown = data;

    switch (action) {
      case "search_repos":
        result = {
          total_count: data.total_count,
          repos: (data.items || []).map((r: Record<string, unknown>) => ({
            name: r.full_name,
            description: r.description,
            stars: r.stargazers_count,
            forks: r.forks_count,
            url: r.html_url,
            language: r.language,
            updated_at: r.updated_at,
          })),
        };
        break;
      case "get_file":
        if (data.encoding === "base64" && data.content) {
          const decoded = atob(data.content.replace(/\n/g, ""));
          result = { path: data.path, content: decoded, size: data.size, encoding: "utf-8" };
        } else {
          result = { path: data.path, content: data.content, size: data.size };
        }
        break;
      case "get_readme":
        result = {
          repo: `${params.owner}/${params.repo}`,
          readme: data.content ? atob(data.content.replace(/\n/g, "")) : "",
          encoding: data.encoding,
        };
        break;
      case "list_issues":
        result = {
          issues: (data || []).map((i: Record<string, unknown>) => ({
            number: i.number,
            title: i.title,
            state: i.state,
            url: i.html_url,
            labels: (i.labels as Array<{ name: string }>)?.map((l) => l.name) || [],
            created_at: i.created_at,
          })),
        };
        break;
      case "get_repo":
        result = {
          name: data.full_name,
          description: data.description,
          stars: data.stargazers_count,
          forks: data.forks_count,
          url: data.html_url,
          default_branch: data.default_branch,
          language: data.language,
          open_issues: data.open_issues_count,
          license: data.license?.name,
        };
        break;
      case "list_branches":
        result = {
          branches: (data || []).map((b: Record<string, unknown>) => ({
            name: b.name,
            protected: b.protected,
          })),
        };
        break;
      case "create_issue":
        result = {
          number: data.number,
          title: data.title,
          url: data.html_url,
          state: data.state,
        };
        break;
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
