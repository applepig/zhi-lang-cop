# 支語警察 (Zhi Lang Cop)

檢查文字中的中國大陸用語（支語），並提供台灣用語建議。

## 功能特色

- 🔍 **智慧檢測**：自動識別中國大陸用語並提供台灣用語替代建議
- 🤖 **AI 整合**：提供 MCP Server 讓 Claude Desktop 等 AI 助手使用
- 🌐 **Web 介面**：提供友善的網頁介面供人工使用
- 📚 **豐富詞庫**：包含 100+ 常見的中國大陸用語與台灣對應詞彙

## 快速開始

### 使用 MCP Server（推薦給 AI 助手使用）

最簡單的方式是透過 npx 直接執行：

```bash
npx -y zhi-lang-cop
```

這會啟動 MCP Server，可以與 Claude Desktop 整合使用。

#### 配置 Claude Desktop

編輯 Claude Desktop 配置檔案：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

加入以下配置：

```json
{
  "mcpServers": {
    "zhi-lang-cop": {
      "command": "npx",
      "args": ["-y", "zhi-lang-cop"]
    }
  }
}
```

重新啟動 Claude Desktop 後，就可以在對話中使用支語檢測功能。

### MCP Tools

支語警察提供 4 個 MCP tools：

1. **lintText** - 檢查文字中的中國大陸用語
2. **lookupRule** - 查詢特定詞彙或規則
3. **listRules** - 列出所有規則
4. **getStats** - 取得詞庫統計資訊

詳細使用方式請參考 [MCP 文件](packages/mcp/README.md)。

## 使用範例

在 Claude Desktop 中：

```
請幫我檢查這段文字：「我需要最佳化數據庫的性能」
```

Claude 會自動使用 `lintText` tool，並回報發現的問題：
- 「數據庫」→ 建議使用「資料庫」

## 本地開發

### 安裝

```bash
git clone https://github.com/applepig/zhi-lang-cop.git
cd zhi-lang-cop
npm install
```

### 開發模式

```bash
# 執行 MCP server（開發模式）
npm run dev:mcp

# 執行 Web 介面
npm run dev:web
```

### 建置

```bash
# 建置 MCP server
npm run build:mcp

# 建置 Web 介面
npm run build:web
```

## 專案架構

```
zhi-lang-cop/
├── packages/
│   ├── core/        # 共用邏輯（Database、Matcher）
│   ├── mcp/         # MCP Server（供 AI 助手使用）
│   └── web/         # Web 介面（供人類使用）
└── data/
    └── terms-db.json # 詞彙資料庫
```

## 技術細節

- **Framework**: FastMCP (MCP Server)
- **Frontend**: Vue 3 + Vuetify 3
- **Build Tool**: Vite, TypeScript
- **Protocol**: Model Context Protocol (MCP)

## 授權

MIT License

## 相關連結

- [MCP 官方文件](https://modelcontextprotocol.io/)
- [FastMCP](https://github.com/jlowin/fastmcp)
