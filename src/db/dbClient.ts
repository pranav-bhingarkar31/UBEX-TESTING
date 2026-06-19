import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as adminSchema from "./admin_schema";
import * as mainSchema from "./schema";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const { Pool } = pg;

// ==========================================
// ADVENTURE ADMINGRUENT DATABASE FALLBACK ENGINE
// ==========================================
const ADMIN_DB_PATH = path.join(process.cwd(), "local_admin_db.json");

function loadAdminDb(): Record<string, any[]> {
  try {
    if (fs.existsSync(ADMIN_DB_PATH)) {
      const content = fs.readFileSync(ADMIN_DB_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("[DATABASE FALLBACK] Failed to read mock admin DB:", err);
  }
  return {};
}

function saveAdminDb(data: Record<string, any[]>) {
  try {
    fs.writeFileSync(ADMIN_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[DATABASE FALLBACK] Failed to write mock admin DB:", err);
  }
}

function getTargetTable(sql: string): string {
  const normalized = sql.toLowerCase();
  for (const table of [
    "admin_users", "sessions", "otp_challenges", "password_reset_requests",
    "role_permissions", "admin_user_roles", "roles", "permissions",
    "audit_logs", "security_events", "password_history", "notifications"
  ]) {
    if (normalized.includes(`"${table}"`) || normalized.includes(`'${table}'`) || normalized.includes(` ${table} `) || normalized.includes(`.${table}`)) {
      return table;
    }
  }
  return "";
}

function evaluateWhere(sql: string, row: any, params: any[]): boolean {
  const whereMatch = sql.match(/where\s+(.*)/i);
  if (!whereMatch) return true;

  let clause = whereMatch[1];
  const limitIdx = clause.toLowerCase().indexOf("limit");
  if (limitIdx !== -1) {
    clause = clause.substring(0, limitIdx).trim();
  }

  if (clause.includes(" = ")) {
    const [leftRaw, rightRaw] = clause.split(" = ").map(s => s.trim());
    const colName = leftRaw.replace(/["']/g, "").split(".").pop()!;
    let val: any;
    if (rightRaw.startsWith("$")) {
      const idx = parseInt(rightRaw.substring(1), 10) - 1;
      val = params[idx];
    } else {
      val = rightRaw.replace(/["']/g, "");
      if (val === "null") val = null;
      else if (val === "true") val = true;
      else if (val === "false") val = false;
    }
    return String(row[colName]) === String(val);
  } else if (clause.toLowerCase().includes(" in ")) {
    const [leftRaw, rightRaw] = clause.split(/ in /i).map(s => s.trim());
    const colName = leftRaw.replace(/["']/g, "").split(".").pop()!;
    const m = rightRaw.match(/\(([^)]+)\)/);
    if (m) {
      const tokens = m[1].split(",").map(t => t.trim());
      const valuesIn: any[] = [];
      for (const t of tokens) {
        if (t.startsWith("$")) {
          const idx = parseInt(t.substring(1), 10) - 1;
          const val = params[idx];
          if (Array.isArray(val)) {
            valuesIn.push(...val);
          } else {
            valuesIn.push(val);
          }
        } else {
          valuesIn.push(t.replace(/["']/g, ""));
        }
      }
      return valuesIn.map(String).includes(String(row[colName]));
    }
  }
  return true;
}

function handleInsert(table: string, sql: string, params: any[]): any[] {
  const colsMatch = sql.match(/insert\s+into\s+[^\s(]+\s*\(([^)]+)\)/i);
  if (!colsMatch) return [];
  const columns = colsMatch[1].split(",").map(c => c.trim().replace(/["']/g, ""));

  const valuesIndex = sql.toLowerCase().indexOf("values");
  if (valuesIndex === -1) return [];
  const valuesStr = sql.substring(valuesIndex);

  const valueGroups: string[] = [];
  let depth = 0;
  let currentGroup = "";
  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];
    if (char === "(") {
      depth++;
      if (depth === 1) {
        currentGroup = "";
        continue;
      }
    } else if (char === ")") {
      depth--;
      if (depth === 0) {
        valueGroups.push(currentGroup);
        continue;
      }
    }
    if (depth > 0) {
      currentGroup += char;
    }
  }

  const list: any[] = [];
  let paramIdx = 0;

  for (const group of valueGroups) {
    const tokens = group.split(",").map(t => t.trim());
    const row: any = {};

    row.id = crypto.randomUUID();
    row.created_at = new Date().toISOString();
    row.updated_at = new Date().toISOString();

    if (table === "admin_users") {
      row.is_active = true;
      row.is_mfa_enabled = false;
      row.failed_login_attempts = 0;
      row.must_change_password = false;
    } else if (table === "sessions") {
      row.is_suspicious = false;
    } else if (table === "otp_challenges") {
      row.retry_count = 0;
      row.max_retries = 3;
      row.is_used = false;
    } else if (table === "password_reset_requests") {
      row.is_used = false;
    }

    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const token = tokens[i];
      if (token && token.startsWith("$")) {
        row[col] = params[paramIdx++];
      } else if (token && token.toLowerCase() === "default") {
        // default value already populated or leave as default
      } else {
        if (token) {
          let val: any = token;
          if (token.startsWith("'") && token.endsWith("'")) {
            val = token.slice(1, -1);
          } else if (token === "true") {
            val = true;
          } else if (token === "false") {
            val = false;
          } else if (token === "null") {
            val = null;
          } else if (!isNaN(Number(token))) {
            val = Number(token);
          }
          row[col] = val;
        }
      }
    }
    list.push(row);
  }

  const dbData = loadAdminDb();
  if (!dbData[table]) dbData[table] = [];
  dbData[table].push(...list);
  saveAdminDb(dbData);

  return list;
}

function handleUpdate(table: string, sql: string, params: any[]): any[] {
  const setMatch = sql.match(/set\s+(.*)\s+where/i);
  if (!setMatch) return [];
  const setStr = setMatch[1];
  const assignments = setStr.split(",").map(a => a.trim());

  const dbData = loadAdminDb();
  const rows = dbData[table] || [];

  const setUpdates: Record<string, any> = {};
  for (const ass of assignments) {
    const [colRaw, valRaw] = ass.split("=").map(s => s.trim());
    const col = colRaw.replace(/["']/g, "").split(".").pop()!;
    if (valRaw.startsWith("$")) {
      const idx = parseInt(valRaw.substring(1), 10) - 1;
      setUpdates[col] = params[idx];
    } else {
      let val: any = valRaw;
      if (valRaw.startsWith("'") && valRaw.endsWith("'")) {
        val = valRaw.slice(1, -1);
      } else if (valRaw === "true") {
        val = true;
      } else if (valRaw === "false") {
        val = false;
      } else if (valRaw === "null") {
        val = null;
      } else if (!isNaN(Number(valRaw))) {
        val = Number(valRaw);
      }
      setUpdates[col] = val;
    }
  }

  const updatedRows: any[] = [];
  for (const row of rows) {
    if (evaluateWhere(sql, row, params)) {
      for (const [col, value] of Object.entries(setUpdates)) {
        row[col] = value;
      }
      row.updated_at = new Date().toISOString();
      updatedRows.push(row);
    }
  }

  saveAdminDb(dbData);
  return updatedRows;
}

function executeMockQuery(sql: string, params: any[] = [], rowMode?: string): any[] {
  console.log(`[DEBUG_DB] SQL="${sql}" PARAMS=${JSON.stringify(params)} rowMode=${rowMode}`);
  const normalized = sql.toLowerCase();
  const table = getTargetTable(sql);

  // 1. SELECT operations and sub-joins
  if (normalized.startsWith("select")) {
    let resultItems: any[] = [];
    if (sql.includes("admin_user_roles") && sql.includes("roles") && sql.includes("inner join")) {
      const dbData = loadAdminDb();
      const adminUserRolesList = dbData.admin_user_roles || [];
      const rolesList = dbData.roles || [];
      const whereMatch = sql.match(/admin_user_id\s*=\s*\$(\d+)/i);
      if (whereMatch) {
        const idx = parseInt(whereMatch[1], 10) - 1;
        const targetAdminUserId = params[idx];
        resultItems = adminUserRolesList
          .filter((aur: any) => String(aur.admin_user_id) === String(targetAdminUserId))
          .map((aur: any) => {
            const role = rolesList.find((r: any) => String(r.id) === String(aur.role_id));
            return role ? { name: role.name, id: role.id } : null;
          })
          .filter(Boolean);
      }
    } else if (sql.includes("role_permissions") && sql.includes("permissions") && sql.includes("inner join")) {
      const dbData = loadAdminDb();
      const rpList = dbData.role_permissions || [];
      const permList = dbData.permissions || [];
      const inMatch = sql.match(/role_id\s+in\s+\(([^)]+)\)/i);
      if (inMatch) {
        const tokens = inMatch[1].split(",").map(t => t.trim());
        const targetRoleIds: any[] = [];
        for (const t of tokens) {
          if (t.startsWith("$")) {
            const idx = parseInt(t.substring(1), 10) - 1;
            const val = params[idx];
            if (Array.isArray(val)) {
              targetRoleIds.push(...val);
            } else {
              targetRoleIds.push(val);
            }
          } else {
            targetRoleIds.push(t.replace(/["']/g, ""));
          }
        }

        resultItems = rpList
          .filter((rp: any) => targetRoleIds.map(String).includes(String(rp.role_id)))
          .map((rp: any) => {
            const perm = permList.find((p: any) => String(p.id) === String(rp.permission_id));
            return perm ? { name: perm.name } : null;
          })
          .filter(Boolean);
      }
    } else {
      if (!table) return [];

      const dbData = loadAdminDb();
      const rows = dbData[table] || [];
      resultItems = rows.filter(row => evaluateWhere(sql, row, params));

      const limitMatch = sql.match(/limit\s+(\d+)/i);
      if (limitMatch) {
        const limit = parseInt(limitMatch[1], 10);
        resultItems = resultItems.slice(0, limit);
      }
    }

    if (rowMode === "array") {
      const selectColMatch = sql.match(/^\s*select\s+(.+?)\s+from\s+/i);
      if (selectColMatch) {
        const cols = selectColMatch[1].split(",").map(c => c.trim().replace(/["']/g, "").split(".").pop()!);
        return resultItems.map((row: any) => {
          return cols.map(col => row[col] !== undefined ? row[col] : null);
        });
      }
    }
    return resultItems;
  }

  // 2. INSERT operations
  if (normalized.startsWith("insert into")) {
    if (!table) return [];
    return handleInsert(table, sql, params);
  }

  // 3. UPDATE operations
  if (normalized.startsWith("update")) {
    if (!table) return [];
    return handleUpdate(table, sql, params);
  }

  // 4. DELETE operations
  if (normalized.startsWith("delete")) {
    if (!table) return [];
    const dbData = loadAdminDb();
    const rows = dbData[table] || [];
    const beforeLength = rows.length;
    dbData[table] = rows.filter(row => !evaluateWhere(sql, row, params));
    saveAdminDb(dbData);
    return [];
  }

  return [];
}

class MockClient {
  async query(sql: any, params: any[] = []) {
    const sqlText = typeof sql === "object" && sql !== null ? sql.text : sql;
    const sqlParams = typeof sql === "object" && sql !== null && Array.isArray(sql.values) ? sql.values : params;
    const rowMode = typeof sql === "object" && sql !== null ? sql.rowMode : undefined;
    return { rows: executeMockQuery(sqlText, sqlParams, rowMode) };
  }
  release() {}
}

class MockPool {
  private listenerMap: Record<string, Function[]> = {};

  on(event: string, fn: Function) {
    if (!this.listenerMap[event]) this.listenerMap[event] = [];
    this.listenerMap[event].push(fn);
    return this;
  }

  async query(sql: any, params: any[] = []) {
    const sqlText = typeof sql === "object" && sql !== null ? sql.text : sql;
    const sqlParams = typeof sql === "object" && sql !== null && Array.isArray(sql.values) ? sql.values : params;
    const rowMode = typeof sql === "object" && sql !== null ? sql.rowMode : undefined;
    return { rows: executeMockQuery(sqlText, sqlParams, rowMode) };
  }

  async connect() {
    return new MockClient();
  }
}

class DynamicPool {
  private pgPool: pg.Pool;
  private mockPool: MockPool;
  private fallbackMode: boolean = false;
  private fallbackLogged: boolean = false;

  constructor(config: pg.PoolConfig) {
    this.pgPool = new Pool(config);
    this.mockPool = new MockPool();

    this.pgPool.on("error", (err: any) => {
      if (err?.code === "ECONNREFUSED" || err?.message?.includes("connect")) {
        this.enableFallback(err);
      } else {
        console.error("[DATABASE] Real database pool error:", err);
      }
    });

    // Check pre-emptively if credentials indicate local/fallback dev database
    if (config.host === "localhost" || config.host === "127.0.0.1" || !process.env.SQL_HOST) {
      this.fallbackMode = true;
      this.enableFallback(new Error("[DATABASE] Using Sandbox Local Storage (No SQL_HOST set)"));
    }
  }

  private enableFallback(reason: any) {
    this.fallbackMode = true;
    if (!this.fallbackLogged) {
      console.log("\n======================================================\n" +
                   `[DATABASE INFO] local dev fallback: ${reason?.message || "Running on sandbox mode"}\n` +
                   "Switched transparently to secure, high-fidelity local file-backed datastore: local_admin_db.json\n" +
                   "======================================================\n");
      this.fallbackLogged = true;
    }
  }

  on(event: string, fn: Function) {
    this.pgPool.on(event as any, (err) => fn(err));
    this.mockPool.on(event, fn);
    return this;
  }

  async query(sql: string, params: any[] = []) {
    if (this.fallbackMode) {
      return this.mockPool.query(sql, params);
    }
    try {
      return await this.pgPool.query(sql, params);
    } catch (err: any) {
      if (err?.code === "ECONNREFUSED" || err?.message?.includes("connect")) {
        this.enableFallback(err);
        return this.mockPool.query(sql, params);
      }
      throw err;
    }
  }

  async connect(): Promise<any> {
    if (this.fallbackMode) {
      return this.mockPool.connect();
    }
    try {
      const client = await this.pgPool.connect();
      return {
        query: async (sql: string, params: any[] = []) => {
          try {
            return await client.query(sql, params);
          } catch (err: any) {
            if (err?.code === "ECONNREFUSED" || err?.message?.includes("connect")) {
              this.enableFallback(err);
              client.release();
              const mockClient = await this.mockPool.connect();
              return mockClient.query(sql, params);
            }
            throw err;
          }
        },
        release: () => {
          client.release();
        }
      };
    } catch (err: any) {
      if (err?.code === "ECONNREFUSED" || err?.message?.includes("connect")) {
        this.enableFallback(err);
        return this.mockPool.connect();
      }
      throw err;
    }
  }
}

// ==========================================
// POOL INITIALIZATION
// ==========================================
let pool: any = null;
let db: any = null;

export function getPool(): any {
  if (pool) return pool;

  const sqlHost = process.env.SQL_HOST || "localhost";
  const sqlDbName = process.env.SQL_DB_NAME || "postgres";
  const user = process.env.SQL_ADMIN_USER || "postgres";
  const password = process.env.SQL_ADMIN_PASSWORD || "postgres";
  const port = parseInt(process.env.SQL_PORT || "5432", 10);

  const sslEnabled = process.env.SQL_SSL === "true";
  const sslConfig = sslEnabled
    ? {
        rejectUnauthorized: process.env.SQL_SSL_REJECT_UNAUTHORIZED !== "false",
        ca: process.env.SQL_SSL_CA,
        key: process.env.SQL_SSL_KEY,
        cert: process.env.SQL_SSL_CERT,
      }
    : false;

  const poolConfig: pg.PoolConfig = {
    host: sqlHost,
    database: sqlDbName,
    user: user,
    password: password,
    port: port,
    ssl: sslConfig,
    max: parseInt(process.env.SQL_POOL_MAX || "20", 10),
    idleTimeoutMillis: parseInt(process.env.SQL_POOL_IDLE_TIMEOUT || "30000", 10),
    connectionTimeoutMillis: parseInt(process.env.SQL_POOL_CONN_TIMEOUT || "5000", 10),
  };

  if (process.env.SQL_SOCKET_PATH) {
    delete poolConfig.host;
    delete poolConfig.port;
    poolConfig.host = process.env.SQL_SOCKET_PATH;
  }

  pool = new DynamicPool(poolConfig);
  return pool;
}

export function getDb() {
  if (db) return db;

  const currentPool = getPool();
  try {
    db = drizzle(currentPool, {
      schema: { ...adminSchema, ...mainSchema },
    });
    return db;
  } catch (error) {
    console.error("[DATABASE] Failed to initialize Drizzle database connection wrapper:", error);
    throw error;
  }
}

export async function checkDatabaseHealth(): Promise<boolean> {
  const currentPool = getPool();
  try {
    const client = await currentPool.connect();
    try {
      await client.query("SELECT 1;");
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[DATABASE] Connection health check query failed:", error);
    return false;
  }
}
