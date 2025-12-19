import { ReactNode } from 'react';

type ExampleHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function ExampleHeader({ eyebrow, title, description, actions }: ExampleHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          {eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {eyebrow}
            </span>
          )}
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {description && <p className="max-w-3xl text-base text-slate-600">{description}</p>}
    </header>
  );
}

type StartChatButtonProps = {
  label?: string;
  icon?: string;
  onClick?: () => void;
  disabled?: boolean;
};

export function StartChatButton({
  label = 'Start chat',
  icon = '💬',
  onClick,
  disabled = false,
}: StartChatButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150
        ${disabled
          ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
          : 'border border-indigo-100 bg-indigo-50 text-indigo-700 hover:border-indigo-200 hover:bg-indigo-100'
        }
      `}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

type ChatExampleShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  left: ReactNode;
  right: ReactNode;
  rightClassName?: string;
};

/**
 * Split layout used by SDK/Chat SDK examples: content on the left, chat on the right.
 * Keeps headers/actions consistent and ensures the chat column has a dedicated card.
 */
export default function ChatExampleShell({
  eyebrow,
  title,
  description,
  actions,
  left,
  right,
  rightClassName = '',
}: ChatExampleShellProps) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <ExampleHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">{left}</div>

        <div
          className={`
            h-full rounded-2xl border border-slate-200 bg-white shadow-sm
            ${rightClassName}
          `}
        >
          {right}
        </div>
      </div>
    </div>
  );
}
