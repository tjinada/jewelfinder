#!/bin/sh
# =============================================================================
# Backfill item visibility — one-time migration for the groups/visibility feature.
#
# Every existing jewelry item predates the `visibility` field. Without this, the
# new schema default ('private') would hide them. This sets every item that has
# no `visibility` yet to 'public', preserving the original shared-pool behaviour
# (all signed-in users keep seeing existing items). New items created from now on
# default to 'private' via the schema — this script does NOT touch those.
#
# Safe to run more than once: it only matches items missing the field.
#
# Run it on the host where Docker is running (e.g. the Unraid terminal):
#   sh scripts/backfill-visibility.sh
# =============================================================================
set -e

docker exec jewel-mongo mongosh jewel-finder --quiet --eval '
  const r = db.jewelryitems.updateMany(
    { visibility: { $exists: false } },
    { $set: { visibility: "public", sharedGroups: [] } },
  );
  print(`Backfilled ${r.modifiedCount} item(s) to public.`);
'
