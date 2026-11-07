// DSHIO 标准技能内容
// 装我们的插件后，模型可以直接载入这些技能来查阅标准和执行检查。

export const STANDARDS_SKILL = {
  name: "dshio-standards",
  description:
    "DSHIO 标准体系（DSHIO/T 00 术语、DSHIO/T 10 插件标准、DSHIO/T 21 测试条件）。" +
    "当用户问「符不符合 DSHIO 标准」「插件标准要求什么」「测试条件是什么」时载入本技能。" +
    "本技能包含条款编号与判定规则，可直接引用条款号。",
  whenToUse:
    "用户询问 DSH 插件是否合规、插件应满足哪些要求、沙箱测试在什么条件下进行、" +
    "或需要引用 DSHIO 标准条款号时使用。",
  content: `# DSHIO 标准速查

DSHIO = DeepSeek Harness Input/Output，第三方标准体系，不是官方机构。
标准号格式：\`DSHIO/T <序号>—<年份>\`，参照 GB/T 体例。

## 体系结构

| 区段 | 类型 | 内容 |
|---|---|---|
| 00–09 | 基础标准 | 术语、编写规则、分类编码、评定通则 |
| 10–19 | 产品标准 | 插件、套件、工具、数据接口、主题、模型接入 |
| 20–29 | 方法标准 | 测试方法、测试条件、抽样、分级 |
| 30–39 | 管理标准 | 收录、推荐、认证、标志、申诉、修订 |

引用单向：上层可引下层，下层不得引上层。

## 关键原则：实施独立性

**标准不要求使用任何特定的开发工具、编程语言、构建流程或辅助库。**
凡满足全部技术要求者即为符合，不论其如何实现。
判定以可观测的运行时行为为准，不以源码结构为准。

含义：
- 不强制 \`@deepseek-ai/dsh-tools\`（\`defineTool()\` 只是便捷方式，手写契约对象同样合法）
- 不强制 TypeScript
- 不强制 pnpm
- 不读源码判定

## 术语（DSHIO/T 00）

| 术语 | 定义 | 判别条件 |
|---|---|---|
| 插件 plugin | 向 DSH 提供能力的软件单元 | 三条全满足：① \`package.json\` 有 \`dsh.bundle.patch\` ② 该字段指向的文件存在 ③ 该文件 \`insert\` 列表至少一个 entry |
| 套件 bundle | 一组插件的集合 | 作为 \`dsh.profile.bundles\` 成员出现，本身不提供能力 |
| 工具 tool | 向模型暴露的可调用函数 | \`name\`/\`description\`/\`parameters\`/\`execute\` 四字段齐全 |
| 服务 service | 向其他插件提供的可注入能力 | 以 \`inject\` 声明依赖 |
| entry | 配置树中的一个条目 | \`cordis.patch.yml\` 的 \`insert\` 列表中的一项 |
| 挂载 mount | entry 出现在合成后的配置树 | \`dsh --dump-config\` 可见 |
| 判定 verdict | 对一次测试的结论 | 五值：pass / install_failed / config_failed / installs_but_not_registered / boot_failed |

**模型无关性**：DSH 的安装、挂载、启动不依赖具体模型，因为模型接入是独立插件（\`dsh-llm-*\`）。
所以 T0–T4 的判定在任何模型下都成立；只有 T5 依賴模型。

## 插件标准要点（DSHIO/T 10）

### 必须做到（critical）

| 条款 | 要求 |
|---|---|
| 5.1.1 | \`package.json\` 含 \`dsh.bundle.patch\` 字段 |
| 5.1.2 | 该字段指向的文件在包内存在 |
| 5.1.3 | patch 文件是合法 YAML（**\`@\` 开头的值必须加引号**，这是最常见错误）|
| 5.1.4 | patch 顶层是数组，至少含一个带 \`insert\` 的项 |
| 5.1.5 | 每个 entry 含非空 \`id\` 与 \`name\` |
| 5.2.2 | \`engines.dsh\` 范围包含基准版本 0.2.2-rc.1 |
| 5.2.3 | 有 \`main\` 或 \`exports\` 入口 |
| 5.3.2 | 不依赖本地绝对路径或 \`file:\` 协议 |

### 应该做到（major）

| 条款 | 要求 |
|---|---|
| 5.2.1 | 声明 \`engines.dsh\`；缺失时按 DSH peerDependencies 判定 |
| 5.3.1 | 若声明 \`files\`，必须包含 \`lib\` 与 patch 文件 |
| 6.1.1 | 每个工具的 description 必须让人判断出「什么情况下调用它」 |
| 6.1.2 | 声明的权限与实际行为一致（不高报、不低报） |
| 6.2.1 | 不得出现红线权限组合 |

### 红线

同时声明 \`network\` 与（\`shell\` 或 \`filesystem\` 写权限）= 数据外泄路径 = 高风险。

### 测试阶段（需沙箱）

| 阶段 | 网络 | 检查 |
|---|---|---|
| T1 安装 | 有网 | \`dsh plugin --profile web add <pkg>\` |
| T2 列装 | **断网** | \`dsh plugin --profile web list\` |
| T3 挂载 | **断网** | \`dsh --profile web --dump-config\` |
| T4 启动 | **断网** | profile 启动后存活 12 秒 |

T2–T4 必须 \`--network none\`：既防恶意行为外发数据，也让残留网络请求失败暴露。

## 测试条件要点（DSHIO/T 21）

**没有固定条件的测试报告只是一人在某台机器上的印象。** 报告必须记录环境指纹：

\`\`\`
dsh=0.2.2-rc.1;img=dsh-sandbox:5.0@sha256:...;node=24.11.1;pnpm=9.15.9;mem=768m;cpu=1
\`\`\`

固定项：DSH 版本（精确到 rc）、容器镜像 + digest、Node/pnpm 版本、内存 768MB、CPU 1 核、
网络状态、超时（安装 180s / 验证 90s / 启动观察 12s）。

**重复次数**：对外判定至少 2 次，结果必须一致；不一致记「不稳定」，不得用于认证。

T5（模型相关）额外必须记录：模型 ID + 版本、temperature、max_tokens、
系统提示词全文、测试提示词全文、**同一轮可用工具总数**（工具越多选错概率越高）。
T5 重复 3 次，认证用「全过」判据。

## 判定规则

- 任何 \`critical\` 条款不符合 → 不符合标准
- 只引用有编号的条款，不要自创条款号
- 无法自动判定的条款（描述质量、权限合理性）必须标为「需人工判断」，不要替用户下结论

## 引用格式

引用时写：\`DSHIO/T 10—2026 第 5.2.2 条\`
不要写：\`DSHIO-DEV\`、\`DSHIO-TEST\`（旧缩写已废止）

标准来源：https://deepseekbase.com/standards/ · 官网 dshio.org（建设中）
标准为第三方归纳，不是 DeepSeek 官方规范，引用时须注明。
`,
};

