// scripts/dev.mjs
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT || 3000);

function rm(relPath) {
  const p = path.join(ROOT, relPath);
  try {
    fs.rmSync(p, { recursive: true, force: true });
    console.log(`✓ removed ${relPath}`);
  } catch {}
}

function killPort(port) {
  // macOS/Linux only
  if (process.platform === "win32") return;

  const res = spawnSync("lsof", ["-ti", `tcp:${port}`], { encoding: "utf8" });
  const pids = (res.stdout || "").split(/\s+/).filter(Boolean);

  for (const pid of pids) {
    try {
      process.kill(Number(pid), "SIGKILL");
      console.log(`✓ killed pid ${pid} on port ${port}`);
    } catch {}
  }

  if (!pids.length) console.log(`✓ port ${port} is free`);
}

function nextBin() {
  const bin =
    process.platform === "win32"
      ? path.join(ROOT, "node_modules", ".bin", "next.cmd")
      : path.join(ROOT, "node_modules", ".bin", "next");
  return fs.existsSync(bin) ? bin : null;
}

killPort(PORT);
rm(".next");

const bin = nextBin();
const cmd = bin ?? "next";
const args = ["dev", "-p", String(PORT)];

const child = spawn(cmd, args, {
  stdio: "inherit",
  shell: !bin,
  env: { ...process.env, PORT: String(PORT) },
});

child.on("exit", (code) => process.exit(code ?? 0));
