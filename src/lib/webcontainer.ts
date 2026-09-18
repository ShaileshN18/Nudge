import {
  WebContainer,
  type FileSystemTree,
  type WebContainerProcess,
} from "@webcontainer/api";

export type ServerLifecycleStatus =
  | "idle"
  | "starting"
  | "running"
  | "error";

export interface DevServerState {
  status: ServerLifecycleStatus;
  port: number | null;
  url: string | null;
  error: string | null;
  commandUsed: string | null;
}

declare global {
  var __webcontainerPromise: Promise<WebContainer> | undefined;
  var __webcontainerInstance: WebContainer | undefined;

  var __nudgeDevServerState: DevServerState | undefined;
  var __nudgeDevServerProcess: WebContainerProcess | undefined;
  var __nudgeDevServerUnsubscribe: (() => void) | undefined;
  var __nudgeDevServerStartPromise: Promise<DevServerState> | undefined;
  var __nudgeDevServerGeneration: number | undefined;
  var __nudgeDevServerSetupProcess: WebContainerProcess | undefined;
  var __nudgeDevServerListeners:
    | Set<(state: DevServerState) => void>
    | undefined;
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

class DevServerStartCancelledError extends Error {
  constructor() {
    super("Dev server startup was cancelled");
    this.name = "DevServerStartCancelledError";
  }
}

function getDevServerGeneration(): number {
  if (globalThis.__nudgeDevServerGeneration === undefined) {
    globalThis.__nudgeDevServerGeneration = 0;
  }

  return globalThis.__nudgeDevServerGeneration;
}

function assertCurrentStart(generation: number): void {
  if (getDevServerGeneration() !== generation) {
    throw new DevServerStartCancelledError();
  }
}

/* ============================================================
   WEBCONTAINER
   ============================================================ */

export async function getWebContainer(): Promise<WebContainer> {
  if (typeof window === "undefined") {
    throw new Error(
      "WebContainer can only be initialized in client-side browser environments."
    );
  }

  if (globalThis.__webcontainerInstance) {
    return globalThis.__webcontainerInstance;
  }

  if (globalThis.__webcontainerPromise) {
    return globalThis.__webcontainerPromise;
  }

  globalThis.__webcontainerPromise = WebContainer.boot()
    .then((instance) => {
      globalThis.__webcontainerInstance = instance;
      return instance;
    })
    .catch((err) => {
      globalThis.__webcontainerPromise = undefined;
      globalThis.__webcontainerInstance = undefined;

      console.error("Failed to boot WebContainer:", err);
      throw err;
    });

  return globalThis.__webcontainerPromise;
}

/* ============================================================
   FILE SYSTEM
   ============================================================ */

export function createFileSystemTree(
  files: Array<{ path: string; content: string }>
): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const file of files) {
    const normalizedPath = file.path.replace(/^\/+|\/+$/g, "");

    if (!normalizedPath) {
      continue;
    }

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
 * Mounts a complete project into WebContainer.
 *
 * IMPORTANT:
 * This is the only operation that should replace the project filesystem.
 * It stops the currently running server first.
 */
export async function mountProject(
  files: Array<{ path: string; content: string }>
): Promise<WebContainer> {
  const webcontainer = await getWebContainer();

  await stopDevServer();

  const entries = await webcontainer.fs.readdir(".", {
    withFileTypes: true,
  });

  await Promise.all(
    entries.map((entry) => {
      const name = typeof entry === "string" ? entry : entry.name;

      return webcontainer.fs.rm(name, {
        recursive: true,
        force: true,
      });
    })
  );

  const tree = createFileSystemTree(files);

  await webcontainer.mount(tree);

  return webcontainer;
}

export async function readProjectFile(
  filePath: string
): Promise<string> {
  const webcontainer = await getWebContainer();

  const cleanPath = filePath.replace(/^\/+/, "");

  return await webcontainer.fs.readFile(cleanPath, "utf-8");
}

export async function writeProjectFile(
  filePath: string,
  content: string
): Promise<void> {
  const webcontainer = await getWebContainer();

  const cleanPath = filePath.replace(/^\/+/, "");

  const lastSlashIndex = cleanPath.lastIndexOf("/");

  if (lastSlashIndex !== -1) {
    const directory = cleanPath.slice(0, lastSlashIndex);

    await webcontainer.fs.mkdir(directory, {
      recursive: true,
    });
  }

  await webcontainer.fs.writeFile(cleanPath, content);
}

/* ============================================================
   PROCESS MANAGEMENT
   ============================================================ */

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
        // Process output stream closed.
      });
  }

  return process;
}

