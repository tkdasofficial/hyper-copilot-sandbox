export type GitProviderStatus = "active" | "coming-soon";
export type GitProvider = { id: "github" | "gitlab" | "bitbucket"; name: string; status: GitProviderStatus };
