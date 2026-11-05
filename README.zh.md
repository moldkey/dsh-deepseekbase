# dsh-deepseekbase

[English](README.md) | 中文

**把 DeepSeek 的價格、插件、模型參數和三調用量接進 DeepSeek Harness。**

```bash
dsh plugin --profile web add github:moldkey/dsh-deepseekbase
```

---

## 最重要的一點：我們免費測插件

大部分插件目錄只告訴你「這個插件存在」。

**沒有人告訴你「它在你這個版本上裝得上嗎」。**

所以我們對索引的每個 DSH 插件做真實沙箱安裝測試 —— **免費，永久**：

| 階段 | 做什麼 |
|---|---|
| 1 | 在乾淨容器裡安裝（`dsh plugin add`）|
| 2 | 確認它出現在 `dsh plugin list` |
| 3 | 確認它掛載進組合後的配置樹 |
| 4 | 啟動 profile，確認進程存活 |

第 2-4 階段完全無網絡（`--network none`），所以即使插件有惡意行為也無處可去。
容器跑完即毀。

**目前的結果：頭部 120 個插件裡，13% 在 DSH 0.2.2-rc.1 上根本裝不上。**
8 個栽在 `engines.dsh` 版本範圍，5 個在 npm 上已經不存在了。

完整結果，隨測試持續更新：

**→ [deepseekbase.com/ecosystem/plugin-tests](https://deepseekbase.com/ecosystem/plugin-tests/)**

不用註冊、不需要 API Key、讀結果不限次數。

---

## 這個插件給你什麼

| 工具 | 回答什麼 |
|---|---|
| `deepseekbase_price` | DeepSeek 多少錢？哪家服務商最便宜？ |
| `deepseekbase_plugin` | 哪個插件能做 X？多少人用？風險多大？ |
| `deepseekbase_specs` | 模型多大？上下文多長？裝得下嗎？ |
| `deepseekbase_trend` | DeepSeek 到底被用了多少？ |

### 例子

> **你：** 比較一下 DeepSeek V4.1 Flash 各家服務商的價格
>
> **工具返回：**
> ```
> 官方：離峰 輸入 $0.15 / 輸出 $0.60 每百萬 token
> 最便宜第三方：Particle AI —— 輸入 $0.025 / 輸出 $0.25
> ```
> 同一個模型，價差 6 倍。

---

## 安裝

```bash
dsh plugin --profile web add github:moldkey/dsh-deepseekbase
```

重啟 Harness，四個工具就可用。

從 npm 安裝（發布後）：

```bash
dsh plugin --profile web add dsh-deepseekbase
```

---

## 權限

這個插件：

- 只對 `deepseekbase.com` 發出 **HTTPS 請求**
- **不**讀寫你的文件
- **不**讀憑證或環境變量
- **不**執行 shell 命令

整個實現就是 `lib/index.js` —— 一個文件、零運行時依賴。
五分鐘可以審完。

---

## 數據來源

| 端點 | 用於 |
|---|---|
| `POST https://deepseekbase.com/mcp` | 價格、插件、模型參數 |
| `GET https://deepseekbase.com/data/openrouter-tokens.json` | token 走勢 |

全部也可以在 <https://deepseekbase.com> 瀏覽。

---

## deepseekbase 是什麼

一個 DeepSeek 生態的第三方索引站。不隸屬於 DeepSeek 官方。

| | |
|---|---|
| **287 頁** | 價格、服務商、7,164 個衍生模型、8,559 個插件、行業套件 |
| **21 份開放數據集** | 每個數字都帶來源和驗證日期 |
| **免費插件測試** | 真實沙箱安裝，結果公開 |
| **MCP Server** | `https://deepseekbase.com/mcp`，任何 MCP 客戶端可用 |
| **插件開發指南** | 十章，含我們自己踩的坑 |

我們會明確標註統計口徑。來源互相矛盾時，我們說出來，而不是挑好看的那個數字。

---

## 貢獻

發現 bug？[提 issue](https://github.com/moldkey/dsh-deepseekbase/issues)。

你的插件沒通過我們的測試？錯誤信息會告訴你具體原因 —— 拿去修就行。
我們記錄的是一個事實，不是評價你的代碼質量。

想讓你的插件被測試？免費：
<https://deepseekbase.com/zh/ecosystem/plugin-tests/>

---

## 許可

MIT。匯編的數據在網站上逐條標註來源。
