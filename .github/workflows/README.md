# GitHub Actions 設定說明

## 自動發佈到 NPM

此專案使用 GitHub Actions 來自動發佈套件到 npmjs.org。

### 工作流程

當推送到 `main` 分支並且以下檔案有變更時，會自動觸發發佈：

- `packages/**`
- `data/**`
- `package.json`
- `package-lock.json`

### 發佈邏輯

1. **檢查版本**：自動檢查 `package.json` 中的版本是否已在 npm 上發佈
2. **跳過重複發佈**：如果版本已存在，則跳過發佈
3. **自動發佈**：如果是新版本，則自動發佈到 npm
4. **建立 Git tag**：發佈成功後，自動建立對應的 Git tag（例如 `v0.3.0`）

### 設定步驟

#### 1. 取得 NPM Token

前往 [npmjs.com](https://www.npmjs.com/) 並登入你的帳號：

1. 點選右上角的頭像 → **Access Tokens**
2. 點選 **Generate New Token** → **Classic Token**
3. 選擇 **Automation** 類型（適合 CI/CD）
4. 複製產生的 token（格式：`npm_xxxxxxxxxxxx`）

#### 2. 在 GitHub 設定 Secret

前往你的 GitHub repository：

1. 進入 **Settings** → **Secrets and variables** → **Actions**
2. 點選 **New repository secret**
3. Name: `NPM_TOKEN`
4. Value: 貼上剛才複製的 npm token
5. 點選 **Add secret**

### 使用方式

#### 方式一：更新版本後推送（推薦）

```bash
# 更新版本號（會自動建立 commit 和 tag）
npm version patch  # 0.3.0 -> 0.3.1
# 或
npm version minor  # 0.3.0 -> 0.4.0
# 或
npm version major  # 0.3.0 -> 1.0.0

# 推送到 main 分支（包含 tag）
git push origin main --follow-tags
```

GitHub Actions 會自動：
- 建置專案
- 發佈到 npm
- 建立 release tag

#### 方式二：手動更新版本

```bash
# 手動編輯 package.json 中的 version

# 提交變更
git add package.json
git commit -m "chore: bump version to 0.3.1"

# 推送到 main
git push origin main
```

### 監控發佈狀態

1. 前往 GitHub repository 的 **Actions** 頁面
2. 查看 **Publish to NPM** workflow 的執行狀態
3. 點進去可以看到詳細的執行日誌

### 常見問題

#### Q: 如何避免重複發佈相同版本？

A: Workflow 會自動檢查版本是否已存在，如果已發佈過相同版本，會自動跳過發佈步驟。

#### Q: 推送到 main 但不想觸發發佈？

A: 可以在 commit message 中加入 `[skip ci]` 或 `[ci skip]`：

```bash
git commit -m "docs: update README [skip ci]"
```

或者確保變更的檔案不在觸發條件中（例如只修改 `docs/` 或 `README.md`）。

#### Q: 發佈失敗怎麼辦？

A: 檢查以下項目：

1. **NPM_TOKEN 是否正確設定**：Settings → Secrets → Actions
2. **Token 權限是否足夠**：需要 Automation 或 Publish 權限
3. **版本號是否已存在**：檢查 [npmjs.com](https://www.npmjs.com/package/zhi-lang-cop) 上的版本列表
4. **建置是否成功**：查看 Actions 日誌中的建置步驟

#### Q: 如何手動觸發發佈？

A: 目前的設定是自動觸發。如果需要手動觸發，可以修改 workflow 加入 `workflow_dispatch`：

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:  # 加入這行
```

這樣就可以在 GitHub Actions 頁面手動觸發 workflow。

### 版本號規範

建議遵循 [語意化版本](https://semver.org/lang/zh-TW/)：

- **MAJOR（主版本）**：不相容的 API 變更
- **MINOR（次版本）**：向下相容的功能新增
- **PATCH（修訂版本）**：向下相容的問題修正

例如：`0.3.0` → `0.3.1`（修正錯誤）→ `0.4.0`（新增功能）→ `1.0.0`（重大變更）

### 安全性注意事項

- ⚠️ **絕對不要**將 NPM_TOKEN 直接寫在程式碼中
- ⚠️ **絕對不要**將 NPM_TOKEN commit 到 git
- ✅ 只將 token 儲存在 GitHub Secrets 中
- ✅ 使用 Automation token 而非 Publish token（權限更受限）
- ✅ 定期更新 token（建議每 6-12 個月）

### 相關資源

- [GitHub Actions 文件](https://docs.github.com/en/actions)
- [npm publish 文件](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [建立 npm token](https://docs.npmjs.com/creating-and-viewing-access-tokens)
