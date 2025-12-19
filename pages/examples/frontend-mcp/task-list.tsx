import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { BotDojoChat, type BotDojoChatControl, type ModelContext } from '@botdojo/chat-sdk';
import CodeSnippet from '@/components/CodeSnippet';
import { Tabs } from '@/components/Tabs';

// Hook to detect mobile screens (768px breakpoint)
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    
    // Set initial value
    setIsMobile(mediaQuery.matches);

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}
import { useTemporaryToken } from '@/hooks/useTemporaryToken';

const config = {
  baseUrl: process.env.NEXT_PUBLIC_IFRAME_URL || 'https://embed.botdojo.com',
};

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface TaskListPageProps {
  sourceFiles: {
    page: string;
  };
}

export default function TaskListPage({ sourceFiles }: TaskListPageProps) {
  const router = useRouter();
  // Get temporary JWT token for secure API access
  const { token, loading: tokenLoading, error: tokenError } = useTemporaryToken();
  
  const isMobile = useIsMobile();
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Review quarterly report', completed: false, priority: 'high' },
    { id: '2', title: 'Schedule team meeting', completed: false, priority: 'medium' },
    { id: '3', title: 'Update documentation', completed: true, priority: 'low' },
    { id: '4', title: 'Fix login bug', completed: false, priority: 'high' },
  ]);
  const [chatControl, setChatControl] = useState<BotDojoChatControl | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState('page');
  const [showChat, setShowChat] = useState(false);
  
  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const newSession = router.query['new-session'] === 'true' || router.query['newsession'] === 'true';

  // Code files configuration using actual source
  const codeFiles = [
    { id: 'page', label: 'task-list.tsx', code: sourceFiles.page },
  ];
  
  const activeCode = codeFiles.find(f => f.id === activeCodeTab)?.code || '';

  // Define the ModelContext - this is like an MCP server running in your frontend
  const modelContext: ModelContext = useMemo(() => ({
    name: 'task_manager',
    description: 'Frontend MCP for managing tasks. The agent can see and interact with the task list.',
    toolPrefix: 'tasks',
    uri: 'tasks://context',
    
    // Define resources - what the agent can "see"
    resources: [
      {
        uri: 'tasks://list',
        name: 'Task List',
        description: 'The current list of tasks with their status and priority',
        mimeType: 'application/json',
        getContent: async () => ({
          uri: 'tasks://list',
          mimeType: 'application/json',
          text: JSON.stringify(tasksRef.current, null, 2),
        }),
      },
    ],
    
    // Define tools - what the agent can "do"
    tools: [
      {
        name: 'getTasks',
        description: 'Get the current list of all tasks with their status and priority.',
        inputSchema: {
          type: 'object',
          properties: {
            go: { type: 'boolean', description: 'Pass true to execute.' },
          },
        },
        execute: async (_params: { go?: boolean }) => {
          return {
            tasks: tasksRef.current,
            summary: {
              total: tasksRef.current.length,
              completed: tasksRef.current.filter(t => t.completed).length,
              pending: tasksRef.current.filter(t => !t.completed).length,
              highPriority: tasksRef.current.filter(t => t.priority === 'high' && !t.completed).length,
            },
          };
        },
        _meta: {
          'botdojo/display-name': 'Get Tasks',
          'botdojo/hide-step-details': true,
        },
      },
      {
        name: 'completeTask',
        description: 'Mark a task as completed by its ID.',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'The ID of the task to complete' },
          },
          required: ['taskId'],
        },
        execute: async (params: { taskId: string }) => {
          const task = tasksRef.current.find(t => t.id === params.taskId);
          if (!task) {
            return { success: false, error: 'Task not found' };
          }
          
          setTasks(prev => prev.map(t => 
            t.id === params.taskId ? { ...t, completed: true } : t
          ));
          
          return { 
            success: true, 
            message: `Task "${task.title}" marked as completed`,
            task: { ...task, completed: true },
          };
        },
        _meta: {
          'botdojo/display-name': 'Complete Task',
        },
      },
      {
        name: 'addTask',
        description: 'Add a new task to the list.',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'The task title' },
            priority: { 
              type: 'string', 
              enum: ['low', 'medium', 'high'],
              description: 'Task priority level',
            },
          },
          required: ['title'],
        },
        execute: async (params: { title: string; priority?: 'low' | 'medium' | 'high' }) => {
          const newTask: Task = {
            id: String(Date.now()),
            title: params.title,
            completed: false,
            priority: params.priority || 'medium',
          };
          
          setTasks(prev => [...prev, newTask]);
          
          return {
            success: true,
            message: `Task "${params.title}" added`,
            task: newTask,
          };
        },
        _meta: {
          'botdojo/display-name': 'Add Task',
        },
      },
      {
        name: 'updateTask',
        description: 'Update an existing task. Can change title, priority, or completion status.',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'The ID of the task to update' },
            title: { type: 'string', description: 'New title for the task (optional)' },
            priority: { 
              type: 'string', 
              enum: ['low', 'medium', 'high'],
              description: 'New priority level (optional)',
            },
            completed: { type: 'boolean', description: 'Set completion status (optional)' },
          },
          required: ['taskId'],
        },
        execute: async (params: { taskId: string; title?: string; priority?: 'low' | 'medium' | 'high'; completed?: boolean }) => {
          const task = tasksRef.current.find(t => t.id === params.taskId);
          if (!task) {
            return { success: false, error: 'Task not found' };
          }
          
          const updates: Partial<Task> = {};
          if (params.title !== undefined) updates.title = params.title;
          if (params.priority !== undefined) updates.priority = params.priority;
          if (params.completed !== undefined) updates.completed = params.completed;
          
          setTasks(prev => prev.map(t => 
            t.id === params.taskId ? { ...t, ...updates } : t
          ));
          
          return {
            success: true,
            message: `Task "${task.title}" updated`,
            task: { ...task, ...updates },
          };
        },
        _meta: {
          'botdojo/display-name': 'Update Task',
        },
      },
    ],
  }), []);

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  if (tokenLoading) {
    return (
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    );
  }

  if (tokenError || !token) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{
          padding: '24px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          borderRadius: '12px',
        }}>
          <strong>Error loading token:</strong> {tokenError || 'No token available'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
          Task List Example
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#64748b', lineHeight: 1.7 }}>
          A complete Frontend MCP example. The task list is connected to the AI agent which can 
          read tasks, complete them, add new ones, and update existing tasks.
        </p>
      </div>

      {/* Live Demo Section - Task List + Chat side by side */}
      <div style={{ 
        display: 'flex', 
        gap: '20px',
        marginBottom: '32px',
        minHeight: '500px',
      }}>
        {/* Task List */}
        <div style={{
          flex: 1,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>📋</span>
              <span style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>My Tasks</span>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              {tasks.filter(t => t.completed).length}/{tasks.length} completed
            </div>
          </div>
          
          <div style={{ padding: '16px' }}>
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  marginBottom: '8px',
                  background: task.completed ? '#f8fafc' : '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                <input 
                  type="checkbox" 
                  checked={task.completed} 
                  readOnly 
                  style={{ width: '20px', height: '20px' }}
                />
                <span style={{
                  flex: 1,
                  textDecoration: task.completed ? 'line-through' : 'none',
                  color: task.completed ? '#94a3b8' : '#0f172a',
                }}>
                  {task.title}
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  background: task.priority === 'high' ? '#fef2f2' : task.priority === 'medium' ? '#fefce8' : '#f0fdf4',
                  color: task.priority === 'high' ? '#dc2626' : task.priority === 'medium' ? '#ca8a04' : '#16a34a',
                }}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Panel - Desktop: inline, Mobile: full-screen overlay */}
        <div style={isMobile ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: showChat ? 'flex' : 'none',
          flexDirection: 'column',
          background: '#ffffff',
          zIndex: 9999,
        } : {
          flex: 1,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Chat header with close button on mobile */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: isMobile ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
              Task Manager Agent
            </span>
            <button
              onClick={() => setShowChat(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.9)',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0 8px',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <BotDojoChat
              apiKey={token}
              baseUrl={config.baseUrl}
              mode="inline"
              autoFocus={false}
              newSession={newSession}
              modelContext={modelContext}
              onBotDojoChatControl={setChatControl}
              fontSize='14px'
              hideBotIcon={true}
              sessionKeyPrefix="frontend-mcp-tasklist"
              welcomeMessage={`## Task Manager Agent

I can help you manage your tasks! Try these:

<promptbutton label="📋 Show my tasks" body='{"text_input": "Show me all my tasks"}'></promptbutton> <promptbutton label="✅ Complete a task" body='{"text_input": "Complete the login bug task"}'></promptbutton> <promptbutton label="✏️ Update a task" body='{"text_input": "Change the priority of the quarterly report task to medium"}'></promptbutton> <promptbutton label="➕ Add a task" body='{"text_input": "Add a new high priority task called Review PR"}'></promptbutton>
`}
            />
          </div>
        </div>
      </div>

      {/* Floating Chat Button - Mobile only, shows when chat is closed */}
      {isMobile && !showChat && (
        <button
          onClick={() => setShowChat(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          title="Open AI Assistant"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Source Code Section */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '20px', 
          fontWeight: 700, 
          color: '#0f172a' 
        }}>
          Source Code
        </h2>
        
        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px', 
          overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <Tabs
              tabs={codeFiles.map(f => ({ id: f.id, label: f.label }))}
              activeId={activeCodeTab}
              onChange={setActiveCodeTab}
            />
          </div>
          <div style={{ padding: '16px' }}>
            <CodeSnippet 
              code={activeCode} 
              language="tsx" 
              title="pages/examples/frontend-mcp/task-list.tsx"
            />
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div style={{ 
        padding: '20px', 
        background: 'white', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0',
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
          Next Steps
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link
            href="/examples/frontend-mcp"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: 'white',
              color: '#6366f1',
              border: '1px solid #6366f1',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            ← Back to Introduction
          </Link>
          <Link
            href="/examples/product-enhance"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: '#6366f1',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            See Product Enhancement Demo →
          </Link>
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const pagesDir = path.join(process.cwd(), 'pages/examples/frontend-mcp');
  
  const pageCode = fs.readFileSync(path.join(pagesDir, 'task-list.tsx'), 'utf-8');
  
  return {
    props: {
      sourceFiles: {
        page: pageCode,
      },
    },
  };
}

