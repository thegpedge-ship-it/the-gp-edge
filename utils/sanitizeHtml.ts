/**
 * Comprehensive emoji & pictograph stripper.
 * Strips all Unicode emoji blocks, pictographs, dingbats, and variation selectors.
 */
export function stripAllEmojis(text: string): string {
  if (!text) return "";
  return text
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{2934}\u{2935}\u{25AA}\u{25AB}\u{25FE}\u{25FD}\u{25FB}\u{25FC}\u{25B6}\u{25C0}\u{1F200}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F19A}\u{FE0E}\u{FE0F}\u{200D}]/gu,
      ""
    )
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\p{Emoji_Presentation}/gu, "");
}

/**
 * sanitizeHtml
 *
 * Strips dangerous elements and attributes from an HTML string before
 * it is injected via dangerouslySetInnerHTML.
 * Also cleans all residual emojis so clinical documents remain clean and professional.
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

  // Strip all emojis from content and headings
  out = stripAllEmojis(out);

  return out;
}
