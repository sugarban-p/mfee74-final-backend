// Functionality: check table/column availability and provide safe query helpers. Purpose: keep APIs resilient when some teammate-owned tables are not ready yet.

import pool from "./connect-mysql.js";

const tableCache = new Map();
const columnCache = new Map();

function isMissingSchemaError(error) {
  return (
    error?.code === "ER_NO_SUCH_TABLE" || error?.code === "ER_BAD_FIELD_ERROR"
  );
}

export function isTableMissingError(error) {
  return error?.code === "ER_NO_SUCH_TABLE";
}

export async function hasTable(tableName) {
  if (tableCache.has(tableName)) return tableCache.get(tableName);

  const sql = `
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = ? AND table_name = ?
    LIMIT 1
  `;
  const [rows] = await pool.execute(sql, [process.env.DB_NAME, tableName]);
  const exists = rows.length > 0;
  tableCache.set(tableName, exists);
  return exists;
}

export async function hasColumn(tableName, columnName) {
  const key = `${tableName}:${columnName}`;
  if (columnCache.has(key)) return columnCache.get(key);

  const tableReady = await hasTable(tableName);
  if (!tableReady) {
    columnCache.set(key, false);
    return false;
  }

  const sql = `
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = ? AND table_name = ? AND column_name = ?
    LIMIT 1
  `;
  const [rows] = await pool.execute(sql, [
    process.env.DB_NAME,
    tableName,
    columnName,
  ]);
  const exists = rows.length > 0;
  columnCache.set(key, exists);
  return exists;
}

export async function safeCount(sql, params = [], fallback = 0) {
  try {
    const [rows] = await pool.execute(sql, params);
    const first = rows[0] || {};
    const value = Number(first.total ?? first.count ?? first.value ?? fallback);
    return Number.isFinite(value) ? value : fallback;
  } catch (error) {
    if (isMissingSchemaError(error)) return fallback;
    throw error;
  }
}
