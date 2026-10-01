import client from "../api/client";

/**
 * Opening a protected PDF on a phone.
 *
 * The download endpoint is protected by a bearer JWT, and a browser
 * *navigation* cannot attach an Authorization header - only XHR/fetch can.
 * That is why the first implementation fetched the PDF with axios and handed
 * the browser a blob: URL.
 *
 * That works on desktop, but fails on phones for three separate reasons:
 *
 *  1. Android WebViews - Instagram, Facebook, WhatsApp and most in-app
 *     browsers - cannot render PDF at all. There is no built-in viewer, so
 *     anything that opens a PDF "in a tab" shows an error.
 *  2. The blob path throws away the server's Content-Disposition header, so the
 *     browser is never told the response is a file to save. It just sees opaque
 *     bytes with no filename.
 *  3. URL.revokeObjectURL() was called in the same tick as link.click(). The
 *     click handler dispatches asynchronously, so on slower mobile engines the
 *     blob was destroyed before the browser read it. Desktop was fast enough to
 *     hide this.
 *
 * So the primary path is now a real navigation to the API, using a short-lived
 * single-use ticket to carry the entitlement instead of a header. The browser
 * sees a genuine Content-Disposition: attachment response and hands the file
 * to the OS, which is the one thing Android WebViews reliably do.
 *
 * The blob path is kept as a fallback and its revoke bug is fixed, because the
 * frontend and backend deploy independently and the ticket call can fail on an
 * older backend.
 */

/**
 * Android WebViews cannot display PDFs, so they must be given a file to save.
 * iOS Safari and every desktop browser have a real PDF viewer, so showing the
 * document inline is a better experience there than dumping it into Downloads.
 */
function wantsInlineView() {
  if (typeof navigator === "undefined") return true;
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  // Instagram/FB in-app browsers identify themselves via their user agent.
  const isInApp = /Instagram|FBAN|FBAV|Instagram|WebView/i.test(ua);
  return !isAndroid && !isInApp;
}

function apiUrl(path) {
  const base = import.meta.env.VITE_API_BASE_URL || "";
  return base + path;
}

function notify(message) {
  // alert() is jarring inside an in-app browser and can be swallowed, but it is
  // the only synchronous feedback available here without touching every caller.
  alert(message);
}

/**
 * Opens the PDF via a real browser navigation.
 *
 * The window is opened synchronously inside the click handler, before any
 * await. Popup blockers only permit a window.open() that happens during user
 * activation; doing it after the ticket round-trip would be blocked on both
 * desktop and mobile.
 */
async function openViaTicket(note) {
  const disposition = wantsInlineView() ? "inline" : "attachment";
  const popup = window.open("", "_blank");

  try {
    const res = await client.post(
      `/api/notes/${note.id}/download-ticket?disposition=${disposition}`,
      null,
      { timeout: 20000 }
    );
    const url = apiUrl(res.data.url);

    if (popup && !popup.closed) {
      popup.location.href = url;
    } else {
      // Popup was blocked. A same-tab navigation still works, at the cost of
      // leaving the app - acceptable, and still protected by the ticket.
      window.location.href = url;
    }
  } catch (err) {
    if (popup && !popup.closed) popup.close();

    const status = err.response?.status;
    if (status === 401) {
      notify("Please sign in to download this PDF.");
      return;
    }
    if (status === 403) {
      notify("Purchase this bundle to unlock the download.");
      return;
    }
    // Ticket endpoint missing or network failure - fall back to the blob path so
    // a stale backend or a flaky connection does not block a paying customer.
    await downloadViaBlob(note);
  }
}

/**
 * Fallback: fetch the bytes with the auth header, then hand the browser a blob.
 *
 * The revoke is deferred - revoking synchronously was the mobile bug.
 */
async function downloadViaBlob(note) {
  let res;
  try {
    res = await client.get(`/api/notes/${note.id}/download`, {
      responseType: "blob",
      timeout: 60000,
    });
  } catch (err) {
    const status = err.response?.status;
    if (status === 401) {
      notify("Please sign in to download this PDF.");
    } else if (status === 403) {
      notify("Purchase this bundle to unlock the download.");
    } else {
      notify("Download failed. Please try again.");
    }
    return;
  }

  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const filename = `${(note.title || "notes").replace(/[^a-z0-9._-]+/gi, "_")}.pdf`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Deferred on purpose. The click handler above only *queues* the navigation,
  // so revoking in the same tick can destroy the blob before it is read. This
  // is what broke downloads on Android and in in-app browsers.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/**
 * Entry point used by the "Download PDF" buttons.
 *
 * The server gates this on a valid token AND a completed purchase, so nothing
 * here weakens the existing protection.
 */
export async function downloadNote(note) {
  if (!note || !note.id) return;
  await openViaTicket(note);
}
