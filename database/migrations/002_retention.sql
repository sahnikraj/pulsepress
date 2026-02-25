-- Raw campaign events retention: 30 days
DELETE FROM campaign_events
WHERE event_timestamp < now() - interval '30 days';
