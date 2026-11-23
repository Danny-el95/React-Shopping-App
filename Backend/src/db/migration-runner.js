import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';

export async function readMigrations(directory) {
  const names = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
  const versions = new Set();
  return Promise.all(names.map(async (name) => {
    const match = /^(\d{4})_[a-z0-9_]+\.sql$/.exec(name);
    if (!match || versions.has(match[1])) throw new Error(`Invalid or duplicate migration number: ${name}`);
    versions.add(match[1]);
    const sql = await readFile(new URL(name, directory), 'utf8');
    if (!sql.trim()) throw new Error(`Empty migration: ${name}`);
    return { name, sql, checksum: createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex') };
  }));
}

export function pendingMigrations(files, applied) {
  if (applied.length > files.length) throw new Error('Applied migration files are missing');
  for (let index = 0; index < applied.length; index++) {
    if (files[index].name !== applied[index].filename || files[index].checksum !== applied[index].checksum) {
      throw new Error(`Migration history mismatch: ${applied[index].filename}`);
    }
  }
  return files.slice(applied.length);
}

export async function migrate(connection, files, { database, statusOnly = false, log = console.log }) {
  const lockName = `migrations:${createHash('sha256').update(database).digest('hex').slice(0, 48)}`;
  let locked = false;
  try {
    const [rows] = await connection.execute('SELECT GET_LOCK(?, 10) AS acquired', [lockName]);
    locked = Number(rows[0].acquired) === 1;
    if (!locked) throw new Error('Could not acquire migration lock');
    await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
      checksum CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);
    const [applied] = await connection.query('SELECT filename, checksum FROM schema_migrations ORDER BY filename');
    const pending = pendingMigrations(files, applied);
    if (statusOnly) {
      for (const file of files) log(`${pending.includes(file) ? 'pending' : 'applied'} ${file.name}`);
      return;
    }
    for (const file of pending) {
      log(`Applying ${file.name}`);
      try {
        // This dedicated connection permits multiple trusted migration statements.
        await connection.query(file.sql);
        await connection.execute('INSERT INTO schema_migrations (filename, checksum) VALUES (?, ?)', [file.name, file.checksum]);
      } catch (error) {
        throw new Error(`Migration ${file.name} failed (${error.code ?? 'UNKNOWN'}). DDL may have committed; inspect the schema before retrying.`);
      }
    }
    log(pending.length ? 'Migrations complete' : 'No pending migrations');
  } finally {
    if (locked) await connection.execute('SELECT RELEASE_LOCK(?)', [lockName]);
  }
}
