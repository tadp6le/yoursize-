(function () {
  const DONE = "data-msd-done";

  function fmt(b) {
    if (!b || b <= 0) return null;
    if (b < 1024) return b + " B";
    if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
    if (b < 1073741824) return (b / 1048576).toFixed(1) + " MB";
    return (b / 1073741824).toFixed(2) + " GB";
  }

  function guess(url) {
    const u = url.toLowerCase();
    if (/4k|2160/.test(u)) return "~8-20 MB";
    if (/1080|fhd/.test(u)) return "~3-8 MB";
    if (/720|hd(?!r)/.test(u)) return "~1-4 MB";
    if (/480|sd/.test(u)) return "~500 KB-2 MB";
    if (/thumb|icon|sm|xs/.test(u)) return "~50-200 KB";
    if (/\.svg/.test(u)) return "~5-50 KB";
    if (/\.gif/.test(u)) return "~500 KB-5 MB";
    if (/\.webp/.test(u)) return "~50-500 KB";
    if (/\.png/.test(u)) return "~100 KB-3 MB";
    if (/\.jpe?g/.test(u)) return "~50 KB-2 MB";
    return null;
  }

  function badge(text, est) {
    const s = document.createElement("span");
    s.className = "msd-badge" + (est ? " msd-est" : "");
    s.textContent = (est ? "≈ " : "") + text;
    return s;
  }

  function getUrl(el) {
    if (el.tagName === "IMG") return el.src || el.dataset.src;
    if (el.tagName === "VIDEO") {
      if (el.src && !el.src.startsWith("blob:")) return el.src;
      const s = el.querySelector("source[src]");
      return s ? s.src : el.currentSrc || null;
    }
    return null;
  }

  async function process(el) {
    if (el.hasAttribute(DONE)) return;
    el.setAttribute(DONE, "1");
    const url = getUrl(el);
    if (!url || url.startsWith("data:") || url.startsWith("blob:")) return;

    let size = null, est = false;

    // 1) background cache (from webRequest)
    try {
      const r = await browser.runtime.sendMessage({ type: "getSize", url });
      if (r?.size) size = r.size;
    } catch (e) {}

    // 2) direct HEAD fetch
    if (!size) {
      try {
        const r = await fetch(url, { method: "HEAD", mode: "cors" });
        const cl = r.headers.get("Content-Length");
        if (cl) size = parseInt(cl, 10);
      } catch (e) {}
    }

    // 3) URL-based guess
    if (!size) {
      size = guess(url);
      est = true;
    }

    const text = typeof size === "number" ? fmt(size) : size;
    if (text) el.insertAdjacentElement("afterend", badge(text, est));
  }

  function scan() {
    document.querySelectorAll("img:not([" + DONE + "]),video:not([" + DONE + "])")
      .forEach(process);
  }

  scan();
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();
