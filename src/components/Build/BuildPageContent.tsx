import type { PageType } from "./build-data";
import { BuildChat } from "./Chat";
import { BuildPreview } from "./Preview";
import { BuildCode } from "./Code";
import { BuildFiles } from "./Files";
import { BuildTerminal } from "./Terminal";
import { BuildGit } from "./Git";
import { BuildCloud } from "./Cloud";
import { BuildSkills } from "./Skills";
import { BuildTools } from "./Tools";
import { BuildPipeline } from "./Pipeline";
import { BuildLogs } from "./Logs";
import { ToolsWindow } from "./ToolsWindow";

export function BuildPageContent({ type, compact = false, onOpenTool }: { type: PageType; compact?: boolean; onOpenTool?: (type: PageType) => void }) {
  switch (type) {
    case "chat":
      return <BuildChat compact={compact} />;
    case "preview":
      return <BuildPreview compact={compact} />;
    case "code":
      return <BuildCode />;
    case "files":
      return <BuildFiles />;
    case "terminal":
      return <BuildTerminal />;
    case "git":
      return <BuildGit />;
    case "supabase":
      return <BuildCloud provider="Supabase" />;
    case "firebase":
      return <BuildCloud provider="Firebase" />;
    case "skills":
      return <BuildSkills />;
    case "tools":
      return <ToolsWindow onOpen={onOpenTool} />;
    case "build":
      return <BuildPipeline />;
    case "logs":
      return <BuildLogs />;
  }
}
