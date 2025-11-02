# NPM 發佈指南

本文件說明如何將支語警察發佈到 npmjs.org。

## 🚀 自動發佈（推薦）

此專案已設定 GitHub Actions，當推送到 `main` 分支時會自動發佈到 npm。

### 快速開始

1. **設定 NPM Token**（只需做一次）
   - 前往 [npmjs.com](https://www.npmjs.com/) → Access Tokens → Generate New Token
   - 選擇 **Automation** 類型
   - 複製 token
   - 在 GitHub repo → Settings → Secrets → Actions → New repository secret
   - Name: `NPM_TOKEN`，Value: 貼上你的 token

2. **更新版本並推送**
   ```bash
   # 更新版本號
   npm version patch  # 或 minor / major

   # 推送到 main（包含 tags）
   git push origin main --follow-tags
   ```

3. **完成！** GitHub Actions 會自動建置並發佈到 npm

詳細說明請參考 [.github/workflows/README.md](.github/workflows/README.md)

---

## 📝 手動發佈

如果需要手動發佈（例如首次發佈或緊急修正），可以按照以下步驟：

### 前置準備

### 1. 註冊 NPM 帳號

如果還沒有 NPM 帳號，請至 [npmjs.com](https://www.npmjs.com/signup) 註冊。

### 2. 登入 NPM

```bash
npm login
```

輸入你的 NPM 使用者名稱、密碼和 email。

### 3. 確認登入狀態

```bash
npm whoami
```

應該會顯示你的 NPM 使用者名稱。

## 發佈流程

### 1. 確認版本號

檢查 `package.json` 中的版本號是否正確：

```json
{
  "version": "0.3.0"
}
```

### 2. 確認所有變更已提交

```bash
git status
```

確保所有重要變更都已經 commit。

### 3. 建置專案

```bash
npm run build:mcp
```

### 4. 測試打包

先測試打包，確認包含的檔案正確：

```bash
npm pack --dry-run
```

檢查輸出，確認：
- ✅ 包含 `packages/mcp/dist/`
- ✅ 包含 `data/terms-db.json`
- ✅ 包含 `packages/core/src/lib/`
- ✅ 包含 `README.md` 和 `packages/mcp/README.md`
- ❌ 不包含 `packages/web/`（Web 相關檔案不需要發佈）
- ❌ 不包含 `node_modules/`

### 5. 本地測試（可選）

建立實際的 tarball 並在本地測試：

```bash
# 建立 tarball
npm pack

# 在其他目錄測試安裝
cd /tmp
npm install /path/to/zhi-lang-cop-0.3.0.tgz

# 測試執行
npx zhi-lang-cop
```

測試完成後清理：

```bash
rm /path/to/zhi-lang-cop-0.3.0.tgz
```

### 6. 發佈到 NPM

**首次發佈（公開套件）**：

```bash
npm publish --access public
```

**後續更新**：

```bash
npm publish
```

### 7. 驗證發佈

發佈成功後，可以在 [npmjs.com](https://www.npmjs.com/package/zhi-lang-cop) 查看套件頁面。

測試安裝：

```bash
npx -y zhi-lang-cop@latest
```

## 版本更新

當需要發佈新版本時：

### 1. 更新版本號

使用 npm version 指令（會自動建立 git tag）：

```bash
# Patch 版本（0.3.0 -> 0.3.1）修正錯誤
npm version patch

# Minor 版本（0.3.0 -> 0.4.0）新增功能
npm version minor

# Major 版本（0.3.0 -> 1.0.0）重大變更
npm version major
```

或手動編輯 `package.json` 中的 `version` 欄位。

### 2. 推送 tag 到 GitHub

```bash
git push --follow-tags
```

### 3. 重複發佈流程

從「建置專案」開始重複上述步驟。

## 撤銷發佈（緊急情況）

如果發佈後發現嚴重問題，可以在 72 小時內撤銷：

```bash
npm unpublish zhi-lang-cop@0.3.0
```

**注意**：
- 只能撤銷 72 小時內發佈的版本
- 撤銷後的版本號不能再次使用
- 建議改用 `npm deprecate` 來標記有問題的版本

標記版本為已棄用：

```bash
npm deprecate zhi-lang-cop@0.3.0 "此版本有嚴重錯誤，請使用 0.3.1"
```

## 檢查清單

發佈前的最終檢查：

- [ ] 版本號已更新
- [ ] 所有測試通過
- [ ] README.md 已更新
- [ ] CHANGELOG 已更新（如果有的話）
- [ ] 所有變更已 commit
- [ ] 已執行 `npm pack --dry-run` 確認打包內容
- [ ] 已登入 NPM (`npm whoami`)
- [ ] 建置成功 (`npm run build:mcp`)

## 常見問題

### Q: 發佈時出現 "You do not have permission to publish"

A: 確認：
1. 已正確登入 NPM (`npm whoami`)
2. 套件名稱沒有被其他人使用
3. 如果是 scoped package，需要使用 `--access public`

### Q: 如何查看目前已發佈的版本？

```bash
npm view zhi-lang-cop versions
```

### Q: 如何測試 npx 是否正常運作？

```bash
# 測試最新版本
npx -y zhi-lang-cop@latest

# 測試特定版本
npx -y zhi-lang-cop@0.3.0
```

## 相關資源

- [NPM 官方文件](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [語意化版本](https://semver.org/lang/zh-TW/)
- [撰寫 README 的最佳實務](https://docs.npmjs.com/about-package-readme-files)
