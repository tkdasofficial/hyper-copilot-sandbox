<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

Copilot history is an animated right-side page owned by CopilotShell, supporting horizontal touch and trackpad gestures; keep the old history URL as a redirect to /copilot so saved links remain usable without a separate history page.
Copilot conversation and composer remain on their existing routes/components because changing their rendering is outside the navigation workflow scope.
Build workspace uses stable initial window IDs and one active ID for its full-size snap carousel, centered minimized preview carousel, and centered scrolling navigation; Tools is the permanent last window represented by [+], new windows insert before it, and Workspace Settings is a separate view that preserves the active window on return.
Builder Chat's autonomous conversation and Raw Actions are local mock-only state in the Chat window, so this visual demo never invokes AI, tools, files, or build execution.
Copilot intent classification lives in the authenticated app server and returns only implemented action states; this keeps client display state aligned with actual backend work.
- All OAuth (Supabase sign-in, Google/Meta/GitHub linking) returns to /auth/callback; the state prefix picks the flow — one redirect URL to register per service.
- Build Tools pages live in src/tools/{git,code,files,cloud,skills} with provider folders; Files and Code share one project-files store; only GitHub is live (real linked accounts), GitLab/Bitbucket/Cloud/Skills stay placeholders — never fake connected states.
- Reel engine source of truth lives in runtime/reel/ and is published to the private TKDasOfficial/hyper-copilot-runtime repo (reel/) via GitHub API with GITHUB_PAT; why: /tmp work is lost between sessions.
