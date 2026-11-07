/**
 * dsh-dshio — DSHIO 标准知识包
 *
 * 只做一件事：把 DSHIO 标准体系的全部知识注册成技能。
 * 不含任何工具、不写文件、不执行命令。
 *
 * 五个技能：
 *   dshio-standards   标准全文（T00 / T10 / T20 / T21）
 *   dshio-check       符合性检查流程
 *   dsh-plugin-dev    插件开发指南
 *   dshio-testing     测试解读
 *   dshio-glossary    术语表
 *
 * 内容优先从服务端拉取（https://dshio.org/api/dshio/skills.json），
 * 拉不到用内置副本。所以我们更新标准时，已安装用户下次启动就同步。
 */

import { STANDARDS_SKILL, CHECK_SKILL } from "./skills.js";
import { PLUGIN_DEV_SKILL, TESTING_SKILL, GLOSSARY_SKILL } from "./skills_new.js";

export const name = "dsh-dshio";

export const inject = ["skills"];

const BASE = "https://dshio.org";
const BUNDLED = [
  STANDARDS_SKILL,
  CHECK_SKILL,
  PLUGIN_DEV_SKILL,
  TESTING_SKILL,
  GLOSSARY_SKILL,
];

const TIMEOUT_MS = 15000;

async function fetchJson(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function toRegistration(sk, layer, extra) {
  return {
    name: sk.name,
    description: sk.description,
    content: sk.content,
    // SkillSummary 要求顶层 source；register() 缺省用 registry 自带的 runtime provider
    source: "runtime",
    metadata: Object.assign(
      {
        source: "dshio",
        layer,
        version: sk.version || "1.0.0",
        standard: sk.standard || "",
        updated: sk.updated || "",
        lang: "zh-Hans",
        homepage: BASE + "/",
      },
      extra || {},
      sk.metadata || {},
    ),
    ...(sk.whenToUse ? { whenToUse: sk.whenToUse } : {}),
  };
}

export function apply(ctx) {
  if (!ctx.skills || typeof ctx.skills.register !== "function") return;

  const disposers = [];

  // 1. 先注册内置副本，保证离线可用
  for (const sk of BUNDLED) {
    try {
      disposers.push(ctx.skills.register(toRegistration(sk, "bundled")));
    } catch {
      /* 单个技能失败不影响其他 */
    }
  }

  // 2. 异步拉服务端版本，内容不同就替换
  (async () => {
    const doc = await fetchJson(BASE + "/api/dshio/skills.json");
    if (!doc || !Array.isArray(doc.skills) || !doc.skills.length) return;

    const remote = doc.skills.filter(
      (x) => x && typeof x.name === "string" && typeof x.content === "string",
    );
    if (!remote.length) return;

    // 内容完全一致就不动，避免无谓的目录失效
    const same = remote.every((rs) => {
      const local = BUNDLED.find((l) => l.name === rs.name);
      return local && local.content === rs.content;
    });
    if (same) return;

    for (const d of disposers) {
      try {
        d();
      } catch {
        /* ignore */
      }
    }
    disposers.length = 0;

    for (const rs of remote) {
      try {
        disposers.push(
          ctx.skills.register(
            toRegistration(rs, "remote", {
              manifest_version: doc.manifest_version || doc.version || "",
              manifest_updated: doc.updated || "",
            }),
          ),
        );
      } catch {
        /* ignore */
      }
    }
  })();
}
