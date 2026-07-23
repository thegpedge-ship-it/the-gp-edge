import { sanitizeHtml } from "./sanitizeHtml";

export function getBlockNodes(html: string): ChildNode[] {
  if (typeof window === "undefined") return [];
  const temp = document.createElement("div");
  temp.innerHTML = html;
  
  const blocks: ChildNode[] = [];
  
  function traverse(node: ChildNode) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent?.trim()) {
        blocks.push(node);
      }
      return;
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toUpperCase();
      
      if (["P", "TABLE", "UL", "OL", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "HR"].includes(tagName)) {
        blocks.push(el);
      } else if (tagName === "DIV" || tagName === "SECTION" || tagName === "ARTICLE" || tagName === "SPAN") {
        if (el.classList.contains("fc-wrapper") || 
            el.classList.contains("img-wrapper") || 
            el.classList.contains("tbl-wrapper") || 
            el.classList.contains("callout-block")) {
          blocks.push(el);
        } else if (el.childNodes.length > 0) {
          Array.from(el.childNodes).forEach(traverse);
        } else if (el.textContent?.trim()) {
          blocks.push(el);
        }
      } else {
        blocks.push(el);
      }
    }
  }
  
  Array.from(temp.childNodes).forEach(traverse);
  return blocks;
}

export function estimateNodeHeight(node: ChildNode): number {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || "";
    const cleanText = text.trim();
    if (!cleanText) return 0;
    const lines = Math.ceil(cleanText.length / 70);
    return lines * 22;
  }
  
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tagName = el.tagName.toUpperCase();
    
    if (el.classList.contains("fc-wrapper")) {
      return 420; // Flowcharts are usually 400px+ high
    }
    if (el.classList.contains("img-wrapper") || el.querySelector("img")) {
      return 360; // Images are usually 320px-350px high
    }
    if (el.classList.contains("callout-block")) {
      const text = el.textContent || "";
      const lines = Math.ceil(text.trim().length / 65) || 1;
      return (lines * 22) + 48; // padding top/bottom and margins
    }
    if (el.classList.contains("tbl-wrapper") || tagName === "TABLE") {
      const rows = el.querySelectorAll("tr");
      let totalTableHeight = 30; // margins + borders
      
      const numCols = rows[0]?.querySelectorAll("td, th").length || 3;
      // Multi-column tables wrap text very easily since column widths are narrow
      const colWidthChars = Math.max(25, Math.floor(85 / numCols));
      
      rows.forEach(row => {
        const cells = row.querySelectorAll("td, th");
        let maxRowHeight = 44; // Minimum row height including padding
        cells.forEach(cell => {
          const text = cell.textContent || "";
          const cleanText = text.trim();
          if (cleanText) {
            const lines = Math.ceil(cleanText.length / colWidthChars) || 1;
            const cellHeight = (lines * 20) + 24; // py-3 standard table padding is 24px total
            if (cellHeight > maxRowHeight) {
              maxRowHeight = cellHeight;
            }
          }
        });
        totalTableHeight += maxRowHeight;
      });
      return totalTableHeight;
    }
    
    if (tagName.startsWith("H")) {
      if (tagName === "H1") return 60;
      if (tagName === "H2") return 50;
      return 45;
    }
    
    if (tagName === "UL" || tagName === "OL") {
      const lis = el.querySelectorAll("li");
      let totalListHeight = 20;
      lis.forEach(li => {
        const text = li.textContent || "";
        const cleanText = text.trim();
        const lines = Math.ceil(cleanText.length / 70) || 1;
        totalListHeight += (lines * 22) + 8;
      });
      return totalListHeight;
    }
    
    if (tagName === "P") {
      const text = el.textContent || "";
      const lines = Math.ceil(text.trim().length / 75) || 1;
      return (lines * 22) + 20; // bottom margin
    }
    
    if (tagName === "HR") return 24;
    if (tagName === "BLOCKQUOTE") {
      const text = el.textContent || "";
      const lines = Math.ceil(text.trim().length / 70);
      return (lines * 22) + 36;
    }
    
    if (["DIV", "SECTION", "ARTICLE", "SPAN"].includes(tagName)) {
      if (el.childNodes.length > 0) {
        let total = 0;
        Array.from(el.childNodes).forEach(child => {
          total += estimateNodeHeight(child);
        });
        return total || 20;
      }
    }
    
    const text = el.textContent || "";
    const lines = Math.ceil(text.trim().length / 75) || 1;
    return (lines * 22) + 20;
  }
  
  return 0;
}

export function splitHtmlIntoPages(html: string): string[] {
  if (typeof window === "undefined") return [html];
  
  const blocks = getBlockNodes(html);
  if (blocks.length === 0) return [html];
  
  const pages: string[] = [];
  let currentPageHtml = "";
  let currentPageHeight = 0;
  
  blocks.forEach((node, index) => {
    const nodeHtml = (node.nodeType === Node.ELEMENT_NODE) 
      ? (node as HTMLElement).outerHTML 
      : node.textContent || "";
    
    const nodeHeight = estimateNodeHeight(node);
    if (nodeHeight === 0) return;
    
    const isFirstPage = pages.length === 0;
    // A4 printable height budget inside 1123px container with p-16:
    // First page has title/meta (~300px non-content): limit is 800px
    // Subsequent pages have header (~180px non-content): limit is 950px
    const limit = isFirstPage ? 800 : 950;
    
    const isHeading = node.nodeType === Node.ELEMENT_NODE && 
      ["H1", "H2", "H3", "H4", "H5", "H6"].includes((node as HTMLElement).tagName.toUpperCase());
      
    let shouldStartNewPage = currentPageHeight > 0 && (currentPageHeight + nodeHeight > limit);
    
    // Lookahead to prevent orphan headings at the bottom of pages
    if (!shouldStartNewPage && isHeading && index < blocks.length - 1) {
      const nextNode = blocks[index + 1];
      const nextNodeHeight = estimateNodeHeight(nextNode);
      // If the heading fits but its immediate following content node doesn't,
      // push the heading to the next page to keep them grouped.
      if (currentPageHeight > 0 && (currentPageHeight + nodeHeight + nextNodeHeight > limit)) {
        shouldStartNewPage = true;
      }
    }
    
    if (shouldStartNewPage) {
      pages.push(currentPageHtml.trim());
      currentPageHtml = nodeHtml;
      currentPageHeight = nodeHeight;
    } else {
      currentPageHtml += nodeHtml;
      currentPageHeight += nodeHeight;
    }
  });
  
  if (currentPageHtml.trim()) {
    pages.push(currentPageHtml.trim());
  }
  
  return pages.length > 0 ? pages : [html];
}
