import Link from 'next/link';

export default function AboutBotDojoPage() {
  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-5 md:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <img src="/logo.svg" alt="BotDojo Logo" className="w-8 h-8 md:w-10 md:h-10" />
          <div>
            <div className="text-[10px] md:text-[11px] text-slate-500 tracking-wider font-bold uppercase">Platform Overview</div>
            <h1 className="m-0 text-xl md:text-[28px] text-indigo-600 font-extrabold">About BotDojo</h1>
          </div>
        </div>
        <p className="m-0 text-sm md:text-[15px] text-slate-600 leading-relaxed max-w-[800px]">
          This Interactive Agent SDK playground demonstrates how to build agentic UIs powered by the BotDojo platform. 
          BotDojo helps you build, monitor, and improve AI agents that deliver real business value.
        </p>
      </div>

      {/* Free Plan Banner */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 rounded-xl border border-indigo-200/50" style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="m-0 mb-2 text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>🎉</span> Free Plan for Developers
            </h3>
            <p className="m-0 text-sm text-slate-600">
              Get started with the Interactive Agent SDK for free. Build and deploy AI agents with full access to monitoring, evals, and feedback tools.
            </p>
          </div>
          <a
            href="https://www.botdojo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-lg no-underline font-semibold text-sm whitespace-nowrap hover:bg-indigo-700 transition-colors"
          >
            Get Started Free →
          </a>
        </div>
      </div>

      {/* What is BotDojo */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 bg-white rounded-xl border border-slate-200">
        <h2 className="m-0 mb-4 text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>⚡</span> What is BotDojo?
        </h2>
        
        <p className="m-0 mb-4 text-sm text-slate-600 leading-relaxed">
          BotDojo is a platform for building, running, and improving AI agents. While this playground showcases the 
          <strong> Interactive Agent SDK</strong> for building agentic UIs, the agents themselves run on the BotDojo platform — 
          giving you enterprise-grade infrastructure for agent execution, monitoring, and continuous improvement.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { 
              icon: '🔧', 
              title: 'Build Agents', 
              desc: 'Visual agent builder with templates, tools, and multi-modal support',
              link: 'https://www.botdojo.com/platform/agent-builder'
            },
            { 
              icon: '📊', 
              title: 'Monitor & Evaluate', 
              desc: 'Real-time observability with tracing, evals, and performance metrics',
              link: 'https://www.botdojo.com/platform/observability-evals'
            },
            { 
              icon: '🔄', 
              title: 'Improve Continuously', 
              desc: 'Human feedback loops that make agents smarter over time',
              link: 'https://www.botdojo.com/platform/human-feedback'
            },
          ].map(item => (
            <a 
              key={item.title} 
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-slate-50 rounded-lg border border-slate-200 no-underline hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{item.icon}</span>
                <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">{item.title}</span>
              </div>
              <p className="m-0 text-xs text-slate-600">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Agent Builder Section */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 bg-white rounded-xl border border-slate-200">
        <h2 className="m-0 mb-4 text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>🔧</span> Visual Agent Builder
        </h2>
        
        <p className="m-0 mb-4 text-sm text-slate-600 leading-relaxed">
          Build AI agents visually without heavy lifting. Start from 100+ templates for common scenarios like customer support, 
          data analysis, and workflow automation. Customize prompts, add tools, and connect to your systems.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h4 className="m-0 mb-2 text-sm font-bold text-slate-800">Multi-modal Support</h4>
            <p className="m-0 text-xs text-slate-600">
              Build once, deploy everywhere. Your agents work across chat, voice/phone, email, and SMS channels with 
              consistent behavior and shared memory.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h4 className="m-0 mb-2 text-sm font-bold text-slate-800">Tool & MCP Integration</h4>
            <p className="m-0 text-xs text-slate-600">
              Connect agents to your systems using Model Context Protocol (MCP). Access databases, APIs, and business 
              workflows without brittle glue code.
            </p>
          </div>
        </div>

        <a
          href="https://www.botdojo.com/platform/agent-builder"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium no-underline"
        >
          Learn more about Agent Builder →
        </a>
      </div>

      {/* Observability & Evals Section */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 bg-white rounded-xl border border-slate-200">
        <h2 className="m-0 mb-4 text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>📊</span> Observability & Evals
        </h2>
        
        <p className="m-0 mb-4 text-sm text-slate-600 leading-relaxed">
          You can't improve what you don't measure. BotDojo provides end-to-end tooling for tracing, experiment management, 
          prompt iteration, and production-grade observability so you can build confidently and improve continuously.
        </p>

        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 mb-4">
          <h4 className="m-0 mb-3 text-sm font-bold text-blue-800">Key Capabilities</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: 'Tracing', desc: 'Visualize and debug the flow of data through your agents. Identify bottlenecks and understand agentic paths.' },
              { title: 'Experiments', desc: 'Accelerate iteration with native dataset management and experiment runs to compare prompts and retrieval settings.' },
              { title: 'Prompt Management', desc: 'Test prompt changes across datasets. Version, review, and promote prompts with confidence.' },
              { title: 'Online & Offline Evals', desc: 'Assess performance with extensible eval templates. Run offline against datasets or online via shadow traffic.' },
            ].map(item => (
              <div key={item.title} className="p-3 bg-white rounded-lg border border-blue-100">
                <p className="m-0 mb-1 font-semibold text-sm text-slate-900">{item.title}</p>
                <p className="m-0 text-xs text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 mb-4">
          <h4 className="m-0 mb-2 text-sm font-bold text-slate-800">Production Monitoring</h4>
          <ul className="m-0 pl-5 text-sm text-slate-600 leading-relaxed">
            <li><strong>Guardrails</strong> — Mitigate risk with proactive safeguards for toxicity, PII, jailbreak detection, and policy enforcement</li>
            <li><strong>Cost Analytics</strong> — Track spend by model, team, environment, and feature to optimize without sacrificing quality</li>
            <li><strong>Business Impact</strong> — Tie agent performance to outcomes like CSAT, deflection, conversion, and time-to-resolution</li>
          </ul>
        </div>

        <a
          href="https://www.botdojo.com/platform/observability-evals"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium no-underline"
        >
          Explore Observability & Evals →
        </a>
      </div>

      {/* Human Feedback Section */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 bg-white rounded-xl border border-slate-200">
        <h2 className="m-0 mb-4 text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>🔄</span> Human Feedback & Continuous Learning
        </h2>
        
        <p className="m-0 mb-4 text-sm text-slate-600 leading-relaxed">
          Every interaction is an opportunity to learn. BotDojo turns coaching and corrections into compounding advantage — 
          codified into prompts, indexes, and memory — so agents get measurably better over time.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <h4 className="m-0 mb-2 text-sm font-bold text-emerald-800">Feedback Queues</h4>
            <p className="m-0 text-xs text-emerald-700">
              Employees coach agents on what they did right, what to change, and how to behave next time. 
              Assign, triage, and approve improvements with clear audit trails.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <h4 className="m-0 mb-2 text-sm font-bold text-emerald-800">Change Management</h4>
            <p className="m-0 text-xs text-emerald-700">
              Link feedback directly to data, prompts, tools, and outcomes. Close the loop automatically 
              with evaluated rollouts and canary releases.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 mb-4">
          <h4 className="m-0 mb-2 text-sm font-bold text-slate-800">The Feedback Flywheel</h4>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-600 py-2">
            <span className="px-3 py-1.5 bg-white rounded-full border border-slate-200 font-medium">Observe</span>
            <span className="text-slate-400">→</span>
            <span className="px-3 py-1.5 bg-white rounded-full border border-slate-200 font-medium">Capture Feedback</span>
            <span className="text-slate-400">→</span>
            <span className="px-3 py-1.5 bg-white rounded-full border border-slate-200 font-medium">Improve</span>
            <span className="text-slate-400">→</span>
            <span className="px-3 py-1.5 bg-white rounded-full border border-slate-200 font-medium">Deploy</span>
            <span className="text-slate-400">→</span>
            <span className="text-xs text-slate-400 italic">repeat</span>
          </div>
        </div>

        <a
          href="https://www.botdojo.com/platform/human-feedback"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium no-underline"
        >
          Learn about Human Feedback & Learning →
        </a>
      </div>

      {/* Getting Agents Running Successfully */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 rounded-xl border border-amber-200/50" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
        <h2 className="m-0 mb-4 text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>🎯</span> Getting Agents to Production Successfully
        </h2>
        
        <p className="m-0 mb-4 text-sm text-slate-700 leading-relaxed">
          Building agents is just the start. Getting them to run successfully in production requires a systematic approach 
          to quality, safety, and continuous improvement. Here's how BotDojo helps:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { 
              num: '1', 
              title: 'Monitor Everything', 
              desc: 'Track every agent interaction with full tracing. Identify issues before they impact users with proactive alerts.' 
            },
            { 
              num: '2', 
              title: 'Evaluate Rigorously', 
              desc: 'Run evals offline against golden datasets and online against live traffic. Catch regressions before they ship.' 
            },
            { 
              num: '3', 
              title: 'Capture Human Feedback', 
              desc: 'When agents make mistakes, capture corrections and coach them to do better. Turn every error into an improvement.' 
            },
            { 
              num: '4', 
              title: 'Manage Changes Safely', 
              desc: 'Roll out improvements with canary releases and A/B tests. Validate in production with automatic rollback.' 
            },
          ].map(item => (
            <div key={item.num} className="flex gap-3 p-3 bg-white/80 rounded-lg border border-amber-200">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">
                {item.num}
              </div>
              <div>
                <p className="m-0 mb-1 font-semibold text-sm text-slate-900">{item.title}</p>
                <p className="m-0 text-xs text-slate-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resources & Links */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 bg-white rounded-xl border border-slate-200">
        <h2 className="m-0 mb-4 text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>📚</span> Resources
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="https://docs.botdojo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 no-underline hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors group"
          >
            <span className="text-2xl">📖</span>
            <div>
              <p className="m-0 mb-1 font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">Documentation</p>
              <p className="m-0 text-xs text-slate-600">Comprehensive guides, API references, and tutorials for building with BotDojo.</p>
              <p className="m-0 mt-2 text-xs text-indigo-600">docs.botdojo.com →</p>
            </div>
          </a>
          
          <a
            href="https://www.botdojo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 no-underline hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors group"
          >
            <span className="text-2xl">🌐</span>
            <div>
              <p className="m-0 mb-1 font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">BotDojo Website</p>
              <p className="m-0 text-xs text-slate-600">Learn more about the platform, pricing, and enterprise solutions.</p>
              <p className="m-0 mt-2 text-xs text-indigo-600">botdojo.com →</p>
            </div>
          </a>

          <a
            href="https://github.com/botdojo-ai/botdojo-chat-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 no-underline hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors group"
          >
            <span className="text-2xl">💻</span>
            <div>
              <p className="m-0 mb-1 font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">Chat SDK on GitHub</p>
              <p className="m-0 text-xs text-slate-600">Open source SDK for building agentic UIs. Star us on GitHub!</p>
              <p className="m-0 mt-2 text-xs text-indigo-600">github.com/botdojo-ai/botdojo-chat-sdk →</p>
            </div>
          </a>

          <a
            href="https://www.botdojo.com/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 no-underline hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors group"
          >
            <span className="text-2xl">💰</span>
            <div>
              <p className="m-0 mb-1 font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">Pricing</p>
              <p className="m-0 text-xs text-slate-600">Free plan for developers. Flexible pricing for teams and enterprises.</p>
              <p className="m-0 mt-2 text-xs text-indigo-600">View pricing →</p>
            </div>
          </a>
        </div>
      </div>

      {/* CTA Section */}
      <div className="p-4 md:p-6 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
        <h3 className="m-0 mb-2 text-lg md:text-xl font-bold text-white">
          Ready to build production-ready agents?
        </h3>
        <p className="m-0 mb-4 text-sm text-indigo-100">
          Get started with the free developer plan. No credit card required.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="https://www.botdojo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-lg no-underline font-semibold text-sm hover:bg-indigo-50 transition-colors"
          >
            Get Started Free
          </a>
          <Link
            href="/examples/getting-started"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500/30 text-white border border-white/30 rounded-lg no-underline font-semibold text-sm hover:bg-indigo-500/50 transition-colors"
          >
            Try the SDK →
          </Link>
        </div>
      </div>
    </div>
  );
}
