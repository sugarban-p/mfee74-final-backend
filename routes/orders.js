// 訂單管理 API

import crypto from "crypto";
import { Router } from "express";
import pool from "../utils/connect-mysql.js";
import { requireAuth } from "../utils/auth-session.js";

const router = Router();

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

const ecpay = {
  merchantId: process.env.ECPAY_MERCHANT_ID || "3002607",
  hashKey: process.env.ECPAY_HASH_KEY || "pwFHCqoQZGmho4w6",
  hashIv: process.env.ECPAY_HASH_IV || "EkRm7iFT261dpevs",
  apiUrl:
    process.env.ECPAY_API_URL ||
    "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5",
};

const linePay = {
  channelId: process.env.LINEPAY_CHANNEL_ID || "2010669119",
  channelSecret:
    process.env.LINEPAY_CHANNEL_SECRET || "f0fe0d34fef5d45aa4a09823bf3d136a",
  apiOrigin:
    process.env.LINEPAY_API_ORIGIN || "https://sandbox-api-pay.line.me",
};

const linePayOrders = new Map();
const productImages = ["/cat-category.png", "/events.png", "/dog-category.png"];
const publicPaymentCallbackPaths = new Set([
  "/payments/ecpay/notify",
  "/payments/ecpay/return",
  "/payments/linepay/confirm",
]);

router.use((req, res, next) => {
  if (publicPaymentCallbackPaths.has(req.path)) return next();
  return requireAuth(req, res, next);
});

const orderStatusMap = {
  1: { key: "processing", text: "處理中" },
  2: { key: "completed", text: "已完成" },
  3: { key: "canceled", text: "已取消" },
  4: { key: "failed", text: "退款中" },
  5: { key: "failed", text: "退貨中" },
};

const paymentStatusMap = {
  0: { key: "pending", text: "未付款" },
  1: { key: "processing", text: "付款中" },
  2: { key: "paid", text: "已付款" },
  3: { key: "failed", text: "付款失敗" },
  4: { key: "failed", text: "付款逾期" },
  5: { key: "failed", text: "退款中" },
  6: { key: "refunded", text: "已退款" },
};

const shippingStatusMap = {
  1: { key: "pending", text: "待出貨" },
  2: { key: "processing", text: "備貨中" },
  3: { key: "shipped", text: "已出貨" },
  4: { key: "shipped", text: "運送中" },
  5: { key: "shipped", text: "已送達" },
  6: { key: "completed", text: "已取貨" },
  7: { key: "failed", text: "退貨中" },
  8: { key: "canceled", text: "已退回" },
};

function getPaymentQuery(req) {
  const amount = Number(req.query.amount) || 0;
  const orderNo =
    typeof req.query.orderNo === "string" && req.query.orderNo.trim()
      ? req.query.orderNo.trim()
      : "";
  const items =
    typeof req.query.items === "string" && req.query.items.trim()
      ? req.query.items.trim()
      : "MOFU 線上商店商品";

  return { amount, items, orderNo };
}

function getProductImage(index) {
  return productImages[index % productImages.length];
}

function getPaymentText(method) {
  if (method === "linepay") return "LINE Pay 付款";
  return "信用卡付款";
}

function getOrderBadge(order) {
  if (order.order_status === 3) return orderStatusMap[3];
  if (order.order_status === 2) return orderStatusMap[2];
  return (
    shippingStatusMap[order.shipping_status] ||
    orderStatusMap[order.order_status]
  );
}

function getPaymentBadge(status) {
  return paymentStatusMap[status] || paymentStatusMap[0];
}

async function markOrderPaid(orderNo) {
  if (!orderNo) return;

  await pool.query(
    `UPDATE orders
    SET payment_status = 2, paid_at = COALESCE(paid_at, NOW())
    WHERE order_no = ?`,
    [orderNo],
  );
}