export const CHECK_SKILL = {
  name: "dshio-check",
  description:
    "对某个 DSH 插件执行 DSHIO/T 10 静态符合性检查。" +
    "当用户问「这个插件符不符合标准」「帮我检查我的插件」「哪里不合规」时载入本技能。" +
    "检查分三层：静态（可自动）、沙箱测试（需提交）、人工判断（只能给清单）。",
  whenToUse:
    "用户要求检查某个插件是否符合 DSHIO 标准、想知道自己的插件哪里不合规、" +
    "或要求生成合规报告时使用。",
  content: `# DSHIO 插件合规检查流程

## 三层检查，不要混为一谈

| 层 | 能判定 | 怎么得到结论 |
|---|---|---|
| **静态** | 结构合法性 | \`deepseekbase_check\` 工具，即时返回 |
| **沙箱** | 能否装/挂/启动 | \`deepseekbase_test_plugin\` 提交，几分钟出结果 |
| **人工** | 描述质量、权限合理性 | 只给清单和引导问题，**不要替用户下结论** |

## 执行顺序

1. 先调 \`deepseekbase_check(plugin)\` 拿静态结果
2. 有 critical 不符合 → 直接报，不要提交沙箱测试（省额度）
3. 静态通过 → 问用户要不要跑沙箱测试（会消耗免费额度 3 次/天）
4. manual 类条款：列出清单，让用户自己判断

## 怎么报告结果

**必须**：
- 引用条款号（如 \`5.2.2\`）
- 给出证据（实际值 vs 要求值）
- 给出修法（可复制粘贴的写法）
- 区分「不符合」和「需人工判断」

**禁止**：
- 说「看起来没问题」（必须有条款依据）
- 把 manual 条款判成通过或失败
- 自创条款号

## 常见错误与修法

### 1. \`@\` 开头未加引号（最常见）

\`\`\`yaml
# ✗ 错
- insert:
    - id: foo
      name: @scope/foo

# ✓ 对
- insert:
    - id: foo
      name: "@scope/foo"
\`\`\`

YAML 里 \`@\` 是保留指示符，不加引号会解析失败。

### 2. \`engines.dsh\` 上界写死

\`\`\`json
// ✗ 错：排除 0.2.2-rc.1
"engines": { "dsh": ">=0.2.0-rc.2 <0.2.2-0" }

// ✓ 对：只写下界
"engines": { "dsh": ">=0.2.0-rc.2" }
\`\`\`

### 3. files 数组漏了 patch

\`\`\`json
"files": ["lib/index.js", "cordis.patch.yml"]
\`\`\`

只写 \`lib/index.js\` 会漏掉整个目录。

### 4. 红线权限组合

\`\`\`json
"dsh": { "permissions": ["network", "fs-write"] }   // 高危
\`\`\`

如果确实需要，在 README 写清为什么需要 + 数据流向。

## 示例对话

用户：「帮我看看 dsh-pet 符不符合标准」

正确做法：
1. 调 \`deepseekbase_check("dsh-pet")\`
2. 报告：「静态检查 10/10 通过。还有 2 条需人工判断：description 是否说清场景、权限是否与实际一致。要不要跑沙箱测试？（消耗 1 次免费额度，每天 3 次）」

错误做法：
- 「dsh-pet 符合标准」← 没给条款依据，而且 manual 条款没判
- 直接跑沙箱测试 ← 没问用户，浪费额度
`,
};
