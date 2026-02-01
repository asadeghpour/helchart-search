# Verified Working Prompts

Use these with `mcp-cli chat` and `gpt-oss:20b` for the best performance.

### 1. Evaluative Security Search
"Search the repository for 'neuvector'. Use the `get_chart_details` tool to summarize its purpose and latest version."

### 2. Surgical Configuration Check (Prevents Timeouts)
"Find the 'longhorn' chart. Use the `grep_values_yaml` tool to search for 'replicaCount'. Tell me the default value."

### 3. Version Lifecycle Analysis
"List all versions for 'rancher-monitoring'. Tell me how many versions have been released and the date of the oldest one."
