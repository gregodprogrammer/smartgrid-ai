-- Create the zones channel pattern for realtime updates
INSERT INTO realtime.channels (pattern, description, enabled)
VALUES ('zones', 'Zone status updates broadcast to public map', true)
ON CONFLICT (pattern) DO UPDATE SET enabled = true;

-- Trigger function: publish a zone_updated event after any zone row update
CREATE OR REPLACE FUNCTION notify_zone_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.publish(
    'zones',
    'zone_updated',
    jsonb_build_object(
      'id',                    NEW.id,
      'name',                  NEW.name,
      'state',                 NEW.state,
      'region',                NEW.region,
      'status',                NEW.status,
      'cause',                 NEW.cause,
      'severity',              NEW.severity,
      'affected_customers',    NEW.affected_customers,
      'estimated_restoration', NEW.estimated_restoration,
      'notes',                 NEW.notes,
      'updated_at',            NEW.updated_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS zone_realtime_trigger ON zones;

CREATE TRIGGER zone_realtime_trigger
  AFTER UPDATE ON zones
  FOR EACH ROW
  EXECUTE FUNCTION notify_zone_update();
