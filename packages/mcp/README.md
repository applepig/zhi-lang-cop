# 支語警察 MCP Server

這是支語警察的 Model Context Protocol (MCP) server，讓 AI 助手（如 Claude Desktop）能夠使用支語檢測功能。

## 功能

MCP Server 提供 4 個 tools：

### 1. `lintText` - 檢查文字
檢查文字中的中國大陸用語，並提供台灣用語建議。

**參數**：
- `text` (string, required): 要檢查的文字
- `minLevel` (enum, optional): 最低檢查等級，可選值: `hazard`, `error`, `warning`, `info`, `depends`，預設為 `error`

**範例**：
```json
{
  "text": "我需要最佳化數據庫的性能",
  "minLevel": "error"
}
```

### 2. `lookupRule` - 查詢規則
查詢特定詞彙或規則的詳細資訊。

**參數**：
- `term` (string, optional): 要查詢的詞彙
- `ruleId` (string, optional): 要查詢的規則 ID

（必須提供 `term` 或 `ruleId` 其中一個）

**範例**：
```json
{
  "term": "優化"
}
```

### 3. `listRules` - 列出規則
列出所有可用的規則，可以按等級或分類過濾。

**參數**：
- `level` (enum, optional): 按等級過濾
- `category` (enum, optional): 按分類過濾
- `limit` (number, optional): 限制返回數量，預設 20，最大 100

**範例**：
```json
{
  "level": "error",
  "limit": 10
}
```

### 4. `getStats` - 取得統計資訊
取得詞庫的統計資訊。

**參數**: 無

## 安裝與使用

### 1. 建置 MCP Server

```bash
# 在專案根目錄
npm run build:mcp
```

### 2. 配置 Claude Desktop

編輯 Claude Desktop 配置檔案：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

加入以下配置：

```json
{
  "mcpServers": {
    "zhi-lang-cop": {
      "command": "node",
      "args": [
        "/absolute/path/to/zhi-lang-cop/packages/mcp/dist/index.js"
      ]
    }
  }
}
```

**注意**: 請將路徑替換為你的實際專案路徑。

### 3. 重新啟動 Claude Desktop

配置完成後，重新啟動 Claude Desktop，MCP server 就會自動載入。

## 使用範例

在 Claude Desktop 中，你可以這樣使用：

**檢查文字**：
```
請幫我檢查這段文字：「我需要優化數據庫的性能」
```

Claude 會自動使用 `lintText` tool，並回報發現的問題：
- 「優化」→ 建議使用「最佳化」
- 「數據庫」→ 建議使用「資料庫」

**查詢詞彙**：
```
「視頻」這個詞在台灣怎麼說？
```

Claude 會使用 `lookupRule` tool 查詢，並告訴你台灣慣用「影片」或「視訊」。

## 開發

### 本地測試

```bash
# 使用 tsx 運行（開發模式）
npm run dev:mcp

# 建置後運行
npm run build:mcp
npm run start:mcp
```

### 除錯

MCP Server 使用 stdio 傳輸，可以透過 Claude Desktop 的 logs 查看除錯資訊。

**macOS logs 位置**: `~/Library/Logs/Claude/`

## 技術細節

- **Framework**: fastmcp
- **Runtime**: Node.js
- **Protocol**: MCP (Model Context Protocol)
- **Transport**: stdio
- **共用邏輯**: 使用 `packages/core/src/lib/` 的 Database 和 Matcher

## 相關連結

- [MCP 官方文件](https://modelcontextprotocol.io/)
- [FastMCP](https://github.com/jlowin/fastmcp)
- [支語警察專案](../../README.md)
