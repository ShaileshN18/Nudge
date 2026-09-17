import type { ProjectFileContent, TaskDefinition } from "@/lib/ai/types";

const normalize = (path: string) => path.replace(/^\/+/, "").toLowerCase();

/** Select only task targets and the active file. The browser can supply live WebContainer content. */
export function selectRelevantFiles(task: TaskDefinition, files: ProjectFileContent[], activeFilePath?: string) {
  const targets = new Set(task.targetFiles.map(normalize));
  const active = normalize(activeFilePath || "");
  return files.filter((file) => {
    const path = normalize(file.path);
    return targets.has(path) || path === active || [...targets].some((target) => path.endsWith(`/${target}`) || target.endsWith(`/${path}`));
  });
}
