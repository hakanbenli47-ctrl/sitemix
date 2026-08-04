import { buildStudioRepositoryFiles } from "@/lib/studioExport";
import type { StudioDeployment, StudioProject, StudioSite } from "@/lib/sitemixStudio";
import { slugify } from "@/lib/sitemixStudio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type GithubRepository = { id: number; name: string; full_name: string; html_url: string; default_branch: string; owner?: { login?: string } };

function githubHeaders() {
  const token = process.env.GITHUB_STUDIO_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_STUDIO_TOKEN veya GITHUB_TOKEN eksik.");
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

async function githubRequest<T>(path: string, init?: RequestInit, allowed: number[] = []) {
  const response = await fetch(`https://api.github.com${path}`, { ...init, headers: { ...githubHeaders(), ...(init?.headers || {}) }, cache: "no-store" });
  const result = await response.json().catch(() => null);
  if (!response.ok && !allowed.includes(response.status)) {
    throw new Error(result?.message || `GitHub işlemi tamamlanamadı (${response.status}).`);
  }
  return { response, result: result as T };
}

function vercelPath(path: string) {
  const teamId = process.env.VERCEL_TEAM_ID;
  return `https://api.vercel.com${path}${path.includes("?") ? "&" : "?"}${teamId ? `teamId=${encodeURIComponent(teamId)}` : ""}`.replace(/[?&]$/, "");
}

async function vercelRequest<T>(path: string, init?: RequestInit, allowed: number[] = []) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error("VERCEL_TOKEN eksik.");
  const response = await fetch(vercelPath(path), {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  const result = await response.json().catch(() => null);
  if (!response.ok && !allowed.includes(response.status)) {
    throw new Error(result?.error?.message || result?.message || `Vercel işlemi tamamlanamadı (${response.status}).`);
  }
  return { response, result: result as T };
}

function repositoryName(project: Pick<StudioProject, "slug" | "id">) {
  const prefix = slugify(process.env.GITHUB_STUDIO_REPO_PREFIX || "sitemix-site");
  return `${prefix}-${slugify(project.slug)}-${project.id.slice(0, 8)}`.slice(0, 95);
}

async function ensureGithubRepository(project: StudioProject) {
  const owner = (process.env.GITHUB_STUDIO_OWNER || process.env.GITHUB_OWNER || "hakanbenli47-ctrl").trim();
  const name = repositoryName(project);
  const existing = await githubRequest<GithubRepository>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, undefined, [404]);
  if (existing.response.ok) return existing.result;

  const created = await githubRequest<GithubRepository>("/user/repos", {
    method: "POST",
    body: JSON.stringify({
      name,
      description: `${project.title} için SiteMix Studio tarafından oluşturulan web sitesi`,
      private: true,
      auto_init: true,
      has_issues: false,
      has_projects: false,
      has_wiki: false,
    }),
  });
  if (created.result.owner?.login?.toLocaleLowerCase("tr-TR") !== owner.toLocaleLowerCase("tr-TR")) {
    throw new Error(`GitHub anahtarı ${owner} hesabında depo oluşturma yetkisine sahip değil.`);
  }
  return created.result;
}

async function ensureVercelProject(repository: GithubRepository, project: StudioProject) {
  const name = repositoryName(project);
  const created = await vercelRequest<{ id?: string; name?: string; link?: { productionBranch?: string }; targets?: { production?: { url?: string } } }>("/v10/projects", {
    method: "POST",
    body: JSON.stringify({
      name,
      framework: null,
      gitRepository: { type: "github", repo: repository.full_name },
    }),
  }, [409]);
  if (created.response.ok) return created.result;
  const existing = await vercelRequest<{ id?: string; name?: string; targets?: { production?: { url?: string } } }>(`/v9/projects/${encodeURIComponent(name)}`);
  return existing.result;
}

async function commitRepositoryFiles(repository: GithubRepository, files: ReturnType<typeof buildStudioRepositoryFiles>, message: string) {
  const branch = repository.default_branch || "main";
  const ref = await githubRequest<{ object: { sha: string } }>(`/repos/${repository.full_name}/git/ref/heads/${encodeURIComponent(branch)}`);
  const headSha = ref.result.object.sha;
  const commit = await githubRequest<{ tree: { sha: string } }>(`/repos/${repository.full_name}/git/commits/${headSha}`);
  const existingTree = await githubRequest<{ tree?: Array<{ path?: string; type?: string }> }>(`/repos/${repository.full_name}/git/trees/${commit.result.tree.sha}?recursive=1`);
  const blobs = await Promise.all(files.map((file) => githubRequest<{ sha: string }>(`/repos/${repository.full_name}/git/blobs`, {
    method: "POST",
    body: JSON.stringify({ content: file.content, encoding: "utf-8" }),
  })));
  const nextPaths = new Set(files.map((file) => file.path));
  const managedPagePaths = new Set(["hakkimizda/index.html", "hizmetler/index.html", "calismalar/index.html", "iletisim/index.html"]);
  const deletions = (existingTree.result.tree || [])
    .filter((item) => item.type === "blob" && item.path && managedPagePaths.has(item.path) && !nextPaths.has(item.path))
    .map((item) => ({ path: item.path!, mode: "100644", type: "blob", sha: null }));
  const tree = await githubRequest<{ sha: string }>(`/repos/${repository.full_name}/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: commit.result.tree.sha,
      tree: [
        ...files.map((file, index) => ({ path: file.path, mode: "100644", type: "blob", sha: blobs[index].result.sha })),
        ...deletions,
      ],
    }),
  });
  const nextCommit = await githubRequest<{ sha: string }>(`/repos/${repository.full_name}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message, tree: tree.result.sha, parents: [headSha] }),
  });
  await githubRequest(`/repos/${repository.full_name}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: nextCommit.result.sha, force: false }),
  });
  return nextCommit.result.sha;
}

function deploymentRecord(projectId: string, patch: Omit<StudioDeployment, "project_id" | "updated_at">): StudioDeployment {
  return { project_id: projectId, ...patch, updated_at: new Date().toISOString() };
}

export async function provisionStudioProject(project: StudioProject): Promise<StudioDeployment> {
  const githubConfigured = Boolean(process.env.GITHUB_STUDIO_TOKEN || process.env.GITHUB_TOKEN);
  if (!githubConfigured) {
    return deploymentRecord(project.id, {
      status: "configuration_required",
      last_error: "SiteMix AI projesindeki GITHUB_TOKEN ve GITHUB_OWNER değişkenleri bu projeye de eklenmeli.",
    });
  }

  try {
    const repository = await ensureGithubRepository(project);
    const vercelProject = process.env.VERCEL_TOKEN ? await ensureVercelProject(repository, project) : null;
    const fallbackHost = `${vercelProject?.name || repository.name}.vercel.app`;
    const commitSha = await commitRepositoryFiles(repository, buildStudioRepositoryFiles(project.current_version, undefined, fallbackHost), "Publish SiteMix website");
    return deploymentRecord(project.id, {
      github_repo_id: repository.id,
      github_repo_name: repository.name,
      github_repo_full_name: repository.full_name,
      github_repo_url: repository.html_url,
      github_commit_sha: commitSha,
      vercel_project_id: vercelProject?.id || null,
      vercel_project_name: vercelProject?.name || repository.name,
      vercel_url: fallbackHost ? `https://${fallbackHost}` : null,
      status: vercelProject ? "ready" : "vercel_connection_required",
      last_error: vercelProject ? null : "GitHub deposu hazır. Tam otomatik Vercel projesi oluşturmak için VERCEL_TOKEN eklenmeli; dilerseniz depoyu Vercel panelinden de bir kez içe aktarabilirsiniz.",
      provisioned_at: new Date().toISOString(),
    });
  } catch (error) {
    return deploymentRecord(project.id, {
      status: "error",
      last_error: error instanceof Error ? error.message : "Site deposu hazırlanamadı.",
    });
  }
}

