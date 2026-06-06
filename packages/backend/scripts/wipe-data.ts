/**
 * Wipe app content to a clean state before opening it up to real users.
 *
 * SAFE BY DEFAULT: running with no flags is a DRY RUN — it only prints what's in
 * the database and deletes nothing. Add --yes to actually wipe.
 *
 * "Content" = jewelry items, sets, closets (groups), bookings/loan requests,
 * and conversations + messages. User accounts are KEPT unless you pass --users.
 *
 * Run it in the SAME environment as your server (same .env / MONGO_URI / MEDIA_DIR)
 * so it targets the right database and photo folder.
 *
 * Usage (from the repo root):
 *   pnpm --filter @jewel/backend wipe                      # dry run: just show counts
 *   pnpm --filter @jewel/backend wipe --yes                # wipe content, keep all users
 *   pnpm --filter @jewel/backend wipe --yes --images       # also delete uploaded photo files
 *   pnpm --filter @jewel/backend wipe --yes --users --keep=me@example.com
 *                                                          # also delete accounts, except the kept ones
 *   pnpm --filter @jewel/backend wipe --yes --force-prod   # required if NODE_ENV=production
 */
import '../src/env.js'; // loads the root .env in development
import path from 'path';
import { promises as fs } from 'fs';
import mongoose from 'mongoose';
import { config } from '../src/config/index.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { Jewelry } from '../src/modules/jewelry/jewelry.model.js';
import { JewelrySet } from '../src/modules/sets/set.model.js';
import { Group } from '../src/modules/groups/group.model.js';
import { Booking } from '../src/modules/bookings/booking.model.js';
import { Conversation, Message } from '../src/modules/conversations/conversation.model.js';
import { User } from '../src/modules/users/user.model.js';

const args = process.argv.slice(2);
const has = (flag: string) => args.includes(flag);

const CONFIRM = has('--yes');
const WIPE_USERS = has('--users');
const WIPE_IMAGES = has('--images');
const FORCE_PROD = has('--force-prod');
const KEEP_EMAILS = (args.find((a) => a.startsWith('--keep='))?.split('=')[1] ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

/** Delete every *.webp in a directory (safe no-op if it doesn't exist). */
async function clearWebpDir(dir: string): Promise<number> {
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch {
    return 0;
  }
  let removed = 0;
  for (const name of names) {
    if (!name.endsWith('.webp')) continue;
    try {
      await fs.unlink(path.join(dir, name));
      removed += 1;
    } catch {
      /* ignore individual failures */
    }
  }
  return removed;
}

async function main(): Promise<void> {
  await connectDatabase();
  const dbName = mongoose.connection.name;

  const [items, sets, groups, bookings, convos, msgs, users] = await Promise.all([
    Jewelry.countDocuments(),
    JewelrySet.countDocuments(),
    Group.countDocuments(),
    Booking.countDocuments(),
    Conversation.countDocuments(),
    Message.countDocuments(),
    User.countDocuments(),
  ]);

  console.log(`\nDatabase: ${dbName}   (NODE_ENV=${config.nodeEnv})`);
  console.log('Current data:');
  console.log(`  jewelry items : ${items}`);
  console.log(`  sets          : ${sets}`);
  console.log(`  closets       : ${groups}`);
  console.log(`  bookings      : ${bookings}`);
  console.log(`  conversations : ${convos}`);
  console.log(`  messages      : ${msgs}`);
  console.log(`  users         : ${users}`);

  if (!CONFIRM) {
    console.log('\nDRY RUN — nothing was deleted.');
    console.log('Re-run with --yes to wipe content. Optional flags:');
    console.log('  --images                          also delete uploaded photo files');
    console.log('  --users [--keep=a@x.com,b@y.com]   also delete user accounts (except kept)');
    await disconnectDatabase();
    return;
  }

  if (config.isProduction && !FORCE_PROD) {
    console.error('\nNODE_ENV=production detected — refusing to wipe without --force-prod.');
    await disconnectDatabase();
    process.exit(1);
  }

  console.log('\nWiping content…');
  const [j, s, g, b, m, c] = await Promise.all([
    Jewelry.deleteMany({}),
    JewelrySet.deleteMany({}),
    Group.deleteMany({}),
    Booking.deleteMany({}),
    Message.deleteMany({}),
    Conversation.deleteMany({}),
  ]);
  console.log(`  jewelry items : -${j.deletedCount}`);
  console.log(`  sets          : -${s.deletedCount}`);
  console.log(`  closets       : -${g.deletedCount}`);
  console.log(`  bookings      : -${b.deletedCount}`);
  console.log(`  messages      : -${m.deletedCount}`);
  console.log(`  conversations : -${c.deletedCount}`);

  if (WIPE_USERS) {
    const filter = KEEP_EMAILS.length ? { email: { $nin: KEEP_EMAILS } } : {};
    const du = await User.deleteMany(filter);
    const kept = KEEP_EMAILS.length ? ` (kept: ${KEEP_EMAILS.join(', ')})` : '';
    console.log(`  users         : -${du.deletedCount}${kept}`);
  } else {
    console.log(`  users         : kept all ${users}`);
  }

  if (WIPE_IMAGES) {
    const full = await clearWebpDir(config.mediaDir);
    const thumbs = await clearWebpDir(path.join(config.mediaDir, 'thumbs'));
    console.log(`  photo files   : -${full + thumbs} (from ${config.mediaDir})`);
  } else {
    console.log('  photo files   : left in place (pass --images to delete them)');
  }

  console.log('\n✅ Done — app is in a clean state.');
  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error('Wipe failed:', err);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
