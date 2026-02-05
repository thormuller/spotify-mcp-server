import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { albumTools } from './albums.js';
import { playTools } from './play.js';
import { readTools } from './read.js';
import { suggestionTools } from './suggestions.js';

const allTools = [...readTools, ...playTools, ...albumTools, ...suggestionTools];

function createServer() {
  const server = new McpServer({
    name: 'spotify-controller',
    version: '1.0.0',
  });

  allTools.forEach((tool) => {
    server.tool(tool.name, tool.description, tool.schema, tool.handler);
  });

  return server;
}

async function runStdio() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function runHttp() {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: 'spotify-mcp-server', version: '1.0.0' });
  });

  // MCP endpoint
  app.post('/mcp', async (req, res) => {
    const server = createServer();

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless mode
    });

    res.on('close', () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  // Handle unsupported methods on /mcp
  app.all('/mcp', (_req, res) => {
    res.status(405).json({ error: 'Method not allowed. Use POST for MCP requests.' });
  });

  const port = parseInt(process.env.PORT || '8080', 10);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Spotify MCP Server running on http://0.0.0.0:${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`MCP endpoint: http://localhost:${port}/mcp`);
  });
}

async function main() {
  const transport = process.env.MCP_TRANSPORT || 'stdio';
  if (transport === 'http') {
    await runHttp();
  } else {
    await runStdio();
  }
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
