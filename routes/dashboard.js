// Functionality: return aggregated member dashboard statistics. Purpose: support dashboard cards without depending on frontend mock data.

import { Router } from "express";

import { requireAuth } from "../utils/auth-session.js";
import { hasColumn, hasTable, safeCount } from "../utils/schema.js";

const router = Router();

async function countFavorites(userId) {
  if (await hasTable("user_favorites")) {
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
    return safeCount(
      "SELECT COUNT(*) AS total FROM favorites WHERE user_id = ?",
      [userId],
      0,
    );
  }

  return 0;
}

router.get("/stats", requireAuth, async (req, res) => {
  try {
    const user = req.currentUser;
    const now = new Date();

    const [orderRows] = await Promise.all([
      safeCount(
        `
          SELECT COUNT(*) AS total
          FROM orders
          WHERE user_id = ?
        `,
        [user.id],
        0,
      ),
    ]);

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
        "SELECT COUNT(*) AS total FROM orders WHERE user_id = ? AND status = ?",
        [user.id, "PENDING"],
        0,
      ),
      safeCount(
        "SELECT COUNT(*) AS total FROM orders WHERE user_id = ? AND status = ?",
        [user.id, "COMPLETED"],
        0,
      ),
      safeCount(
        "SELECT COUNT(*) AS total FROM orders WHERE user_id = ? AND status = ?",
        [user.id, "CANCELLED"],
        0,
      ),
      countFavorites(user.id),
      safeCount(
        "SELECT COUNT(*) AS total FROM pets WHERE user_id = ?",
        [user.id],
        0,
      ),
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
