import mysql from "mysql2/promise";
import "dotenv/config";

const { DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT } = process.env;

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  port: +DB_PORT || 3306,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  multipleStatements: true,
});

const createdThreadIds = new Set(); // 紀錄 在本次伺服器執行期間 建立的 threadId
const activeThreadIds = new Set(); // 紀錄 當下使用中的 threadId

/* 連線池紀錄 */
// 建立新連線
pool.on("connection", (connection) => {
  createdThreadIds.add(connection.threadId);
  console.log(`【建立新的資料庫連線 識別碼: ${connection.threadId}】`);
});
// 使用連線
pool.on("acquire", (connection) => {
  activeThreadIds.add(connection.threadId);
  logPoolStatus(`取得 SQL 連線 (識別碼：${connection.threadId})`);
});
// 釋放連線
pool.on("release", (connection) => {
  activeThreadIds.delete(connection.threadId);
  logPoolStatus(`釋放 SQL (識別碼：${connection.threadId})`);
});
// 連線數量達上限 (connectionLimit)
pool.on("enqueue", () => {
  console.log("⏳ SQL 連線池已滿，等待可用連線...");
});

/* 連線池行為 */
// 輸出當下 SQL 連線池狀態
function logPoolStatus(label = "SQL 狀態") {
  console.log(
    `-- ${label}\n-- 現在 SQL 連線數量: ${activeThreadIds.size} [${[
      ...activeThreadIds,
    ].join(", ")}]\n`,
  );
}
// 包裝 pool.query
const originalQuery = pool.query.bind(pool);
pool.query = async (...args) => {
  logPoolStatus("-- 準備執行 pool.query ...");
  try {
    return await originalQuery(...args);
  } finally {
    logPoolStatus("-- 完成 pool.query");
  }
};
// 包裝 pool.execute
const originalExecute = pool.execute.bind(pool);
pool.execute = async (...args) => {
  logPoolStatus("-- 準備執行 pool.execute ...");
  try {
    return await originalExecute(...args);
  } finally {
    logPoolStatus("-- 完成 pool.execute");
  }
};
// 包裝 getConnection
const originalGetConnection = pool.getConnection.bind(pool);
pool.getConnection = async (...args) => {
  const connection = await originalGetConnection(...args);

  const originalRelease = connection.release.bind(connection);

  connection.release = () => {
    activeThreadIds.delete(connection.threadId);
    return originalRelease();
  };

  return connection;
};

/* 關閉伺服器前，確保 所有SQL連線正常結束 */
export async function closeMysqlPool() {
  console.log("-- 準備關閉 MySQL 連線池...");

  if (activeThreadIds.size > 0) {
    console.warn(
      `-- 關閉前仍有使用中的 SQL threadId: [${[...activeThreadIds].join(", ")}]`,
    );
  }

  await pool.end();
  activeThreadIds.clear();
  console.log("【MySQL 連線池已關閉】");
}

/* 監聽連線池層級的錯誤事件 */
pool.on("error", (err) => {
  console.error("【error】資料庫連線池錯誤\n", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.log("【error】資料庫連線中斷\n-- 嘗試重新連線...");
  } else if (err.code === "ER_CON_COUNT_ERROR") {
    console.log("【error】資料庫連線數過多");
  } else if (err.code === "ECONNREFUSED") {
    console.log("【error】資料庫連線被拒絕");
  }
});

/* 測試連線 */
try {
  const connection = await pool.getConnection();
  console.log("【測試連線中】\n", { DB_USER, DB_NAME, DB_PORT }, "\n");
  console.log("🎯 資料庫連線測試成功");
  // 檢查資料庫版本
  const [rows] = await connection.execute("SELECT VERSION() as version");
  console.log(`-- MySQL 版本: ${rows[0].version}\n`);
  connection.release(); // 釋放連線
} catch (error) {
  console.error("❌ 資料庫連線測試失敗:\n", error.message);
}
export default pool;
