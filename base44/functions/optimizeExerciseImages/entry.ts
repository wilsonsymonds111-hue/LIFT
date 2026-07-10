import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BATCH_SIZE = 15;
const TARGET_WIDTH = 400;
const JPEG_QUALITY = 80;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const allDetails = await base44.asServiceRole.entities.ExerciseDetail.list('name', 500);
    const toProcess = allDetails.filter(d => {
      if (!d.image_url) return false;
      if (d.image_url.endsWith('.jpg') || d.image_url.endsWith('.jpeg')) return false;
      return true;
    });

    const batch = toProcess.slice(0, BATCH_SIZE);
    const results = { processed: 0, failed: 0, remaining: toProcess.length - batch.length, total: toProcess.length, errors: [] };

    // Import pure-JS image libraries
    const upngMod = await import('npm:upng-js@2.1.0');
    const UPNG = upngMod.default || upngMod;
    const jpegMod = await import('npm:jpeg-js@0.4.4');
    const JPEG = jpegMod.default || jpegMod;

    for (const detail of batch) {
      try {
        const imgResp = await fetch(detail.image_url);
        if (!imgResp.ok) { results.errors.push(`${detail.name}: fetch ${imgResp.status}`); results.failed++; continue; }
        const arrayBuffer = await imgResp.arrayBuffer();

        // Decode PNG
        const img = UPNG.decode(arrayBuffer);
        const { width, height } = img;
        const rgba = UPNG.toRGBA8(img)[0]; // Uint8Array of RGBA pixels

        // Calculate resize dimensions (fit inside TARGET_WIDTH x TARGET_WIDTH)
        const scale = Math.min(TARGET_WIDTH / width, TARGET_WIDTH / height);
        const newW = Math.round(width * scale);
        const newH = Math.round(height * scale);

        // Bilinear resize
        const resized = new Uint8Array(newW * newH * 4);
        for (let y = 0; y < newH; y++) {
          for (let x = 0; x < newW; x++) {
            const srcX = x / scale;
            const srcY = y / scale;
            const x0 = Math.floor(srcX);
            const y0 = Math.floor(srcY);
            const x1 = Math.min(x0 + 1, width - 1);
            const y1 = Math.min(y0 + 1, height - 1);
            const fx = srcX - x0;
            const fy = srcY - y0;

            for (let c = 0; c < 4; c++) {
              const top = rgba[(y0 * width + x0) * 4 + c] * (1 - fx) + rgba[(y0 * width + x1) * 4 + c] * fx;
              const bot = rgba[(y1 * width + x0) * 4 + c] * (1 - fx) + rgba[(y1 * width + x1) * 4 + c] * fx;
              resized[(y * newW + x) * 4 + c] = Math.round(top * (1 - fy) + bot * fy);
            }
          }
        }

        // Encode to JPEG
        const rawImageData = { data: Buffer.from(resized), width: newW, height: newH };
        const jpegData = JPEG.encode(rawImageData, JPEG_QUALITY);

        const file = new File([jpegData.data], 'exercise.jpg', { type: 'image/jpeg' });
        const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        await base44.asServiceRole.entities.ExerciseDetail.update(detail.id, { image_url: file_url });
        results.processed++;
      } catch (e) {
        results.errors.push(`${detail.name}: ${e.message}`);
        results.failed++;
      }
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});