// src/components/ExpandablePanelModal.jsx
// Reusable accessible modal/sheet component for expandable feature panels
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function ExpandablePanelModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  badge,
  children,
  triggerRef
}) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Esc key & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      // Focus trapping
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus on close button or first interactive element
    const timer = setTimeout(() => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      clearTimeout(timer);
      if (triggerRef?.current) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const titleId = `panel-title-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const descId = subtitle ? `panel-desc-${title.replace(/\s+/g, '-').toLowerCase()}` : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 sm:p-4 md:p-6 transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative w-full h-[92vh] sm:h-auto sm:max-h-[90vh] sm:max-w-4xl md:max-w-5xl rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 sm:motion-safe:zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 sm:py-5 border-b border-slate-200 dark:border-slate-800 bg-[#F1F5F9] dark:bg-[#1E293B] shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            {Icon && (
              <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id={titleId}
                  className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white truncate"
                >
                  {title}
                </h2>
                {badge}
              </div>
              {subtitle && (
                <p id={descId} className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="p-2 sm:p-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
