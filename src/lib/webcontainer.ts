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

const PORT = process.env.PORT || 0;
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

/**
 * Starts the project's dev server and listens for WebContainer's 'server-ready' event.
 * Obtains the live preview URL dynamically (does not assume localhost).
 */
export async function startDevServer(options: DevServerOptions = {}): Promise<{
  process: WebContainerProcess;
  urlPromise: Promise<{ port: number; url: string }>;
  commandUsed: string;
}> {
  const webcontainer = await getWebContainer();
  
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

  let resolveServerUrl: (val: { port: number; url: string }) => void;
  const urlPromise = new Promise<{ port: number; url: string }>((resolve) => {
    resolveServerUrl = resolve;
  });

  const unsubscribe = webcontainer.on("server-ready", (port, url) => {
    options.onServerReady?.(port, url);
    resolveServerUrl({ port, url });
  });

  const process = await spawnProcess(command, args || [], {
    output: options.onOutput,
  });

  process.exit.then(() => {
    unsubscribe();
  });

  return { process, urlPromise, commandUsed: commandDescription };
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
