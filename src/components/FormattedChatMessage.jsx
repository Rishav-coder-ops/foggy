// src/components/FormattedChatMessage.jsx
// Safe, accessible Markdown renderer for Foggy chat replies
// Uses react-markdown with custom components for bold, italics, bullet/numbered lists, and headings.
// Automatically strips stray markdown symbols and extracts the medical disclaimer into a dedicated callout card.

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { AlertCircle } from 'lucide-react';
import { balanceMarkdownMarkers } from '../../shared/chat/markdownSanitizer.js';

export function cleanAndExtractMarkdown(text) {
  if (!text || typeof text !== 'string') {
    return { cleanText: '', hasDisclaimer: false };
  }

  let cleaned = text;

  // Extract medical disclaimer block (matches blockquote or lines containing medical disclaimer)
  const disclaimerRegex =
    /(?:^|\n)(?:[>\s*•-]*🩺?[>\s*•-]*)*\s*(?:\*+|_+)?\s*Medical disclaimer:?\s*([^\n]+(?:\n[^\n]+)*)(?:\*+|_+)?/gi;
  let hasDisclaimer = false;
  if (disclaimerRegex.test(cleaned)) {
    hasDisclaimer = true;
    cleaned = cleaned.replace(disclaimerRegex, '\n');
  } else if (/Foggy is an AI assistant, not a doctor/i.test(cleaned)) {
    hasDisclaimer = true;
    cleaned = cleaned.replace(/(?:^|\n)[^\n]*Foggy is an AI assistant, not a doctor[^\n]*/gi, '\n');
  }

  // Convert lines like '*Household Alert...*' or '*Household Alert:*' to '**Household Alert:**'
  cleaned = cleaned.replace(/^(\s*)\*([A-Za-z0-9][^*]*?)\*(\s*)$/gm, '$1**$2**$3');

  // If a line starts with '* Word:' without space after '*', make it '* **Word:**'
  cleaned = cleaned.replace(/^(\s*)\*([A-Za-z0-9][^:\n]*:)/gm, '$1* **$2**');

  // If a line starts with '* Label:' with space, bold the label
  cleaned = cleaned.replace(/^(\s*[\*\-]\s+)([A-Za-z0-9][^:\n]{2,32}:)/gm, '$1**$2**');

  // Strip trailing hashes on headings e.g. '### Title ###' -> '### Title'
  cleaned = cleaned.replace(/^(#{1,6}\s+.*?)\s+#+\s*$/gm, '$1');

  // Strip empty hashes on their own line
  cleaned = cleaned.replace(/^\s*#+\s*$/gm, '');

  // Strip stray unclosed lone asterisks
  cleaned = cleaned.replace(/(?<=\s)\*(?=\s|$)/g, '');

  // Balance markdown markers (**, *, `) and strip trailing dangling tokens
  cleaned = balanceMarkdownMarkers(cleaned);

  return { cleanText: cleaned.trim(), hasDisclaimer };
}

export default function FormattedChatMessage({ content, sender = 'foggy' }) {
  const isFoggy = sender === 'foggy';

  const { cleanText, hasDisclaimer } = useMemo(() => {
    if (!isFoggy) return { cleanText: content, hasDisclaimer: false };
    return cleanAndExtractMarkdown(content);
  }, [content, isFoggy]);

  // For user messages, simple clean text
  if (!isFoggy) {
    return <div className="text-xs leading-relaxed break-words whitespace-pre-wrap">{content}</div>;
  }

  const markdownComponents = {
    h1: ({ children, ...props }) => (
      <h3
        className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base mt-2.5 mb-1.5 flex items-center gap-1.5"
        {...props}
      >
        {children}
      </h3>
    ),
    h2: ({ children, ...props }) => (
      <h3
        className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm mt-2.5 mb-1 flex items-center gap-1.5"
        {...props}
      >
        {children}
      </h3>
    ),
    h3: ({ children, ...props }) => (
      <h4
        className="font-extrabold text-slate-800 dark:text-white text-xs sm:text-sm mt-2 mb-1 flex items-center gap-1.5"
        {...props}
      >
        {children}
      </h4>
    ),
    h4: ({ children, ...props }) => (
      <h5 className="font-bold text-slate-800 dark:text-slate-100 text-xs mt-1.5 mb-1" {...props}>
        {children}
      </h5>
    ),
    p: ({ children, ...props }) => (
      <p
        className="my-1.5 leading-relaxed text-xs text-slate-800 dark:text-slate-100 break-words"
        {...props}
      >
        {children}
      </p>
    ),
    strong: ({ children, ...props }) => (
      <strong className="font-extrabold text-slate-900 dark:text-white" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em className="italic text-slate-800 dark:text-slate-200" {...props}>
        {children}
      </em>
    ),
    ul: ({ children, ...props }) => (
      <ul
        className="list-disc list-outside ml-4 my-2 space-y-1 text-xs text-slate-800 dark:text-slate-100"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className="list-decimal list-outside ml-4 my-2 space-y-1 text-xs text-slate-800 dark:text-slate-100"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="leading-relaxed pl-0.5" {...props}>
        {children}
      </li>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="border-l-2 border-sky-400 dark:border-sky-500 pl-3 py-1 my-2 bg-sky-50/60 dark:bg-sky-950/30 rounded-r-xl text-slate-700 dark:text-slate-300 italic text-[11px]"
        {...props}
      >
        {children}
      </blockquote>
    ),
    code: ({ children, ...props }) => (
      <code
        className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-800 dark:text-slate-200"
        {...props}
      >
        {children}
      </code>
    )
  };

  return (
    <div className="space-y-1 text-xs leading-relaxed">
      <ReactMarkdown components={markdownComponents}>{cleanText}</ReactMarkdown>

      {/* Styled Medical Disclaimer Callout shown once at the end */}
      {hasDisclaimer && (
        <div className="mt-3 p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-2.5 text-amber-900 dark:text-amber-200 text-[11px] leading-snug">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-950 dark:text-amber-100 block">
              Medical Safety Notice
            </span>
            <span className="block text-amber-900/90 dark:text-amber-200/90">
              Foggy is an AI assistant, not a doctor. In a medical emergency, call 112. Follow your
              physician's advice for medications, and keep prescribed salbutamol inhaler (e.g.
              Asthalin) handy.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
