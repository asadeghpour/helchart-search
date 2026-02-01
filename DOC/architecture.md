How it works:

    Host (mcp-cli): Manages the LLM context and tool execution.

    Server (Node.js): Acts as the logic engine. It uses tar-stream and gunzip-maybe to read Helm archives on the fly.

    Filter: By using the grep_values_yaml tool, the server processes a 50KB file and only returns ~500 bytes of relevant data to the AI, preventing timeouts.
    --------------------------- Command Line --------------------
For ollama:
mcp-cli chat --config-file server_config.json --provider ollama --model gpt-oss:20b
or:
mcp-cli chat --config-file=/root/mcp-k8s-docs/server_config.json --provider=ollama --model=qwen2.5:1.5b


For using gemini:

    export GEMINI_API_KEY=
    mcp-cli chat --config-file server_config.json --provider gemini --model gemini-2.5-flash-lite ### this works
