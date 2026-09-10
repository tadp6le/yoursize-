const sizeCache = {};

browser.webRequest.onHeadersReceived.addListener(
  (details) => {
    for (const h of (details.responseHeaders || [])) {
      if (h.name.toLowerCase() === "content-length") {
        sizeCache[details.url] = parseInt(h.value, 10);
        if (Object.keys(sizeCache).length > 5000)
          delete sizeCache[Object.keys(sizeCache)[0]];
        break;
      }
    }
  },
  { urls: ["<all_urls>"], types: ["image", "media", "xmlhttprequest", "other"] },
  ["responseHeaders"]
);

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "getSize")
    sendResponse({ size: sizeCache[msg.url] || null });
  return true;
});
