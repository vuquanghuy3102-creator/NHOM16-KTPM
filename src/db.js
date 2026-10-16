const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

let wrapper;

async function createDatabase() {
  const wasmDir = path.dirname(require.resolve("sql.js/dist/sql-wasm.js"));
  const SQL = await initSqlJs({
    locateFile: file => path.join(wasmDir, file)
  });

  const dbPath = path.join(__dirname, "..", "database", "hotel_booking.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const nativeDb = fs.existsSync(dbPath)
    ? new SQL.Database(fs.readFileSync(dbPath))
    : new SQL.Database();

  let inTransaction = false;

  function persist() {
    const data = nativeDb.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }

  function normalizeParams(params) {
    return Array.isArray(params) ? params : [];
  }

  wrapper = {
    async exec(sql) {
      const command = String(sql).trim().toUpperCase();
      nativeDb.run(sql);

      if (command.startsWith("BEGIN")) {
        inTransaction = true;
      } else if (command.startsWith("COMMIT")) {
        inTransaction = false;
        persist();
      } else if (command.startsWith("ROLLBACK")) {
        inTransaction = false;
        persist();
      } else if (!inTransaction) {
        persist();
      }
    },

    async run(sql, params = []) {
      const stmt = nativeDb.prepare(sql);
      try {
        stmt.bind(normalizeParams(params));
        while (stmt.step()) { /* consume result if any */ }
      } finally {
        stmt.free();
      }

      const changes = nativeDb.getRowsModified();
      let lastID = 0;
      const result = nativeDb.exec("SELECT last_insert_rowid() AS id");
      if (result[0] && result[0].values[0]) lastID = Number(result[0].values[0][0]);

      if (!inTransaction) persist();
      return { changes, lastID };
    },

    async get(sql, params = []) {
      const stmt = nativeDb.prepare(sql);
      try {
        stmt.bind(normalizeParams(params));
        return stmt.step() ? stmt.getAsObject() : undefined;
      } finally {
        stmt.free();
      }
    },

    async all(sql, params = []) {
      const stmt = nativeDb.prepare(sql);
      const rows = [];
      try {
        stmt.bind(normalizeParams(params));
        while (stmt.step()) rows.push(stmt.getAsObject());
      } finally {
        stmt.free();
      }
      return rows;
    }
  };

  return wrapper;
}

async function getDb() {
  if (!wrapper) return createDatabase();
  return wrapper;
}

module.exports = { getDb };
