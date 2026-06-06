#!/bin/sh
# scripts/remove-user.sh
#
# Remove a single user account by email so the email can be reused (e.g. to
# re-run the closet invite/join test). Also:
#   - detaches the user from every closet they're a member of
#   - deletes closets they OWN (and prunes those closets from items' sharedGroups)
#   - deletes jewelry they own
#
# Bookings/conversations/messages are NOT touched here — use
# scripts/purge-test-data.sh for a broader content wipe.
#
# SAFE BY DEFAULT: with no --yes it's a DRY RUN that only reports and deletes
# nothing. Add --yes to actually remove.
#
# Environment variables (same as purge-test-data.sh):
#   MONGO_URI        Mongo connection string incl. db name
#                    (default: mongodb://localhost:27017/jewel-finder)
#   MONGO_CONTAINER  if set, runs mongosh inside this Docker container
#
# Usage:
#   sh scripts/remove-user.sh you@example.com                          # dry run
#   sh scripts/remove-user.sh you@example.com --yes                    # remove
#   MONGO_CONTAINER=jewel-mongo sh scripts/remove-user.sh you@x.com --yes
#   MONGO_URI="mongodb://u:p@localhost:27017/jewel-finder?authSource=admin" \
#     MONGO_CONTAINER=jewel-mongo sh scripts/remove-user.sh you@x.com --yes

set -eu

MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/jewel-finder}"
CONFIRM=false
EMAIL="${EMAIL:-}"

for arg in "$@"; do
  case "$arg" in
    --yes) CONFIRM=true ;;
    --email=*) EMAIL="${arg#--email=}" ;;
    -h|--help)
      echo "Usage: [MONGO_URI=...] [MONGO_CONTAINER=...] sh $0 <email> [--yes]"
      echo "  (no --yes)   dry run: report what would be removed, delete nothing"
      echo "  --yes        remove the user, detach from closets, delete owned closets/items"
      exit 0 ;;
    -*) echo "Unknown option: $arg (try --help)" >&2; exit 1 ;;
    *) EMAIL="$arg" ;;
  esac
done

if [ -z "$EMAIL" ]; then
  echo "Provide an email: sh $0 <email> [--yes]" >&2
  exit 1
fi

# JavaScript run inside mongosh. $EMAIL/$CONFIRM are injected from the shell;
# Mongo operators ($pull/$in) are escaped so the shell leaves them alone.
JS=$(cat <<EOF
const email = "${EMAIL}".toLowerCase().trim();
const confirm = ${CONFIRM};
print("");
print("Database: " + db.getName());
const user = db.users.findOne({ email: email });
if (!user) {
  print("No user found with email: " + email);
} else {
  const uid = user._id;
  const ownedGroups = db.groups.find({ owner: uid }).toArray();
  const ownedIds = ownedGroups.map(function (g) { return g._id; });
  const memberGroups = db.groups.countDocuments({ members: uid });
  const ownedItems = db.jewelry.countDocuments({ owner: uid });

  print("User:         " + email + "  (" + uid + ")");
  print("Display name: " + (user.displayName || ""));
  print("Member of:    " + memberGroups + " closet(s)");
  print("Owns:         " + ownedGroups.length + " closet(s), " + ownedItems + " item(s)");

  if (!confirm) {
    print("");
    print("DRY RUN - nothing deleted. Re-run with --yes to remove.");
  } else {
    print("");
    print("Removing...");
    const pulled = db.groups.updateMany({ members: uid }, { \$pull: { members: uid } }).modifiedCount;
    print("  detached from " + pulled + " closet(s)");
    if (ownedIds.length) {
      db.jewelry.updateMany(
        { sharedGroups: { \$in: ownedIds } },
        { \$pull: { sharedGroups: { \$in: ownedIds } } },
      );
      const delGroups = db.groups.deleteMany({ _id: { \$in: ownedIds } }).deletedCount;
      print("  deleted " + delGroups + " owned closet(s)");
    }
    const delItems = db.jewelry.deleteMany({ owner: uid }).deletedCount;
    print("  deleted " + delItems + " item(s)");
    db.users.deleteOne({ _id: uid });
    print("  deleted user account");
    print("");
    print("Done - " + email + " removed. The email is free to register again.");
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
