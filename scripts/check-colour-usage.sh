#!/bin/sh
# scripts/check-colour-usage.sh
#
# Read-only inspection: how are item colours used across the database, and is a
# particular colour id in use by anyone? Use this to decide the migration path
# when splitting/removing a colour (e.g. "goldYellow").
#
# Prints:
#   - total item count
#   - full colour distribution (every colour id + how many items use it)
#   - for the target colour: how many items, and which users (owners) own them
#
# READ-ONLY: deletes/changes nothing, so there is no --yes gate.
#
# Env (same as the other scripts):
#   MONGO_URI        default mongodb://localhost:27017/jewel-finder
#   MONGO_CONTAINER  if set, runs mongosh inside this Docker container
#
# Usage:
#   sh scripts/check-colour-usage.sh                                   # target = goldYellow
#   sh scripts/check-colour-usage.sh pink                              # target = pink
#   MONGO_CONTAINER=jewel-mongo sh scripts/check-colour-usage.sh       # Unraid

set -eu

MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/jewel-finder}"
TARGET_COLOUR="goldYellow"

for arg in "$@"; do
  case "$arg" in
    -h|--help)
      echo "Usage: [MONGO_URI=...] [MONGO_CONTAINER=...] sh $0 [colourId]"
      echo "  colourId   colour to focus on (default: goldYellow)"
      exit 0 ;;
    -*) echo "Unknown option: $arg (try --help)" >&2; exit 1 ;;
    *) TARGET_COLOUR="$arg" ;;
  esac
done

JS=$(cat <<EOF
const target = "${TARGET_COLOUR}";
print("");
print("Database: " + db.getName());

// The jewelry collection name varies by pluralization ("jewelries" /
// "jewelryitems") — discover it the same way clean-regression.sh does.
const jcol = db.getCollectionNames().find((n) => /^jewel/i.test(n)) || "jewelries";
const J = db[jcol];
print("Collection: " + jcol);

const total = J.countDocuments();
print("Total items: " + total);
print("");

print("Colour usage across all items:");
J.aggregate([
  { \$group: { _id: { \$ifNull: ["\$colour", "(none)"] }, count: { \$sum: 1 } } },
  { \$sort: { count: -1 } },
]).forEach((r) => print("  " + r._id + ": " + r.count));
print("");

// .toArray() first, then .map() on the plain array (cursor.map() is unreliable).
const hits = J.find({ colour: target }).toArray();
print("Items with colour '" + target + "': " + hits.length);

if (hits.length === 0) {
  print("");
  print("No items use '" + target + "' — safe to remove it cleanly (migration option a).");
} else {
  const ownerIds = hits.map((i) => i.owner);
  const distinct = [...new Set(ownerIds.map((id) => String(id)))];
  print("Distinct owners affected: " + distinct.length);
  const owners = db.users
    .find({ _id: { \$in: ownerIds } }, { email: 1, name: 1 })
    .toArray();
  owners.forEach((u) => print("  - " + (u.email || u.name || u._id)));
  print("");
  print("Removing '" + target + "' without a remap would drop the colour chip on these items.");
}
EOF
)

echo "Target: ${MONGO_URI}${MONGO_CONTAINER:+  (via container: ${MONGO_CONTAINER})}"

if [ -n "${MONGO_CONTAINER:-}" ]; then
  printf '%s' "$JS" | docker exec -i "$MONGO_CONTAINER" mongosh "$MONGO_URI" --quiet
else
  printf '%s' "$JS" | mongosh "$MONGO_URI" --quiet
fi
