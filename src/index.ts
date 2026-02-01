import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import yaml from "js-yaml";
import { Readable } from "stream";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const gunzip = require('gunzip-maybe');
const tar = require('tar-stream');

const RANCHER_INDEX_URL = "https://charts.rancher.io/index.yaml";

const server = new Server(
  { name: "rancher-devops-assistant", version: "1.2.0" },
  { capabilities: { tools: {} } }
);

async function fetchIndex() {
  const response = await axios.get(RANCHER_INDEX_URL);
  return yaml.load(response.data) as any;
}

async function getFileFromTgz(url: string, targetFile: string): Promise<string> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const extract = tar.extract();
  let content = "";

  return new Promise((resolve, reject) => {
    extract.on('entry', (header: any, stream: Readable, next: () => void) => {
      if (header.name.endsWith(targetFile)) {
        stream.on('data', (chunk: Buffer) => { content += chunk.toString(); });
        stream.on('end', () => next());
      } else {
        stream.resume();
        next();
      }
    });
    extract.on('finish', () => resolve(content || ""));
    extract.on('error', (err: Error) => reject(err));
    Readable.from(Buffer.from(response.data)).pipe(gunzip()).pipe(extract);
  });
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_rancher_charts",
      description: "Search for apps in the Rancher repo",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"]
      }
    },
    {
      name: "get_chart_details",
      description: "Get metadata for a specific chart",
      inputSchema: {
        type: "object",
        properties: { name: { type: "string" }, version: { type: "string" } },
        required: ["name"]
      }
    },
    {
      name: "grep_values_yaml",
      description: "Search for specific keywords inside a chart's values.yaml (Recommended for performance)",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          pattern: { type: "string", description: "Keyword to search for (e.g., 'image' or 'port')" },
          version: { type: "string" }
        },
        required: ["name", "pattern"]
      }
    },
    {
      name: "list_chart_versions",
      description: "List all historical versions available for an app",
      inputSchema: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"]
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const data = await fetchIndex();
  const args = (request.params.arguments as any) || {};

  switch (request.params.name) {
    case "search_rancher_charts":
      const results = Object.keys(data.entries)
        .filter(k => k.toLowerCase().includes(args.query?.toLowerCase() || ""))
        .map(k => ({ name: k, latest: data.entries[k][0].version }));
      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };

    case "get_chart_details":
      const detail = args.version ? data.entries[args.name].find((e: any) => e.version === args.version) : data.entries[args.name][0];
      return { content: [{ type: "text", text: JSON.stringify(detail, null, 2) }] };

    case "grep_values_yaml":
      const entry = args.version ? data.entries[args.name].find((e: any) => e.version === args.version) : data.entries[args.name][0];
      if (!entry) throw new Error("Chart not found");
      let url = entry.urls[0].startsWith('http') ? entry.urls[0] : `https://charts.rancher.io/${entry.urls[0]}`;
      
      const fullValues = await getFileFromTgz(url, "values.yaml");
      const lines = fullValues.split('\n');
      const filtered = lines.filter(line => line.toLowerCase().includes(args.pattern.toLowerCase()));
      
      return { 
        content: [{ 
          type: "text", 
          text: filtered.length > 0 
            ? `Matching lines in ${args.name} values.yaml:\n${filtered.join('\n')}` 
            : `No lines matching "${args.pattern}" found.` 
        }] 
      };

    case "list_chart_versions":
        const versions = data.entries[args.name].map((e: any) => ({ version: e.version, created: e.created }));
        return { content: [{ type: "text", text: JSON.stringify(versions, null, 2) }] };

    default:
      throw new Error("Unknown tool");
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
