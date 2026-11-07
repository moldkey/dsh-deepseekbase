# dsh-deepseekbase

[English](README.md) | 中文

**在 DeepSeek Harness 裡查 DeepSeek 價格、搜索插件、看沙箱測試結果。**

```bash
dsh plugin --profile web add @liangjiehappy/dsh-deepseekbase
```

---

## 裝了之後能做什麼

| 你說 | 調用的工具 |
|---|---|
| 「DeepSeek 多少錢？」 | `deepseekbase_price` |
| 「找個記憶類插件」 | `deepseekbase_plugin` |
| 「V4-Flash 多大？」 | `deepseekbase_specs` |
| 「DeepSeek 實際用了多少？」 | `deepseekbase_trend` |
| **「幫我測 dsh-foo 能不能裝」** | **`deepseekbase_test_plugin`** |
| **「過了嗎？」** | **`deepseekbase_test_result`** |
| **「我還剩幾次免費測試？」** | **`deepseekbase_quota`** |

七個工具、單文件、零運行時依賴，只對 `deepseekbase.com` 發出 HTTPS 請求。

---

## 不用離開 DSH 就能測自己的插件

大部分插件目錄只告訴你插件**存在**。沒人告訴你它在**你這個版本的 Harness 上裝不裝得上**。

所以我們做真實沙箱安裝 —— 而且插件讓你直接在對話裡提交：

```
你：测一下 dsh-foo 在 0.2.2-rc.1 上能不能装

DSH: [deepseekbase_test_plugin]
     已排队。
     编号: 1793979912-48671
     今天还剩 2/3 次免费额度
     通常几分钟内跑完。

你：过了吗？

DSH: [deepseekbase_test_result]
     plugin: dsh-foo
     verdict: 已测通过
     install_ok: True
     node_modules: 12.4 MB
```

**免費額度：每 IP 每天 3 次。** 不用註冊、不用 API key。
更高額度在計劃中但還沒開放 —— 見[定價說明](https://deepseekbase.com/zh/plugin-pricing/#test-service)。

### 四階段測什麼

| 階段 | 網絡 | 檢查 |
|---|---|---|
| 1 安裝 | 有網 | `dsh plugin add` 在乾淨 profile |
| 2 列裝 | **斷網** | `dsh plugin list` 能看到 |
| 3 掛載 | **斷網** | `--dump-config` 出現在配置樹 |
| 4 啟動 | **斷網** | profile 啟動 12 秒不死 |

後三步用 `--network none`，插件即使有惡意行為也無處可去。每個容器跑完就銷毀。

---

## 目前的成果

**3,500+ 個插件真的裝上並掛載了**，覆蓋下載量前 2,000 名。

| 判定 | 數量 |
|---|---|
| 通過 | 2,822 |
| 裝不上 | 654 |
| 裝了沒註冊 | 35 |
| 啟動失敗 | 10 |

全部可搜、每個插件有獨立頁面：

**→ [deepseekbase.com/zh/plugins/](https://deepseekbase.com/zh/plugins/)**
**→ [deepseekbase.com/zh/ecosystem/plugin-tests/](https://deepseekbase.com/zh/ecosystem/plugin-tests/)**

**看結果**不用註冊、不用 API key、不限次數。

---

## 它不做什麼

- 不讀寫文件
- 不執行 shell
- 不碰憑證
- 不上報遙測

整個實現就一個文件 —— 五分鐘能審完。

---

## 數據來源說明

價格來自 DeepSeek 官方 API 文檔。插件數據來自公開的 npm registry 與 GitHub。
測試判定是我們自己沙箱跑的，不是 DeepSeek 官方輸出。這是第三方索引 —— 引用時請標明。

MIT 許可。源碼：[github.com/moldkey/dsh-deepseekbase](https://github.com/moldkey/dsh-deepseekbase)