export async function syncStudioRepository(project: StudioProject, deployment: StudioDeployment, domain?: string | null): Promise<StudioDeployment> {
  if (!deployment.github_repo_full_name) throw new Error("Bu proje için GitHub deposu henüz hazır değil.");
  const repo = await githubRequest<GithubRepository>(`/repos/${deployment.github_repo_full_name}`);
  const fallbackHost = deployment.vercel_project_name ? `${deployment.vercel_project_name}.vercel.app` : undefined;
  const resolvedDomain = domain === undefined ? deployment.domain || undefined : domain || undefined;
  const commitSha = await commitRepositoryFiles(repo.result, buildStudioRepositoryFiles(project.current_version as StudioSite, resolvedDomain, fallbackHost), resolvedDomain ? `Connect domain ${resolvedDomain}` : "Update website content");
  const connectedToVercel = Boolean(deployment.vercel_project_id);
  return {
    ...deployment,
    project_id: project.id,
    domain: resolvedDomain || null,
    github_commit_sha: commitSha,
    seo_synced_at: new Date().toISOString(),
    status: connectedToVercel ? "ready" : "vercel_connection_required",
    last_error: connectedToVercel ? null : deployment.last_error || "GitHub deposu güncellendi; Vercel bağlantısı için VERCEL_TOKEN eklenmeli.",
    updated_at: new Date().toISOString(),
  };
}

