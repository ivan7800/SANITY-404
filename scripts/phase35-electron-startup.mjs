import { spawn, execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";
import {
  desktopRoot,
  resolveElectronExecutable,
} from "./phase34-electron-runtime.mjs";
import { evaluateStartup } from "./phase35-electron-startup-check.mjs";

const execFileAsync = promisify(execFile);
const outputDir = path.resolve(
  process.argv.find((arg) => arg.startsWith("--output-dir="))?.slice(13) ??
    "docs/capturas/fase34/electron-independent-native",
);
const timeoutMs = 25000;
const maxOutput = 65536;
const report = {
  startedAt: new Date().toISOString(),
  platform: process.platform,
  arch: process.arch,
  node: process.version,
  runnerOs: process.env.RUNNER_OS ?? null,
  sessionName: process.env.SESSIONNAME ?? null,
  electronRunAsNode: process.env.ELECTRON_RUN_AS_NODE ?? null,
  modes: [],
  completed: false,
};

function collect(target, chunk) {
  if (target.length >= maxOutput) return target;
  return (target + chunk.toString()).slice(0, maxOutput);
}

async function readRecords(file) {
  const content = await readFile(file, "utf8").catch((error) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
  return content
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function stopProcess(child, result, closed) {
  if (!child.pid || result.exited) return;
  try {
    if (process.platform === "win32") {
      await execFileAsync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        timeout: 10000,
      });
    } else {
      process.kill(-child.pid, "SIGKILL");
    }
    result.cleanup = "terminated process tree";
  } catch (error) {
    if (!result.exited) result.cleanupError = String(error);
  }
  await Promise.race([closed, delay(5000)]);
  if (!result.exited)
    result.cleanupError ??= "process remained alive after cleanup";
}

async function probe(mode, executablePath) {
  const userData = await mkdtemp(path.join(os.tmpdir(), "sanity35-electron-"));
  const startupLog = path.join(userData, "startup.jsonl");
  const chromiumLog = path.join(userData, "chromium.log");
  const args = [
    "--enable-logging=file",
    `--log-file=${chromiumLog}`,
    ...(mode === "debug-flags"
      ? ["--inspect=0", "--remote-debugging-port=0"]
      : []),
    desktopRoot,
  ];
  const env = {
    ...process.env,
    SANITY_QA_USER_DATA: userData,
    SANITY_QA_STARTUP_LOG: startupLog,
  };
  delete env.NODE_OPTIONS; // Playwright also removes this variable when launching Electron.
  const result = {
    mode,
    startedAt: new Date().toISOString(),
    executablePath,
    args,
    timeoutMs,
    stdout: "",
    stderr: "",
    records: [],
  };
  let child;
  try {
    child = spawn(executablePath, args, {
      cwd: desktopRoot,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      detached: process.platform !== "win32",
    });
    result.pid = child.pid ?? null;
    result.processStarted = Boolean(child.pid);
    const closed = new Promise((resolve) => {
      child.once("close", (code, signal) => {
        result.exited = true;
        result.exitCode = code;
        result.signal = signal;
        resolve();
      });
    });
    child.once("error", (error) => {
      result.spawnError = String(error);
    });
    child.stdout.on("data", (chunk) => {
      result.stdout = collect(result.stdout, chunk);
    });
    child.stderr.on("data", (chunk) => {
      result.stderr = collect(result.stderr, chunk);
    });

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline && !result.exited && !result.spawnError) {
      result.records = await readRecords(startupLog);
      const check = evaluateStartup(result.records);
      if (check.passed || check.errors.length > 0) break;
      await delay(100);
    }
    result.records = await readRecords(startupLog);
    result.check = evaluateStartup(result.records);
    result.timedOut =
      Date.now() >= deadline && !result.check.passed && !result.exited;
    if (result.check.passed) await delay(500);
    result.passed =
      result.processStarted && result.check.passed && !result.exited;
    result.debuggerListening = /Debugger listening on ws:\/\//.test(
      result.stderr,
    );
    result.devToolsListening = /DevTools listening on ws:\/\//.test(
      result.stderr,
    );
    result.chromiumLog = await readFile(chromiumLog, "utf8")
      .then((content) => content.slice(0, maxOutput))
      .catch((error) => (error.code === "ENOENT" ? "" : String(error)));
    await stopProcess(child, result, closed);
    if (result.cleanupError) result.passed = false;
  } catch (error) {
    result.passed = false;
    result.error = { message: String(error), stack: error.stack };
    if (child?.pid && !result.exited) {
      // A failed record read must not leave the GUI process behind.
      const closed = new Promise((resolve) => child.once("close", resolve));
      await stopProcess(child, result, closed);
    }
  } finally {
    result.finishedAt = new Date().toISOString();
    report.modes.push(result);
    await rm(userData, { recursive: true, force: true });
  }
  console.log(
    `${result.passed ? "PASS" : "FAIL"} Electron ${mode}: ${JSON.stringify({
      pid: result.pid,
      stages: result.records.map((record) => record.stage),
      check: result.check,
      debuggerListening: result.debuggerListening,
      devToolsListening: result.devToolsListening,
      timedOut: result.timedOut,
      exitCode: result.exitCode,
      cleanupError: result.cleanupError,
    })}`,
  );
}

try {
  await mkdir(outputDir, { recursive: true });
  const executablePath = resolveElectronExecutable();
  report.executablePath = executablePath;
  for (const mode of ["plain", "debug-flags"])
    await probe(mode, executablePath);
  report.completed = report.modes.every((mode) => mode.passed);
  if (!report.completed) process.exitCode = 1;
} catch (error) {
  report.failure = { message: String(error), stack: error.stack };
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  await mkdir(outputDir, { recursive: true });
  await writeFile(
    path.join(outputDir, "diagnostico.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
}
