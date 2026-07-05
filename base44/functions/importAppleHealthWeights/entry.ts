import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // All entries transcribed from Apple Health screenshots (Mar 2025 – Jun 2026)
    const entries = [
      { date: '2025-03-19', weight: 74.0 },
      { date: '2025-03-22', weight: 74.4 },
      { date: '2025-03-23', weight: 74.9 },
      { date: '2025-03-24', weight: 75.6 },
      { date: '2025-03-25', weight: 76.2 },
      { date: '2025-03-26', weight: 75.8 },
      { date: '2025-03-28', weight: 75.5 },
      { date: '2025-03-30', weight: 75.7 },
      { date: '2025-03-31', weight: 74.6 },
      { date: '2025-04-01', weight: 75.6 },
      { date: '2025-04-02', weight: 75.0 },
      { date: '2025-04-03', weight: 76.3 },
      { date: '2025-04-09', weight: 76.5 },
      { date: '2025-04-16', weight: 77.1 },
      { date: '2025-04-23', weight: 76.3 },
      { date: '2025-04-30', weight: 77.8 },
      { date: '2025-05-07', weight: 77.5 },
      { date: '2025-05-13', weight: 78.2 },
      { date: '2025-05-19', weight: 77.8 },
      { date: '2025-05-28', weight: 78.3 },
      { date: '2025-06-04', weight: 78.4 },
      { date: '2025-06-11', weight: 78.8 },
      { date: '2025-06-19', weight: 77.5 },
      { date: '2025-06-24', weight: 77.1 },
      { date: '2025-07-02', weight: 78.3 },
      { date: '2025-07-09', weight: 77.8 },
      { date: '2025-07-18', weight: 78.6 },
      { date: '2025-07-23', weight: 79.9 },
      { date: '2025-07-30', weight: 80.0 },
      { date: '2025-08-06', weight: 79.4 },
      { date: '2025-08-12', weight: 79.5 },
      { date: '2025-08-17', weight: 79.7 },
      { date: '2025-08-21', weight: 80.0 },
      { date: '2025-09-02', weight: 76.9 },
      { date: '2025-09-06', weight: 73.4 },
      { date: '2025-09-12', weight: 76.2 },
      { date: '2025-09-17', weight: 77.0 },
      { date: '2025-09-18', weight: 75.4 },
      { date: '2025-09-18', weight: 78.4 },
      { date: '2025-09-23', weight: 78.5 },
      { date: '2025-09-24', weight: 77.8 },
      { date: '2025-09-28', weight: 77.8 },
      { date: '2025-10-01', weight: 79.5 },
      { date: '2025-10-08', weight: 81.1 },
      { date: '2025-10-15', weight: 82.0 },
      { date: '2025-10-21', weight: 81.8 },
      { date: '2025-10-29', weight: 82.1 },
      { date: '2025-11-05', weight: 81.5 },
      { date: '2025-11-12', weight: 81.9 },
      { date: '2025-11-19', weight: 80.9 },
      { date: '2025-11-26', weight: 80.4 },
      { date: '2025-12-03', weight: 80.7 },
      { date: '2025-12-10', weight: 80.3 },
      { date: '2025-12-17', weight: 78.9 },
      { date: '2025-12-25', weight: 78.1 },
      { date: '2025-12-31', weight: 78.2 },
      { date: '2025-12-31', weight: 77.8 },
      { date: '2026-01-07', weight: 77.4 },
      { date: '2026-01-15', weight: 76.1 },
      { date: '2026-01-23', weight: 76.1 },
      { date: '2026-01-28', weight: 75.5 },
      { date: '2026-02-04', weight: 75.9 },
      { date: '2026-02-11', weight: 74.2 },
      { date: '2026-02-18', weight: 73.9 },
      { date: '2026-02-25', weight: 73.2 },
      { date: '2026-03-04', weight: 74.1 },
      { date: '2026-03-12', weight: 73.6 },
      { date: '2026-03-18', weight: 74.2 },
      { date: '2026-03-25', weight: 73.6 },
      { date: '2026-04-01', weight: 73.4 },
      { date: '2026-04-08', weight: 71.9 },
      { date: '2026-04-12', weight: 70.0 },
      { date: '2026-04-17', weight: 69.3 },
      { date: '2026-04-18', weight: 68.4 },
      { date: '2026-04-22', weight: 68.4 },
      { date: '2026-04-28', weight: 68.6 },
      { date: '2026-05-06', weight: 69.0 },
      { date: '2026-05-13', weight: 68.5 },
      { date: '2026-05-26', weight: 67.0 },
      { date: '2026-05-27', weight: 66.3 },
      { date: '2026-06-03', weight: 68.0 },
      { date: '2026-06-11', weight: 69.0 },
      { date: '2026-06-18', weight: 68.3 },
      { date: '2026-06-30', weight: 68.8 },
    ];

    // Fetch existing entries to skip duplicates
    const existing = await base44.entities.BodyWeight.list('date', 500);
    const seen = new Set(existing.map(e => `${e.date}|${e.weight}`));
    const toCreate = entries.filter(e => !seen.has(`${e.date}|${e.weight}`));

    if (toCreate.length > 0) {
      await base44.entities.BodyWeight.bulkCreate(toCreate);
    }

    return Response.json({
      imported: toCreate.length,
      skipped: entries.length - toCreate.length,
      total: entries.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});