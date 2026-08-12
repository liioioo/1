import { FontPreset } from '../types';

export const INITIAL_FONT_PRESETS: FontPreset[] = [];

export function applyFontToDOM(fontPreset: FontPreset | null, fontSizePx: number = 14) {
  if (typeof document === 'undefined') return;

  // 1. Inject or update style tag for custom font-face
  let styleEl = document.getElementById('custom-font-style-element') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'custom-font-style-element';
    document.head.appendChild(styleEl);
  }

  if (fontPreset && fontPreset.fontUrl && fontPreset.sourceType !== 'system') {
    if (fontPreset.sourceType === 'url' && fontPreset.fontUrl.includes('fonts.googleapis.com')) {
      let linkEl = document.getElementById('custom-font-link-element') as HTMLLinkElement | null;
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.id = 'custom-font-link-element';
        linkEl.rel = 'stylesheet';
        document.head.appendChild(linkEl);
      }
      linkEl.href = fontPreset.fontUrl;
      styleEl.innerHTML = '';
    } else {
      styleEl.innerHTML = `
        @font-face {
          font-family: '${fontPreset.family}';
          src: url('${fontPreset.fontUrl}');
          font-display: swap;
        }
      `;
    }
  } else {
    styleEl.innerHTML = '';
  }

  // 2. Set root element font family and font size
  const familyName = fontPreset ? `"${fontPreset.family}", system-ui, -apple-system, sans-serif` : 'system-ui, -apple-system, sans-serif';
  document.documentElement.style.fontFamily = familyName;
  document.documentElement.style.fontSize = `${fontSizePx}px`;
}
