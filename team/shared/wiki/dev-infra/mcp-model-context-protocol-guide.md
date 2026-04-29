# MCP (Model Context Protocol) Guide

> MCP connects LLMs to your tools, files, and data. As of April 2026, it has 24k+ stars on the main SDK and is the de facto standard for LLM tool use.

## What is MCP?

MCP (Model Context Protocol) is a standardized protocol — like USB-C for AI — that lets any LLM client connect to any MCP server to access tools, resources, and prompts. Created by Anthropic (same team behind Claude).

The protocol has three key concepts:
- **Tools**: Functions the LLM can call (e.g., search web, run code, query DB)
- **Resources**: Data the LLM can read (e.g., files, API responses, database dumps)
- **Prompts**: Reusable prompt templates

## Architecture

```
┌─────────────┐       MCP       ┌──────────────────┐
│  LLM Client │◄───────────────►│   MCP Server     │
│ (Claude,    │                │ (your FastMCP,   │
│  Cursor,    │                │  Chrome MCP,     │
│  OpenCode)  │                │  custom servers)  │
└─────────────┘                └────────┬─────────┘
                                        │
                         ┌──────────────┼──────────────┐
                         │              │              │
                      Tools         Resources       Prompts
                    (functions)     (read data)    (templates)
```

## FastMCP: The Python Framework

FastMCP (PrefectHQ, 24,786 stars) is the most popular way to build MCP servers in Python. It was incorporated into the official MCP Python SDK in 2024; the standalone project is still actively maintained and downloaded ~1M times/day.

```bash
uv pip install fastmcp
```

```python
from fastmcp import FastMCP

mcp = FastMCP("My Server")

@mcp.tool
def search_code(query: str, lang: str = "python") -> list[dict]:
    """Search code across repositories."""
    return [{"file": "main.py", "line": 42, "match": "async def main()"}]

@mcp.resource("file://config")
def get_config() -> str:
    """Expose config as a readable resource."""
    return open("config.yaml").read()

@mcp.prompt("code-review")
def code_review(file: str) -> str:
    """Template for code review prompts."""
    return f"Review this code:\n{open(file).read()}"

if __name__ == "__main__":
    mcp.run()
```

### FastMCP App: Interactive UIs in Chat

FastMCP Apps render interactive UIs directly in the conversation:

```python
from fastmcp import FastMCP
from fastmcp.app import App

mcp = FastMCP("Stock Tracker")

@mcp.app(label="Stock Price")
class StockApp(App):
    @mcp.app.query()
    def get_price(self, symbol: str) -> str:
        return f"{symbol}: ${self.fetch_price(symbol)}"
```

## Running MCP Servers

### CLI
```bash
# Run a FastMCP server
fastmcp run my_server.py

# Or use uv
uv run fastmcp run my_server.py
```

### Connect to Claude Desktop / Cursor
Add to your MCP client config:
```json
{
  "mcpServers": {
    "my-server": {
      "command": "uv",
      "args": ["run", "fastmcp", "run", "my_server.py"]
    }
  }
}
```

## Notable MCP Servers (April 2026)

| Server | Stars | Purpose |
|---|---|---|
| **PrefectHQ/fastmcp** | 24,786 | Python framework for building MCP servers |
| **microsoft/mcp-for-beginners** | 15,925 | Official MCP curriculum (.NET, JS, Rust, Python) |
| **tadata-org/fastapi_mcp** | 11,819 | Expose FastAPI endpoints as MCP tools with auth |
| **hangwin/mcp-chrome** | 11,282 | Control Chrome browser via MCP (automation, scraping) |
| **mcp-use/mcp-use** | 9,797 | Fullstack MCP framework for ChatGPT/Claude |
| **mark3labs/mcp-go** | 8,617 | Go implementation of MCP |
| **modelcontextprotocol/registry** | 6,721 | Community registry of MCP servers |

## MCP with Claude Code / OpenCode

Claude Code and OpenCode can use MCP servers as tools. Configure in your Claude Code config:

```bash
# In your Claude Code settings or .claude.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"]
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search", "YOUR_API_KEY"]
    }
  }
}
```

## Best Practices

1. **Use `uv pip install`** instead of plain `pip` — FastMCP and modern Python tooling prefer uv.
2. **Always add docstrings** to `@mcp.tool` functions — these become the LLM's tool description.
3. **Type hints** are used for validation — they're not optional for production tools.
4. **Authentication**: Use `fastapi_mcp` for endpoints that need auth.
5. **Server isolation**: MCP servers run as separate processes — a crash in one doesn't kill the client.

## MCP Python SDK (vs FastMCP)

The official MCP Python SDK is at `modelcontextprotocol/python`. FastMCP is a higher-level wrapper built on top of it. For production use, prefer FastMCP. For low-level control, use the SDK directly.

## Sources

- https://github.com/PrefectHQ/fastmcp (24,786 stars)
- https://github.com/microsoft/mcp-for-beginners (15,925 stars)
- https://modelcontextprotocol.io/
- https://github.com/modelcontextprotocol/registry (6,721 stars)
