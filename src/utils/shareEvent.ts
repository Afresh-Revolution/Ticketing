type ShareEventInput = {
  title: string;
  url: string;
  imageUrl?: string;
  onCopySuccess?: () => void;
};

export function getEventShareUrl(eventId: string): string {
  return new URL(`#/event/${eventId}`, window.location.href).href;
}

function isShareAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

function copyWithExecCommand(text: string): boolean {
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.setAttribute("aria-hidden", "true");
  el.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;border:0;padding:0;margin:0;";
  document.body.appendChild(el);
  el.focus();
  el.select();
  el.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(el);
  return ok;
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (copyWithExecCommand(text)) return true;
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function absoluteUrl(maybeUrl: string): string {
  try {
    return new URL(maybeUrl, window.location.href).href;
  } catch {
    return maybeUrl;
  }
}

async function toShareFile(imageUrl: string): Promise<File | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(absoluteUrl(imageUrl), {
      mode: "cors",
      credentials: "omit",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    const type = blob.type.startsWith("image/") ? blob.type : "image/jpeg";
    const ext = type.split("/")[1]?.split("+")[0] || "jpg";
    return new File([blob], `gatewav-event.${ext}`, { type });
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function shareEvent(input: ShareEventInput): Promise<void> {
  const { title, url, imageUrl, onCopySuccess } = input;
  const shareText = `Check out "${title}" on GateWav\n${url}`;

  const copied = await copyToClipboard(url);
  if (copied) onCopySuccess?.();

  if (typeof navigator.share !== "function") {
    if (!copied) {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
    }
    return;
  }

  const linkData: ShareData = { title, text: shareText, url };

  try {
    const file = imageUrl ? await toShareFile(imageUrl) : null;
    if (file) {
      // Keep the URL in `text` (caption). Do not set `url` together with `files` —
      // Safari/iOS drops the link when both are present, so Copy/WhatsApp get only the image.
      const fileData: ShareData = { title, text: shareText, files: [file] };
      const canShareFiles = !navigator.canShare || navigator.canShare({ files: [file] });
      if (canShareFiles) {
        try {
          await navigator.share(fileData);
          await copyToClipboard(url);
          onCopySuccess?.();
          return;
        } catch (err) {
          if (isShareAbort(err)) return;
        }
      }
    }

    await navigator.share(linkData);
    await copyToClipboard(url);
    onCopySuccess?.();
  } catch (err) {
    if (isShareAbort(err)) return;
    if (!copied) {
      const fallbackCopied = await copyToClipboard(url);
      if (fallbackCopied) onCopySuccess?.();
      else window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
    }
  }
}
