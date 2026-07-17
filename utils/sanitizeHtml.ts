/**
 * sanitizeHtml
 *
 * Strips dangerous elements and attributes from an HTML string before
 * it is injected via dangerouslySetInnerHTML.
 *
 * Removed:
 *  - <script> ... </script>  (any variant — causes the React warning)
 *  - <iframe> ... </iframe>
 *  - <object> ... </object>
 *  - <embed>
 *  - <form> ... </form>
 *  - Inline event handlers  (on*)
 *  - javascript: hrefs / srcs
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  let out = html;

  // Remove <script> blocks (including type="..." variants)
  out = out.replace(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi, "");

  // Remove <iframe>, <object>, <embed>, <form> blocks
  out = out.replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe\s*>/gi, "");
  out = out.replace(/<object\b[^>]*>([\s\S]*?)<\/object\s*>/gi, "");
  out = out.replace(/<embed\b[^>]*/gi, "");
  out = out.replace(/<form\b[^>]*>([\s\S]*?)<\/form\s*>/gi, "");

  // Remove inline event handlers (onclick, onload, onerror, etc.)
  out = out.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // Remove javascript: in href / src / action attributes
  out = out.replace(/(href|src|action)\s*=\s*["']\s*javascript\s*:[^"']*/gi, '$1="#"');

  return out;
}
