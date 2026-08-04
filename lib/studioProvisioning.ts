import { buildStudioRepositoryFiles } from "@/lib/studioExport";
import type { StudioProject, StudioSite } from "@/lib/sitemixStudio";
import { slugify } from "@/lib/sitemixStudio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type GithubRepository = { id: number; name: string; full_name: string; html_url: string; default_branch: string; owner?: { login?: string } };
type DeploymentRecord = { id?: string; project_id: string; github_repo_name?: string | null; github_repo_full_name?: string | null; github_repo_url?: string | null; vercel_project_id?: string | null; vercel_project_name?: string | null; vercel_url?: string | null; status?: string; domain?: string | null; last_error?: string | null };

function githubHeaders() {
  const token = process.env.GITHUB_STUDIO_TOKEN;
  if (!token) throw new Error("GITHUB_STUDIO_TOKEN eksik.");
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
  const owner = (process.env.GITHUB_STUDIO_OWNER || "hakanbenli47-ctrl").trim();
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

async function saveDeployment(projectId: string, patch: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin.from("studio_deployments").upsert({ project_id: projectId, ...patch, updated_at: new Date().toISOString() }, { onConflict: "project_id" }).select("*").single();
  if (error) throw error;
  return data as DeploymentRecord;
}

export async function provisionStudioProject(project: StudioProject) {
  const configured = Boolean(process.env.GITHUB_STUDIO_TOKEN && process.env.VERCEL_TOKEN);
  if (!configured) {
    return saveDeployment(project.id, {
      status: "configuration_required",
      last_error: "GITHUB_STUDIO_TOKEN ve VERCEL_TOKEN ortam değişkenleri eklenmeli.",
    });
  }

  await saveDeployment(project.id, { status: "provisioning", last_error: null });
  try {
    const repository = await ensureGithubRepository(project);
    const vercelProject = await ensureVercelProject(repository, project);
    const fallbackHost = vercelProject.name ? `${vercelProject.name}.vercel.app` : undefined;
    const commitSha = await commitRepositoryFiles(repository, buildStudioRepositoryFiles(project.current_version, undefined, fallbackHost), "Publish SiteMix website");
    return saveDeployment(project.id, {
      github_repo_id: repository.id,
      github_repo_name: repository.name,
      github_repo_full_name: repository.full_name,
      github_repo_url: repository.html_url,
      github_commit_sha: commitSha,
      vercel_project_id: vercelProject.id || null,
      vercel_project_name: vercelProject.name || repository.name,
      vercel_url: fallbackHost ? `https://${fallbackHost}` : null,
      status: "ready",
      last_error: null,
      provisioned_at: new Date().toISOString(),
    });
  } catch (error) {
    return saveDeployment(project.id, {
      status: "error",
      last_error: error instanceof Error ? error.message : "Site deposu hazırlanamadı.",
    });
  }
}

export async function syncStudioRepository(project: StudioProject, deployment: DeploymentRecord, domain?: string) {
  if (!deployment.github_repo_full_name) throw new Error("Bu proje için GitHub deposu henüz hazır değil.");
  const repo = await githubRequest<GithubRepository>(`/repos/${deployment.github_repo_full_name}`);
  const fallbackHost = deployment.vercel_project_name ? `${deployment.vercel_project_name}.vercel.app` : undefined;
  const commitSha = await commitRepositoryFiles(repo.result, buildStudioRepositoryFiles(project.current_version as StudioSite, domain, fallbackHost), domain ? `Connect domain ${domain}` : "Update website content");
  await saveDeployment(project.id, {
    domain: domain || deployment.domain || null,
    github_commit_sha: commitSha,
    seo_synced_at: new Date().toISOString(),
    status: "ready",
    last_error: null,
  });
  return commitSha;
}

export async function connectStudioDomain(project: StudioProject, rawDomain: string) {
  const domain = rawDomain.trim().toLocaleLowerCase("tr-TR").replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].replace(/[^a-z0-9.-]/g, "");
  if (!domain || !domain.includes(".")) throw new Error("Geçerli bir domain yazmalısınız.");
  const { data: deployment, error: deploymentError } = await supabaseAdmin.from("studio_deployments").select("*").eq("project_id", project.id).single();
  if (deploymentError || !deployment) throw deploymentError || new Error("Önce site deposu hazırlanmalı.");
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
  await syncStudioRepository(project, deployment, domain);
  return domainRecord;
}
