#!/usr/bin/env node

const { execSync, spawn } = require("node:child_process");
const net = require("node:net");

const LOCAL_PORT = 5432;
const REMOTE_HOST = "my"; // 对应 ~/.ssh/config 中的 Host 别名

function freePort(port) {
  try {
    const stdout = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN`, {
      encoding: "utf8",
    });
    const pids = stdout.trim().split("\n").filter(Boolean);
    if (pids.length > 0) {
      console.log(
        `\x1b[33m🧹 [Port ${port}] 发现旧进程 (${pids.join(", ")}) 占用，已自动清理释放\x1b[0m`,
      );
      for (const pid of pids) {
        try {
          process.kill(Number(pid), "SIGKILL");
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // 端口无监听进程，直接跳过
  }
}

function checkPort(port, host = "127.0.0.1", timeout = 500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(timeout);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

async function waitForPort(port, maxWaitMs = 4000, intervalMs = 200) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (await checkPort(port)) {
      return true;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

async function start() {
  let sshProcess = null;

  // 1. 检查本地 5432 是否已有连接（防止重复开启冲突）
  const alreadyOpen = await checkPort(LOCAL_PORT);

  if (alreadyOpen) {
    console.log(
      `\x1b[36mℹ️  [SSH Tunnel] 本地端口 ${LOCAL_PORT} 已处于连接状态，复用已有连接\x1b[0m`,
    );
  } else {
    // 2. 启动 SSH 隧道
    try {
      sshProcess = spawn(
        "ssh",
        [
          "-N",
          "-L",
          `${LOCAL_PORT}:localhost:5432`,
          "-o",
          "ExitOnForwardFailure=yes",
          "-o",
          "ServerAliveInterval=30",
          "-o",
          "ConnectTimeout=3",
          REMOTE_HOST,
        ],
        { stdio: "ignore" },
      );

      sshProcess.on("error", (err) => {
        console.warn(
          `\x1b[33m⚠️  [SSH Tunnel] 启动失败: ${err.message}，将以离线模式启动 Next.js\x1b[0m`,
        );
      });

      const ready = await waitForPort(LOCAL_PORT, 3500);
      if (ready) {
        console.log(
          `\x1b[32m✅ [SSH Tunnel] 已打通远程 PostgreSQL (${REMOTE_HOST}:5432 -> localhost:${LOCAL_PORT})\x1b[0m`,
        );
      } else {
        console.warn(
          `\x1b[33m⚠️  [SSH Tunnel] 隧道连接超时（可能网络受阻），将以纯前端模式启动 Next.js\x1b[0m`,
        );
      }
    } catch (e) {
      console.warn(`\x1b[33m⚠️  [SSH Tunnel] 启动异常: ${e.message}\x1b[0m`);
    }
  }

  // 3. 检查并清理 3000 端口（防止其他终端残留的 next 实例导致冲突）
  freePort(3000);

  // 4. 启动 Next.js Dev Server
  const nextDev = spawn("pnpm", ["exec", "next", "dev"], {
    stdio: "inherit",
  });

  const cleanup = () => {
    if (sshProcess && !sshProcess.killed) {
      try {
        sshProcess.kill("SIGTERM");
      } catch {
        // ignore
      }
    }
  };

  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });
  process.on("exit", cleanup);

  nextDev.on("exit", (code) => {
    cleanup();
    process.exit(code ?? 0);
  });
}

start();
