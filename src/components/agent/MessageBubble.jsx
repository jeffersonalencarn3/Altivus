import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Zap, CheckCircle2, AlertCircle, Loader2, ChevronRight, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";

const FunctionDisplay = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);
  const name = toolCall?.name || 'Função';
  const status = toolCall?.status || 'pending';
  const results = toolCall?.results;

  const parsedResults = (() => {
    if (!results) return null;
    try { return typeof results === 'string' ? JSON.parse(results) : results; }
    catch { return results; }
  })();

  const isError = results && (
    (typeof results === 'string' && /error|failed/i.test(results)) ||
    (parsedResults?.success === false)
  );

  const statusConfig = {
    pending:     { icon: Clock,       color: 'text-slate-400', text: 'Aguardando' },
    running:     { icon: Loader2,     color: 'text-blue-400',  text: 'Executando...', spin: true },
    in_progress: { icon: Loader2,     color: 'text-blue-400',  text: 'Executando...', spin: true },
    completed:   isError ? { icon: AlertCircle, color: 'text-red-400',   text: 'Falhou' }
                         : { icon: CheckCircle2, color: 'text-green-400', text: 'Concluído' },
    success:     { icon: CheckCircle2, color: 'text-green-400', text: 'Concluído' },
    failed:      { icon: AlertCircle,  color: 'text-red-400',   text: 'Falhou' },
    error:       { icon: AlertCircle,  color: 'text-red-400',   text: 'Falhou' },
  }[status] || { icon: Zap, color: 'text-slate-400', text: '' };

  const Icon = statusConfig.icon;
  const formattedName = name.split('.').reverse().join(' ').toLowerCase();

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
          "hover:border-white/15"
        )}
        style={{ background: 'rgba(255,255,255,0.04)', borderColor: expanded ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)', color: '#A0AEC0' }}
      >
        <Icon className={cn("h-3 w-3", statusConfig.color, statusConfig.spin && "animate-spin")} />
        <span className="text-white/70">{formattedName}</span>
        {statusConfig.text && <span className={cn("text-white/40", isError && "text-red-400")}>• {statusConfig.text}</span>}
        {!statusConfig.spin && (toolCall.arguments_string || results) && (
          <ChevronRight className={cn("h-3 w-3 opacity-40 transition-transform ml-auto", expanded && "rotate-90")} />
        )}
      </button>

      {expanded && !statusConfig.spin && (
        <div className="mt-1.5 ml-3 pl-3 border-l-2 border-white/10 space-y-2">
          {toolCall.arguments_string && (
            <div>
              <div className="text-[10px] text-white/40 mb-1">Parâmetros:</div>
              <pre className="rounded-md p-2 text-xs text-white/60 whitespace-pre-wrap overflow-auto max-h-32"
                style={{ background: 'rgba(0,0,0,0.3)' }}>
                {(() => { try { return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2); } catch { return toolCall.arguments_string; } })()}
              </pre>
            </div>
          )}
          {parsedResults && (
            <div>
              <div className="text-[10px] text-white/40 mb-1">Resultado:</div>
              <pre className="rounded-md p-2 text-xs text-white/60 whitespace-pre-wrap max-h-48 overflow-auto"
                style={{ background: 'rgba(0,0,0,0.3)' }}>
                {typeof parsedResults === 'object' ? JSON.stringify(parsedResults, null, 2) : parsedResults}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center mt-0.5 shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(123,97,255,0.15))', border: '1px solid rgba(0,212,255,0.2)' }}
        >
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: '#00D4FF' }} />
        </div>
      )}

      <div className={cn("max-w-[85%]", isUser && "flex flex-col items-end")}>
        {message.content && (
          <div
            className="rounded-2xl px-4 py-2.5"
            style={isUser
              ? { background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(123,97,255,0.12))', border: '1px solid rgba(0,212,255,0.25)', color: '#FFFFFF' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#FFFFFF' }
            }
          >
            {isUser ? (
              <p className="text-sm leading-relaxed">{message.content}</p>
            ) : (
              <ReactMarkdown
                className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  p: ({ children }) => <p className="my-1 leading-relaxed text-white/90">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc text-white/80">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal text-white/80">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  h1: ({ children }) => <h1 className="text-base font-bold my-2 text-white">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-bold my-2 text-white">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xs font-bold my-1.5 text-white">{children}</h3>,
                  code: ({ inline, children, ...props }) => inline
                    ? <code className="px-1 py-0.5 rounded text-xs text-neon-blue" style={{ background: 'rgba(0,212,255,0.08)' }} {...props}>{children}</code>
                    : <pre className="rounded-lg p-3 overflow-x-auto my-2 text-xs text-white/70" style={{ background: 'rgba(0,0,0,0.4)' }}><code {...props}>{children}</code></pre>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 pl-3 my-2 text-white/60" style={{ borderColor: 'rgba(0,212,255,0.4)' }}>{children}</blockquote>
                  ),
                  a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-neon-blue underline underline-offset-2">{children}</a>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}

        {message.tool_calls?.length > 0 && (
          <div className="space-y-1 mt-1 w-full">
            {message.tool_calls.map((tc, idx) => <FunctionDisplay key={idx} toolCall={tc} />)}
          </div>
        )}
      </div>
    </div>
  );
}