export async function connectStudioDomain(project: StudioProject, deployment: StudioDeployment, rawDomain: string) {
  const domain = rawDomain.trim().toLocaleLowerCase("tr-TR").replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].replace(/[^a-z0-9.-]/g, "");
  if (!domain || !domain.includes(".")) throw new Error("Geçerli bir domain yazmalısınız.");
  const vercelProject = deployment.vercel_project_id || deployment.vercel_project_name;
  if (!vercelProject) throw new Error("Vercel projesi henüz hazır değil.");

  const added = await vercelRequest<{ verified?: boolean; verification?: Array<{ type?: string; domain?: string; value?: string; reason?: string }> }>(`/v10/projects/${encodeURIComponent(vercelProject)}/domains`, {
    method: "POST",
    body: JSON.stringify({ name: domain }),
  }, [409]);
  let verified = Boolean(added.result?.verified);
  let verification = Array.isArray(added.result?.verification) ? added.result.verification : [];
  if (!verified) {
    const checked = await vercelRequest<{ verified?: boolean; verification?: Array<{ type?: string; domain?: string; value?: string; reason?: string }> }>(`/v9/projects/${encodeURIComponent(vercelProject)}/domains/${encodeURIComponent(domain)}/verify`, { method: "POST" }, [400]);
    verified = Boolean(checked.result?.verified);
    verification = Array.isArray(checked.result?.verification) ? checked.result.verification : verification;
  }
  const records = verification.length ? verification.map((item) => ({ type: item.type || "TXT", name: item.domain || "@", value: item.value || item.reason || "Vercel doğrulama kaydı" })) : [
    { type: "A", name: "@", value: "76.76.21.21" },
    { type: "CNAME", name: "www", value: "cname.vercel-dns-0.com" },
  ];
  const { data: domainRecord, error } = await supabaseAdmin.from("studio_domains").upsert({
    project_id: project.id,
    owner_id: project.owner_id,
    domain,
    status: verified ? "active" : "dns_pending",
    is_primary: true,
    ssl_status: verified ? "provisioning" : "pending",
    verification_records: records,
    last_checked_at: new Date().toISOString(),
  }, { onConflict: "domain" }).select("*").single();
  if (error) throw error;
  const nextDeployment = await syncStudioRepository(project, deployment, domain);
  return { domainRecord, deployment: nextDeployment };
}
