#!/bin/sh
# =============================================================================
# Purge test data — wipes all bookings, conversations and messages from the
# running jewel-finder Mongo container.
#
# Leaves users, jewelry, sets and uploaded images untouched, so you keep your
# accounts and catalogue while resetting the loan/chat state between tests.
#
# Run it on the host where Docker is running (e.g. the Unraid terminal):
#   sh scripts/purge-test-data.sh
# =============================================================================
set -e

docker exec jewel-mongo mongosh jewel-finder --quiet --eval '
  const b = db.bookings.deleteMany({}).deletedCount;
  const c = db.conversations.deleteMany({}).deletedCount;
  const m = db.messages.deleteMany({}).deletedCount;
  print(`Purged ${b} bookings, ${c} conversations, ${m} messages.`);
'
