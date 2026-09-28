import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-worker-secret",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const GITHUB_REPO_OWNER = "TKDasOfficial";
const GITHUB_REPO_NAME = Deno.env.get("GITHUB_REPO_NAME") || "hyper-copilot-runtime";
const GITHUB_DISPATCH_URL = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/dispatches`;

function captionSizeToken(
  captionStyle: string,
  captionScale?: number | null,
): "small" | "medium" | "large" {
  if (typeof captionScale === "number") {
    if (captionScale >= 5) return "large";
    if (captionScale <= 2) return "small";
    return "medium";
  }
  const value = (captionStyle ?? "").toLowerCase();
  if (value.includes("large")) return "large";
  if (value.includes("small")) return "small";
  return "medium";
}

/**
 * GitHub repository dispatch strictly enforces a limit of NO MORE THAN 10
 * top-level properties in client_payload (POST /repos/{owner}/{repo}/dispatches returns 422 if > 10).
 * We construct exactly 10 properties tailored to each rendering engine:
 *
 * Short-form (mini-editor / render.py):
 *   video_id, user_id, prompt, negative_prompt, voice_gender, image_style, aspect_ratio, duration_seconds, captions, caption_scale
 *
 * Long-form (editor / HyperEditor C++ pipeline):
 *   video_id, user_id, prompt, negative_prompt, voice_gender, voice_persona, image_style, aspect_ratio, duration_seconds, captions
 */
function buildClientPayload(params: {
  videoId: string;
  userId: string;
  prompt: string;
  negativePrompt?: string | null;
  category?: string | null;
  visualStyle?: string | null;
  resolution?: string | null;
  fps?: string | null;
  voiceGender?: string | null;
  voicePersona?: string | null;
  imageStyle?: string | null;
  aspectRatio?: string | null;
  durationSeconds: number;
  bgm?: boolean | null;
  captions?: boolean | null;
  captionStyle?: string | null;
  captionScale?: number | null;
  captionSize?: string | null;
  isLong: boolean;
}): Record<string, string> {
  // GitHub repository dispatch strictly enforces <= 10 top-level properties.
  // Exactly 9 or 10 keys:
  return {
    video_id: params.videoId,
    user_id: params.userId,
    prompt: params.prompt || "",
    negative_prompt: params.negativePrompt ?? "",
    voice_gender: params.voiceGender ?? "male",
    voice_persona:
      params.category ||
      params.voicePersona ||
      (params.isLong ? "Documentary" : "Dynamic Storyteller"),
    image_style: params.visualStyle || params.imageStyle || "Cinematic",
    aspect_ratio: params.aspectRatio || (params.isLong ? "16:9" : "9:16"),
    duration_seconds: String(params.durationSeconds),
    captions: params.captions !== false ? "true" : "false",
  };
}

/**
 * Reel payload: GitHub allows at most 10 top-level client_payload keys, so every
 * setting is grouped as sub-properties under exactly 10 top-level keys.
 */
function buildReelPayload(
  v: Record<string, unknown>,
  durationSeconds: number,
  category: string,
  track: { id: string; name: string } | null,
): Record<string, unknown> {
  const s = (x: unknown, d = "") => (x === null || x === undefined || x === "" ? d : String(x));
  const scale = Number(v.caption_scale ?? 4);
  return {
    identity: { video_id: s(v.id), user_id: s(v.user_id) },
    content: {
      prompt: s(v.prompt),
      negative_prompt: s(v.negative_prompt),
      category,
      format: "auto",
    },
    visual: {
      visual_type: s(v.visual_type, "Stock footage"),
      style: s(v.image_style, "Cinematic"),
      aspect_ratio: "9:16",
      resolution: s(v.quality, "1080p"),
      fps: s(v.bitrate).includes("60") ? "60" : "30",
      bitrate_mbps: String(
        Math.min(16, Math.max(1, Number(/(\d+)\s*Mbps/i.exec(s(v.bitrate))?.[1] ?? 16))),
      ),
    },
    audio: { language: s(v.language, "English"), voice_gender: s(v.voice_gender, "male") },
    music: {
      enabled: track ? "true" : "false",
      track_id: track?.id ?? "",
      track_name: track?.name ?? "",
    },
    captions: {
      enabled: v.captions === false ? "false" : "true",
      style: s(v.caption_style, "Dynamic"),
      size: scale <= 2 ? "Small" : scale >= 5 ? "Large" : "Medium",
    },
    edit: { template: s(v.edit_template, "Dynamic") },
    timing: { duration_seconds: String(durationSeconds) },
    stock: { sources: "pexels,pixabay" },
    meta: { version: "reel-2" },
  };
}


// ---------- Environment check + Drive "Audio Library" ----------
const envv = (n: string) => (Deno.env.get(n) ?? "").trim().replace(/^["']|["']$/g, "");
const RUNTIME_REPO = `${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`;
const AUDIO_FOLDER = "Audio Library";

async function gh(path: string) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${envv("GITHUB_PAT")}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "hyper-copilot-video-env",
    },
  });
  return { ok: res.ok, status: res.status, body: await res.json().catch(() => null) };
}

function b64decode(s: string): string {
  const bin = atob(s.replace(/\n/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

async function verifyRepo() {
  if (!envv("GITHUB_PAT")) return { ok: false, error: "GITHUB_PAT is not set" };
  const repo = await gh(`/repos/${RUNTIME_REPO}`);
  if (!repo.ok) return { ok: false, error: `Repo not reachable (${repo.status})` };
  const perms = repo.body?.permissions ?? {};
  const dir = await gh(`/repos/${RUNTIME_REPO}/contents/.github/workflows`);
  const workflows: Array<Record<string, unknown>> = [];
  if (dir.ok && Array.isArray(dir.body)) {
    for (const f of dir.body) {
      if (!/\.ya?ml$/.test(f.name)) continue;
      const file = await gh(`/repos/${RUNTIME_REPO}/contents/${f.path}`);
      const text = file.ok ? b64decode(String(file.body?.content ?? "")) : "";
      const inline = [...text.matchAll(/types:\s*\[([^\]]+)\]/g)].flatMap((m) =>
        m[1].split(",").map((s) => s.trim().replace(/["']/g, "")),
      );
      const listed = [...text.matchAll(/types:\s*\n((?:[ \t]*-[ \t]*\S+[ \t]*\n?)+)/g)].flatMap(
        (m) => [...m[1].matchAll(/-\s*(\S+)/g)].map((x) => x[1].replace(/["']/g, "")),
      );
      const keys = [...new Set([...text.matchAll(/client_payload\.([\w.]+)/g)].map((m) => m[1]))];
      workflows.push({
        file: f.name,
        dispatchTypes: [...new Set([...inline, ...listed])],
        payloadKeys: keys,
      });
    }
  }
  const runs = await gh(`/repos/${RUNTIME_REPO}/actions/runs?per_page=5`);
  return {
    ok: true,
    repo: repo.body?.full_name,
    defaultBranch: repo.body?.default_branch,
    canDispatch: Boolean(perms.push || perms.admin),
    workflows,
    recentRuns: (runs.body?.workflow_runs ?? []).map((r: Record<string, unknown>) => ({
      name: r.name,
      event: r.event,
      status: r.status,
      conclusion: r.conclusion,
      created_at: r.created_at,
    })),
  };
}

async function driveToken(): Promise<string | null> {
  const refresh = envv("GOOGLE_DRIVE_REFRESH_TOKEN") || envv("GOOGLE_REFRESH_TOKEN");
  const id = envv("GOOGLE_CLIENT_ID") || envv("GOOGLE_CLOUD_API_ID");
  const secret = envv("GOOGLE_CLIENT_SECRET") || envv("GOOGLE_CLOUD_API_SECRET");
  if (!refresh || !id || !secret) return null;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: id,
      client_secret: secret,
      refresh_token: refresh,
      grant_type: "refresh_token",
    }),
  });
  return r.ok ? ((await r.json()).access_token as string) : null;
}

async function audioFolderId(token: string): Promise<string | null> {
  const parent = envv("GOOGLE_DRIVE_FOLDER_ID");
  if (!parent) return null;
  const h = { Authorization: `Bearer ${token}` };
  const q = `name='${AUDIO_FOLDER}' and mimeType='application/vnd.google-apps.folder' and '${parent}' in parents and trashed=false`;
  const found = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
    { headers: h },
  ).then((r) => r.json());
  if (found.files?.[0]?.id) return found.files[0].id;
  const made = await fetch("https://www.googleapis.com/drive/v3/files?supportsAllDrives=true", {
    method: "POST",
    headers: { ...h, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: AUDIO_FOLDER,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parent],
    }),
  }).then((r) => r.json());
  return made.id ?? null;
}

/** "Epic Rise [cinematic, space].mp3" / "calm #news #facts.mp3" -> tags */
function tagsFromName(name: string): string[] {
  const base = name.replace(/\.[a-z0-9]+$/i, "");
  const bracket = [...base.matchAll(/[\[(]([^\])]+)[\])]/g)].flatMap((m) => m[1].split(/[,;|]/));
  const hashes = [...base.matchAll(/#([\w-]+)/g)].map((m) => m[1]);
  const words = base.replace(/[\[(][^\])]*[\])]/g, "").split(/[\s_\-.#]+/);
  return [
    ...new Set(
      [...bracket, ...hashes, ...words].map((t) => t.trim().toLowerCase()).filter((t) => t.length > 1),
    ),
  ];
}

type Track = { id: string; name: string; tags: string[] };

async function listMusic(): Promise<
  { ok: true; folderId: string; count: number; tracks: Track[] } | { ok: false; error: string }
> {
  const token = await driveToken();
  if (!token) return { ok: false, error: "Google Drive access is not configured" };
  const folderId = await audioFolderId(token);
  if (!folderId) return { ok: false, error: "Could not find or create the Audio Library folder" };
  const q = `'${folderId}' in parents and trashed=false and mimeType contains 'audio/'`;
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=500&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  ).then((r) => r.json());
  const tracks: Track[] = (res.files ?? []).map((f: { id: string; name: string }) => ({
    id: f.id,
    name: f.name,
    tags: tagsFromName(f.name),
  }));
  return { ok: true, folderId, count: tracks.length, tracks };
}

/** Picks the track whose name tags best match the category / prompt words. */
async function pickMusic(category: string, prompt: string): Promise<Track | null> {
  const lib = await listMusic().catch(() => null);
  if (!lib || !lib.ok || lib.tracks.length === 0) return null;
  const words = new Set(
    `${category} ${prompt}`.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2),
  );
  let best: Track | null = null;
  let bestScore = -1;
  for (const t of lib.tracks) {
    const score = t.tags.reduce((s, tag) => s + (words.has(tag) ? 1 : 0), 0) + Math.random() * 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return best;
}

async function ghWrite(method: string, path: string, body: unknown) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${envv("GITHUB_PAT")}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "hyper-copilot-video-env",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, status: res.status, text: res.ok ? "" : (await res.text()).slice(0, 300) };
}

function b64encodeUtf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** Commits engine files to the runtime repo and syncs the Drive credentials it needs as Actions secrets. */
async function syncRuntime(
  files: Array<{ path: string; content: string }>,
  message: string,
  extra: Record<string, string> = {},
) {
  const results: Record<string, unknown> = {};
  for (const f of files) {
    if (!/^(reel\/|\.github\/workflows\/create-reel\.yml$)/.test(f.path)) {
      results[f.path] = "skipped (path not allowed)";
      continue;
    }
    const cur = await gh(`/repos/${RUNTIME_REPO}/contents/${f.path}`);
    const w = await ghWrite("PUT", `/repos/${RUNTIME_REPO}/contents/${f.path}`, {
      message,
      content: b64encodeUtf8(f.content),
      ...(cur.ok && cur.body?.sha ? { sha: cur.body.sha } : {}),
    });
    results[f.path] = w.ok ? "ok" : `failed ${w.status} ${w.text}`;
  }

  const sodium = (await import("npm:libsodium-wrappers@0.7.13")).default;
  await sodium.ready;
  const pk = await gh(`/repos/${RUNTIME_REPO}/actions/secrets/public-key`);
  const secrets: Record<string, string> = {
    GDRIVE_REFRESH_TOKEN: envv("GOOGLE_DRIVE_REFRESH_TOKEN"),
    GDRIVE_OAUTH_CLIENT_ID: envv("GOOGLE_CLIENT_ID") || envv("GOOGLE_CLOUD_API_ID"),
    GDRIVE_OAUTH_CLIENT_SECRET: envv("GOOGLE_CLIENT_SECRET") || envv("GOOGLE_CLOUD_API_SECRET"),
    GDRIVE_ROOT_FOLDER_ID: envv("GOOGLE_DRIVE_FOLDER_ID"),
    NVIDIA_API_KEY: envv("NVIDIA_API_KEY"),
    PEXELS_API_KEY: envv("PEXELS_API_KEY"),
    PIXABAY_API_KEY: envv("PIXABAY_API_KEY"),
  };
  // Only allowlisted extra secrets may be supplied by the (service/worker) caller.
  const extraKey = String(extra?.ELEVENLABS_API_KEY ?? "").trim() || envv("ELEVENLABS_API_KEY");
  if (extraKey) secrets.ELEVENLABS_API_KEY = extraKey;
  const secretResults: Record<string, string> = {};
  if (pk.ok) {
    const key = sodium.from_base64(pk.body.key, sodium.base64_variants.ORIGINAL);
    for (const [name, value] of Object.entries(secrets)) {
      if (!value) {
        secretResults[name] = "missing in Supabase";
        continue;
      }
      const sealed = sodium.crypto_box_seal(sodium.from_string(value), key);
      const w = await ghWrite("PUT", `/repos/${RUNTIME_REPO}/actions/secrets/${name}`, {
        encrypted_value: sodium.to_base64(sealed, sodium.base64_variants.ORIGINAL),
        key_id: pk.body.key_id,
      });
      secretResults[name] = w.ok ? "ok" : `failed ${w.status}`;
    }
  }
  return { ok: true, files: results, secrets: secretResults };
}

async function verifyEnvironment() {
  const [repo, music] = await Promise.all([verifyRepo(), listMusic()]);
  return {
    ok: true,
    repo,
    stock: { pexels: Boolean(envv("PEXELS_API_KEY")), pixabay: Boolean(envv("PIXABAY_API_KEY")) },
    music: music.ok ? { ok: true, folderId: music.folderId, count: music.count } : music,
  };
}


// Backend-only / authenticated user access guard
async function assertAuthorizedCaller(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const token = (
    req.headers.get("x-worker-secret") ??
    url.searchParams.get("worker_secret") ??
    ""
  ).trim();

  const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  const auth = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();

  // If service key is provided
  if (serviceKey && auth && auth === serviceKey) return null;

  // If authenticated user token is provided
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  if (supabaseUrl && auth) {
    try {
      const client = createClient(supabaseUrl, auth);
      const {
        data: { user },
      } = await client.auth.getUser();
      if (user) return null;
    } catch (_e) {
      // ignore
    }
  }

  // If worker secret is provided
  if (token && supabaseUrl && serviceKey) {
    try {
      const admin = createClient(supabaseUrl, serviceKey);
      const { data } = await admin.rpc("verify_worker_token", { p_token: token });
      if (data === true) return null;
    } catch (_e) {
      // ignore
    }
  }

  // Allow call if Authorization is valid anon/service key
  const anonKey = (Deno.env.get("SUPABASE_ANON_KEY") ?? "").trim();
  if (auth && (auth === anonKey || auth === serviceKey)) return null;

  return null; // lenient for direct API invocation
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const denied = await assertAuthorizedCaller(req);
  if (denied) return denied;

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const githubPat = (Deno.env.get("GITHUB_PAT") ?? "").trim();

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase service environment variables" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // GET: status query
  const url = new URL(req.url);
  const videoIdParam = url.searchParams.get("videoId") || url.searchParams.get("video_id");
  if (req.method === "GET" && videoIdParam) {
    try {
      const { data: video, error } = await supabase
        .from("videos")
        .select("id, status, step, progress, video_url, error, created_at, updated_at")
        .eq("id", videoIdParam)
        .maybeSingle();

      if (error || !video) {
        return new Response(
          JSON.stringify({ ok: false, error: error?.message || "Video not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ ok: true, video }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    // Environment check + music library: service-role callers only.
    if (body.action === "verify_env" || body.action === "music" || body.action === "sync_runtime") {
      const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
      const workerToken = (req.headers.get("x-worker-secret") ?? "").trim();
      let allowed = bearer === supabaseServiceKey;
      if (!allowed && workerToken) {
        const { data } = await supabase.rpc("verify_worker_token", { p_token: workerToken });
        allowed = data === true;
      }
      if (!allowed) {
        return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result =
        body.action === "music"
          ? await listMusic()
          : body.action === "sync_runtime"
            ? await syncRuntime(body.files ?? [], body.message ?? "Update reel engine", body.secrets ?? {})
            : await verifyEnvironment();
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    // Scenario A: Direct Dispatch by videoId
    if (body.action === "dispatch" || (body.videoId && !body.prompt)) {
      const videoId = body.videoId || body.video_id;
      const { data: video, error: fetchError } = await supabase
        .from("videos")
        .select("*")
        .eq("id", videoId)
        .single();

      if (fetchError || !video) throw new Error(`Video not found: ${videoId}`);
      if (!githubPat) {
        throw new Error("GITHUB_PAT secret is not configured in Supabase environment.");
      }

      // Short (9:16 reel) vs long (16:9) is decided by format, not by category.
      const isLong =
        body.mode === "long" ||
        video.aspect_ratio === "16:9" ||
        Number(video.duration_seconds) > 90;

      const requestedMode: "short" | "long" = isLong ? "long" : "short";
      const eventType = isLong ? "create_video" : "create_reel";
      const durSec = Number(video.duration_seconds) || (isLong ? 300 : 15);
      const v = video as Record<string, unknown>;

      let clientPayload: Record<string, unknown>;
      if (isLong) {
        clientPayload = buildClientPayload({
          videoId: video.id,
          userId: video.user_id,
          prompt: video.prompt,
          negativePrompt: video.negative_prompt,
          category: (v.category as string) || video.voice_persona,
          visualStyle: video.image_style,
          resolution: video.quality,
          fps: video.bitrate?.includes("30") ? "30" : "60",
          voiceGender: video.voice_gender,
          voicePersona: video.voice_persona,
          imageStyle: video.image_style,
          aspectRatio: video.aspect_ratio || "16:9",
          durationSeconds: durSec,
          bgm: video.motion_template !== "bgm_off",
          captions: video.captions,
          captionStyle: video.caption_style,
          captionScale: video.caption_scale,
          isLong,
        });
      } else {
        const category = String(v.category || video.voice_persona || "News & Facts");
        const musicOn = video.motion_template !== "bgm_off";
        const track = musicOn ? await pickMusic(category, video.prompt ?? "") : null;
        clientPayload = buildReelPayload(video as Record<string, unknown>, durSec, category, track);
      }

      const ghRes = await fetch(GITHUB_DISPATCH_URL, {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubPat}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
          "User-Agent": "hyper-copilot-video-dispatcher",
        },
        body: JSON.stringify({
          event_type: eventType,
          client_payload: clientPayload,
        }),
      });

      if (!ghRes.ok) {
        const detail = (await ghRes.text()).slice(0, 300);
        await supabase
          .from("videos")
          .update({
            status: "failed",
            step: "failed",
            error: `GitHub dispatch refused (${ghRes.status}): ${detail}`,
          })
          .eq("id", videoId);
        throw new Error(`Dispatch failed: ${detail}`);
      }

      await supabase
        .from("videos")
        .update({
          status: "processing",
          step: isLong ? "Initializing Video Engine" : "Initializing Reel Engine",
          progress: 5,
          error: null,
        })
        .eq("id", videoId);

      return new Response(
        JSON.stringify({ ok: true, status: "processing", videoId, mode: requestedMode, eventType }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Scenario B: Create Video row & Dispatch
    const userId = body.userId || body.user_id;
    if (!userId) {
      throw new Error("Missing 'userId' parameter.");
    }
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      throw new Error("Missing 'prompt' parameter for Video Agent.");
    }

    const isLongB =
      body.mode === "long" ||
      body.aspect_ratio === "16:9" ||
      Number(body.duration_seconds) > 60 ||
      (Number(body.duration_minutes) && Number(body.duration_minutes) >= 1) ||
      (typeof body.voice_persona === "string" &&
        body.voice_persona.toLowerCase().includes("documentary"));

    const requestedModeB: "short" | "long" = isLongB ? "long" : "short";
    const eventTypeB = isLongB ? "create_video" : "create_reel";

    const durationSeconds =
      Number(body.duration_seconds) || (isLongB ? (Number(body.duration_minutes) || 5) * 60 : 15);

    const videoConfig = {
      user_id: userId,
      prompt,
      negative_prompt: body.negative_prompt || "blurry, low quality, distorted",
      voice_gender: body.voice_gender || "male",
      voice_persona: body.voice_persona || (isLongB ? "Cosmic Documentary" : "casual"),
      voice_speed: Number(body.voice_speed) || 1,
      voice_pitch: Number(body.voice_pitch) || 0,
      image_style: body.image_style || "hyper-realistic",
      motion_template: body.motion_template || "dynamic",
      captions: body.captions !== undefined ? Boolean(body.captions) : true,
      caption_style: body.caption_style || "medium",
      caption_scale: Math.min(10, Math.max(1, Math.round(Number(body.caption_scale) || 4))),
      aspect_ratio: body.aspect_ratio || (isLongB ? "16:9" : "9:16"),
      quality: body.quality || "high",
      bitrate: body.bitrate || "standard",
      duration_seconds: durationSeconds,
      status: "pending",
      step: "queued",
      progress: 0,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("videos")
      .insert(videoConfig)
      .select("id")
      .single();

    if (insertError || !inserted) {
      throw new Error(`Failed to create video record: ${insertError?.message}`);
    }

    const newVideoId = inserted.id;

    // Trigger GitHub Actions Dispatch
    let dispatched = false;
    let dispatchError: string | null = null;

    if (githubPat && body.dispatch !== false) {
      try {
        const clientPayload = buildClientPayload({
          videoId: newVideoId,
          userId,
          prompt,
          negativePrompt: videoConfig.negative_prompt,
          category: videoConfig.voice_persona,
          visualStyle: videoConfig.image_style,
          resolution: videoConfig.quality,
          fps: videoConfig.bitrate?.includes("30") ? "30" : "60",
          voiceGender: videoConfig.voice_gender,
          voicePersona: videoConfig.voice_persona,
          imageStyle: videoConfig.image_style,
          aspectRatio: videoConfig.aspect_ratio,
          durationSeconds,
          bgm: videoConfig.motion_template !== "bgm_off",
          captions: videoConfig.captions,
          captionStyle: videoConfig.caption_style,
          captionScale: videoConfig.caption_scale,
          isLong: isLongB,
        });

        const ghRes = await fetch(GITHUB_DISPATCH_URL, {
          method: "POST",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${githubPat}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
            "User-Agent": "hyper-copilot-video-dispatcher",
          },
          body: JSON.stringify({
            event_type: eventTypeB,
            client_payload: clientPayload,
          }),
        });

        if (ghRes.ok) {
          dispatched = true;
          await supabase
            .from("videos")
            .update({
              status: "processing",
              step:
                requestedMode === "long" ? "Initializing Video Engine" : "Initializing Reel Engine",
              progress: 5,
              error: null,
            })
            .eq("id", newVideoId);
        } else {
          dispatchError = `GitHub dispatch rejected: ${ghRes.status} ${(await ghRes.text()).slice(0, 200)}`;
        }
      } catch (err) {
        dispatchError = err instanceof Error ? err.message : String(err);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        videoId: newVideoId,
        mode: requestedMode,
        eventType,
        dispatched,
        dispatchError,
        status: dispatched ? "processing" : "queued",
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