export async function runCommand(
  command: string,
  args: string[] = [],
  onOutput?: (chunk: string) => void
): Promise<number> {
  const process = await spawnProcess(command, args, {
    output: onOutput,
  });

  return await process.exit;
}

/* ============================================================
   STATIC SERVER
   ============================================================ */

export async function ensureStaticServerFile(): Promise<string> {
  const scriptName = ".nudge_static_server.cjs";

  const scriptContent = `
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 5000;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

const server = http.createServer((req, res) => {
  const requestUrl = req.url || "/";
  const urlPath = requestUrl.split("?")[0];

  let safePath = path
    .normalize(urlPath)
    .replace(/^\\.+[\\\\/]/, "");

  if (safePath === "/" || safePath === "\\\\") {
    safePath = "/index.html";
  }

  let filePath = path.join(".", safePath);

  fs.stat(filePath, (statErr, stats) => {
    if (!statErr && stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        // SPA fallback
        if (
          fs.existsSync("index.html") &&
          !path.extname(safePath)
        ) {
          fs.readFile("index.html", (spaErr, spaData) => {
            if (spaErr) {
              res.writeHead(404, {
                "Content-Type": "text/plain"
              });

              res.end("404 Not Found");
              return;
            }

            res.writeHead(200, {
              "Content-Type": "text/html; charset=utf-8"
            });

            res.end(spaData);
          });

          return;
        }

        res.writeHead(404, {
          "Content-Type": "text/plain"
        });

        res.end("404 Not Found: " + urlPath);
        return;
      }

      const extension = path.extname(filePath).toLowerCase();

      const contentType =
        MIME_TYPES[extension] ||
        "application/octet-stream";

      res.writeHead(200, {
        "Content-Type": contentType
      });

      res.end(data);
    });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    "Nudge static server listening on port " + PORT
  );
});
`;

  await writeProjectFile(scriptName, scriptContent);

  return scriptName;
}

/* ============================================================
   SERVER COMMAND DETECTION
   ============================================================ */

export interface DetectedServerCommand {
  command: string;
  args: string[];
  type: "npm-script" | "node-server" | "static-html";
  description: string;
}

