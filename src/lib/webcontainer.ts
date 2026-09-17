import {
  WebContainer,
  type FileSystemTree,
  type WebContainerProcess,
} from "@webcontainer/api";

export type ServerLifecycleStatus = "idle" | "starting" | "running" | "error";

export interface DevServerState {
  status: ServerLifecycleStatus;
  port: number | null;
  url: string | null;
  error: string | null;
  commandUsed: string | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __webcontainerPromise: Promise<WebContainer> | undefined;
  // eslint-disable-next-line no-var
  var __webcontainerInstance: WebContainer | undefined;
  // eslint-disable-next-line no-var
  var __nudgeDevServerState: DevServerState | undefined;
  // eslint-disable-next-line no-var
  var __nudgeDevServerProcess: WebContainerProcess | undefined;
  // eslint-disable-next-line no-var
  var __nudgeDevServerUnsubscribe: (() => void) | undefined;
  // eslint-disable-next-line no-var
  var __nudgeDevServerStartPromise: Promise<DevServerState> | undefined;
  // eslint-disable-next-line no-var
  var __nudgeDevServerListeners: Set<(state: DevServerState) => void> | undefined;
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
    process.output
      .pipeTo(
        new WritableStream({
          write(chunk) {
            options.output?.(chunk);
            options.terminal?.write(chunk);
          },
        })
      )
      .catch(() => {
        // Stream aborted/closed when process exits; ignore error
      });
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

export interface DetectedServerCommand {
  command: string;
  args: string[];
  type: "npm-script" | "node-server" | "static-html";
  description: string;
}

/**
 * Ensures a lightweight, zero-dependency static HTTP server script exists in the WebContainer.
 * Used to serve index.html / frontend assets when no custom backend or dev server exists.
 */
export async function ensureStaticServerFile(): Promise<string> {
  const scriptName = ".nudge_static_server.cjs";
  const scriptContent = `const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url ? req.url.split('?')[0] : '/';
  let safePath = path.normalize(urlPath).replace(/^(\\.\\.[\\/\\\\])+/, '');
  if (safePath === '/' || safePath === '\\\\') safePath = '/index.html';
  
  let filePath = path.join('.', safePath);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        if (fs.existsSync('index.html') && !path.extname(safePath)) {
          fs.readFile('index.html', (spaErr, spaData) => {
            if (spaErr) {
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              res.end('404 Not Found');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(spaData);
            }
          });
          return;
        }
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found: ' + urlPath);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log('🚀 Static Web Server listening on port ' + PORT);
});
`;
  await writeProjectFile(scriptName, scriptContent);
  return scriptName;
}

/**
 * Automatically inspects the WebContainer filesystem and detects the appropriate
 * command to start the project's dev/web server.
 */
export async function detectServerCommand(): Promise<DetectedServerCommand> {
  const container = await getWebContainer();
  let rootFiles: string[] = [];
  try {
    const entries = await container.fs.readdir(".", { withFileTypes: true });
    rootFiles = entries.map((e) => (typeof e === "string" ? e : e.name));
  } catch (err) {
    console.warn("Failed to read root directory for server detection:", err);
  }

  // 1. Check package.json scripts
  if (rootFiles.includes("package.json")) {
    try {
      const rawPkg = await container.fs.readFile("package.json", "utf-8");
      const pkg = JSON.parse(rawPkg);
      if (pkg.scripts?.dev) {
        return {
          command: "npm",
          args: ["run", "dev"],
          type: "npm-script",
          description: "npm run dev",
        };
      }
      if (pkg.scripts?.start) {
        return {
          command: "npm",
          args: ["start"],
          type: "npm-script",
          description: "npm start",
        };
      }
    } catch {
      // Ignore JSON parse error, fall through
    }
  }

  // 2. Check Node backend server entry points
  const candidateServers = [
    "server.js",
    "app.js",
    "index.js",
    "src/server.js",
    "src/index.js",
    "src/app.js",
  ];
  for (const candidate of candidateServers) {
    if (candidate.includes("/")) {
      try {
        const stat = await container.fs.readFile(candidate, "utf-8");
        if (stat) {
          return {
            command: "node",
            args: [candidate],
            type: "node-server",
            description: `node ${candidate}`,
          };
        }
      } catch {
        // Does not exist
      }
    } else if (rootFiles.includes(candidate)) {
      return {
        command: "node",
        args: [candidate],
        type: "node-server",
        description: `node ${candidate}`,
      };
    }
  }

  // 3. Check for HTML frontend projects (e.g. index.html or any html file)
  const hasHtml = rootFiles.some((f) => f.toLowerCase().endsWith(".html"));
  if (hasHtml || rootFiles.includes("index.html")) {
    const staticScript = await ensureStaticServerFile();
    return {
      command: "node",
      args: [staticScript],
      type: "static-html",
      description: "Static Web Server (index.html)",
    };
  }

  // 4. Default fallback: create static server for current directory
  const staticScript = await ensureStaticServerFile();
  return {
    command: "node",
    args: [staticScript],
    type: "static-html",
    description: "WebContainer Dev Server",
  };
}

function getDevServerListeners(): Set<(state: DevServerState) => void> {
  if (!globalThis.__nudgeDevServerListeners) {
    globalThis.__nudgeDevServerListeners = new Set();
  }
  return globalThis.__nudgeDevServerListeners;
}

export function getDevServerState(): DevServerState {
  if (!globalThis.__nudgeDevServerState) {
    globalThis.__nudgeDevServerState = {
      status: "idle",
      port: null,
      url: null,
      error: null,
      commandUsed: null,
    };
  }
  return globalThis.__nudgeDevServerState;
}

function setDevServerState(nextState: DevServerState): void {
  globalThis.__nudgeDevServerState = nextState;
  const listeners = getDevServerListeners();
  for (const listener of listeners) {
    try {
      listener(nextState);
    } catch (err) {
      console.error("Error in DevServer listener:", err);
    }
  }
}

export function subscribeDevServer(
  listener: (state: DevServerState) => void
): () => void {
  const listeners = getDevServerListeners();
  listeners.add(listener);
  try {
    listener(getDevServerState());
  } catch (err) {
    console.error("Error invoking DevServer subscriber:", err);
  }
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Cleanly stops the active dev server, ensuring the process terminates
 * and network ports are fully released.
 */
export async function stopDevServer(): Promise<void> {
  const currentProcess = globalThis.__nudgeDevServerProcess;
  const unsubscribe = globalThis.__nudgeDevServerUnsubscribe;

  if (unsubscribe) {
    try {
      unsubscribe();
    } catch {}
    globalThis.__nudgeDevServerUnsubscribe = undefined;
  }

  if (currentProcess) {
    try {
      currentProcess.kill();
      await Promise.race([
        currentProcess.exit,
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    } catch {}
    globalThis.__nudgeDevServerProcess = undefined;
  }

  globalThis.__nudgeDevServerStartPromise = undefined;
  setDevServerState({
    status: "idle",
    port: null,
    url: null,
    error: null,
    commandUsed: null,
  });
}

/**
 * Starts the project's dev server and listens for WebContainer's 'server-ready' event.
 * Follows the authoritative lifecycle: idle -> starting -> running / error.
 * Prevents multiple concurrent processes and returns in-flight promises.
 */
export async function startDevServer(
  options: DevServerOptions = {}
): Promise<DevServerState> {
  const currentState = getDevServerState();

  // 1. If server is already running with an active URL, return immediately (idempotent)
  if (currentState.status === "running" && currentState.url) {
    options.onServerReady?.(currentState.port || 0, currentState.url);
    return currentState;
  }

  // 2. If server startup is already in flight, return existing promise (prevents duplicate start / double clicks)
  if (globalThis.__nudgeDevServerStartPromise) {
    return globalThis.__nudgeDevServerStartPromise;
  }

  // 3. Initiate single authoritative startup
  const startPromise = (async (): Promise<DevServerState> => {
    // If a stale process reference exists, terminate it cleanly first
    if (globalThis.__nudgeDevServerProcess) {
      await stopDevServer();
    }

    setDevServerState({
      status: "starting",
      port: null,
      url: null,
      error: null,
      commandUsed: null,
    });

    const webcontainer = await getWebContainer();

    // Command resolution
    let command = options.command;
    let args = options.args;
    let commandDescription = "";

    if (!command) {
      const detected = await detectServerCommand();
      command = detected.command;
      args = detected.args;
      commandDescription = detected.description;
    } else {
      commandDescription = `${command} ${(args || []).join(" ")}`.trim();
    }

    setDevServerState({
      status: "starting",
      port: null,
      url: null,
      error: null,
      commandUsed: commandDescription,
    });

    options.onOutput?.(`➜ ${commandDescription}\n⚡ [WebContainer] Starting ${commandDescription}...\n`);

    // Check if npm install is needed
    if (
      command === "npm" ||
      (command === "node" && args?.[0]?.includes("server"))
    ) {
      let hasNodeModules = false;
      try {
        const entries = await webcontainer.fs.readdir(".", { withFileTypes: true });
        hasNodeModules = entries.some(
          (e: any) => (typeof e === "string" ? e : e.name) === "node_modules"
        );
      } catch {
        hasNodeModules = false;
      }

      if (!hasNodeModules) {
        options.onOutput?.("📦 Installing project dependencies (npm install)...\n");
        const installProc = await spawnProcess("npm", ["install"], {
          output: options.onOutput,
        });
        const installExitCode = await installProc.exit;
        if (installExitCode !== 0) {
          const errMessage = `Dependency installation (npm install) failed with exit code ${installExitCode}`;
          options.onOutput?.(`❌ ${errMessage}\n`);
          const failedState: DevServerState = {
            status: "error",
            port: null,
            url: null,
            error: errMessage,
            commandUsed: commandDescription,
          };
          setDevServerState(failedState);
          throw new Error(errMessage);
        }
        options.onOutput?.("✔ Dependencies ready.\n");
      }
    }

    // Set up server-ready listener BEFORE spawning the process
    let resolveServerReady: (state: DevServerState) => void;
    let rejectServerReady: (err: Error) => void;
    const readyPromise = new Promise<DevServerState>((resolve, reject) => {
      resolveServerReady = resolve;
      rejectServerReady = reject;
    });

    if (globalThis.__nudgeDevServerUnsubscribe) {
      try {
        globalThis.__nudgeDevServerUnsubscribe();
      } catch {}
      globalThis.__nudgeDevServerUnsubscribe = undefined;
    }

    const unsubscribe = webcontainer.on("server-ready", (port, url) => {
      const readyState: DevServerState = {
        status: "running",
        port,
        url,
        error: null,
        commandUsed: commandDescription,
      };
      setDevServerState(readyState);
      options.onServerReady?.(port, url);
      options.onOutput?.(
        `✔ [WebContainer] Dev Server Ready! Listening on port ${port}\n🌐 Live Preview URL: ${url}\n`
      );
      resolveServerReady(readyState);
    });
    globalThis.__nudgeDevServerUnsubscribe = unsubscribe;

    // Spawn server process
    const proc = await spawnProcess(command, args || [], {
      output: options.onOutput,
    });
    globalThis.__nudgeDevServerProcess = proc;

    // Attach exit handler
    proc.exit.then((code) => {
      if (globalThis.__nudgeDevServerProcess !== proc) return;

      globalThis.__nudgeDevServerProcess = undefined;
      if (globalThis.__nudgeDevServerUnsubscribe) {
        try {
          globalThis.__nudgeDevServerUnsubscribe();
        } catch {}
        globalThis.__nudgeDevServerUnsubscribe = undefined;
      }

      const wasRunning = getDevServerState().status === "running";
      const errorMsg = wasRunning
        ? (code === 0 ? null : `Dev server stopped (code ${code})`)
        : `Dev server exited before becoming ready (code ${code}). See terminal output.`;

      const exitStatus: ServerLifecycleStatus = wasRunning
        ? (code === 0 ? "idle" : "error")
        : "error";

      setDevServerState({
        status: exitStatus,
        port: null,
        url: null,
        error: errorMsg,
        commandUsed: commandDescription,
      });

      options.onOutput?.(
        wasRunning
          ? `ℹ Server process exited with code ${code}\n`
          : `❌ Server exited before becoming ready (code ${code}). See process output above.\n`
      );

      if (!wasRunning) {
        rejectServerReady(new Error(errorMsg || `Server process exited with code ${code}`));
      }
    });

    return await readyPromise;
  })();

  globalThis.__nudgeDevServerStartPromise = startPromise;

  try {
    return await startPromise;
  } finally {
    globalThis.__nudgeDevServerStartPromise = undefined;
  }
}

/**
 * Restarts the project's dev server by gracefully terminating the running process,
 * releasing all ports, and starting a fresh server instance.
 */
export async function restartDevServer(
  options: DevServerOptions = {}
): Promise<DevServerState> {
  await stopDevServer();
  return await startDevServer(options);
}

/**
 * Attaches a listener for the WebContainer 'server-ready' event.
 * Returns an unsubscription function.
 */
export async function onServerReady(
  callback: (port: number, url: string) => void
): Promise<() => void> {
  const webcontainer = await getWebContainer();
  return webcontainer.on("server-ready", callback);
}

export interface DirEntry {
  name: string;
  isDirectory: boolean;
}

/**
 * Lists the contents of a directory in the WebContainer filesystem.
 * Returns an array of entries with name and type (file vs directory).
 */
export async function listDirectory(dirPath: string): Promise<DirEntry[]> {
  const webcontainer = await getWebContainer();
  const cleanPath = dirPath.replace(/^\/+/, "") || ".";
  const entries = await webcontainer.fs.readdir(cleanPath, {
    withFileTypes: true,
  });
  return entries.map((entry) => ({
    name: typeof entry === "string" ? entry : entry.name,
    isDirectory: typeof entry === "string" ? false : entry.isDirectory(),
  }));
}

/**
 * Creates a directory in the WebContainer filesystem.
 * Automatically creates parent directories if they don't exist.
 */
export async function createDirectory(dirPath: string): Promise<void> {
  const webcontainer = await getWebContainer();
  const cleanPath = dirPath.replace(/^\/+/, "");
  await webcontainer.fs.mkdir(cleanPath, { recursive: true });
}

/**
 * Deletes a file or directory from the WebContainer filesystem.
 */
export async function deleteEntry(entryPath: string): Promise<void> {
  const webcontainer = await getWebContainer();
  const cleanPath = entryPath.replace(/^\/+/, "");
  if (!cleanPath || cleanPath === ".") return;
  await webcontainer.fs.rm(cleanPath, { recursive: true, force: true });
}

/**
 * Renames or moves a file or directory in the WebContainer filesystem.
 */
export async function renameEntry(
  oldPath: string,
  newPath: string
): Promise<void> {
  const webcontainer = await getWebContainer();
  const cleanOld = oldPath.replace(/^\/+/, "");
  const cleanNew = newPath.replace(/^\/+/, "");

  if (!cleanOld || !cleanNew || cleanOld === cleanNew) return;

  const lastSlashIndex = cleanNew.lastIndexOf("/");
  if (lastSlashIndex !== -1) {
    const parentDir = cleanNew.slice(0, lastSlashIndex);
    await webcontainer.fs.mkdir(parentDir, { recursive: true });
  }

  if (typeof (webcontainer.fs as any).rename === "function") {
    await (webcontainer.fs as any).rename(cleanOld, cleanNew);
  } else {
    const content = await webcontainer.fs.readFile(cleanOld, "utf-8");
    await webcontainer.fs.writeFile(cleanNew, content);
    await webcontainer.fs.rm(cleanOld, { recursive: true, force: true });
  }
}
