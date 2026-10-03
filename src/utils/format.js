// Format Rupiah Helper
export function formatRupiah(number) {
  if (number === null || number === undefined) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
}

// Simple & Safe Markdown Parser for CS AI responses
export function formatCsMarkdown(rawText) {
  if (!rawText) return "";

  // Escape HTML
  let text = rawText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks
  text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic
  text = text.replace(/(^|[^\*])\*([^\*]+)\*(?!\*)/g, '$1<em>$2</em>');
  text = text.replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<em>$2</em>');

  // Markdown Links [Label](url)
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="cs-msg-link">$1</a>');

  // Auto link URLs
  text = text.replace(/(^|[^\w"'])(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="cs-msg-link">$2</a>');

  // Lines & Lists
  const lines = text.split("\n");
  let inUl = false;
  let inOl = false;
  let htmlLines = [];

  for (let line of lines) {
    const trimmed = line.trim();
    const ulMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);

    if (ulMatch) {
      if (!inUl) {
        if (inOl) { htmlLines.push('</ol>'); inOl = false; }
        htmlLines.push('<ul class="cs-msg-list">');
        inUl = true;
      }
      htmlLines.push(`<li>${ulMatch[1]}</li>`);
    } else if (olMatch) {
      if (!inOl) {
        if (inUl) { htmlLines.push('</ul>'); inUl = false; }
        htmlLines.push('<ol class="cs-msg-list">');
        inOl = true;
      }
      htmlLines.push(`<li>${olMatch[2]}</li>`);
    } else {
      if (inUl) { htmlLines.push('</ul>'); inUl = false; }
      if (inOl) { htmlLines.push('</ol>'); inOl = false; }

      if (trimmed === "") {
        htmlLines.push('<div class="cs-msg-spacer"></div>');
      } else {
        htmlLines.push(`<p>${line}</p>`);
      }
    }
  }

  if (inUl) htmlLines.push('</ul>');
  if (inOl) htmlLines.push('</ol>');

  return htmlLines.join("\n");
}

// Helper to copy text to clipboard
export async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback
    }
  }
  try {
    const tempInput = document.createElement("input");
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    return true;
  } catch {
    return false;
  }
}

// Kompresi foto bukti transfer via Canvas agar ringan (~50-80KB) dan aman di localStorage
export function compressImageFile(file, maxWidth = 900, maxHeight = 1200, quality = 0.72) {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const image = new Image();
        image.onload = () => {
          let width = image.width;
          let height = image.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        image.onerror = () => resolve(readerEvent.target.result);
        image.src = readerEvent.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    } catch {
      resolve(null);
    }
  });
}

// Upload proof image to temporary cloud host
export async function uploadProofImage(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("expire", "172800"); // 48h

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.status === "success" && data.data && data.data.url) {
        return data.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
      }
    }
  } catch (err) {
    console.warn("Upload proof error:", err);
  }
  return null;
}

// Copy image to clipboard for desktop WA Web
export async function copyImageBlobToClipboard(file) {
  try {
    if (!navigator.clipboard || !window.ClipboardItem) return false;

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(async (blob) => {
            if (!blob) return resolve(false);
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob })
              ]);
              resolve(true);
            } catch {
              resolve(false);
            }
          }, "image/png");
        } catch {
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  } catch {
    return false;
  }
}
