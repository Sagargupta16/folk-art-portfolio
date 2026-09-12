-- Run while catalog writes are paused, alongside the matching pg_dump.
-- psql -X -A -t -f scripts/export-image-references.sql --output image-keys.json
-- Only storage key-bases are exported here; lead and maintainer data stay in the dump.
SELECT coalesce(jsonb_agg(key_base ORDER BY key_base), '[]'::jsonb)
FROM (
    SELECT 'artworks/' || regexp_replace(
        regexp_replace(image, '^.*/', ''), '\.[^.]+$', ''
    ) AS key_base
    FROM public.artworks
    UNION
    SELECT jsonb_array_elements_text(images) FROM public.events
    UNION
    SELECT value #>> '{}'
    FROM public.settings
    WHERE key = 'profileImage' AND jsonb_typeof(value) = 'string'
) AS image_references;
