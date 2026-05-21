const AUTH_PREFIX = "AUTH_";

function pathAllowed(dopath: string, allowPaths: string): boolean {
  for (const entry of allowPaths.split(",")) {
    const rule = entry.trim();
    if (!rule) continue;
    if (rule === "*" || dopath.startsWith(rule)) return true;
  }
  return false;
}

function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.byteLength !== bb.byteLength) {
    crypto.subtle.timingSafeEqual(ab, ab);
    return false;
  }
  return crypto.subtle.timingSafeEqual(ab, bb);
}

/** 新格式：AUTH_<用户名> = 密码|允许目录（Pages 中勾选 Encrypt） */
function getAllowPathsFromAuthEntry(
  env: Record<string, string>,
  username: string,
  password: string
): string | undefined {
  const raw = env[`${AUTH_PREFIX}${username}`];
  if (!raw) return undefined;
  const sep = raw.indexOf("|");
  if (sep < 0) return undefined;
  const storedPassword = raw.slice(0, sep);
  const paths = raw.slice(sep + 1);
  if (!safeEqual(storedPassword, password)) return undefined;
  return paths;
}

/** 旧格式兼容：变量名为 账号__密码 或 账号:密码，值为目录列表 */
function getAllowPathsLegacy(
  env: Record<string, string>,
  account: string
): string | undefined {
  if (env[account]) return env[account];
  const pagesKey = account.replace(/:/g, "__");
  if (pagesKey !== account && env[pagesKey]) return env[pagesKey];
  return undefined;
}

function parseBasicAccount(header: string | null): { username: string; password: string } | null {
  if (!header?.startsWith("Basic ")) return null;
  const decoded = atob(header.slice(6));
  const sep = decoded.indexOf(":");
  if (sep < 0) return null;
  return {
    username: decoded.slice(0, sep),
    password: decoded.slice(sep + 1),
  };
}

export function get_auth_status(context) {
  const dopath = context.request.url.split("/api/write/items/")[1];
  if (dopath.startsWith("_$flaredrive$/thumbnails/")) return true;

  if (context.env["GUEST"]) {
    if (pathAllowed(dopath, context.env["GUEST"])) return true;
  }

  const creds = parseBasicAccount(context.request.headers.get("Authorization"));
  if (!creds) return false;

  const allowPaths =
    getAllowPathsFromAuthEntry(context.env, creds.username, creds.password) ??
    getAllowPathsLegacy(context.env, `${creds.username}:${creds.password}`);

  if (!allowPaths) return false;
  return pathAllowed(dopath, allowPaths);
}