export async function detectServerCommand(): Promise<DetectedServerCommand> {
  const container = await getWebContainer();

  let rootFiles: string[] = [];

  try {
    const entries = await container.fs.readdir(".", {
      withFileTypes: true,
    });

    rootFiles = entries.map((entry) =>
      typeof entry === "string"
        ? entry
        : entry.name
    );
  } catch (error) {
    console.warn(
      "Failed to inspect WebContainer filesystem:",
      error
    );
  }

  /* ----------------------------------------------------------
     1. package.json scripts
     ---------------------------------------------------------- */

  if (rootFiles.includes("package.json")) {
    try {
      const rawPackage = await container.fs.readFile(
        "package.json",
        "utf-8"
      );

      const packageJson = JSON.parse(rawPackage);

      /*
       * Frontend/dev server takes priority over server.js.
       */
      if (packageJson.scripts?.dev) {
        return {
          command: "npm",
          args: ["run", "dev"],
          type: "npm-script",
          description: "npm run dev",
        };
      }

      if (packageJson.scripts?.start) {
        return {
          command: "npm",
          args: ["start"],
          type: "npm-script",
          description: "npm start",
        };
      }
    } catch (error) {
      console.warn(
        "Could not parse package.json:",
        error
      );
    }
  }

  /* ----------------------------------------------------------
     2. Static frontend
     ---------------------------------------------------------- */

  const frontendFiles = [
    "vite.config.js",
    "vite.config.ts",
    "vite.config.mjs",
    "next.config.js",
    "next.config.mjs",
    "next.config.ts",
    "src",
    "app",
    "pages",
    "index.html",
  ];

  const hasFrontendStructure = frontendFiles.some(
    (file) => rootFiles.includes(file)
  );

  if (hasFrontendStructure) {
    const staticScript =
      await ensureStaticServerFile();

    return {
      command: "node",
      args: [staticScript],
      type: "static-html",
      description: "Static Web Server",
    };
  }

  /* ----------------------------------------------------------
     3. Backend Node server
     ---------------------------------------------------------- */

  const candidateServers = [
    "server.js",
    "app.js",
    "src/server.js",
    "src/index.js",
    "src/app.js",
    "index.js",
  ];

  for (const candidate of candidateServers) {
    if (candidate.includes("/")) {
      try {
        const content =
          await container.fs.readFile(
            candidate,
            "utf-8"
          );

        if (content) {
          return {
            command: "node",
            args: [candidate],
            type: "node-server",
            description: `node ${candidate}`,
          };
        }
      } catch {
        // File doesn't exist.
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

  /* ----------------------------------------------------------
     4. Plain HTML project
     ---------------------------------------------------------- */

  const hasHtml =
    rootFiles.some((file) =>
      file.toLowerCase().endsWith(".html")
    );

  if (hasHtml) {
    const staticScript =
      await ensureStaticServerFile();

    return {
      command: "node",
      args: [staticScript],
      type: "static-html",
      description: "Static Web Server",
    };
  }

  /* ----------------------------------------------------------
     5. Final fallback
     ---------------------------------------------------------- */

  const staticScript =
    await ensureStaticServerFile();

  return {
    command: "node",
    args: [staticScript],
    type: "static-html",
    description: "WebContainer Dev Server",
  };
}
/* ============================================================
   SERVER STATE
   ============================================================ */

function getDevServerListeners(): Set<
  (state: DevServerState) => void
> {
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

function setDevServerState(
  nextState: DevServerState
): void {
  globalThis.__nudgeDevServerState = nextState;

  const listeners = getDevServerListeners();

  for (const listener of listeners) {
    try {
      listener(nextState);
    } catch (error) {
      console.error(
        "DevServer state listener error:",
        error
      );
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
  } catch (error) {
    console.error(
      "DevServer subscriber error:",
      error
    );
  }

  return () => {
    listeners.delete(listener);
  };
}

/* ============================================================
   STOP SERVER
   ============================================================ */

export async function stopDevServer(): Promise<void> {
  /*
   * Increment generation FIRST.
   *
   * Any startup that was already in progress becomes invalid.
   */
  globalThis.__nudgeDevServerGeneration =
    getDevServerGeneration() + 1;

  const startPromise =
    globalThis.__nudgeDevServerStartPromise;

  const currentProcess =
    globalThis.__nudgeDevServerProcess;

  const setupProcess =
    globalThis.__nudgeDevServerSetupProcess;

  const unsubscribe =
    globalThis.__nudgeDevServerUnsubscribe;

  if (unsubscribe) {
    try {
      unsubscribe();
    } catch { }

    globalThis.__nudgeDevServerUnsubscribe =
      undefined;
  }

  const processes = [
    setupProcess,
    currentProcess,
  ].filter(
    (process): process is WebContainerProcess =>
      Boolean(process)
  );

  for (const process of processes) {
    try {
      process.kill();
    } catch { }
  }

  for (const process of processes) {
    try {
      await process.exit;
    } catch { }
  }

  if (
    globalThis.__nudgeDevServerProcess ===
    currentProcess
  ) {
    globalThis.__nudgeDevServerProcess =
      undefined;
  }

  if (
    globalThis.__nudgeDevServerSetupProcess ===
    setupProcess
  ) {
    globalThis.__nudgeDevServerSetupProcess =
      undefined;
  }

  if (startPromise) {
    try {
      await startPromise;
    } catch {
      // Expected when startup was cancelled.
    }
  }

  setDevServerState({
    status: "idle",
    port: null,
    url: null,
    error: null,
    commandUsed: null,
  });
}

/* ============================================================
   START SERVER
   ============================================================ */

export async function startDevServer(
  options: DevServerOptions = {}
): Promise<DevServerState> {
  const currentState = getDevServerState();

  /*
   * Already running.
   */
  if (
    currentState.status === "running" &&
    currentState.url
  ) {
    options.onServerReady?.(
      currentState.port || 0,
      currentState.url
    );

    return currentState;
  }

  /*
   * Startup already happening.
   */
  if (globalThis.__nudgeDevServerStartPromise) {
    return globalThis.__nudgeDevServerStartPromise;
  }

  const generation = getDevServerGeneration();

  const startPromise = (async () => {
    /*
     * Kill stale process if one somehow remains.
     */
    if (globalThis.__nudgeDevServerProcess) {
      await stopDevServer();
    }

    assertCurrentStart(generation);

    setDevServerState({
      status: "starting",
      port: null,
      url: null,
      error: null,
      commandUsed: null,
    });

    const webcontainer = await getWebContainer();

    assertCurrentStart(generation);

    /* --------------------------------------------------------
       Detect command
       -------------------------------------------------------- */

    let command = options.command;
    let args = options.args;
    let commandDescription = "";

    if (!command) {
      const detected =
        await detectServerCommand();

      assertCurrentStart(generation);

      command = detected.command;
      args = detected.args;
      commandDescription =
        detected.description;
    } else {
      commandDescription =
        `${command} ${(args || []).join(" ")}`.trim();
    }

    setDevServerState({
      status: "starting",
      port: null,
      url: null,
      error: null,
      commandUsed: commandDescription,
    });

    options.onOutput?.(
      `➜ ${commandDescription}\n` +
      `⚡ Starting WebContainer server...\n`
    );

    /* --------------------------------------------------------
       npm install
       -------------------------------------------------------- */

    if (
      command === "npm" ||
      (
        command === "node" &&
        args?.[0]?.includes("server")
      )
    ) {
      let hasNodeModules = false;

      try {
        const entries =
          await webcontainer.fs.readdir(".", {
            withFileTypes: true,
          });

        hasNodeModules = entries.some(
          (entry: any) =>
            (
              typeof entry === "string"
                ? entry
                : entry.name
            ) === "node_modules"
        );
      } catch {
        hasNodeModules = false;
      }

      if (!hasNodeModules) {
        assertCurrentStart(generation);

        options.onOutput?.(
          "📦 Installing dependencies...\n"
        );

        const installProcess =
          await spawnProcess(
            "npm",
            ["install"],
            {
              output: options.onOutput,
            }
          );

        globalThis.__nudgeDevServerSetupProcess =
          installProcess;

        const exitCode =
          await installProcess.exit;

        if (
          globalThis.__nudgeDevServerSetupProcess ===
          installProcess
        ) {
          globalThis.__nudgeDevServerSetupProcess =
            undefined;
        }

        assertCurrentStart(generation);

        if (exitCode !== 0) {
          const errorMessage =
            `npm install failed with exit code ${exitCode}`;

          setDevServerState({
            status: "error",
            port: null,
            url: null,
            error: errorMessage,
            commandUsed: commandDescription,
          });

          options.onOutput?.(
            `❌ ${errorMessage}\n`
          );

          throw new Error(errorMessage);
        }

        options.onOutput?.(
          "✔ Dependencies ready.\n"
        );
      }
    }

    /* --------------------------------------------------------
       WAIT FOR SERVER READY
       -------------------------------------------------------- */

    let resolveServerReady:
      (state: DevServerState) => void;

    let rejectServerReady:
      (error: Error) => void;

    const readyPromise =
      new Promise<DevServerState>(
        (resolve, reject) => {
          resolveServerReady = resolve;
          rejectServerReady = reject;
        }
      );

    /*
     * IMPORTANT:
     * Register server-ready BEFORE spawn().
     */
    if (globalThis.__nudgeDevServerUnsubscribe) {
      try {
        globalThis.__nudgeDevServerUnsubscribe();
      } catch { }

      globalThis.__nudgeDevServerUnsubscribe =
        undefined;
    }

    const unsubscribe =
      webcontainer.on(
        "server-ready",
        (port, url) => {
          /*
           * Ignore events belonging to an old startup.
           */
          if (
            getDevServerGeneration() !==
            generation
          ) {
            return;
          }

          /*
           * DO NOT append /health.
           *
           * `url` is the actual WebContainer preview URL.
           */
          const previewUrl =
            normalizePreviewUrl(url);

          const readyState: DevServerState = {
            status: "running",
            port,
            url: previewUrl,
            error: null,
            commandUsed:
              commandDescription,
          };

          setDevServerState(readyState);

          options.onServerReady?.(
            port,
            previewUrl
          );

          options.onOutput?.(
            `✔ WebContainer server ready\n` +
            `🌐 Preview: ${previewUrl}\n`
          );

          resolveServerReady(readyState);
        }
      );

    globalThis.__nudgeDevServerUnsubscribe =
      unsubscribe;

    /* --------------------------------------------------------
       SPAWN SERVER
       -------------------------------------------------------- */

    assertCurrentStart(generation);

    const process =
      await spawnProcess(
        command,
        args || [],
        {
          output: options.onOutput,
        }
      );

    /*
     * Startup was cancelled while spawn() was happening.
     */
    if (
      getDevServerGeneration() !==
      generation
    ) {
      if (
        globalThis.__nudgeDevServerUnsubscribe ===
        unsubscribe
      ) {
        try {
          unsubscribe();
        } catch { }

        globalThis.__nudgeDevServerUnsubscribe =
          undefined;
      }

      try {
        process.kill();
        await process.exit;
      } catch { }

      throw new DevServerStartCancelledError();
    }

    globalThis.__nudgeDevServerProcess =
      process;

    /* --------------------------------------------------------
       PROCESS EXIT
       -------------------------------------------------------- */

    process.exit.then((code) => {
      if (
        globalThis.__nudgeDevServerProcess !==
        process
      ) {
        return;
      }

      globalThis.__nudgeDevServerProcess =
        undefined;

      if (
        globalThis.__nudgeDevServerUnsubscribe
      ) {
        try {
          globalThis.__nudgeDevServerUnsubscribe();
        } catch { }

        globalThis.__nudgeDevServerUnsubscribe =
          undefined;
      }

      const wasRunning =
        getDevServerState().status ===
        "running";

      const errorMessage = wasRunning
        ? (
          code === 0
            ? null
            : `Dev server stopped (code ${code})`
        )
        : `Dev server exited before becoming ready (code ${code})`;

      const status: ServerLifecycleStatus =
        wasRunning
          ? (
            code === 0
              ? "idle"
              : "error"
          )
          : "error";

      setDevServerState({
        status,
        port: null,
        url: null,
        error: errorMessage,
        commandUsed:
          commandDescription,
      });

      options.onOutput?.(
        wasRunning
          ? `ℹ Server exited with code ${code}\n`
          : `❌ Server exited before becoming ready (code ${code})\n`
      );

      if (!wasRunning) {
        rejectServerReady(
          new Error(
            errorMessage ||
            `Server exited with code ${code}`
          )
        );
      }
    });

    return await readyPromise;
  })();

  globalThis.__nudgeDevServerStartPromise =
    startPromise;

  try {
    return await startPromise;
  } catch (error) {
    if (
      !(error instanceof DevServerStartCancelledError) &&
      getDevServerGeneration() === generation &&
      getDevServerState().status ===
      "starting"
    ) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      setDevServerState({
        ...getDevServerState(),
        status: "error",
        port: null,
        url: null,
        error: message,
      });
    }

    throw error;
  } finally {
    if (
      globalThis.__nudgeDevServerStartPromise ===
      startPromise
    ) {
      globalThis.__nudgeDevServerStartPromise =
        undefined;
    }
  }
}

/* ============================================================
   URL NORMALIZATION
   ============================================================ */

/**
 * WebContainer's server-ready URL is the source of truth.
 *
 * We normalize it to the server root so the preview UI never
 * accidentally turns it into /health, /api/health, etc.
 */
function normalizePreviewUrl(
  url: string
): string {
  try {
    const parsed = new URL(url);

    parsed.pathname = "/";
    parsed.search = "";
    parsed.hash = "";

    return parsed.toString();
  } catch {
    return url.endsWith("/")
      ? url
      : `${url}/`;
  }
}

/* ============================================================
   RESTART
   ============================================================ */

export async function restartDevServer(
  options: DevServerOptions = {}
): Promise<DevServerState> {
  await stopDevServer();

  return await startDevServer(options);
}

/* ============================================================
   SERVER READY LISTENER
   ============================================================ */

export async function onServerReady(
  callback: (
    port: number,
    url: string
  ) => void
): Promise<() => void> {
  const webcontainer =
    await getWebContainer();

  return webcontainer.on(
    "server-ready",
    (port, url) => {
      /*
       * Always provide the root preview URL.
       */
      callback(
        port,
        normalizePreviewUrl(url)
      );
    }
  );
}

/* ============================================================
   DIRECTORY OPERATIONS
   ============================================================ */

export interface DirEntry {
  name: string;
  isDirectory: boolean;
}

export async function listDirectory(
  dirPath: string
): Promise<DirEntry[]> {
  const webcontainer =
    await getWebContainer();

  const cleanPath =
    dirPath.replace(/^\/+/, "") || ".";

  const entries =
    await webcontainer.fs.readdir(
      cleanPath,
      {
        withFileTypes: true,
      }
    );

  return entries.map((entry) => ({
    name:
      typeof entry === "string"
        ? entry
        : entry.name,

    isDirectory:
      typeof entry === "string"
        ? false
        : entry.isDirectory(),
  }));
}

export async function createDirectory(
  dirPath: string
): Promise<void> {
  const webcontainer =
    await getWebContainer();

  const cleanPath =
    dirPath.replace(/^\/+/, "");

  await webcontainer.fs.mkdir(
    cleanPath,
    {
      recursive: true,
    }
  );
}

export async function deleteEntry(
  entryPath: string
): Promise<void> {
  const webcontainer =
    await getWebContainer();

  const cleanPath =
    entryPath.replace(/^\/+/, "");

  if (
    !cleanPath ||
    cleanPath === "."
  ) {
    return;
  }

  await webcontainer.fs.rm(
    cleanPath,
    {
      recursive: true,
      force: true,
    }
  );
}

export async function renameEntry(
  oldPath: string,
  newPath: string
): Promise<void> {
  const webcontainer =
    await getWebContainer();

  const cleanOld =
    oldPath.replace(/^\/+/, "");

  const cleanNew =
    newPath.replace(/^\/+/, "");

  if (
    !cleanOld ||
    !cleanNew ||
    cleanOld === cleanNew
  ) {
    return;
  }

  const lastSlashIndex =
    cleanNew.lastIndexOf("/");

  if (lastSlashIndex !== -1) {
    const parentDirectory =
      cleanNew.slice(
        0,
        lastSlashIndex
      );

    await webcontainer.fs.mkdir(
      parentDirectory,
      {
        recursive: true,
      }
    );
  }

  if (
    typeof (webcontainer.fs as any)
      .rename === "function"
  ) {
    await (
      webcontainer.fs as any
    ).rename(
      cleanOld,
      cleanNew
    );
  } else {
    const content =
      await webcontainer.fs.readFile(
        cleanOld,
        "utf-8"
      );

    await webcontainer.fs.writeFile(
      cleanNew,
      content
    );

    await webcontainer.fs.rm(
      cleanOld,
      {
        recursive: true,
        force: true,
      }
    );
  }
}