// 新增的 3 个技能：开发、测试、术语
// 与现有的 dshio-standards / dshio-check 一起放进 dsh-dshio 知识包

export const PLUGIN_DEV_SKILL = {
  name: "dsh-plugin-dev",
  version: "1.0.0",
  description:
    "DSH 插件开发指南：从零写一个能装上的插件。含最小模板、manifest 必填字段、" +
    "cordis.patch.yml 写法、engines.dsh 版本范围、工具契约、以及最常见的四个失败模式。" +
    "当用户要写插件、插件装不上、不知道 manifest 怎么写时载入。",
  whenToUse:
    "用户要开发 DSH 插件、询问 package.json 怎么写、cordis.patch.yml 怎么写、" +
    "engines.dsh 怎么填、插件装不上要排查原因时使用。",
  content: `# DSH 插件开发指南

## 一、最小可安装插件（30 行）

**目录结构：**
\`\`\`
my-plugin/
├── package.json
├── cordis.patch.yml
└── lib/index.js
\`\`\`

**package.json：**
\`\`\`json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "type": "module",
  "main": "lib/index.js",
  "files": ["lib", "cordis.patch.yml"],
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" } },
  "engines": { "dsh": ">=0.2.0-rc.2" }
}
\`\`\`

**cordis.patch.yml：**
\`\`\`yaml
- insert:
    - id: my-plugin
      name: my-plugin
\`\`\`

**lib/index.js：**
\`\`\`js
export const name = "my-plugin";
export const inject = ["tools"];
export function apply(ctx) {
  ctx.tools.register({
    name: "my_tool",
    description: "一句话说清什么时候该用它。",
    parameters: {
      q: { type: "string", required: true, description: "查询词" },
    },
    async execute(args) {
      return { text: "结果: " + args.q };
    },
  });
}
\`\`\`

**发布：** \`npm publish\`
**安装：** \`dsh plugin --profile web add my-plugin\`

---

## 二、manifest 必填字段

| 字段 | 必填 | 说明 |
|---|---|---|
| \`name\` | ✅ | npm 包名，带作用域要完整 |
| \`version\` | ✅ | semver |
| \`type\` | 宜 | \`"module"\`（ESM） |
| \`main\` 或 \`exports\` | ✅ | 代码入口 |
| \`dsh.bundle.patch\` | ✅ | **没有这个就不是插件** |
| \`files\` | 宜 | 必须含 \`lib\` 与 patch 文件 |
| \`engines.dsh\` | 宜 | 版本范围，缺失则按 peerDeps 判 |

---

## 三、cordis.patch.yml 写法

**顶层必须是数组：**

\`\`\`yaml
- insert:
    - id: my-plugin        # 配置树里的唯一 id
      name: my-plugin      # 模块 specifier
\`\`\`

**带配置：**
\`\`\`yaml
- insert:
    - id: my-plugin
      name: my-plugin
      config:
        timeout: 30
\`\`\`

**插入多个 entry：**
\`\`\`yaml
- insert:
    - id: my-plugin
      name: my-plugin
    - id: my-plugin-ui
      name: my-plugin/client
\`\`\`

**⚠️ 最常见的致命错误：\`@\` 开头的值必须加引号**

\`\`\`yaml
# ✗ 错 —— YAML 解析失败，插件装不上
- insert:
    - id: foo
      name: @scope/foo

# ✓ 对
- insert:
    - id: foo
      name: "@scope/foo"
\`\`\`

YAML 里 \`@\` 是保留指示符。

---

## 四、engines.dsh 怎么填

**只写下界，不要写上界。**

\`\`\`json
// ✓ 对
"engines": { "dsh": ">=0.2.0-rc.2" }

// ✗ 错 —— 会排除 0.2.2-rc.1
"engines": { "dsh": ">=0.2.0-rc.2 <0.2.2-0" }
\`\`\`

**为什么：** DSH 安装时会校验 \`engines.dsh\` 是否匹配运行时版本。上界写死，新版本一发布你的插件就装不上了。

**精确到预发布标识：** 判定时用的是 \`dsh --version\` 的输出，如 \`0.2.2-rc.1\`。

---

## 五、工具契约

注册工具时四个字段必填：

| 字段 | 要求 |
|---|---|
| \`name\` | 非空、唯一、小写加下划线 |
| \`description\` | **必须让人判断出什么时候该调用它** |
| \`parameters\` | JSON Schema 对象约定 |
| \`execute\` | 函数 |

**description 的合格标准：**

\`\`\`
✗ 差："查询插件"
✓ 好："按关键词搜索 DSH 插件，返回下载量、风险等级和沙箱测试判定。
       当用户问『有哪些 XX 类插件』或『某插件装得上吗』时使用。"
\`\`\`

---

## 六、插件能注入什么服务

在 \`inject\` 里声明依赖：

| 服务 | 用途 |
|---|---|
| \`tools\` | 注册工具 |
| \`systemPrompt\` | 加系统提示 |
| \`skills\` | 注册技能 |
| \`fs\` | 文件读写 |
| \`llm\` | 调用模型 |
| \`web\` | 搜索/抓网页 |
| \`session\` | 会话数据 |
| \`shell\` | 执行命令 |

**只声明你真正用的** —— 声明未使用的服务会拖慢启动。

---

## 七、四个最常见的失败模式

### 1. YAML 里 \`@\` 没加引号
**现象：** \`installation rejected: failed to parse overlay ... YAMLException\`
**修：** \`name: "@scope/pkg"\`

### 2. \`files\` 漏了 patch 文件
**现象：** 本地能装，npm 上装不上
**修：** \`"files": ["lib", "cordis.patch.yml"]\`

### 3. \`dependencies\` 里有 \`file:\` 路径
**现象：** 别人装不上，你本地能装
**修：** 改成 npm 包名，或移到 \`devDependencies\`

### 4. entry 没进配置树
**现象：** 装上了、列表里也有，但功能不生效
**查：** \`dsh --profile web --dump-config | grep -A3 "id: my-plugin"\`
**因：** patch 被后续层覆盖、id 与已有 entry 冲突

---

## 八、自检清单

发 npm 之前：

- [ ] \`package.json\` 有 \`dsh.bundle.patch\`
- [ ] 该字段指向的文件存在且在 \`files\` 里
- [ ] patch 文件 YAML 合法（\`@\` 已加引号）
- [ ] 顶层是数组，含 \`insert\`
- [ ] 每个 entry 有 \`id\` 和 \`name\`
- [ ] \`engines.dsh\` 只写下界
- [ ] 有 \`main\` 或 \`exports\`
- [ ] 依赖里没有 \`file:\`

**自动化检查：** 用 \`deepseekbase_check\` 工具，或访问 https://dshio.org/check/

---

## 九、官方文档

官方开发文档（本指南是对它们的归纳）：

- cordis-primer — Cordis 五個核心概念
- cordis-tutorial/01-first-plugin — 最小插件與三種形狀
- cordis-tutorial/03-services — 服務與 inject
- tool-catalog — 內置工具的完整 schema
- config-catalog — 所有配置項

地址：https://github.com/deepseek-ai/deepseek-harness/tree/master/docs

本指南是第三方归纳，不是官方规范。以官方文档为准。
`,
};

