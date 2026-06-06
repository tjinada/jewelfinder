#!/bin/sh
# scripts/clean-regression.sh
#
# Remove everything created by scripts/api-regression.mjs. That script uses
# throwaway accounts with emails like "regress+owner.<timestamp>@example.com";
# this finds every "regress+..." user and deletes them plus all their data
# (bookings, conversations + messages, jewelry, owned closets, memberships).
#
# The regression script already best-effort deletes the closet/items it makes,
# so usually only the users + their booking/conversation/messages remain — this
# mops up whatever is left, idempotently.
#
# SAFE BY DEFAULT: dry run unless you pass --yes.
#
# Env (same as the other scripts):
#   MONGO_URI        default mongodb://localhost:27017/jewel-finder
#   MONGO_CONTAINER  if set, runs mongosh inside this Docker container
#
# Usage:
#   sh scripts/clean-regression.sh                                  # dry run
#   MONGO_CONTAINER=jewel-mongo sh scripts/clean-regression.sh --yes

set -eu

MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/jewel-finder}"
CONFIRM=false

for arg in "$@"; do
  case "$arg" in
    --yes) CONFIRM=true ;;
    -h|--help)
      echo "Usage: [MONGO_URI=...] [MONGO_CONTAINER=...] sh $0 [--yes]"
      echo "  (no --yes)  dry run: report what would be removed"
      echo "  --yes       delete all regress+ test users and their data"
      exit 0 ;;
    *) echo "Unknown option: $arg (try --help)" >&2; exit 1 ;;
  esac
done

JS=$(cat <<EOF
const confirm = ${CONFIRM};
const rx = /^regress\+/;
print("");
print("Database: " + db.getName());

const users = db.users.find({ email: rx }).toArray();
const ids = users.map((u) => u._id);
print("Regression test users found: " + users.length);
users.forEach((u) => print("  - " + u.email));

if (ids.length === 0) {
  print("\nNothing to clean.");
} else {
  // Jewelry collection name can be "jewelry" or "jewelries" depending on
  // pluralization — discover it so this works either way.
  const jcol = db.getCollectionNames().find((n) => /^jewel/i.test(n)) || "jewelries";
  const convs = db.conversations.find({ participants: { \$in: ids } }).map((c) => c._id);
  const bookingFilter = { \$or: [{ owner: { \$in: ids } }, { requester: { \$in: ids } }] };

  if (!confirm) {
    print("");
    print("Would delete:");
    print("  bookings:      " + db.bookings.countDocuments(bookingFilter));
    print("  conversations: " + convs.length);
    print("  messages:      " + db.messages.countDocuments({ conversation: { \$in: convs } }));
    print("  " + jcol + ":   " + db[jcol].countDocuments({ owner: { \$in: ids } }));
    print("  closets owned: " + db.groups.countDocuments({ owner: { \$in: ids } }));
    print("  users:         " + ids.length);
    print("");
    print("DRY RUN - nothing deleted. Re-run with --yes to remove.");
  } else {
    print("\nRemoving...");
    print("  bookings:      " + db.bookings.deleteMany(bookingFilter).deletedCount);
    print("  messages:      " + db.messages.deleteMany({ conversation: { \$in: convs } }).deletedCount);
    print("  conversations: " + db.conversations.deleteMany({ _id: { \$in: convs } }).deletedCount);
    print("  " + jcol + ":   " + db[jcol].deleteMany({ owner: { \$in: ids } }).deletedCount);
    print("  closets owned: " + db.groups.deleteMany({ owner: { \$in: ids } }).deletedCount);
    db.groups.updateMany({ members: { \$in: ids } }, { \$pull: { members: { \$in: ids } } });
    print("  users:         " + db.users.deleteMany({ _id: { \$in: ids } }).deletedCount);
    print("\nDone - regression data cleared.");
  }
}
EOF
)

echo "Target: ${MONGO_URI}${MONGO_CONTAINER:+  (via container: ${MONGO_CONTAINER})}"

if [ -n "${MONGO_CONTAINER:-}" ]; then
  printf '%s' "$JS" | docker exec -i "$MONGO_CONTAINER" mongosh "$MONGO_URI" --quiet
else
  printf '%s' "$JS" | mongosh "$MONGO_URI" --quiet
fi
