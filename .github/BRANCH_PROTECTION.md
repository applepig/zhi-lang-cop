# Branch Protection 設定說明

## 目前設定

`main` 分支已啟用以下保護規則：

### ✅ 已啟用的保護

- **禁止強制推送 (Force Push)** - 保護提交歷史，防止意外覆蓋
- **禁止刪除分支** - 防止誤刪 main 分支
- **管理員可繞過** - 專案擁有者仍可直接推送（適合個人專案）

### ❌ 未啟用的保護

以下功能目前未啟用（可依需求調整）：

- **必須通過 PR 審查** - 個人專案可選，團隊專案建議啟用
- **必須通過狀態檢查** - 可在加入 CI 測試後啟用
- **必須為線性歷史** - 強制使用 rebase 或 squash merge
- **必須解決對話** - PR 中的討論必須解決才能合併

## 建議的工作流程

### 目前配置（個人專案友善）

```bash
# 1. 建立 feature 分支
git checkout -b feat/new-feature

# 2. 開發並提交
git add .
git commit -m "feat: add new feature"

# 3. 推送分支
git push origin feat/new-feature

# 4. 建立 PR
gh pr create --base main

# 5. 審查後合併（或直接合併）
gh pr merge --squash

# 6. main 分支會自動觸發 npm 發佈
```

### 保護的作用

- ✅ 可以直接推送到 main（如果是管理員）
- ✅ 可以透過 PR 合併
- ✅ 可以使用 GitHub UI 合併 PR
- ❌ 不能使用 `git push -f` 強制推送
- ❌ 不能刪除 main 分支

## 進階設定建議

### 1. 加入 CI 測試後

如果未來加入測試流程，建議啟用狀態檢查：

```bash
gh api -X PUT repos/applepig/zhi-lang-cop/branches/main/protection \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["test", "build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

### 2. 團隊協作時

如果有其他協作者加入，建議啟用 PR 審查：

```bash
gh api -X PUT repos/applepig/zhi-lang-cop/branches/main/protection \
  --input - <<'EOF'
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

### 3. 嚴格的線性歷史

如果想要乾淨的提交歷史（只允許 squash 或 rebase merge）：

```bash
gh api -X PUT repos/applepig/zhi-lang-cop/branches/main/protection \
  --input - <<'EOF'
{
  "required_status_checks": null,
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

## 查看目前設定

```bash
# 查看完整的保護設定
gh api repos/applepig/zhi-lang-cop/branches/main/protection

# 查看簡化的設定
gh api repos/applepig/zhi-lang-cop/branches/main/protection | jq '{
  enforce_admins: .enforce_admins.enabled,
  allow_force_pushes: .allow_force_pushes.enabled,
  allow_deletions: .allow_deletions.enabled,
  required_linear_history: .required_linear_history.enabled
}'
```

## 移除分支保護（不建議）

如果需要暫時移除保護：

```bash
gh api -X DELETE repos/applepig/zhi-lang-cop/branches/main/protection
```

## 與自動發佈的關係

目前的設定與 GitHub Actions 自動發佈相容：

1. **PR 合併到 main** → 觸發自動發佈 workflow
2. **直接推送到 main**（管理員）→ 也會觸發自動發佈
3. **版本更新** → `npm version` + `git push --follow-tags` 正常運作

⚠️ **注意**：由於禁止強制推送，如果需要修改歷史記錄，必須先暫時移除保護或使用 revert。

## 常見問題

### Q: 為什麼不強制要求 PR 審查？

A: 這是個人專案，強制 PR 審查會增加工作流程複雜度。當有其他協作者加入時再啟用。

### Q: 可以直接推送到 main 嗎？

A: 可以（如果你是管理員）。但建議仍然使用 PR 流程，保持清晰的變更歷史。

### Q: 如果不小心刪除了 main 分支怎麼辦？

A: 目前的設定已禁止刪除 main 分支，所以不會發生這種情況。

### Q: 強制推送的限制會影響 npm 發佈嗎？

A: 不會。npm 發佈只需要正常的推送，不需要強制推送。

## 相關資源

- [GitHub Branch Protection 文件](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub API - Branch Protection](https://docs.github.com/en/rest/branches/branch-protection)
- [最佳實踐指南](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule)
