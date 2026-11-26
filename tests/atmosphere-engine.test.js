// tests/atmosphere-engine.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getSpotlightGradient,
  getAuraStyles,
  isInteractiveTarget,
  AtmosphericParticle,
  startAtmosphereEngine
} from '../src/utils/atmosphereEngine.js';
import { requestJson } from '../src/services/httpClient.js';
import { requestPersonalizeMemo } from '../src/services/profileApi.js';
import { auth } from '../src/firebase.js';

describe('src/utils/atmosphereEngine.js', () => {
  describe('getSpotlightGradient', () => {
    it('returns sky blue ozone gradient for dark mode and warm haze for light mode', () => {
      const darkGrad = getSpotlightGradient(true);
      expect(darkGrad).toContain('56, 189, 248');

      const lightGrad = getSpotlightGradient(false);
      expect(lightGrad).toContain('217, 119, 6');
    });
  });

  describe('getAuraStyles', () => {
    it('returns compact style when clicking', () => {
      const style = getAuraStyles({ isClicking: true, isHoveringClickable: false, isDark: true });
      expect(style.width).toBe('20px');
      expect(style.height).toBe('20px');
    });

    it('returns expanded glow style when hovering clickable elements', () => {
      const darkHover = getAuraStyles({
        isClicking: false,
        isHoveringClickable: true,
        isDark: true
      });
      expect(darkHover.width).toBe('44px');
      expect(darkHover.boxShadow).toContain('rgba(56, 189, 248');

      const lightHover = getAuraStyles({
        isClicking: false,
        isHoveringClickable: true,
        isDark: false
      });
      expect(lightHover.width).toBe('44px');
      expect(lightHover.boxShadow).toContain('rgba(217, 119, 6');
    });

    it('returns default 26px ring when idle', () => {
      const idle = getAuraStyles({ isClicking: false, isHoveringClickable: false, isDark: true });
      expect(idle.width).toBe('26px');
      expect(idle.backgroundColor).toBe('transparent');
    });
  });

  describe('isInteractiveTarget', () => {
    it('identifies standard interactive HTML tags', () => {
      const btn = document.createElement('button');
      const link = document.createElement('a');
      const input = document.createElement('input');
      const select = document.createElement('select');
      const textarea = document.createElement('textarea');
      const div = document.createElement('div');

      expect(isInteractiveTarget(btn)).toBe(true);
      expect(isInteractiveTarget(link)).toBe(true);
      expect(isInteractiveTarget(input)).toBe(true);
      expect(isInteractiveTarget(select)).toBe(true);
      expect(isInteractiveTarget(textarea)).toBe(true);
      expect(isInteractiveTarget(div)).toBe(false);
      expect(isInteractiveTarget(null)).toBe(false);
    });

    it('detects nested interactive elements via closest() and data attributes', () => {
      const parentBtn = document.createElement('button');
      const childSpan = document.createElement('span');
      parentBtn.appendChild(childSpan);
      expect(isInteractiveTarget(childSpan)).toBe(true);

      const roleBtn = document.createElement('div');
      roleBtn.setAttribute('role', 'button');
      const roleChild = document.createElement('p');
      roleBtn.appendChild(roleChild);
      expect(isInteractiveTarget(roleChild)).toBe(true);

      const dataInteractive = document.createElement('div');
      dataInteractive.setAttribute('data-interactive', 'true');
      expect(isInteractiveTarget(dataInteractive)).toBe(true);
    });
  });

  describe('AtmosphericParticle', () => {
    it('initializes with bounded properties and updates over time', () => {
      const p = new AtmosphericParticle(800, 600);
      expect(p.x).toBeDefined();
      expect(p.y).toBeDefined();
      expect(p.size).toBeGreaterThan(0);

      const oldX = p.x;
      const oldY = p.y;
      p.update(800, 600, { isActive: false, radius: 100, x: 400, y: 300, vx: 0, vy: 0 });
      expect(p.x !== oldX || p.y !== oldY).toBe(true);
    });

    it('reacts to cursor repulsion when mouse is active within radius', () => {
      const p = new AtmosphericParticle(800, 600);
      p.x = 405;
      p.y = 305;
      const mouse = { isActive: true, radius: 100, x: 400, y: 300, vx: 5, vy: 5 };
      p.update(800, 600, mouse);
      expect(p.x).toBeGreaterThan(405);
      expect(p.y).toBeGreaterThan(305);
    });

    it('draws correctly in both dark and light modes across particle types', () => {
      const p = new AtmosphericParticle(800, 600);
      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillStyle: '',
        shadowColor: '',
        shadowBlur: 0
      };

      p.type = 0;
      p.draw(mockCtx, true);
      p.draw(mockCtx, false);

      p.type = 1;
      p.draw(mockCtx, true);
      p.draw(mockCtx, false);

      p.type = 2;
      p.draw(mockCtx, true);
      p.draw(mockCtx, false);

      expect(mockCtx.save).toHaveBeenCalledTimes(6);
      expect(mockCtx.restore).toHaveBeenCalledTimes(6);
    });

    it('wraps boundary coordinates when particles drift beyond canvas', () => {
      const p = new AtmosphericParticle(800, 600);
      p.x = -25;
      p.y = -25;
      p.update(800, 600, { isActive: false });
      expect(p.x).toBe(820);
      expect(p.y).toBe(620);

      p.x = 850;
      p.y = 650;
      p.update(800, 600, { isActive: false });
      expect(p.x).toBe(-20);
      expect(p.y).toBe(-20);
    });
  });

  describe('startAtmosphereEngine', () => {
    let canvas;
    let spotlightEl;
    let auraEl;
    let animCallbacks = [];

    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 768;
      canvas.getContext = vi.fn().mockReturnValue({
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        fillStyle: '',
        strokeStyle: ''
      });

      spotlightEl = document.createElement('div');
      auraEl = document.createElement('div');
      document.body.appendChild(canvas);
      document.body.appendChild(spotlightEl);
      document.body.appendChild(auraEl);

      animCallbacks = [];
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        animCallbacks.push(cb);
        return animCallbacks.length;
      });
      vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    });

    afterEach(() => {
      canvas.remove();
      spotlightEl.remove();
      auraEl.remove();
      vi.restoreAllMocks();
    });

    it('handles initialization, fast mousemove for mist trails, render frames, and cleanup cleanly', () => {
      const onHoverChange = vi.fn();
      const onClickChange = vi.fn();

      const engine = startAtmosphereEngine({
        canvas,
        spotlightEl,
        auraEl,
        isDark: true,
        hasCoarsePointer: false,
        onHoverChange,
        onClickChange
      });

      // Dispatch initial mousemove
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }));
      expect(onHoverChange).toHaveBeenCalled();

      // Fast mousemove to generate mist trails (speed > 8)
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 500, clientY: 500 }));

      // Dispatch window resize
      window.dispatchEvent(new Event('resize'));

      // Run multiple render loop animation frames to cover particle physics and mist trail decays
      for (let i = 0; i < 5; i++) {
        const callbacks = [...animCallbacks];
        animCallbacks = [];
        callbacks.forEach((cb) => cb(performance.now()));
      }

      // Dispatch mousedown/mouseup
      window.dispatchEvent(new MouseEvent('mousedown'));
      expect(onClickChange).toHaveBeenCalledWith(true);

      window.dispatchEvent(new MouseEvent('mouseup'));
      expect(onClickChange).toHaveBeenCalledWith(false);

      window.dispatchEvent(new MouseEvent('mouseleave'));
      expect(onHoverChange).toHaveBeenCalledWith(false);

      // Dispatch touch events
      window.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 150, clientY: 150 }]
        })
      );
      window.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [{ clientX: 180, clientY: 180 }]
        })
      );
      window.dispatchEvent(new TouchEvent('touchend'));

      // Destroy engine
      expect(() => engine.destroy()).not.toThrow();
    });

    it('returns noop destroy if canvas is null', () => {
      const engine = startAtmosphereEngine({
        canvas: null,
        spotlightEl: null,
        auraEl: null,
        isDark: false,
        hasCoarsePointer: false,
        onHoverChange: vi.fn(),
        onClickChange: vi.fn()
      });
      expect(typeof engine.destroy).toBe('function');
      expect(() => engine.destroy()).not.toThrow();
    });
  });

  describe('src/services/httpClient.js and profileApi.js coverage', () => {
    afterEach(() => {
      auth.currentUser = null;
    });

    it('requestJson fetches and parses json successfully', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok' })
      });
      const res = await requestJson('/api/test', {}, 1000);
      expect(res.ok).toBe(true);
      expect(res.data.status).toBe('ok');
    });

    it('requestJson handles invalid JSON gracefully', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Not JSON');
        }
      });
      const res = await requestJson('/api/test');
      expect(res.ok).toBe(false);
      expect(res.data).toBeNull();
    });

    it('requestPersonalizeMemo delegates to api endpoint with auth token when available', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ memo: 'Safe indoor memo', isFallback: false })
      });

      const mockGetToken = vi.fn().mockResolvedValue('mock-jwt-token');
      auth.currentUser = {
        getIdToken: mockGetToken
      };

      const res = await requestPersonalizeMemo({
        member: { name: 'Aarav', relationship: 'child', healthConditions: ['Asthma'] },
        prompt: 'How to stay safe?',
        context: { city: 'Delhi', aqi: 240 }
      });

      expect(res.memo).toBe('Safe indoor memo');
      expect(mockGetToken).toHaveBeenCalled();
    });

    it('requestPersonalizeMemo throws when endpoint fails', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Error' })
      });

      await expect(
        requestPersonalizeMemo({
          member: { name: 'Grandpa' }
        })
      ).rejects.toThrow('Internal Error');
    });
  });
});
