import {
  WebContainer,
  type FileSystemTree,
  type WebContainerProcess,
} from "@webcontainer/api";

declare global {
  // eslint-disable-next-line no-var
  var __webcontainerPromise: Promise<WebContainer> | undefined;
  // eslint-disable-next-line no-var
  var __webcontainerInstance: WebContainer | undefined;
}

export interface ProjectFileItem {
  path: string;
  content: string;
  visible?: boolean;
  editable?: boolean;
}

export interface SpawnProcessOptions {
  output?: (data: string) => void;
  terminal?: {
    write: (data: string) => void;
  };
}

export interface DevServerOptions {
  command?: string;
  args?: string[];
  onServerReady?: (port: number, url: string) => void;
  onOutput?: (chunk: string) => void;
}

/**
 * Returns the singleton WebContainer instance.
 * Preserves the instance across Next.js Fast Refresh cycles using globalThis.
 */
export async function getWebContainer(): Promise<WebContainer> {
  if (typeof window === "undefined") {
    throw new Error(
      "WebContainer can only be initialized in client-side browser environments."
    );
  }

  // Return existing booted instance if available
  if (globalThis.__webcontainerInstance) {
    return globalThis.__webcontainerInstance;
  }

  // Return ongoing boot promise if in progress
  if (globalThis.__webcontainerPromise) {
    return globalThis.__webcontainerPromise;
  }

  // Boot singleton instance
  globalThis.__webcontainerPromise = WebContainer.boot()
    .then((instance) => {
      globalThis.__webcontainerInstance = instance;
      return instance;
    })
    .catch((err) => {
      // Clear cache on failure to allow retry
      globalThis.__webcontainerPromise = undefined;
      globalThis.__webcontainerInstance = undefined;
      console.error("Failed to boot WebContainer:", err);
      throw err;
    });

  return globalThis.__webcontainerPromise;
}

/**
 * Transforms a flat list of project files into a WebContainer FileSystemTree.
 * Supports arbitrary nested directories and hidden/non-editable files.
 */
export function createFileSystemTree(
  files: Array<{ path: string; content: string }>
): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const file of files) {
    // Normalize path by trimming leading/trailing slashes
    const normalizedPath = file.path.replace(/^\/+|\/+$/g, "");
    if (!normalizedPath) continue;

    const segments = normalizedPath.split("/");
    let currentLevel: any = tree;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const isFile = i === segments.length - 1;

      if (isFile) {
        currentLevel[segment] = {
          file: {
            contents: file.content ?? "",
          },
        };
      } else {
        if (!currentLevel[segment]) {
          currentLevel[segment] = {
            directory: {},
          };
        }
        currentLevel = currentLevel[segment].directory;
      }
    }
  }

  return tree;
}

/**
 * Mounts project files into the WebContainer filesystem.
 * Accepts files from MongoDB Project or UserProject models.
 */
export async function mountProject(
  files: Array<{ path: string; content: string }>
): Promise<WebContainer> {
  const webcontainer = await getWebContainer();
  const tree = createFileSystemTree(files);
  await webcontainer.mount(tree);
  return webcontainer;
}

/**
 * Reads the content of a file from the WebContainer.
 */
export async function readProjectFile(filePath: string): Promise<string> {
  const webcontainer = await getWebContainer();
  const cleanPath = filePath.replace(/^\/+/, "");
  return await webcontainer.fs.readFile(cleanPath, "utf-8");
}

/**
 * Writes content to a file in the WebContainer.
 * Automatically creates parent directories if they don't exist.
 */
export async function writeProjectFile(
  filePath: string,
  content: string
): Promise<void> {
  const webcontainer = await getWebContainer();
  const cleanPath = filePath.replace(/^\/+/, "");

  const lastSlashIndex = cleanPath.lastIndexOf("/");
  if (lastSlashIndex !== -1) {
    const dirPath = cleanPath.slice(0, lastSlashIndex);
    await webcontainer.fs.mkdir(dirPath, { recursive: true });
  }

  await webcontainer.fs.writeFile(cleanPath, content);
}

/**
 * Spawns a process in WebContainer with streaming output support for terminals.
 */
export async function spawnProcess(
  command: string,
  args: string[] = [],
  options?: SpawnProcessOptions
): Promise<WebContainerProcess> {
  const webcontainer = await getWebContainer();
  const process = await webcontainer.spawn(command, args);

  if (options?.output || options?.terminal) {
    process.output.pipeTo(
      new WritableStream({
        write(chunk) {
          options.output?.(chunk);
          options.terminal?.write(chunk);
        },
      })
    );
  }

  return process;
}

/**
 * Executes a command and waits for it to complete, returning the exit code.
 */
export async function runCommand(
  command: string,
  args: string[] = [],
  onOutput?: (chunk: string) => void
): Promise<number> {
  const process = await spawnProcess(command, args, { output: onOutput });
  return await process.exit;
}

/**
 * Starts the project's dev server and listens for WebContainer's 'server-ready' event.
 * Obtains the live preview URL dynamically (does not assume localhost).
 */
export async function startDevServer(options: DevServerOptions = {}): Promise<{
  process: WebContainerProcess;
  urlPromise: Promise<{ port: number; url: string }>;
}> {
  const webcontainer = await getWebContainer();
  const command = options.command || "npm";
  const args = options.args || ["run", "dev"];

  let resolveServerUrl: (val: { port: number; url: string }) => void;
  const urlPromise = new Promise<{ port: number; url: string }>((resolve) => {
    resolveServerUrl = resolve;
  });

  const unsubscribe = webcontainer.on("server-ready", (port, url) => {
    options.onServerReady?.(port, url);
    resolveServerUrl({ port, url });
  });

  const process = await spawnProcess(command, args, {
    output: options.onOutput,
  });

  process.exit.then(() => {
    unsubscribe();
  });

  return { process, urlPromise };
}
