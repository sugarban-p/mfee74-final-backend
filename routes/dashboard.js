// Functionality: return aggregated member dashboard statistics. Purpose: support dashboard cards without depending on frontend mock data.

import { Router } from "express";

import { requireAuth } from "../utils/auth-session.js";
import { hasColumn, hasTable, safeCount } from "../utils/schema.js";

const router = Router();

async function countFavorites(userId) {
  if (await hasTable("user_favorites")) {
    if (await hasColumn("user_favorites", "user_id_fk")) {
      return safeCount(
        "SELECT COUNT(*) AS total FROM user_favorites WHERE user_id_fk = ?",
        [userId],
        0,
      );
    }

    if (await hasColumn("user_favorites", "user_id")) {
      return safeCount(
        "SELECT COUNT(*) AS total FROM user_favorites WHERE user_id = ?",
        [userId],
        0,
      );
    }

    if (await hasColumn("user_favorites", "member_id_fk")) {
      return safeCount(
        "SELECT COUNT(*) AS total FROM user_favorites WHERE member_id_fk = ?",
        [userId],
        0,
      );
    }
  }

  if (await hasTable("favorites")) {
    if (await hasColumn("favorites", "user_id_fk")) {
      return safeCount(
        "SELECT COUNT(*) AS total FROM favorites WHERE user_id_fk = ?",
        [userId],
        0,
      );
    }

    return safeCount(
      "SELECT COUNT(*) AS total FROM favorites WHERE user_id = ?",
      [userId],
      0,
    );
  }

  return 0;
}

async function getOrdersUserColumn() {
  if (await hasColumn("orders", "user_id_fk")) return "user_id_fk";
  return "user_id";
}

async function getOrderStatusStrategy() {
  if (await hasColumn("orders", "order_status")) {
    return {
      column: "order_status",
      pending: 1,
      completed: 2,
      cancelled: 3,
    };
  }

  return {
    column: "status",
    pending: "PENDING",
    completed: "COMPLETED",
    cancelled: "CANCELLED",
  };
}

async function countPets(userId) {
  if (!(await hasTable("pets"))) return 0;

  const userColumn = (await hasColumn("pets", "user_id_fk"))
    ? "user_id_fk"
    : "user_id";
  const hasSoftDelete = await hasColumn("pets", "is_deleted");
  const where = hasSoftDelete
    ? `${userColumn} = ? AND is_deleted = 0`
    : `${userColumn} = ?`;

  return safeCount(
    `SELECT COUNT(*) AS total FROM pets WHERE ${where}`,
    [userId],
    0,
  );
}

router.get("/stats", requireAuth, async (req, res) => {
  try {
    const user = req.currentUser;
    const now = new Date();

    const [ordersUserColumn, orderStatusStrategy] = await Promise.all([
      getOrdersUserColumn(),
      getOrderStatusStrategy(),
    ]);

    const orderRows = await safeCount(
      `
        SELECT COUNT(*) AS total
        FROM orders
        WHERE ${ordersUserColumn} = ?
      `,
      [user.id],
      0,
    );

    const [
      pending,
      completed,
      cancelled,
      favorites,
      pets,
      available,
      usedCoupons,
      expiredCoupons,
    ] = await Promise.all([
      safeCount(
        `SELECT COUNT(*) AS total FROM orders WHERE ${ordersUserColumn} = ? AND ${orderStatusStrategy.column} = ?`,
        [user.id, orderStatusStrategy.pending],
        0,
      ),
      safeCount(
        `SELECT COUNT(*) AS total FROM orders WHERE ${ordersUserColumn} = ? AND ${orderStatusStrategy.column} = ?`,
        [user.id, orderStatusStrategy.completed],
        0,
      ),
      safeCount(
        `SELECT COUNT(*) AS total FROM orders WHERE ${ordersUserColumn} = ? AND ${orderStatusStrategy.column} = ?`,
        [user.id, orderStatusStrategy.cancelled],
        0,
      ),
      countFavorites(user.id),
      countPets(user.id),
      safeCount(
        `
          SELECT COUNT(*) AS total
          FROM user_coupons
            WHERE user_id = ?
              AND used_at IS NULL
              AND (expires_at IS NULL OR expires_at > ?)
        `,
        [user.id, now],
        0,
      ),
      safeCount(
        "SELECT COUNT(*) AS total FROM user_coupons WHERE user_id = ? AND used_at IS NOT NULL",
        [user.id],
        0,
      ),
      safeCount(
        "SELECT COUNT(*) AS total FROM user_coupons WHERE user_id = ? AND used_at IS NULL AND expires_at IS NOT NULL AND expires_at < ?",
        [user.id, now],
        0,
      ),
    ]);

    return res.json({
      orders: {
        total: orderRows,
        pending,
        completed,
        cancelled,
      },
      favorites,
      pets,
      coupons: {
        available,
        used: usedCoupons,
        expired: expiredCoupons,
      },
    });
  } catch (error) {
    console.error("[dashboard/stats]", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

export default router;
