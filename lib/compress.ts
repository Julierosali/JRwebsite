/**
 * Compresse une image en WebP avec une taille max en octets.
 * Utilise le Canvas API côté client.
 */
export async function compressImageToWebp(
  file: File,
  maxBytes: number
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const origW = bitmap.width;
  const origH = bitmap.height;
  const maxDimension =
    maxBytes <= 10 * 1024 ? 400
    : maxBytes <= 200 * 1024 ? 2000
    : maxBytes <= 500 * 1024 ? 2400
    : 2800;
  let w = origW;
  let h = origH;
  if (w > maxDimension || h > maxDimension) {
    if (w > h) {
      h = Math.round((h * maxDimension) / w);
      w = maxDimension;
    } else {
      w = Math.round((w * maxDimension) / h);
      h = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2d non disponible');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let quality = 0.92;
  let blob: Blob | null = null;

  const tryBlob = (): Promise<Blob> =>
    new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob a échoué'))),
        'image/webp',
        quality
      );
    });

  while (quality >= 0.1) {
    blob = await tryBlob();
    if (blob.size <= maxBytes) return blob;
    quality = Math.max(0.1, quality - 0.12);
  }

  // Toujours trop gros : on réduit la taille du canvas et on réessaie
  if (blob && blob.size > maxBytes && (w > 400 || h > 400)) {
    const scale = Math.sqrt(maxBytes / blob.size);
    const newW = Math.max(400, Math.round(w * scale));
    const newH = Math.max(400, Math.round(h * scale));
    const canvas2 = document.createElement('canvas');
    canvas2.width = newW;
    canvas2.height = newH;
    const ctx2 = canvas2.getContext('2d');
    if (!ctx2) return blob;
    ctx2.drawImage(canvas, 0, 0, w, h, 0, 0, newW, newH);
    const blob2 = await new Promise<Blob | null>((resolve) => {
      canvas2.toBlob((b) => resolve(b), 'image/webp', 0.85);
    });
    if (blob2 && blob2.size <= maxBytes) return blob2;
  }

  return blob!;
}