export const TESTING_SKILL = {
  name: "dshio-testing",
  version: "1.0.0",
  description:
    "DSH 插件测试解读：四阶段（安装/列装/挂载/启动）分别在测什么、" +
    "五种判定分别意味着什么、怎么在本地自己跑一遍、以及为什么某些失败最难发现。" +
    "当用户问某个判定是什么意思、测试怎么做的、怎么自己测插件时载入。",
  whenToUse:
    "用户询问测试判定含义（install_failed / installs_but_not_registered / boot_failed）、" +
    "想知道测试怎么执行、想自己复现测试、或看不懂测试报告时使用。",
  content: `# DSH 插件测试解读

## 一、四个阶段，各测什么

| 阶段 | 名称 | 网络 | 检查什么 |
|---|---|---|---|
| **T1** | 安装 | 有网 | \`dsh plugin add\` 能否成功 |
| **T2** | 列装 | **断网** | 是否出现在依赖列表 |
| **T3** | 挂载 | **断网** | entry 是否进入配置树 |
| **T4** | 启动 | **断网** | profile 能否启动并存活 12 秒 |

**为什么 T2–T4 要断网：**

1. **可复现** —— 有网时插件可能依赖外部服务，结果随服务状态变化
2. **安全** —— 插件有恶意行为也无处发数据
3. **暴露隐藏请求** —— 断网后残留的网络请求会失败并暴露

---

## 二、五种判定，各意味着什么

| 判定 | 含义 | 严重性 |
|---|---|---|
| **pass** | 全部阶段通过 | ✅ 可以正常用 |
| **install_failed** | T1 或 T2 失败 | ❌ 根本装不上 |
| **config_failed** | T3 命令本身失败 | ❌ 配置树生成失败 |
| **installs_but_not_registered** | T3 通过但 entry 不在配置树 | ⚠️ **最隐蔽** |
| **boot_failed** | T4 失败 | ❌ 能挂载但起不来 |

### \`installs_but_not_registered\` 为什么最隐蔽

**用户看到的是：**
- 安装成功 ✅
- 插件列表里有 ✅
- **但功能就是不生效** ❌

**原因：**
1. patch 的 \`insert\` 被 profile 后几层覆盖或禁用
2. \`id\` 与已有 entry 冲突，导致覆盖而非新增
3. patch 文件写入了但没有 \`insert\` 项

**怎么查：**
\`\`\`bash
dsh --profile web --dump-config | grep -A4 "id: <你的-entry-id>"
\`\`\`

找不到就是没挂上。

---

## 三、怎么自己跑一遍

**前提：** DSH 已安装，有一个 profile。

### 1. 准备干净 profile
\`\`\`bash
# 用出厂模板重建
dsh --profile web --from-default-profile web
\`\`\`

### 2. T1 安装（有网）
\`\`\`bash
dsh plugin --profile web add <包名>
echo "退出码: $?"   # 必须是 0
\`\`\`

### 3. T2 列装（断网）
\`\`\`bash
# 断网后执行（例如容器里加 --network none）
dsh plugin --profile web list | grep <包名>
\`\`\`

### 4. T3 挂载（断网）
\`\`\`bash
dsh --profile web --dump-config | grep -A4 "id: <你的-entry-id>"
\`\`\`

### 5. T4 启动（断网）
\`\`\`bash
dsh --profile web
# 观察 12 秒，进程不能退出
\`\`\`

---

## 四、测试条件为什么重要

**没有固定条件的测试结果，只是一个人某天某台机器上的印象。**

同一份报告必须记录环境指纹：

\`\`\`
dsh=0.2.2-rc.1;img=dsh-sandbox:5.0@sha256:...;node=24.11.1;pnpm=9.15.9;mem=768m;cpu=1
\`\`\`

**固定项：**
- DSH 版本（**精确到 rc**，写 \`0.2.x\` 不算）
- 容器镜像 + digest
- Node / pnpm 版本
- 内存 / CPU
- 网络状态
- 超时

**重复次数：** 对外判定至少 2 次，结果必须一致。不一致记「不稳定」，不得用于认证。

---

## 五、测试结果怎么看

**我们发布的每条判定都带：**

| 字段 | 说明 |
|---|---|
| \`verdict\` | 五值之一 |
| \`dsh_version\` | 测的是哪个 DSH 版本 |
| \`tested_at\` | 测试时间 |
| \`install_ok\` / \`listed\` / \`config_ok\` / \`registered\` / \`boot_ok\` | 各阶段布尔值 |
| \`node_modules_mb\` | 安装体积 |
| \`first_error\` | 第一条能定位失败的行 |

**怎么用：**
\`\`\`
deepseekbase_test_result("dsh-pet")
→ verdict: tested: pass
   dsh_version: 0.2.2-rc.1
   node_modules: 136.15 MB
\`\`\`

---

## 六、从 4,000 个测试里看到的规律

基于 4,025 个插件的实测（DSH 0.2.2-rc.1）：

| 判定 | 占比 |
|---|---:|
| pass | 79.9% |
| install_failed | 18.8% |
| installs_but_not_registered | 1.0% |
| boot_failed | 0.3% |

**三个结论：**

1. **约五分之一装不上** —— 所以「存在」不等于「能用」
2. **installs_but_not_registered 只占 1%，但最难被用户自己发现**
3. **boot_failed 极少** —— 能挂载的基本都能启动

---

## 七、标准依据

- **DSHIO/T 20** 测试方法总则 —— 每阶段做什么、看什么、怎么判
- **DSHIO/T 21** 测试条件 —— 在什么条件下做

本文是 T20/T21 的通俗版。判定以标准原文为准。
`,
};

