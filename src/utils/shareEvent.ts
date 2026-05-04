type ShareEventInput = {
  title: string;
  url: string;
  imageUrl?: string;
  onCopySuccess?: () => void;
};

async function toShareFile(imageUrl: string): Promise<File | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return null;
    const ext = blob.type.split("/")[1] || "jpg";
    return new File([blob], `gatewav-event.${ext}`, { type: blob.type });
  } catch {
    return null;
  }
}

export async function shareEvent(input: ShareEventInput): Promise<void> {
  const { title, url, imageUrl, onCopySuccess } = input;
  const shareText = `Check out "${title}" on GateWav.`;

  if (navigator.share) {
    try {
      const shareData: ShareData = { title, text: shareText, url };

      if (imageUrl && navigator.canShare) {
        const file = await toShareFile(imageUrl);
        if (file && navigator.canShare({ files: [file] })) {
          shareData.files = [file];
        }
      }

      await navigator.share(shareData);
      return;
    } catch {
      // User may cancel native share, or unsupported file share; fallback below.
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    onCopySuccess?.();
    return;
  } catch {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(`${shareText} ${url}`);
    window.open(`https://wa.me/?text=${encodedText}`, "_blank", "noopener,noreferrer");
    window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(title)}`, "_blank", "noopener,noreferrer");
  }
}
