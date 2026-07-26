import { execFile, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";

import { chromium } from "playwright-core";

const CHATGPT_URL = "https://chatgpt.com/";
const CANVA_URL = "https://www.canva.com/";
const ATTACHMENT_UPLOAD_MAX_ATTEMPTS = 3;
const ATTACHMENT_CONFIRM_TIMEOUT_MS = 30_000;
const ATTACHMENT_POLL_MS = 350;
const LOGIN_LABELS = ["Log in", "Iniciar sessão", "Iniciar sessao"];
const SIGNUP_LABELS = ["Sign up", "Registar", "Criar conta"];
const SESSION_ENDPOINTS = ["/api/auth/session", "/backend-api/me"];
const CANVA_LOGIN_NAME = /^(?:log in|sign in|iniciar sess[aã]o|entrar|connexion|se connecter)(?:\s|$)/i;
const CANVA_SIGNUP_NAME = /^(?:sign up|create (?:an )?account|registar(?:-se)?|criar conta|s['’]inscrire)(?:\s|$)/i;
const APPROVAL_LABELS = [
  "Allow",
  "Allow once",
  "Confirm",
  "Continue",
  "Permitir",
  "Permitir uma vez",
  "Confirmar",
  "Continuar",
  "Autorizar",
];
const MANUAL_EDGE_DEBUG_PORT_FILE = "CodexDevToolsPort";

function firstExistingPath(candidates) {
  return candidates.find((candidate) => candidate && existsSync(candidate)) || "";
}

export function isMicrosoftEdgeExecutable(executablePath = "") {
  const normalized = String(executablePath || "").replaceAll("\\", "/").toLowerCase();
  const filename = path.basename(normalized);
  return filename === "msedge.exe"
    || filename === "msedge"
    || filename === "microsoft edge"
    || filename === "microsoft-edge"
    || filename === "microsoft-edge-stable"
    || normalized.includes("/microsoft edge.app/");
}

export function buildManualEdgeLaunchArgs({
  profileDir,
  debugPort,
  initialUrl,
} = {}) {
  const port = Number(debugPort);
  if (!profileDir || !Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new TypeError("A dedicated profile and valid localhost debugging port are required.");
  }
  const targetUrl = new URL(String(initialUrl || CHATGPT_URL));
  if (!["https:", "http:"].includes(targetUrl.protocol)) {
    throw new TypeError("The manual Edge target must be HTTP or HTTPS.");
  }
  return [
    "--remote-debugging-address=127.0.0.1",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${path.resolve(profileDir)}`,
    "--profile-directory=Default",
    "--no-first-run",
    "--no-default-browser-check",
    targetUrl.toString(),
  ];
}

export function parseManualEdgeDebugPortFromCommand(command, profileDir) {
  const normalizedCommand = String(command || "");
  const resolvedProfileDir = path.resolve(String(profileDir || ""));
  if (
    !normalizedCommand
    || !profileDir
    || !normalizedCommand.includes(`--user-data-dir=${resolvedProfileDir}`)
    || !normalizedCommand.includes("--remote-debugging-address=127.0.0.1")
  ) {
    return null;
  }
  const match = normalizedCommand.match(/(?:^|\s)--remote-debugging-port=(\d{4,5})(?:\s|$)/);
  const port = Number(match?.[1]);
  return Number.isInteger(port) && port >= 1024 && port <= 65535 ? port : null;
}

async function processCommand(pid) {
  if (process.platform === "win32") return "";
  const executable = existsSync("/bin/ps") ? "/bin/ps" : "ps";
  return new Promise((resolve) => {
    execFile(
      executable,
      ["-p", String(pid), "-o", "command="],
      { timeout: 2_000, maxBuffer: 64 * 1024 },
      (error, stdout) => resolve(error ? "" : String(stdout || "").trim()),
    );
  });
}

async function discoverManualEdgeDebugPort(profileDir) {
  try {
    const lockTarget = await fs.readlink(path.join(profileDir, "SingletonLock"));
    const pidMatch = String(lockTarget).match(/-(\d{1,10})$/);
    if (!pidMatch) return null;
    const command = await processCommand(Number(pidMatch[1]));
    return parseManualEdgeDebugPortFromCommand(command, profileDir);
  } catch {
    return null;
  }
}

export function resolveBrowserExecutable(configuredPath = "") {
  const programFiles = process.env.ProgramFiles || "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const localAppData = process.env.LOCALAPPDATA || "";
  const detectedPath = firstExistingPath([
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    path.join(programFiles, "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe"),
    localAppData && path.join(localAppData, "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
    localAppData && path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
    "/usr/bin/microsoft-edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ]);
  if (configuredPath && existsSync(configuredPath)) return configuredPath;
  return detectedPath || configuredPath;
}

export function extractCanvaDesignLink(values) {
  const source = Array.isArray(values) ? values : [values];
  for (const value of source) {
    const text = String(value || "");
    const candidates = text.match(/https:\/\/(?:www\.)?canva\.com\/(?:design\/[A-Za-z0-9_-]{6,120}|d\/[A-Za-z0-9_-]{6,120})(?:\/[^\s"'<>]*)?/gi) || [];
    for (const candidate of candidates) {
      try {
        const url = new URL(candidate.replace(/[),.;]+$/, ""));
        const designId = decodeURIComponent(url.pathname.match(/\/design\/([^/?#]+)/i)?.[1] || "");
        if (/^[a-z0-9_-]{6,120}$/i.test(designId)) {
          return { designId, editUrl: url.toString() };
        }
        if (/^\/d\/[a-z0-9_-]{6,120}\/?$/i.test(url.pathname)) {
          return { designId: null, editUrl: url.toString() };
        }
      } catch {
        // Ignore malformed candidate URLs.
      }
    }
  }
  return null;
}

function automationError(code, message, options = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, options);
  return error;
}

async function locatorIsVisible(locator) {
  try {
    return await locator.isVisible();
  } catch {
    return false;
  }
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function reserveLoopbackPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port: 0, exclusive: true }, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close((error) => {
        if (error) reject(error);
        else if (!port) reject(new Error("LOCAL_DEBUG_PORT_UNAVAILABLE"));
        else resolve(port);
      });
    });
  });
}

async function waitForLoopbackCdp(port, timeoutMs = 15_000) {
  const endpoint = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${endpoint}/json/version`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) {
        const payload = await response.json().catch(() => null);
        const websocketUrl = new URL(String(payload?.webSocketDebuggerUrl || ""));
        if (
          ["127.0.0.1", "localhost"].includes(websocketUrl.hostname)
          && Number(websocketUrl.port) === port
          && /^Edg\//i.test(String(payload?.Browser || ""))
        ) {
          return endpoint;
        }
        lastError = new Error("EDGE_CDP_ENDPOINT_NOT_LOOPBACK");
      }
      if (!response.ok) lastError = new Error(`EDGE_CDP_HTTP_${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw automationError(
    "EDGE_MANUAL_DEBUGGING_UNAVAILABLE",
    "O Microsoft Edge abriu, mas a porta local de depuracao nao ficou disponivel.",
    {
      cause: lastError,
      statusCode: 409,
      publicMessage: "O Edge abriu, mas a ligacao local nao ficou pronta. Fecha apenas o Edge do atelier e tenta novamente.",
    },
  );
}

export function classifyCanvaWebSession(snapshot = {}) {
  const pathname = String(snapshot.pathname || "/").toLowerCase();
  const loginPath = /^\/(?:(?:[a-z]{2}(?:[_-][a-z]{2})?)\/)?(?:login|signup|register|auth|sso)(?:\/|$)/.test(pathname);
  const obviousLoggedOut = Boolean(
    loginPath
    || snapshot.passwordInputVisible
    || snapshot.loginControlVisible
    || snapshot.signupControlVisible
  );
  if (obviousLoggedOut) {
    return {
      ready: false,
      authenticated: false,
      state: "login_required",
      evidence: loginPath
        ? "login_path"
        : snapshot.passwordInputVisible
          ? "login_form"
          : "logged_out_control",
    };
  }

  const authenticated = Boolean(
    snapshot.accountControlVisible
    || (snapshot.workspaceNavigationVisible && snapshot.createDesignControlVisible)
  );
  if (authenticated) {
    return {
      ready: true,
      authenticated: true,
      state: "ready",
      evidence: snapshot.accountControlVisible
        ? "authenticated_account_control"
        : "authenticated_workspace_controls",
    };
  }

  return {
    ready: false,
    authenticated: false,
    state: "unknown",
    evidence: "no_authenticated_ui_evidence",
  };
}

export class ChatGptCanvaWorker {
  constructor({
    executablePath = "",
    profileDir,
    headless = false,
    timeoutMs = 600_000,
    manualEdgeCdp = true,
  }) {
    this.executablePath = resolveBrowserExecutable(executablePath);
    this.profileDir = profileDir;
    this.headless = Boolean(headless);
    this.timeoutMs = timeoutMs;
    this.manualEdgeCdp = Boolean(manualEdgeCdp)
      && !this.headless
      && isMicrosoftEdgeExecutable(this.executablePath);
    this.context = null;
    this.cdpBrowser = null;
    this.page = null;
    this.setupPage = null;
    this.canvaSetupPage = null;
    this.automationPage = null;
    this.manualBrowserProcess = null;
    this.manualDebugPort = null;
    this.manualBrowserStartedAt = null;
    this.manualBrowserTarget = null;
    this.manualBrowserExternallyManaged = false;
    this.manualAttachError = null;
    this.lastError = null;
  }

  resetAttachedContext() {
    this.context = null;
    this.cdpBrowser = null;
    this.page = null;
    this.setupPage = null;
    this.canvaSetupPage = null;
    this.automationPage = null;
  }

  bindContext(context, cdpBrowser = null) {
    this.context = context;
    this.cdpBrowser = cdpBrowser;
    this.context.once("close", () => this.resetAttachedContext());
    if (this.cdpBrowser) {
      this.cdpBrowser.once("disconnected", () => this.resetAttachedContext());
    }
    const pages = this.context.pages();
    this.setupPage = pages.find((page) => page.url().startsWith(CHATGPT_URL)) || null;
    this.canvaSetupPage = pages.find((page) => {
      try {
        return /(^|\.)canva\.com$/i.test(new URL(page.url()).hostname);
      } catch {
        return false;
      }
    }) || null;
    this.page = this.setupPage;
    this.manualAttachError = null;
    return context;
  }

  manualBrowserIsRunning() {
    return Boolean(
      (this.manualBrowserProcess && this.manualBrowserProcess.exitCode === null)
      || (this.manualBrowserExternallyManaged && this.manualDebugPort),
    );
  }

  manualDebugPortPath() {
    return path.join(this.profileDir, MANUAL_EDGE_DEBUG_PORT_FILE);
  }

  async rememberManualDebugPort(port) {
    await fs.writeFile(this.manualDebugPortPath(), `${port}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
  }

  async forgetManualDebugPort() {
    await fs.unlink(this.manualDebugPortPath()).catch(() => {});
  }

  async recoverManualEdgeSession() {
    const candidates = [];
    try {
      const persisted = Number(
        String(await fs.readFile(this.manualDebugPortPath(), "utf8")).trim(),
      );
      if (Number.isInteger(persisted) && persisted >= 1024 && persisted <= 65535) {
        candidates.push(persisted);
      }
    } catch {
      // Older profiles do not have a persisted debug port.
    }
    const discovered = await discoverManualEdgeDebugPort(this.profileDir);
    if (discovered && !candidates.includes(discovered)) candidates.push(discovered);

    for (const port of candidates) {
      try {
        await waitForLoopbackCdp(port, 1_500);
        this.manualDebugPort = port;
        this.manualBrowserExternallyManaged = true;
        this.manualBrowserStartedAt ||= new Date().toISOString();
        this.manualAttachError = null;
        await this.rememberManualDebugPort(port);
        return true;
      } catch {
        // Try the next locally discovered candidate.
      }
    }
    await this.forgetManualDebugPort();
    return false;
  }

  manualSetupStatus(target = "both") {
    const running = this.manualBrowserIsRunning();
    return {
      available: Boolean(this.executablePath),
      ready: false,
      signedIn: false,
      initialized: false,
      authenticated: false,
      attached: false,
      manualSetupRequired: true,
      browserMode: "manual_edge_cdp",
      state: running ? "manual_login_pending" : "manual_browser_not_started",
      sessionEvidence: "manual_completion_required",
      evidence: "manual_completion_required",
      checkedAt: new Date().toISOString(),
      browser: this.executablePath ? path.basename(this.executablePath) : null,
      profileDir: this.profileDir,
      headless: this.headless,
      target,
      debugAddress: running ? "127.0.0.1" : null,
      startedAt: this.manualBrowserStartedAt,
      instructions: running
        ? "Conclui manualmente o desafio Cloudflare e o login no Microsoft Edge. So depois usa o botao de testar sessao para ligar a automacao."
        : "Abre primeiro o Microsoft Edge manual do atelier. Conclui Cloudflare e o login antes de ligar a automacao.",
      error: this.manualAttachError,
    };
  }

  async openManualEdge(targetUrl) {
    if (!this.manualEdgeCdp) {
      throw automationError(
        "EDGE_MANUAL_SETUP_UNAVAILABLE",
        "O modo manual exige Microsoft Edge visivel e CANVA_CHATGPT_MANUAL_EDGE_CDP=1.",
        {
          statusCode: 409,
          publicMessage: "O modo manual precisa de Microsoft Edge visivel. Confirma a configuracao do browser.",
        },
      );
    }
    if (!this.executablePath || !isMicrosoftEdgeExecutable(this.executablePath)) {
      throw automationError("CHATGPT_CANVA_BROWSER_NOT_FOUND", "Microsoft Edge nao foi encontrado.");
    }
    await fs.mkdir(this.profileDir, { recursive: true });
    if (!this.manualBrowserIsRunning()) await this.recoverManualEdgeSession();

    if (this.manualBrowserIsRunning()) {
      const child = spawn(this.executablePath, buildManualEdgeLaunchArgs({
        profileDir: this.profileDir,
        debugPort: this.manualDebugPort,
        initialUrl: targetUrl,
      }), {
        detached: false,
        stdio: "ignore",
        windowsHide: false,
      });
      child.once("error", () => {});
      child.unref();
      this.manualBrowserTarget = targetUrl;
      return this.manualSetupStatus(targetUrl === CANVA_URL ? "canva" : "chatgpt");
    }

    this.manualDebugPort = await reserveLoopbackPort();
    const args = buildManualEdgeLaunchArgs({
      profileDir: this.profileDir,
      debugPort: this.manualDebugPort,
      initialUrl: targetUrl,
    });
    const child = spawn(this.executablePath, args, {
      detached: false,
      stdio: "ignore",
      windowsHide: false,
    });
    this.manualBrowserProcess = child;
    this.manualBrowserStartedAt = new Date().toISOString();
    this.manualBrowserTarget = targetUrl;
    this.manualBrowserExternallyManaged = false;
    this.manualAttachError = null;
    child.once("exit", () => {
      if (this.manualBrowserProcess === child) {
        this.manualBrowserProcess = null;
        if (!this.context) {
          this.manualDebugPort = null;
          this.forgetManualDebugPort().catch(() => {});
        }
      }
    });
    const launchError = new Promise((_, reject) => {
      child.once("error", reject);
    });
    try {
      await Promise.race([
        waitForLoopbackCdp(this.manualDebugPort),
        launchError,
      ]);
      await this.rememberManualDebugPort(this.manualDebugPort);
    } catch (error) {
      this.manualAttachError = String(error?.message || error);
      throw error;
    }
    return this.manualSetupStatus(targetUrl === CANVA_URL ? "canva" : "chatgpt");
  }

  async attachManualBrowser() {
    if (!this.manualEdgeCdp) return this.ensureBrowser();
    if (this.context) return this.context;
    if (!this.manualBrowserIsRunning() || !this.manualDebugPort) {
      await this.recoverManualEdgeSession();
    }
    if (!this.manualBrowserIsRunning() || !this.manualDebugPort) {
      throw automationError(
        "EDGE_MANUAL_LOGIN_NOT_STARTED",
        "Abre primeiro o Microsoft Edge manual e conclui Cloudflare/login antes de ligar a automacao.",
        {
          statusCode: 409,
          publicMessage: "Abre primeiro o Edge manual e conclui Cloudflare/login antes de ligar a automacao.",
        },
      );
    }
    try {
      const endpoint = await waitForLoopbackCdp(this.manualDebugPort, 5_000);
      const browser = await chromium.connectOverCDP(endpoint, { timeout: 10_000 });
      const context = browser.contexts()[0];
      if (!context) {
        await browser.close().catch(() => {});
        throw new Error("EDGE_CDP_CONTEXT_MISSING");
      }
      return this.bindContext(context, browser);
    } catch (error) {
      this.manualAttachError = String(error?.message || error);
      if (this.manualBrowserExternallyManaged) {
        this.manualBrowserExternallyManaged = false;
        this.manualDebugPort = null;
        await this.forgetManualDebugPort();
      }
      throw automationError(
        "EDGE_MANUAL_ATTACH_FAILED",
        "Nao foi possivel ligar a automacao ao Edge local. Mantem o Edge aberto e tenta novamente.",
        {
          cause: error,
          statusCode: 409,
          publicMessage: "Nao foi possivel ligar ao Edge local. Mantem a janela aberta e tenta novamente.",
        },
      );
    }
  }

  async ensureBrowser() {
    if (this.context) return this.context;
    if (!this.executablePath) {
      throw automationError("CHATGPT_CANVA_BROWSER_NOT_FOUND", "Microsoft Edge ou Google Chrome nao foi encontrado.");
    }
    if (this.manualEdgeCdp) {
      throw automationError(
        "EDGE_MANUAL_ATTACH_REQUIRED",
        "Conclui primeiro Cloudflare/login no Edge manual e usa o botao de testar sessao.",
        {
          statusCode: 409,
          publicMessage: "Conclui primeiro Cloudflare/login no Edge manual e liga a automacao na pagina local.",
        },
      );
    }
    await fs.mkdir(this.profileDir, { recursive: true });
    const context = await chromium.launchPersistentContext(this.profileDir, {
      executablePath: this.executablePath,
      headless: this.headless,
      locale: "pt-PT",
      viewport: { width: 1365, height: 900 },
      args: [
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding",
        "--no-first-run",
        "--no-default-browser-check",
      ],
    });
    this.bindContext(context);
    this.setupPage = this.context.pages()[0] || await this.context.newPage();
    this.page = this.setupPage;
    return this.context;
  }

  async getPage() {
    await this.ensureBrowser();
    if (!this.page || this.page.isClosed()) {
      this.page = this.context.pages()[0] || await this.context.newPage();
    }
    return this.page;
  }

  async getFreshAutomationPage() {
    await this.ensureBrowser();
    if (this.automationPage && !this.automationPage.isClosed()) {
      await this.automationPage.close().catch(() => {});
    }
    this.automationPage = await this.context.newPage();
    this.page = this.automationPage;
    return this.automationPage;
  }

  async newAuthenticatedPage() {
    await this.ensureBrowser();
    return this.context.newPage();
  }

  async getCanvaSetupPage() {
    await this.ensureBrowser();
    if (!this.canvaSetupPage || this.canvaSetupPage.isClosed()) {
      this.canvaSetupPage = await this.context.newPage();
    }
    return this.canvaSetupPage;
  }

  async inspectCanvaWebSession(page, { ensureHome = true } = {}) {
    if (!page || typeof page.url !== "function") {
      return {
        ready: false,
        authenticated: false,
        state: "browser_unavailable",
        evidence: "page_unavailable",
        checkedAt: new Date().toISOString(),
      };
    }

    let currentUrl = page.url();
    let currentHost = "";
    let currentPath = "/";
    try {
      const parsed = new URL(currentUrl);
      currentHost = parsed.hostname.toLowerCase();
      currentPath = parsed.pathname || "/";
    } catch {
      currentHost = "";
    }
    if (ensureHome && (!/(^|\.)canva\.com$/i.test(currentHost) || currentPath !== "/")) {
      await page.goto(CANVA_URL, { waitUntil: "domcontentloaded", timeout: 45_000 });
    }

    await page.waitForTimeout(900);
    currentUrl = page.url();
    try {
      const parsed = new URL(currentUrl);
      currentHost = parsed.hostname.toLowerCase();
      currentPath = parsed.pathname || "/";
    } catch {
      currentHost = "";
      currentPath = "/";
    }

    const loginControl = page.getByRole("button", { name: CANVA_LOGIN_NAME })
      .or(page.getByRole("link", { name: CANVA_LOGIN_NAME }));
    const signupControl = page.getByRole("button", { name: CANVA_SIGNUP_NAME })
      .or(page.getByRole("link", { name: CANVA_SIGNUP_NAME }));
    const passwordInput = page.locator("input[type='password']");
    const accountControl = page.locator([
      "[data-testid='account-menu-button']",
      "[data-testid='profile-button']",
      "button[aria-label*='account menu' i]",
      "button[aria-label*='account settings' i]",
      "button[aria-label*='your account' i]",
      "button[aria-label^='account' i]",
      "button[aria-label*='avatar' i]",
      "button[aria-label*='profile' i]",
      "button[aria-label*='conta' i]",
      "button[aria-label*='perfil' i]",
    ].join(", "));
    const workspaceNavigation = page.locator([
      "a[href^='/projects']",
      "a[href^='/folders']",
      "a[href^='/brand']",
      "[data-testid='homepage-sidebar']",
    ].join(", "));
    const createDesignControl = page.getByRole("button", {
      name: /(?:create a design|criar um design|criar design|crear un dise[nñ]o|cr[ée]er un design)/i,
    });
    const snapshot = {
      pathname: currentPath,
      loginControlVisible: await loginControl.count() > 0 && await locatorIsVisible(loginControl.first()),
      signupControlVisible: await signupControl.count() > 0 && await locatorIsVisible(signupControl.first()),
      passwordInputVisible: await passwordInput.count() > 0 && await locatorIsVisible(passwordInput.first()),
      accountControlVisible: await accountControl.count() > 0 && await locatorIsVisible(accountControl.first()),
      workspaceNavigationVisible: await workspaceNavigation.count() > 0 && await locatorIsVisible(workspaceNavigation.first()),
      createDesignControlVisible: await createDesignControl.count() > 0 && await locatorIsVisible(createDesignControl.first()),
    };
    const classification = classifyCanvaWebSession(snapshot);
    return {
      ...classification,
      available: /(^|\.)canva\.com$/i.test(currentHost),
      checkedAt: new Date().toISOString(),
      page: {
        origin: /(^|\.)canva\.com$/i.test(currentHost) ? "https://www.canva.com" : null,
        pathname: currentPath,
      },
    };
  }

  async isCanvaWebAuthenticated(page) {
    const session = await this.inspectCanvaWebSession(page, { ensureHome: true });
    return session.ready;
  }

  async canvaWebStatus() {
    if (this.manualEdgeCdp && !this.context) {
      return this.manualSetupStatus("canva");
    }
    try {
      const page = await this.getCanvaSetupPage();
      const status = await this.inspectCanvaWebSession(page, { ensureHome: true });
      return {
        ...status,
        attached: Boolean(this.context),
        manualSetupRequired: this.manualEdgeCdp,
        browserMode: this.manualEdgeCdp ? "manual_edge_cdp" : "playwright_persistent_legacy",
        browser: path.basename(this.executablePath),
        profileDir: this.profileDir,
        headless: this.headless,
      };
    } catch (error) {
      return {
        available: false,
        ready: false,
        authenticated: false,
        attached: Boolean(this.context),
        manualSetupRequired: this.manualEdgeCdp,
        browserMode: this.manualEdgeCdp ? "manual_edge_cdp" : "playwright_persistent_legacy",
        state: "browser_unavailable",
        evidence: "probe_failed",
        checkedAt: new Date().toISOString(),
        browser: this.executablePath ? path.basename(this.executablePath) : null,
        profileDir: this.profileDir,
        headless: this.headless,
        error: String(error?.message || error),
      };
    }
  }

  async openCanvaSetup() {
    if (this.manualEdgeCdp && !this.context) {
      return this.openManualEdge(CANVA_URL);
    }
    const page = await this.getCanvaSetupPage();
    await page.goto(CANVA_URL, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.bringToFront();
    return this.inspectCanvaWebSession(page, { ensureHome: false });
  }

  async probeAuthenticatedSession(page) {
    try {
      return await page.evaluate(async (endpoints) => {
        const probes = [];
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              method: "GET",
              credentials: "include",
              cache: "no-store",
              headers: { Accept: "application/json" },
            });
            const text = await response.text();
            let payload = null;
            try {
              payload = text ? JSON.parse(text) : null;
            } catch {
              payload = null;
            }
            const authenticated = Boolean(
              response.ok
              && payload
              && (
                payload?.user?.id
                || payload?.user?.email
                || payload?.user?.name
                || payload?.id
                || payload?.email
                || payload?.accessToken
                || payload?.access_token
              )
            );
            probes.push({ endpoint, status: response.status, authenticated });
            if (authenticated) return { authenticated: true, method: endpoint, probes };
          } catch (error) {
            probes.push({ endpoint, status: null, authenticated: false, error: String(error?.message || error) });
          }
        }
        return { authenticated: false, method: null, probes };
      }, SESSION_ENDPOINTS);
    } catch (error) {
      return {
        authenticated: false,
        method: null,
        probes: [],
        error: String(error?.message || error),
      };
    }
  }

  async inspectSession(page, { waitForComposerMs = 10_000 } = {}) {
    const loginName = new RegExp(`^(${LOGIN_LABELS.join("|")})$`, "i");
    const signupName = new RegExp(`^(${SIGNUP_LABELS.join("|")})$`, "i");
    const loginButton = page.getByRole("button", { name: loginName }).or(page.getByRole("link", { name: loginName }));
    const signupButton = page.getByRole("button", { name: signupName }).or(page.getByRole("link", { name: signupName }));
    const composer = page.locator(
      "#prompt-textarea, textarea[data-testid='prompt-textarea'], [contenteditable='true'][role='textbox'], div[contenteditable='true']",
    );

    await page.waitForTimeout(900);
    let loginButtonVisible = await loginButton.count() > 0 && await locatorIsVisible(loginButton.first());
    let signupButtonVisible = await signupButton.count() > 0 && await locatorIsVisible(signupButton.first());
    if (!loginButtonVisible && !signupButtonVisible) {
      await composer.first().waitFor({ state: "visible", timeout: waitForComposerMs }).catch(() => {});
      loginButtonVisible = await loginButton.count() > 0 && await locatorIsVisible(loginButton.first());
      signupButtonVisible = await signupButton.count() > 0 && await locatorIsVisible(signupButton.first());
    }

    const composerCount = await composer.count();
    const composerVisible = composerCount > 0 && await locatorIsVisible(composer.first());
    const apiProbe = await this.probeAuthenticatedSession(page);
    const cookies = await this.context.cookies(CHATGPT_URL).catch(() => []);
    const authenticatedCookieNames = cookies
      .map((cookie) => cookie.name)
      .filter((name) => /(session-token|auth-session|access-token|refresh-token)/i.test(name) && !/csrf/i.test(name));

    const accountControl = page.locator([
      "[data-testid='profile-button']",
      "[data-testid='sidebar-profile-button']",
      "button[aria-label*='profile' i]",
      "button[aria-label*='perfil' i]",
      "button[aria-label*='account' i]",
      "button[aria-label*='conta' i]",
    ].join(", "));
    const accountControlVisible = await accountControl.count() > 0 && await locatorIsVisible(accountControl.first());

    const signedIn = Boolean(
      !loginButtonVisible
      && !signupButtonVisible
      && (apiProbe.authenticated || accountControlVisible || authenticatedCookieNames.length > 0)
    );
    const initialized = Boolean(signedIn && composerVisible);

    return {
      signedIn,
      initialized,
      evidence: apiProbe.authenticated
        ? `api:${apiProbe.method}`
        : accountControlVisible
          ? "authenticated_account_control"
          : authenticatedCookieNames.length > 0
            ? "authenticated_session_cookie"
            : "none",
      apiProbe,
      loginButtonCount: await loginButton.count(),
      loginButtonVisible,
      signupButtonCount: await signupButton.count(),
      signupButtonVisible,
      composerCount,
      composerVisible,
      accountControlVisible,
      authenticatedCookieNames,
    };
  }

  async isSignedIn(page) {
    const session = await this.inspectSession(page);
    return session.initialized;
  }

  async status() {
    if (this.manualEdgeCdp && !this.context) {
      return this.manualSetupStatus("chatgpt");
    }
    try {
      const page = await this.getPage();
      if (!page.url().startsWith(CHATGPT_URL)) {
        await page.goto(CHATGPT_URL, { waitUntil: "domcontentloaded", timeout: 45_000 });
      }
      const session = await this.inspectSession(page);
      this.lastError = null;
      return {
        available: true,
        signedIn: session.signedIn,
        initialized: session.initialized,
        attached: Boolean(this.context),
        manualSetupRequired: this.manualEdgeCdp,
        browserMode: this.manualEdgeCdp ? "manual_edge_cdp" : "playwright_persistent_legacy",
        sessionEvidence: session.evidence,
        sessionProbe: session.apiProbe,
        browser: path.basename(this.executablePath),
        profileDir: this.profileDir,
        headless: this.headless,
        attachmentVerification: "visible_filename_or_new_preview_required",
        page: {
          url: page.url(),
          title: await page.title(),
          loginButtonCount: session.loginButtonCount,
          loginButtonVisible: session.loginButtonVisible,
          signupButtonCount: session.signupButtonCount,
          signupButtonVisible: session.signupButtonVisible,
          composerCount: session.composerCount,
          composerVisible: session.composerVisible,
          accountControlVisible: session.accountControlVisible,
        },
      };
    } catch (error) {
      this.lastError = String(error?.message || error);
      return {
        available: false,
        signedIn: false,
        initialized: false,
        attached: Boolean(this.context),
        manualSetupRequired: this.manualEdgeCdp,
        browserMode: this.manualEdgeCdp ? "manual_edge_cdp" : "playwright_persistent_legacy",
        browser: this.executablePath ? path.basename(this.executablePath) : null,
        profileDir: this.profileDir,
        headless: this.headless,
        error: this.lastError,
      };
    }
  }

  async openSetup() {
    if (this.manualEdgeCdp && !this.context) {
      return this.openManualEdge(CHATGPT_URL);
    }
    const page = await this.getPage();
    await page.goto(CHATGPT_URL, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.bringToFront();
    return this.status();
  }

  async findComposer(page) {
    const candidates = [
      page.locator("#prompt-textarea"),
      page.locator("textarea[data-testid='prompt-textarea']"),
      page.locator("textarea[placeholder*='Pergunte' i]"),
      page.locator("textarea[placeholder*='Message' i]"),
      page.locator("[contenteditable='true'][role='textbox']"),
      page.locator("div[contenteditable='true']"),
    ];
    for (const locator of candidates) {
      if (await locatorIsVisible(locator)) return locator;
    }
    return null;
  }

  attachmentRoot(page) {
    return page.locator("form").filter({
      has: page.locator(
        "#prompt-textarea, textarea[data-testid='prompt-textarea'], [contenteditable='true'][role='textbox'], div[contenteditable='true']",
      ),
    }).last();
  }

  async clearComposerAttachments(page) {
    const root = this.attachmentRoot(page);
    const scope = await root.count() > 0 ? root : page.locator("body");
    const removeButtons = scope.locator([
      "button[aria-label*='Remove attachment' i]",
      "button[aria-label*='Remove file' i]",
      "button[aria-label*='Delete attachment' i]",
      "button[aria-label*='Remove image' i]",
      "button[aria-label*='Remover anexo' i]",
      "button[aria-label*='Remover ficheiro' i]",
      "button[aria-label*='Remover imagem' i]",
      "[data-testid*='attachment'] button[aria-label*='remove' i]",
      "[data-testid*='file'] button[aria-label*='remove' i]",
    ].join(", "));

    const count = Math.min(await removeButtons.count().catch(() => 0), 10);
    for (let index = count - 1; index >= 0; index -= 1) {
      const button = removeButtons.nth(index);
      if (await locatorIsVisible(button)) {
        await button.click({ timeout: 2_000 }).catch(() => {});
      }
    }

    const inputs = page.locator("input[type='file']");
    const inputCount = await inputs.count().catch(() => 0);
    for (let index = 0; index < inputCount; index += 1) {
      await inputs.nth(index).setInputFiles([]).catch(() => {});
    }
    await page.waitForTimeout(300);
  }

  async findFileInput(page) {
    let fileInput = page.locator("input[type='file']");
    if (await fileInput.count() > 0) return fileInput.last();

    const addButton = page.locator([
      "button[aria-label*='Adicionar ficheiros' i]",
      "button[aria-label*='Add files' i]",
      "button[aria-label*='Attach files' i]",
      "button[aria-label*='Upload' i]",
      "button[aria-label*='Anexar' i]",
      "button[data-testid='composer-plus-btn']",
      "button[data-testid*='composer-attachment' i]",
    ].join(", ")).last();

    if (await addButton.count() > 0 && await locatorIsVisible(addButton)) {
      await addButton.click();
      await page.waitForTimeout(400);
      fileInput = page.locator("input[type='file']");
    }

    const inputCount = await fileInput.count();
    if (inputCount === 0) {
      throw automationError("CHATGPT_FILE_INPUT_NOT_FOUND", "O controlo de upload do ChatGPT nao foi encontrado.", {
        retryable: true,
      });
    }
    return fileInput.last();
  }

  async attachmentSnapshot(page, expectedName) {
    return page.evaluate(({ expectedName }) => {
      const normalizedExpectedName = String(expectedName || "").toLocaleLowerCase();
      const composer = document.querySelector(
        "#prompt-textarea, textarea[data-testid='prompt-textarea'], [contenteditable='true'][role='textbox']",
      );
      const root = composer?.closest("form") || composer?.parentElement?.parentElement || document.querySelector("main") || document.body;
      const visible = (node) => {
        if (!(node instanceof Element)) return false;
        const style = window.getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return style.display !== "none"
          && style.visibility !== "hidden"
          && Number(style.opacity || 1) > 0
          && rect.width > 3
          && rect.height > 3;
      };
      const valuesFor = (node) => [
        node.textContent,
        node.getAttribute?.("aria-label"),
        node.getAttribute?.("title"),
        node.getAttribute?.("alt"),
        node.getAttribute?.("data-testid"),
      ].filter(Boolean).map((value) => String(value).replace(/\s+/g, " ").trim().toLocaleLowerCase());

      const visibleNodes = Array.from(root.querySelectorAll("*")).filter(visible);
      const filenameMatches = normalizedExpectedName
        ? visibleNodes.filter((node) => valuesFor(node).some((value) => value.includes(normalizedExpectedName))).length
        : 0;
      const previews = Array.from(root.querySelectorAll([
        "[data-testid*='attachment'] img",
        "[data-testid*='file-preview'] img",
        "[data-testid*='image-preview'] img",
        "img[src^='blob:']",
        "img[src^='data:image']",
      ].join(", "))).filter(visible);
      const tiles = Array.from(root.querySelectorAll([
        "[data-testid*='attachment']",
        "[data-testid*='file-preview']",
        "[data-testid*='image-preview']",
        "[aria-label*='attachment preview' i]",
        "[aria-label*='file preview' i]",
        "[aria-label*='pré-visualização do anexo' i]",
        "[aria-label*='pré-visualização do ficheiro' i]",
      ].join(", "))).filter(visible);
      const removeButtons = Array.from(root.querySelectorAll("button")).filter((button) => {
        if (!visible(button)) return false;
        const label = `${button.getAttribute("aria-label") || ""} ${button.getAttribute("title") || ""}`.toLocaleLowerCase();
        return /(remove|delete|remover|eliminar)/.test(label)
          && /(attachment|file|image|anexo|ficheiro|imagem)/.test(label);
      });
      const loading = Array.from(root.querySelectorAll([
        "[aria-busy='true']",
        "[role='progressbar']",
        "[data-testid*='uploading']",
        "[data-state='loading']",
      ].join(", "))).filter(visible).length;
      const alertText = Array.from(document.querySelectorAll(
        "[role='alert'], [data-sonner-toast], [data-testid*='toast']",
      )).filter(visible).map((node) => node.textContent || "").join(" ");

      return {
        filenameMatches,
        previewCount: previews.length,
        tileCount: tiles.length,
        removeCount: removeButtons.length,
        loading,
        alertText,
      };
    }, { expectedName });
  }

  async waitForAttachmentConfirmation(page, expectedName, baseline, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    let stableMethod = "";
    let stablePolls = 0;

    while (Date.now() < deadline) {
      const snapshot = await this.attachmentSnapshot(page, expectedName);
      if (/upload.{0,40}(failed|error)|failed.{0,40}upload|falha.{0,40}(envio|carregamento)|erro.{0,40}(envio|carregamento)/i.test(snapshot.alertText)) {
        throw automationError(
          "CHATGPT_ATTACHMENT_UPLOAD_REJECTED",
          normalizeText(snapshot.alertText) || "O ChatGPT recusou o carregamento da imagem.",
          { retryable: true },
        );
      }

      const filenameVisible = snapshot.filenameMatches > baseline.filenameMatches;
      const newPreview = snapshot.previewCount > baseline.previewCount;
      const newTile = snapshot.tileCount > baseline.tileCount;
      const removablePreview = snapshot.removeCount > baseline.removeCount;
      const previewVisible = (newPreview || newTile) && removablePreview;
      const method = filenameVisible ? "filename" : previewVisible ? "attachment_preview" : "";

      if (method && snapshot.loading === 0) {
        if (method === stableMethod) stablePolls += 1;
        else {
          stableMethod = method;
          stablePolls = 1;
        }
        if (stablePolls >= 2) return { method, snapshot };
      } else {
        stableMethod = "";
        stablePolls = 0;
      }
      await page.waitForTimeout(ATTACHMENT_POLL_MS);
    }

    throw automationError(
      "CHATGPT_ATTACHMENT_NOT_CONFIRMED",
      `O anexo ${expectedName} nao apareceu no ChatGPT dentro do tempo limite.`,
      { retryable: true, expectedAttachmentName: expectedName },
    );
  }

  async uploadApprovedImage(page, imagePath, {
    onState = async () => {},
    expectedAttachmentName = path.basename(imagePath),
    attachmentUploadMaxAttempts = ATTACHMENT_UPLOAD_MAX_ATTEMPTS,
    attachmentConfirmTimeoutMs = ATTACHMENT_CONFIRM_TIMEOUT_MS,
  } = {}) {
    const maxAttempts = Math.max(1, Math.min(5, Number(attachmentUploadMaxAttempts) || ATTACHMENT_UPLOAD_MAX_ATTEMPTS));
    const timeoutMs = Math.max(5_000, Number(attachmentConfirmTimeoutMs) || ATTACHMENT_CONFIRM_TIMEOUT_MS);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      await this.clearComposerAttachments(page);
      const baseline = await this.attachmentSnapshot(page, expectedAttachmentName);
      await onState("chatgpt_canva_uploading", {
        attachmentConfirmed: false,
        expectedAttachmentName,
        attachmentUploadAttempt: attempt,
        attachmentUploadMaxAttempts: maxAttempts,
        chatUrl: page.url(),
      });

      try {
        const fileInput = await this.findFileInput(page);
        await fileInput.setInputFiles(imagePath);
        const confirmation = await this.waitForAttachmentConfirmation(
          page,
          expectedAttachmentName,
          baseline,
          timeoutMs,
        );
        const details = {
          attachmentConfirmed: true,
          attachmentName: expectedAttachmentName,
          attachmentConfirmationMethod: confirmation.method,
          attachmentUploadAttempt: attempt,
          attachmentUploadMaxAttempts: maxAttempts,
          chatUrl: page.url(),
        };
        await onState("chatgpt_canva_attachment_confirmed", details);
        return details;
      } catch (error) {
        await this.clearComposerAttachments(page);
        if (attempt >= maxAttempts) {
          throw automationError(
            "CHATGPT_ATTACHMENT_NOT_CONFIRMED",
            error?.message || "Nao foi possivel confirmar o anexo no ChatGPT.",
            {
              retryable: true,
              cause: error,
              expectedAttachmentName,
              attachmentUploadAttempt: attempt,
              attachmentUploadMaxAttempts: maxAttempts,
            },
          );
        }
        await onState("chatgpt_canva_upload_retrying", {
          attachmentConfirmed: false,
          expectedAttachmentName,
          attachmentUploadAttempt: attempt,
          attachmentUploadMaxAttempts: maxAttempts,
          attachmentError: error?.code || error?.message || "CHATGPT_ATTACHMENT_NOT_CONFIRMED",
          chatUrl: page.url(),
        });
        await page.waitForTimeout(Math.min(4_000, 800 * attempt));
      }
    }

    throw automationError("CHATGPT_ATTACHMENT_NOT_CONFIRMED", "Nao foi possivel confirmar o anexo no ChatGPT.", {
      retryable: true,
    });
  }

  async composeCanvaRequest(page, prompt) {
    const composer = await this.findComposer(page);
    if (!composer) {
      throw automationError("CHATGPT_COMPOSER_NOT_FOUND", "A caixa de mensagem do ChatGPT nao foi encontrada.");
    }

    await composer.fill("@Canva");
    await page.waitForTimeout(900);
    const mentionOptions = page
      .locator("[role='option'], [role='menuitem']")
      .filter({ hasText: /Canva/i });
    const mentionCount = await mentionOptions.count();
    if (mentionCount > 0 && await locatorIsVisible(mentionOptions.first())) {
      await mentionOptions.first().click();
      await composer.press("End");
      await composer.type(` ${prompt.replace(/^Use @Canva\s*/i, "")}`);
    } else {
      await composer.fill(prompt);
    }
    return composer;
  }

  async sendRequest(page, composer) {
    const sendButton = page.locator(
      "[data-testid='send-button'], button[aria-label='Enviar prompt'], button[aria-label='Send prompt']",
    );
    if (await sendButton.count() > 0 && await locatorIsVisible(sendButton.first())) {
      await sendButton.first().click();
      return;
    }
    await composer.press("Enter");
  }

  async approveExpectedAppActions(page) {
    for (const label of APPROVAL_LABELS) {
      const button = page.getByRole("button", { name: label, exact: true });
      if (await button.count() === 1 && await locatorIsVisible(button)) {
        await button.click();
        await page.waitForTimeout(500);
        return true;
      }
    }
    return false;
  }

  async collectCanvaLinks(page) {
    const values = [];
    for (const frame of page.frames()) {
      try {
        values.push(...await frame.locator("a[href*='canva.com']").evaluateAll(
          (anchors) => anchors.slice(0, 30).map((anchor) => anchor.href),
        ));
        values.push(await frame.locator("body").innerText({ timeout: 2_000 }));
      } catch {
        // Cross-origin widgets and transient frames are expected.
      }
    }
    return extractCanvaDesignLink(values);
  }

  async tryOpenCanvaResult(page) {
    const buttons = page
      .locator("a, button")
      .filter({ hasText: /Open in Canva|Abrir no Canva|Edit in Canva|Editar no Canva/i });
    if (await buttons.count() === 0) return null;
    const button = buttons.first();
    const href = await button.getAttribute("href");
    const direct = extractCanvaDesignLink(href);
    if (direct) return direct;
    try {
      const popupPromise = this.context.waitForEvent("page", { timeout: 12_000 });
      await button.click();
      const popup = await popupPromise;
      await popup.waitForLoadState("domcontentloaded", { timeout: 20_000 }).catch(() => {});
      const result = extractCanvaDesignLink(popup.url());
      await popup.close().catch(() => {});
      return result;
    } catch {
      return extractCanvaDesignLink(page.url());
    }
  }

  async createDesign({
    imagePath,
    prompt,
    title,
    onState = async () => {},
    detectCreatedDesign = null,
    requireAttachmentConfirmation = true,
    expectedAttachmentName = path.basename(imagePath),
    attachmentUploadMaxAttempts = ATTACHMENT_UPLOAD_MAX_ATTEMPTS,
    attachmentConfirmTimeoutMs = ATTACHMENT_CONFIRM_TIMEOUT_MS,
  }) {
    const page = await this.getFreshAutomationPage();
    await page.goto(CHATGPT_URL, { waitUntil: "domcontentloaded", timeout: 45_000 });
    if (!await this.isSignedIn(page)) {
      throw automationError(
        "CHATGPT_LOGIN_REQUIRED",
        "A conta do atelier precisa de iniciar sessao no ChatGPT uma vez.",
        { loginRequired: true },
      );
    }

    await fs.access(imagePath);
    const actualAttachmentName = path.basename(imagePath);
    if (expectedAttachmentName && expectedAttachmentName !== actualAttachmentName) {
      throw automationError(
        "CHATGPT_ATTACHMENT_NAME_MISMATCH",
        `Era esperado o anexo ${expectedAttachmentName}, mas foi recebido ${actualAttachmentName}.`,
      );
    }

    const attachment = await this.uploadApprovedImage(page, imagePath, {
      onState,
      expectedAttachmentName: actualAttachmentName,
      attachmentUploadMaxAttempts,
      attachmentConfirmTimeoutMs,
    });
    if (requireAttachmentConfirmation && attachment.attachmentConfirmed !== true) {
      throw automationError(
        "CHATGPT_ATTACHMENT_NOT_CONFIRMED",
        "O pedido Canva foi bloqueado porque a imagem nao foi confirmada no ChatGPT.",
        { retryable: true },
      );
    }

    const composer = await this.composeCanvaRequest(page, `${prompt}\n\nDesign title: ${title}`);
    await onState("chatgpt_canva_processing", {
      ...attachment,
      chatUrl: page.url(),
    });
    await this.sendRequest(page, composer);

    const startedAt = Date.now();
    let lastProgressAt = 0;
    while (Date.now() - startedAt < this.timeoutMs) {
      const approved = await this.approveExpectedAppActions(page);
      if (approved) await onState("chatgpt_canva_processing", {
        ...attachment,
        approvalHandled: true,
        chatUrl: page.url(),
      });

      const link = await this.collectCanvaLinks(page);
      if (link) return { ...link, ...attachment, chatUrl: page.url() };

      if (typeof detectCreatedDesign === "function") {
        try {
          const design = await detectCreatedDesign();
          if (design?.id) {
            return {
              designId: design.id,
              editUrl: design?.urls?.edit_url || design?.urls?.view_url || "",
              design,
              ...attachment,
              chatUrl: page.url(),
            };
          }
        } catch {
          // The Canva list can lag briefly behind Image To Design.
        }
      }

      if (Date.now() - startedAt > 20_000) {
        const opened = await this.tryOpenCanvaResult(page);
        if (opened) return { ...opened, ...attachment, chatUrl: page.url() };
      }

      if (Date.now() - lastProgressAt > 15_000) {
        lastProgressAt = Date.now();
        await onState("chatgpt_canva_processing", {
          ...attachment,
          elapsedMs: Date.now() - startedAt,
          chatUrl: page.url(),
        });
      }
      await page.waitForTimeout(1_500);
    }
    throw automationError("CHATGPT_CANVA_TIMEOUT", "O ChatGPT nao devolveu o link Canva dentro do tempo limite.", {
      retryable: true,
    });
  }

  async close() {
    if (this.context) await this.context.close().catch(() => {});
    this.context = null;
    this.page = null;
    this.setupPage = null;
    this.automationPage = null;
  }
}
