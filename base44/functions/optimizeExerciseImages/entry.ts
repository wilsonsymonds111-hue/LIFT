import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BATCH_SIZE = 5;
const TARGET_WIDTH = 400;
const JPEG_QUALITY = 80;

const IMAGE_PROMPT = (name, muscles) => `Two side-by-side anatomical figures showing the "${name}" exercise: the left figure shows the starting position, the right figure shows the finishing position. Both figures are identical in size, proportions, camera angle, body composition, and anatomical detail. Clean solid white background (not transparent). Grayscale anatomical style with visible musculature, no skin texture, like a fitness anatomy reference diagram. ONLY the following muscles must be highlighted in red: ${muscles}. No other muscles should be red. No text, labels, arrows, numbers, logos, watermarks, or annotations. Exercise equipment accurately represented for each phase. Professional museum-quality medical illustration style.`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let body = {};
    try { body = await req.json(); } catch {}
    const skip = body.skip || 0;

    const allDetails = await base44.asServiceRole.entities.ExerciseDetail.list('name', 500);
    const batch = allDetails.slice(skip, skip + BATCH_SIZE);
    const results = { processed: 0, failed: 0, remaining: Math.max(0, allDetails.length - skip - batch.length), total: allDetails.length, skip, errors: [] };

    // Import pure-JS image libraries
    const upngMod = await import('npm:upng-js@2.1.0');
    const UPNG = upngMod.default || upngMod;
    const jpegMod = await import('npm:jpeg-js@0.4.4');
    const JPEG = jpegMod.default || jpegMod;

    for (const detail of batch) {
      try {
        // Regenerate image from scratch using AI
        const muscles = detail.muscles_worked || 'various muscle groups';
        const imgRes = await base44.asServiceRole.integrations.Core.GenerateImage({
          prompt: IMAGE_PROMPT(detail.name, muscles)
        });
        const generatedUrl = imgRes?.url;
        if (!generatedUrl) { results.errors.push(`${detail.name}: no image URL from AI`); results.failed++; continue; }

        // Fetch the generated image
        const imgResp = await fetch(generatedUrl);
        if (!imgResp.ok) { results.errors.push(`${detail.name}: fetch ${imgResp.status}`); results.failed++; continue; }
        const arrayBuffer = await imgResp.arrayBuffer();
        const headerBytes = new Uint8Array(arrayBuffer.slice(0, 4));
        const isJpeg = headerBytes[0] === 0xff && headerBytes[1] === 0xd8;
        const isPng = headerBytes[0] === 0x89 && headerBytes[1] === 0x50;

        let width, height, rgba;
        if (isPng) {
          const img = UPNG.decode(arrayBuffer);
          width = img.width; height = img.height;
          rgba = UPNG.toRGBA8(img)[0];
        } else if (isJpeg) {
          const img = JPEG.decode(arrayBuffer);
          width = img.width; height = img.height;
          rgba = img.data;
        } else {
          results.errors.push(`${detail.name}: unknown image format`);
          results.failed++;
          continue;
        }

        // Calculate resize dimensions (fit inside TARGET_WIDTH x TARGET_WIDTH)
        const scale = Math.min(TARGET_WIDTH / width, TARGET_WIDTH / height);
        const newW = Math.round(width * scale);
        const newH = Math.round(height * scale);

        // Bilinear resize with proper alpha compositing onto white background
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

            // Bilinear sample alpha channel
            const a00 = rgba[(y0 * width + x0) * 4 + 3];
            const a01 = rgba[(y0 * width + x1) * 4 + 3];
            const a10 = rgba[(y1 * width + x0) * 4 + 3];
            const a11 = rgba[(y1 * width + x1) * 4 + 3];
            const alphaTop = a00 * (1 - fx) + a01 * fx;
            const alphaBot = a10 * (1 - fx) + a11 * fx;
            const alpha = (alphaTop * (1 - fy) + alphaBot * fy) / 255;

            // Alpha-composite RGB onto white: output = src * alpha + white * (1 - alpha)
            for (let c = 0; c < 3; c++) {
              const top = rgba[(y0 * width + x0) * 4 + c] * (1 - fx) + rgba[(y0 * width + x1) * 4 + c] * fx;
              const bot = rgba[(y1 * width + x0) * 4 + c] * (1 - fx) + rgba[(y1 * width + x1) * 4 + c] * fx;
              const srcVal = top * (1 - fy) + bot * fy;
              resized[(y * newW + x) * 4 + c] = Math.round(srcVal * alpha + 255 * (1 - alpha));
            }
            resized[(y * newW + x) * 4 + 3] = 255; // opaque
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
        results.errors.push(`${detail.name}: ${e.message || e.toString() || JSON.stringify(e)}`);
        results.failed++;
      }
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});