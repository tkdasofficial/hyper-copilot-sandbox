import { githubProvider } from "./github";
import { gitlabProvider } from "./gitlab";
import { bitbucketProvider } from "./bitbucket";

export const GIT_PROVIDERS = [githubProvider, gitlabProvider, bitbucketProvider];
export type { GitProvider } from "./types";
