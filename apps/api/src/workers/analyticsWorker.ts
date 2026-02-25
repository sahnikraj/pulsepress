import { Worker } from "bullmq";
import { redis } from "../db/redis";
import { db } from "../db/pool";

export const analyticsWorker = new Worker(
  "analytics-nightly",
  async () => {
    await db.query(`
      INSERT INTO analytics_cache (id, website_id, metric_key, metric_value, calculated_at)
      SELECT
        gen_random_uuid(),
        ce.website_id,
        'ctr_by_hour',
        jsonb_object_agg(hour_label, ctr_value),
        now()
      FROM (
        SELECT
          website_id,
          to_char(event_timestamp, 'HH24') AS hour_label,
          COALESCE(
            SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END)::numeric /
            NULLIF(SUM(CASE WHEN event_type = 'shown' THEN 1 ELSE 0 END), 0),
            0
          ) AS ctr_value
        FROM campaign_events
        WHERE event_timestamp > now() - interval '30 days'
        GROUP BY website_id, to_char(event_timestamp, 'HH24')
      ) ce
      GROUP BY ce.website_id
    `);

    await db.query(`
      UPDATE subscribers
      SET presence_class = CASE
        WHEN last_site_visit > now() - interval '7 days' THEN 'active'
        WHEN last_site_visit > now() - interval '30 days' THEN 'warm'
        ELSE 'cold'
      END
    `);
  },
  { connection: redis }
);
