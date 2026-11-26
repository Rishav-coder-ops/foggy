// src/utils/atmospherePalettes.js
/**
 * @fileoverview Color gradients, aura feedback styles, and UI interaction target detection.
 */

/**
 * Returns spotlight radial background gradient matching dark/light mode.
 * @param {boolean} isDark - Whether dark theme is active.
 * @returns {string} CSS radial gradient string.
 */
export function getSpotlightGradient(isDark) {
  return isDark
    ? 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, rgba(56, 189, 248, 0.02) 40%, transparent 70%)'
    : 'radial-gradient(circle, rgba(217, 119, 6, 0.07) 0%, rgba(217, 119, 6, 0.02) 45%, transparent 70%)';
}

/**
 * Returns aura ring styles for desktop pointer feedback.
 * @param {{ isClicking: boolean, isHoveringClickable: boolean, isDark: boolean }} opts
 * @returns {object} Inline React styles.
 */
export function getAuraStyles({ isClicking, isHoveringClickable, isDark }) {
  const size = isClicking ? '20px' : isHoveringClickable ? '44px' : '26px';

  let borderColor = isDark ? 'rgba(248, 250, 252, 0.45)' : 'rgba(51, 65, 85, 0.45)';
  let borderWidth = '1.5px';
  let backgroundColor = 'transparent';
  let boxShadow = 'none';

  if (isHoveringClickable) {
    borderWidth = '2px';
    borderColor = isDark ? 'rgba(56, 189, 248, 0.85)' : 'rgba(217, 119, 6, 0.85)';
    backgroundColor = isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(217, 119, 6, 0.12)';
    boxShadow = isDark ? '0 0 16px rgba(56, 189, 248, 0.45)' : '0 0 16px rgba(217, 119, 6, 0.35)';
  }

  return {
    width: size,
    height: size,
    borderRadius: '9999px',
    border: `${borderWidth} solid ${borderColor}`,
    backgroundColor,
    boxShadow
  };
}

/**
 * Detects whether an event target is an interactive clickable element.
 * @param {EventTarget | null} target
 * @returns {boolean}
 */
export function isInteractiveTarget(target) {
  if (!target || typeof target.closest !== 'function') return false;
  const tag = target.tagName;
  if (
    tag === 'BUTTON' ||
    tag === 'A' ||
    tag === 'INPUT' ||
    tag === 'SELECT' ||
    tag === 'TEXTAREA'
  ) {
    return true;
  }
  return Boolean(
    target.closest('button') ||
    target.closest('a') ||
    target.closest('[role="button"]') ||
    target.getAttribute?.('data-interactive') === 'true'
  );
}
