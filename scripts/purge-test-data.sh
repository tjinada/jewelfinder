#!/bin/sh
# scripts/purge-test-data.sh
#
# Purge The Clasp content (jewelry, sets, closets, bookings, conversations,
# messages) to a clean state. User accounts are KEPT unless you pass --wipe-users.
#
# Works without node_modules — it talks to MongoDB via `mongosh`, either locally
# or inside a Docker container (e.g. on Unraid, where Mongo runs as a container).
#
# SAFE BY DEFAULT: with no flags it's a DRY RUN that only lists collections and
# their counts and deletes nothing. Add --yes to actually purge.
#
# Environment variables:
#   MONGO_URI        Mongo connection string, including the db name
#                    (default: mongodb://localhost:27017/jewel-finder)
#   MONGO_CONTAINER  if set, runs mongosh inside this Docker container
#   MEDIA_DIR        folder holding uploaded *.webp photos (only used by --images)
#
# Usage:
#   sh scripts/purge-test-data.sh                                  # dry run
#   sh scripts/purge-test-data.sh --yes                            # purge content, keep users
#   sh scripts/purge-test-data.sh --yes --images                   # also delete photo files
#   MONGO_CONTAINER=mongo sh scripts/purge-test-data.sh --yes      # Unraid: exec into mongo container
#   MONGO_URI="mongodb://u:p@localhost:27017/jewel-finder?authSource=admin" \
#     MONGO_CONTAINER=mongo sh scripts/purge-test-data.sh --yes

set -eu

MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/jewel-finder}"
CONFIRM=false
KEEP_USERS=true
WIPE_IMAGES=false

for arg in "$@"; do
  case "$arg" in
    --yes) CONFIRM=true ;;
    --wipe-users) KEEP_USERS=false ;;
    --images) WIPE_IMAGES=true ;;
    -h|--help)
      echo "Usage: [MONGO_URI=...] [MONGO_CONTAINER=...] [MEDIA_DIR=...] sh $0 [--yes] [--wipe-users] [--images]"
      echo "  (no flags)     dry run: list collections + counts, delete nothing"
      echo "  --yes          purge content (keeps user accounts)"
      echo "  --wipe-users   also delete all user accounts"
      echo "  --images       also delete uploaded *.webp photos (needs MEDIA_DIR)"
      exit 0 ;;
    *) echo "Unknown option: $arg (try --help)" >&2; exit 1 ;;
  esac
done

# JavaScript run inside mongosh. Booleans are injected from the shell flags.
JS=$(cat <<EOF
const keepUsers = ${KEEP_USERS};
const confirm = ${CONFIRM};
print("");
print("Database: " + db.getName());
print("Collections:");
db.getCollectionNames().forEach(function (c) {
  print("  " + c + ": " + db.getCollection(c).countDocuments());
});
if (!confirm) {
  print("");
  print("DRY RUN - nothing deleted. Re-run with --yes to purge.");
} else {
  print("");
  print("Purging...");
  db.getCollectionNames().forEach(function (c) {
    if (c.indexOf("system.") === 0) return;
    if (keepUsers && c === "users") { print("  kept    users"); return; }
    var n = db.getCollection(c).deleteMany({}).deletedCount;
    print("  cleared " + c + ": " + n);
  });
  print("");
  print("Done - content cleared" + (keepUsers ? " (users kept)." : "."));
}
EOF
)

echo "Target: ${MONGO_URI}${MONGO_CONTAINER:+  (via container: ${MONGO_CONTAINER})}"

if [ -n "${MONGO_CONTAINER:-}" ]; then
  printf '%s' "$JS" | docker exec -i "$MONGO_CONTAINER" mongosh "$MONGO_URI" --quiet
else
  printf '%s' "$JS" | mongosh "$MONGO_URI" --quiet
fi

# Optional: clear orphaned uploaded photos from disk (only on a real run).
if [ "$WIPE_IMAGES" = true ] && [ "$CONFIRM" = true ]; then
  if [ -z "${MEDIA_DIR:-}" ]; then
    echo "MEDIA_DIR not set - skipped photo cleanup. Set MEDIA_DIR to the folder containing the .webp files."
  elif [ ! -d "$MEDIA_DIR" ]; then
    echo "MEDIA_DIR '$MEDIA_DIR' not found - skipped photo cleanup."
  else
    count=$(find "$MEDIA_DIR" -type f -name '*.webp' 2>/dev/null | wc -l | tr -d ' ')
    find "$MEDIA_DIR" -type f -name '*.webp' -delete 2>/dev/null || true
    echo "Deleted ${count} photo files from ${MEDIA_DIR}"
  fi
fi
