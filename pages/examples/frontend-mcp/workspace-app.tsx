import Link from 'next/link';
import CodeSnippet from '@/components/CodeSnippet';
export default function WorkspaceAppExample() {
 return <div className="max-w-[900px] mx-auto"><h1 className="text-2xl font-bold">Tools inside a workspace app</h1><p className="my-4">Download this task board and open it as an HTML preview in your BotDojo workspace. Ask the agent to read your selected task and move it to Done.</p><p><a href="/examples/workspace-task-board.html" download className="text-indigo-600 underline">Download task board HTML</a></p><CodeSnippet language="ts" title="App-defined tools" code={`import { registerFrontendMcp } from 'https://cdn.jsdelivr.net/npm/@botdojo/chat-sdk@0.0.31/lib/frontend-mcp/index.js';
await registerFrontendMcp({
  name: 'task_board',
  tools: [{
    name: 'get_board', description: 'Read the visible board',
    inputSchema: { type: 'object', properties: {} },
    execute: async () => getCurrentBoard(),
  }],
});`} /><p className="my-4">Handlers execute in the open preview. Closing the preview removes its tools. Persist important changes through your app’s existing save behavior.</p><Link href="/examples/frontend-mcp">Frontend MCP introduction</Link></div>;
}