function calculateCouponDiscount(coupon, subtotal) {
  if (!coupon || subtotal < Number(coupon.minAmount)) return 0;
  if (coupon.discountType === "percent") {
    return Math.round(subtotal * (1 - Number(coupon.discountValue) / 100));
  }
  if (coupon.code === "FREESHIP") return 0;
  return Math.min(Number(coupon.discountValue) || 0, subtotal);
}

function createOrderNo(date = new Date()) {
  const pad = (value, length = 2) => String(value).padStart(length, "0");

  return `ORD${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(
    date.getDate(),
  )}${pad(date.getHours())}${pad(date.getMinutes())}${pad(
    date.getSeconds(),
  )}${pad(date.getMilliseconds(), 3)}`;
}

function formatEcpayDate(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");

  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds(),
  )}`;
}

function ecpayEncode(value) {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/%2D/g, "-")
    .replace(/%5F/g, "_")
    .replace(/%2E/g, ".")
    .replace(/%21/g, "!")
    .replace(/%2A/g, "*")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")");
}

function createEcpayCheckMacValue(params) {
  const sortedParams = Object.keys(params)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  const raw = `HashKey=${ecpay.hashKey}&${sortedParams}&HashIV=${ecpay.hashIv}`;

  return crypto
    .createHash("sha256")
    .update(ecpayEncode(raw).toLowerCase())
    .digest("hex")
    .toUpperCase();
}

function createAutoSubmitForm(action, params) {
  const inputs = Object.entries(params)
    .map(
      ([key, value]) =>
        `<input type="hidden" name="${key}" value="${String(value).replaceAll(
          '"',
          "&quot;",
        )}" />`,
    )
    .join("");

  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <title>付款轉導中</title>
  </head>
  <body>
    <form method="post" action="${action}">
      ${inputs}
    </form>
    <script>document.forms[0].submit();</script>
  </body>
</html>`;
}

function createLinePaySignature(uri, body, nonce) {
  const message = `${linePay.channelSecret}${uri}${body}${nonce}`;

  return crypto
    .createHmac("sha256", linePay.channelSecret)
    .update(message)
    .digest("base64");
}

async function postLinePay(uri, body) {
  const nonce = crypto.randomUUID();
  const bodyText = JSON.stringify(body);
  const response = await fetch(`${linePay.apiOrigin}${uri}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-LINE-ChannelId": linePay.channelId,
      "X-LINE-Authorization-Nonce": nonce,
      "X-LINE-Authorization": createLinePaySignature(uri, bodyText, nonce),
    },
    body: bodyText,
  });

  return response.json();
}

router.get("/", (req, res) => {
  res.json({ route: "orders", success: true });
});

router.get("/cart", async (req, res) => {
  const demoUserId = req.currentUser.id;
  const [rows] = await pool.query(
    `SELECT
      ci.id,
      ci.sku_id_fk AS skuId,
      ci.quantity AS qty,
      p.prod_name AS name,
      i.item_name AS spec,
      p.price,
      ppt.tag_ch AS brand
    FROM cart_items ci
    JOIN items i ON i.id = ci.sku_id_fk
    JOIN products p ON p.id = i.prod_id_fk
    LEFT JOIN product_pet_tags ppt ON ppt.id = p.pet_tag_id_fk
    WHERE ci.user_id_fk = ? AND ci.is_selected = 1
    ORDER BY ci.id`,
    [demoUserId],
  );

  res.json({
    success: true,
    items: rows.map((item, index) => ({
      ...item,
      brand: item.brand ? `${item.brand}商品` : "MOFU",
      image: getProductImage(index),
    })),
  });
});

router.patch("/cart/:id", async (req, res) => {
  const demoUserId = req.currentUser.id;
  const quantity = Math.max(1, Number(req.body.quantity) || 1);

  await pool.query(
    `UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id_fk = ?`,
    [quantity, req.params.id, demoUserId],
  );

  res.json({ success: true });
});

