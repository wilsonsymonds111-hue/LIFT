import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import JSZip from 'npm:jszip@3.10.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { zip_url } = body;
    if (!zip_url) return Response.json({ error: 'Missing zip_url' }, { status: 400 });

    // 1. Download the zip
    const zipRes = await fetch(zip_url);
    if (!zipRes.ok) return Response.json({ error: 'Failed to download zip' }, { status: 502 });
    const zipBuf = new Uint8Array(await zipRes.arrayBuffer());

    // 2. Extract all PNG images
    const zip = await JSZip.loadAsync(zipBuf);
    const imageFiles: { name: string; data: Uint8Array }[] = [];
    for (const fileName of Object.keys(zip.files)) {
      const lower = fileName.toLowerCase();
      if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
        const data = await zip.files[fileName].async('uint8array');
        imageFiles.push({ name: fileName, data });
      }
    }

    if (imageFiles.length === 0) {
      return Response.json({ error: 'No images found in zip' }, { status: 400 });
    }

    // 3. Upload each image to Base44 storage
    const uploadedUrls: string[] = [];
    for (const img of imageFiles) {
      const blob = new Blob([img.data], { type: 'image/png' });
      const file = new File([blob], img.name, { type: 'image/png' });
      const result = await base44.asServiceRole.integrations.Core.UploadFile({ file });
      if (result?.file_url) uploadedUrls.push(result.file_url);
    }

    if (uploadedUrls.length === 0) {
      return Response.json({ error: 'Failed to upload images' }, { status: 500 });
    }

    // 4. Use InvokeLLM with vision to extract all weight entries from all images at once
    const prompt = `You are looking at screenshots from the Apple Health app showing body weight history data. 
Each entry has a date and a weight value in kg.
Extract ALL weight entries visible in these screenshots.
Return a JSON object with an "entries" array, where each entry has:
- "date": in YYYY-MM-DD format (convert from whatever format is shown, e.g. "15 Mar 2025" → "2025-03-15", "Mar 15" → "2025-03-15" if year not shown assume 2025)
- "weight": the weight value as a number in kg (round to 1 decimal place)

Look carefully at every row in every screenshot. Do not skip any entries. If the same date appears in multiple screenshots, include it once with the weight shown.
If a weight is shown in lbs, convert to kg by dividing by 2.20462.

Return ONLY the JSON object, no other text.`;

    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: uploadedUrls,
      response_json_schema: {
        type: 'object',
        properties: {
          entries: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string' },
                weight: { type: 'number' },
              },
              required: ['date', 'weight'],
            },
          },
        },
        required: ['entries'],
      },
    });

    const entries = llmResult?.entries || [];

    if (entries.length === 0) {
      return Response.json({
        error: 'No weight entries could be extracted from the images',
        imagesProcessed: uploadedUrls.length,
        llmRaw: JSON.stringify(llmResult).slice(0, 500),
      });
    }

    // 5. Deduplicate by date
    const byDate: { [date: string]: number } = {};
    for (const e of entries) {
      if (e.date && e.weight && e.weight > 0 && e.weight < 500) {
        byDate[e.date] = Math.round(e.weight * 10) / 10;
      }
    }

    // 6. Check against existing entries
    const existing = await base44.asServiceRole.entities.BodyWeight.list('-date', 1000);
    const existingDates = new Set((existing || []).map((e: any) => e.date));
    const toCreate = Object.entries(byDate)
      .filter(([d]) => !existingDates.has(d))
      .map(([d, w]) => ({ date: d, weight: w }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 7. Bulk create
    let created = 0;
    if (toCreate.length > 0) {
      for (let i = 0; i < toCreate.length; i += 500) {
        const batch = toCreate.slice(i, i + 500);
        await base44.asServiceRole.entities.BodyWeight.bulkCreate(batch);
        created += batch.length;
      }
    }

    return Response.json({
      success: true,
      imagesProcessed: uploadedUrls.length,
      totalEntriesExtracted: entries.length,
      uniqueDates: Object.keys(byDate).length,
      existingDates: existingDates.size,
      newEntriesCreated: created,
      skippedDuplicates: Object.keys(byDate).length - created,
      dateRange: toCreate.length > 0 ? `${toCreate[0].date} to ${toCreate[toCreate.length - 1].date}` : 'N/A',
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});