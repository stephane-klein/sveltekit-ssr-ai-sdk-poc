import hljs from 'highlight.js';
import { marked, Renderer } from 'marked';

const renderer = new Renderer();

renderer.code = function ({ text, lang, escaped }) {
  if (lang && hljs.getLanguage(lang)) {
    const highlighted = hljs.highlight(text, { language: lang }).value;
    return `<pre><code class="language-${lang} hljs">${highlighted}</code></pre>`;
  }
  const highlighted = hljs.highlightAuto(text).value;
  return `<pre><code class="hljs">${highlighted}</code></pre>`;
};

marked.setOptions({ renderer });

export function renderMarkdown(text) {
  if (!text) return '';
  return marked.parse(text);
}