router.delete("/cart/:id", async (req, res) => {
  const demoUserId = req.currentUser.id;
  await pool.query(`DELETE FROM cart_items WHERE id = ? AND user_id_fk = ?`, [
    req.params.id,
    demoUserId,
  ]);

  res.json({ success: true });
});

router.get("/coupons", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT code, title, discount_type AS discountType, discount_value AS discountValue, min_amount AS minAmount
    FROM coupons
    WHERE is_active = 1
    ORDER BY id`,
  );

  res.json({ success: true, coupons: rows });
});

router.post("/checkout", async (req, res) => {
  const userId = req.currentUser.id;
  const {
    receiverName,
    receiverPhone,
    receiverAddress,
    shippingMethod = "宅配",
    paymentMethod = "credit",
    couponCode = "",
    invoiceType = "個人發票",
    remark = "",
    clearCart = true,
  } = req.body;

  if (!receiverName || !receiverPhone || !receiverAddress) {
    return res.status(400).json({
      success: false,
      message: "請填寫完整收件資訊",
    });
  }

  if (!["credit", "linepay"].includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: "付款方式格式錯誤",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [cartItems] = await connection.query(
      `SELECT
        ci.id AS cartId,
        ci.sku_id_fk AS skuId,
        ci.quantity AS qty,
        p.prod_name AS productName,
        i.item_name AS skuName,
        p.price
      FROM cart_items ci
      JOIN items i ON i.id = ci.sku_id_fk
      JOIN products p ON p.id = i.prod_id_fk
      WHERE ci.user_id_fk = ? AND ci.is_selected = 1
      ORDER BY ci.id
      FOR UPDATE`,
      [userId],
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "購物車沒有可結帳商品",
      });
    }

    const subtotal = cartItems.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.qty),
      0,
    );
    let coupon = null;

    if (couponCode) {
      const [[couponRow]] = await connection.query(
        `SELECT
          id,
          code,
          discount_type AS discountType,
          discount_value AS discountValue,
          min_amount AS minAmount
        FROM coupons
        WHERE code = ? AND is_active = 1
        LIMIT 1`,
        [couponCode],
      );
      coupon = couponRow || null;
    }

    const shippingFee = 0;
    const discount = calculateCouponDiscount(coupon, subtotal);
    const finalAmount = Math.max(0, subtotal + shippingFee - discount);
    const orderNo = createOrderNo();

    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        order_no,
        user_id_fk,
        order_status,
        payment_status,
        shipping_status,
        items_amount,
        shipping_fee,
        coupon_id_fk,
        coupon_code,
        coupon_discount,
        final_amount,
        payment_method,
        invoice_type,
        remark
      ) VALUES (?, ?, 1, 0, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNo,
        userId,
        subtotal,
        shippingFee,
        coupon?.id || null,
        coupon?.code || null,
        discount,
        finalAmount,
        paymentMethod,
        invoiceType,
        remark || null,
      ],
    );

    const orderId = orderResult.insertId;

    await connection.query(
      `INSERT INTO order_shipping_infos (
        order_id_fk,
        receiver_name,
        receiver_phone,
        shipping_method,
        receiver_address
      ) VALUES (?, ?, ?, ?, ?)`,
<<<<<<< HEAD
      [
        orderId,
        receiverName,
        receiverPhone,
        shippingMethod,
        receiverAddress,
      ],
=======
      [orderId, receiverName, receiverPhone, shippingMethod, receiverAddress],
>>>>>>> main
    );

    await connection.query(
      `INSERT INTO order_items (
        order_id_fk,
        sku_id_fk,
        product_name,
        sku_name,
        product_image,
        price,
        quantity,
        subtotal
      ) VALUES ?`,
      [
        cartItems.map((item) => [
          orderId,
          item.skuId,
          item.productName,
          item.skuName,
          null,
          item.price,
          item.qty,
          Number(item.price) * Number(item.qty),
        ]),
      ],
    );

    await connection.query(
      `INSERT INTO order_status_logs (
        order_id_fk,
        status_type,
        status_value,
        note
      ) VALUES
        (?, 'order', 1, '訂單成立'),
        (?, 'payment', 0, '等待付款'),
        (?, 'shipping', 1, '待出貨')`,
      [orderId, orderId, orderId],
    );

    if (clearCart) {
      await connection.query(
        `DELETE FROM cart_items WHERE user_id_fk = ? AND is_selected = 1`,
        [userId],
      );
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      orderNo,
      orderId,
      subtotal,
      shippingFee,
      discount,
      total: finalAmount,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Create order error:", error);
    return res.status(500).json({
      success: false,
      message: "建立訂單失敗",
    });
  } finally {
    connection.release();
  }
});

router.get("/list", async (req, res) => {
  const demoUserId = req.currentUser.id;
  const [orders] = await pool.query(
    `SELECT
      o.id,
      o.order_no AS orderNo,
      o.order_status,
      o.payment_status,
      o.shipping_status,
      o.final_amount AS total,
      o.payment_method AS paymentMethod,
      DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i') AS createdAt,
      COUNT(oi.id) AS itemCount,
      MIN(oi.product_name) AS firstProduct
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id_fk = o.id
    WHERE o.user_id_fk = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC`,
    [demoUserId],
  );

  res.json({
    success: true,
    orders: orders.map((order, index) => {
      const status = getOrderBadge(order);
      const paymentStatus = getPaymentBadge(order.payment_status);

      return {
        id: order.orderNo,
        status: status.key,
        statusText: status.text,
        paymentStatus: paymentStatus.key,
        paymentText: paymentStatus.text,
        createdAt: order.createdAt,
        title:
          Number(order.itemCount) > 1
            ? `${order.firstProduct} 等 ${order.itemCount} 件商品`
            : order.firstProduct,
        payment: getPaymentText(order.paymentMethod),
        total: order.total,
        images: Array.from(
          { length: Math.min(Number(order.itemCount) || 1, 3) },
          (_, imageIndex) => getProductImage(index + imageIndex),
        ),
      };
    }),
  });
});

router.get("/list/:orderNo", async (req, res) => {
  const demoUserId = req.currentUser.id;
  const [[order]] = await pool.query(
    `SELECT
      o.*,
      DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i') AS createdAt,
      s.receiver_name,
      s.receiver_phone,
      s.receiver_address,
      s.tracking_no
    FROM orders o
    LEFT JOIN order_shipping_infos s ON s.order_id_fk = o.id
    WHERE o.order_no = ? AND o.user_id_fk = ?`,
    [req.params.orderNo, demoUserId],
  );

  if (!order) {
    return res.status(404).json({ success: false, message: "找不到訂單" });
  }

  const [items] = await pool.query(
    `SELECT product_name AS name, sku_name AS spec, price, quantity AS qty, subtotal
    FROM order_items
    WHERE order_id_fk = ?
    ORDER BY id`,
    [order.id],
  );

  const [logs] = await pool.query(
    `SELECT status_type AS statusType, status_value AS statusValue, note, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS createdAt
    FROM order_status_logs
    WHERE order_id_fk = ?
    ORDER BY created_at`,
    [order.id],
  );

  const status = getOrderBadge(order);
  const paymentStatus = getPaymentBadge(order.payment_status);

  res.json({
    success: true,
    order: {
      id: order.order_no,
      status: status.key,
      statusText: status.text,
      paymentStatus: paymentStatus.key,
      paymentText: paymentStatus.text,
      createdAt: order.createdAt,
      payment: getPaymentText(order.payment_method),
      subtotal: order.items_amount,
      shippingFee: order.shipping_fee,
      discount: order.coupon_discount,
      total: order.final_amount,
      receiver: {
        name: order.receiver_name,
        phone: order.receiver_phone,
        email: "mei@petfull.tw",
        address: order.receiver_address,
        trackingNo: order.tracking_no,
      },
      items: items.map((item, index) => ({
        ...item,
        brand: "MOFU",
        image: getProductImage(index),
      })),
      timeline: logs.map((log) => ({
        label: log.note,
        note: log.createdAt,
        done: true,
      })),
    },
  });
});

router.get("/payments/ecpay", (req, res) => {
  const { amount, items, orderNo } = getPaymentQuery(req);

  if (!amount) {
    return res.status(400).json({ success: false, message: "缺少總金額" });
  }

  const params = {
    MerchantID: ecpay.merchantId,
    MerchantTradeNo: orderNo || createOrderNo(),
    MerchantTradeDate: formatEcpayDate(),
    PaymentType: "aio",
    EncryptType: 1,
    TotalAmount: amount,
    TradeDesc: "MOFU 線上商店付款",
    ItemName: items.split(",").filter(Boolean).join("#") || "MOFU 商品一批",
    ReturnURL: `${backendUrl}/api/orders/payments/ecpay/notify`,
    OrderResultURL: `${backendUrl}/api/orders/payments/ecpay/return`,
    ChoosePayment: "Credit",
  };

  res.send(
    createAutoSubmitForm(ecpay.apiUrl, {
      ...params,
      CheckMacValue: createEcpayCheckMacValue(params),
    }),
  );
});

router.post("/payments/ecpay/notify", async (req, res) => {
  await markOrderPaid(req.body.MerchantTradeNo);
  res.send("1|OK");
});

router.post("/payments/ecpay/return", async (req, res) => {
  await markOrderPaid(req.body.MerchantTradeNo);
  res.redirect(`${frontendUrl}/checkout/success`);
});

router.get("/payments/linepay", async (req, res) => {
  const { amount, items, orderNo } = getPaymentQuery(req);

  if (!amount) {
    return res.status(400).json({ success: false, message: "缺少總金額" });
  }

  const orderId = orderNo || createOrderNo();
  linePayOrders.set(orderId, { amount });

  try {
    const result = await postLinePay("/v3/payments/request", {
      amount,
      currency: "TWD",
      orderId,
      packages: [
        {
          id: crypto.randomBytes(5).toString("hex"),
          amount,
          name: "MOFU 線上商店",
          products: [
            {
              id: "mofu_cart",
              name: items,
              quantity: 1,
              price: amount,
            },
          ],
        },
      ],
      redirectUrls: {
        confirmUrl: `${backendUrl}/api/orders/payments/linepay/confirm`,
        cancelUrl: `${frontendUrl}/checkout/fail`,
      },
      options: {
        display: {
          locale: "zh_TW",
        },
      },
    });

    if (result.returnCode !== "0000") {
      linePayOrders.delete(orderId);
      return res.status(400).json({
        success: false,
        message: result.returnMessage || "LINE Pay 建立付款失敗",
      });
    }

    return res.redirect(result.info.paymentUrl.web);
  } catch (error) {
    console.error("LINE Pay request error:", error);
    linePayOrders.delete(orderId);
    return res.redirect(`${frontendUrl}/checkout/error`);
  }
});

router.get("/payments/linepay/confirm", async (req, res) => {
  const { transactionId, orderId } = req.query;
  const order = linePayOrders.get(orderId);

  if (!transactionId || !order) {
    return res.redirect(`${frontendUrl}/checkout/fail`);
  }

  try {
    const result = await postLinePay(`/v3/payments/${transactionId}/confirm`, {
      amount: order.amount,
      currency: "TWD",
    });

    linePayOrders.delete(orderId);

    if (result.returnCode !== "0000") {
      return res.redirect(`${frontendUrl}/checkout/fail`);
    }

    await markOrderPaid(orderId);
    return res.redirect(`${frontendUrl}/checkout/success`);
  } catch (error) {
    console.error("LINE Pay confirm error:", error);
    linePayOrders.delete(orderId);
    return res.redirect(`${frontendUrl}/checkout/error`);
  }
});

export default router;
