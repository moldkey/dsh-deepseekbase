# @liangjiehappy/dsh-dshio

[English](README.md) | 中文

**把 DSHIO 标准体系做成 DeepSeek Harness 技能 —— 五个技能，带版本号，从 dshio.org 下发。**

```bash
dsh plugin --profile web add @liangjiehappy/dsh-dshio
```

或在 Web 界面：**插件 → 添加插件 → `@liangjiehappy/dsh-dshio`**

---

## 你会得到什么

| 技能 | 版本 | 依据标准 | 回答什么问题 |
|---|---|---|---|
| `dshio-standards` | 1.0.0 | DSHIO/T 00, 10, 20, 21, 32 | 标准原文到底怎么写的？ |
| `dshio-check` | 1.0.0 | DSHIO/T 10 | 怎么检查一个插件合不合规？ |
| `dsh-plugin-dev` | 1.0.0 | DSHIO/T 10 | 怎么写出一个能装上的插件？ |
| `dshio-testing` | 1.0.0 | DSHIO/T 20, 21 | `installs_but_not_registered` 是什么意思？ |
| `dshio-glossary` | 1.0.0 | DSHIO/T 00 | 插件、套件、工具到底有什么区别？ |

合计约 14,000 字的标准知识。

---

## 为什么单独做一个包

标准由 DSHIO 发布，数据工具由 deepseekbase 运营。合在一个包里，等于宣布「标准是某个产品的一部分」。
拆开之后身份就干净了：

| 你想要 | 装什么 |
|---|---|
| 只要标准 | `@liangjiehappy/dsh-dshio`（本包）|
| 要数据工具（会自动带上标准）| `@liangjiehappy/dsh-deepseekbase` |
| 要在 DSH 里装插件市场 | `@liangjiehappy/dsh-deepseekbase-market` |

---

## 内容更新不需要重装

技能内容不是焊死在这个包的 JS 里的。启动时它会拉：

```
https://dshio.org/api/dshio/skills.json
```

内容和内置副本不同，就在运行时替换掉。
**我们更新标准，你下次启动就是新的 —— 不用 npm 升级。**

拉不到（离线、被墙）就保留内置副本，技能照常可用。

每个技能都带 `version` 和依据的 `standard`，你能看出自己读的是哪一版。

---

## 它不做什么

- 不注册任何工具
- 不读写文件
- 不执行 shell
- 不碰凭证
- 不上报遥测

它只注册技能，别的什么都不干。只对 `dshio.org` 发出 HTTPS 请求。

---

## 数据来源说明

标准是 DSHIO 自己的，从官方开发套件的实际行为独立归纳而来 —— **不是** DeepSeek 官方规范。
官方链接：

- [DeepSeek 官网](https://www.deepseek.com) · [DeepSeek Harness](https://deepseek.com/harness)
- [官方仓库](https://github.com/deepseek-ai/deepseek-harness) · [API 文档](https://api-docs.deepseek.com)

每份标准的网页版：**https://dshio.org**

MIT 许可。源碼：[github.com/moldkey/dsh-deepseekbase](https://github.com/moldkey/dsh-deepseekbase)