export const GLOSSARY_SKILL = {
  name: "dshio-glossary",
  version: "1.0.0",
  description:
    "DSHIO 术语表：插件、套件、工具、服务、entry、patch、挂载、判定等术语的标准定义、" +
    "判别条件、常见误解与相关术语。当用户对某个词的确切含义有疑问、" +
    "或需要引用标准术语时载入。",
  whenToUse:
    "用户问『XX 是什么意思』、『插件和套件有什么区别』、需要精确术语表述、" +
    "要引用标准定义时使用。",
  content: `# DSHIO 术语表

> 依据 DSHIO/T 00—2026 术语和定义。
> 完整网页版：https://dshio.org/glossary/

## 一、插件相关

### 插件 plugin

**定义：** 向 DSH 提供一项或多项能力的软件单元。以 npm 包形式分发，
通过 \`cordis.patch.yml\` 声明在配置树中的位置。

**判别条件（三条全满足）：**
1. \`package.json\` 含 \`dsh.bundle.patch\` 字段
2. 该字段指向的 patch 文件存在
3. 该 patch 文件的 \`insert\` 列表至少含一个 entry

**常见误解：**
- ❌ 「有 dsh 字段就是插件」 —— 只有 \`dsh.client\` 不算，必须 \`dsh.bundle.patch\`
- ❌ 「能 npm install 就是插件」 —— 还要能被 DSH 挂载

**相关：** 套件 bundle、工具 tool、服务 service

---

### 套件 bundle

**定义：** 一组插件的集合。作为 \`dsh.profile.bundles\` 列表成员出现。

**和插件的区别：**
- 插件提供能力
- 套件只是打包多个插件和它们的配置，本身不提供能力

**例子：** \`@deepseek-ai/dsh-web-app\` 是套件，包含 web 界面、会话管理、工具执行器等一组插件。

---

### 工具 tool

**定义：** 向模型暴露的可调用函数。

**判别条件：** 有 \`name\`、\`description\`、\`parameters\`、\`execute\` 四个字段。

**常见误解：**
- ❌ 「工具就是命令」 —— 工具是给模型调用的，不是给人敲的
- ❌ 「一个插件只能有一个工具」 —— 可以有一堆

---

### 服务 service

**定义：** 插件向其他插件提供的可注入能力。

**例子：** \`dsh-fs\` 提供文件读写，\`dsh-llm\` 提供模型调用。
你的插件在 \`inject\` 里声明要用哪些服务。

---

## 二、配置相关

### entry

**定义：** 配置树中的一个条目。\`cordis.patch.yml\` 的 \`insert\` 列表中的一项。

**字段：** \`id\`（唯一标识）、\`name\`（模块 specifier）、\`config\`（可选）。

---

### patch

**定义：** 描述对配置树的插入、覆盖或禁用操作的 YAML 文件。

**约定文件名：** \`cordis.patch.yml\`

---

### 配置树 composed config tree

**定义：** profile 的所有 patch 层按优先序合成后得到的 entry 列表。

**查看：** \`dsh --profile web --dump-config\`

---

### 层优先序 layer precedence

**定义：** 配置合成的顺序。后者覆盖前者：

\`\`\`
1. 各 bundle 的 patch，按 dsh.profile.bundles 顺序
2. profile 的 cordis.patch.yml
3. home 级 $DSH_HOME/cordis.patch.yml
4. --patch 覆盖层
\`\`\`

---

### profile

**定义：** DSH 启动时载入的一组插件及其配置。对应 \`$DSH_HOME/profiles/<name>/\`。

**出厂 profile：** \`web\`、\`headless\`、\`sdk\`、\`sdk-minimal\`、\`acp\`

**注：** \`desktop\` 是保留名，CLI 不接受。

---

## 三、测试相关

### 挂载 mount

**定义：** entry 出现在合成后的配置树中。

**判定：** \`dsh --dump-config\` 的输出里有你的 entry。

**为什么重要：** 装上了 ≠ 挂载了 ≠ 生效了。

---

### 判定 verdict

**定义：** 对一次测试的结论。

**五个值：**

| 值 | 含义 |
|---|---|
| \`pass\` | 全部阶段通过 |
| \`install_failed\` | 安装阶段失败 |
| \`config_failed\` | 配置树生成失败 |
| \`installs_but_not_registered\` | 装上了但没进配置树 |
| \`boot_failed\` | 能挂载但启动失败 |

---

### 可复现性 reproducibility

**定义：** 在相同测试条件下重复执行，得到相同判定的性质。

**要求：** 任何对外发布的判定，至少执行两次且结果一致。

---

## 四、模型相关

### 模型无关性 model agnosticism

**定义：** DSH 的核心能力（安装、挂载、启动、工具注册）不依赖具体模型的性質。

**依据：** 模型接入由独立插件提供（\`dsh-llm-deepseek\`、\`dsh-llm-pi-ai\` 等），不在 harness 核心内。

**意涵：** 一个插件在 DeepSeek 模型下能装上，换成其他模型也能装上。
**安装性与模型无关。**

---

### 模型接入插件 model adapter

**定义：** 把某个模型提供商接入 DSH 的插件。

**命名约定：** \`dsh-llm-<provider>\`

**例子：** \`dsh-llm-deepseek\`、\`dsh-llm-pi-ai\`

---

## 五、安全相关

### 权限声明 declared capability

**定义：** 插件在 manifest 中声明的所需能力。

**能力标识：**
\`fs-read\`、\`fs-write\`、\`network\`、\`shell\`、\`credentials\`、\`dynamic-code\`、\`llm\`、\`env\`

---

### 红线 red line

**定义：** 单独出现即判定为高风险的权限组合。

**当前定义：** \`network\` 与（\`shell\` 或 \`fs-write\`）同时出现
→ 构成「读取本地资料并发送到外部」的完整路径。

---

## 六、标准体系相关

### DSHIO

**定义：** DeepSeek Harness Input/Output。本标准体系的发布机构代号。

**注：** 不是官方机构，不是认证机构，是标准的编写与维护方。

---

### 参照实现 reference implementation

**定义：** 第一个按某标准完整实现并通过全部条款的实例。

**规则：** 标准发布前必须有参照实现。无参照实现的不得从「草案」转「现行」。

---

### 实施独立性 implementation independence

**定义：** 标准不要求使用任何特定工具、语言、构建流程或辅助库。

**意涵：** 不用官方开发套件也能写出合格的插件。

---

### 例外 exception

**定义：** 标准要求与实际冲突时，经公开登记的偏离。

**规则：** 未登记的偏离不是例外，是不符合。

---

## 七、引用格式

**引用标准时写：**
\`\`\`
DSHIO/T 10—2026 第 5.2.2 条
\`\`\`

**不要写：**
- \`DSHIO-DEV\`（已废止的旧代号）
- \`插件标准第 2 条\`（必须带标准号）

---

完整定义与多语言对照见 DSHIO/T 00—2026 附录 A。
网页版：https://dshio.org/glossary/
`,
};
