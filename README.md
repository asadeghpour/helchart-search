# Rancher Helm Chart Search (MCP Server)

An implementation of the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) designed to evaluate and search the Rancher Helm Repository (`charts.rancher.io`). 

This server allows AI assistants (like Claude, ChatGPT, or local Ollama models) to browse the Rancher catalog, inspect chart metadata, and search through `values.yaml` files using optimized server-side filtering to save LLM context.

## 🚀 Features

- **Optimized Search**: Server-side `grep` for `values.yaml` to minimize data sent to the LLM.
- **Deep Metadata**: Access maintainers, app versions, and homepages directly from the index.
- **Full History**: List and inspect historical chart versions.
- **No Local Helm Required**: Interacts directly with the HTTPS repository index and chart archives.

## 🛠️ Installation (Linux / openSUSE Tumbleweed)

### 1. Prerequisites
Ensure you have Node.js and npm installed on your system:
```bash
sudo dnf install nodejs npm
