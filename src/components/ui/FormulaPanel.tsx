import React, { useState } from 'react';

export interface FormulaStep {
  label: string;
  expr: string;
  highlight?: boolean;
}

export interface FormulaPanelProps {
  title: string;
  formula: string;
  variables?: { symbol: string; meaning: string }[];
  steps?: FormulaStep[];
  result?: { label: string; value: string; status?: 'pass' | 'warning' | 'fail' | 'info' };
  defaultOpen?: boolean;
}

export function FormulaPanel({
  title,
  formula,
  variables,
  steps,
  result,
  defaultOpen = false,
}: FormulaPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  const resultColors = {
    pass:    'bg-green-950/60 border-green-700 text-green-300',
    warning: 'bg-amber-950/60 border-amber-700 text-amber-300',
    fail:    'bg-red-950/60 border-red-700 text-red-300',
    info:    'bg-blue-950/60 border-blue-700 text-blue-300',
  };

  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-colors text-left"
      >
        <span className="flex items-center gap-2">
          <span className="text-indigo-500 dark:text-indigo-400 text-base font-bold select-none">∑</span>
          <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">{title}</span>
        </span>
        <svg
          className={`w-4 h-4 text-indigo-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="p-4 bg-gray-950 space-y-4">
          {/* Formula */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Formula</p>
            <pre className="text-sm text-indigo-100 font-mono leading-loose whitespace-pre-wrap">{formula}</pre>
          </div>

          {/* Variable definitions */}
          {variables && variables.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Variables</p>
              <div className="space-y-1.5">
                {variables.map((v) => (
                  <div key={v.symbol} className="flex gap-3 text-sm">
                    <span className="text-cyan-400 font-mono font-semibold shrink-0 w-14">{v.symbol}</span>
                    <span className="text-slate-300">{v.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live calculation steps */}
          {steps && steps.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">With your values</p>
              <div className="space-y-2">
                {steps.map((s, i) => (
                  <div
                    key={i}
                    className={`flex flex-col sm:flex-row sm:gap-3 text-sm font-mono rounded px-2 py-1 ${
                      s.highlight
                        ? 'bg-green-950/50 text-green-300'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-500 font-sans text-xs w-32 shrink-0 flex items-start pt-0.5">{s.label}</span>
                    <span className="break-all">{s.expr}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`rounded-lg px-4 py-2.5 border ${resultColors[result.status ?? 'info']}`}>
              <span className="text-xs font-bold uppercase tracking-wider mr-2 opacity-75">{result.label}:</span>
              <span className="font-mono font-bold">{result.value}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
