INSERT INTO
    `orders`
VALUES (
        1,
        'ORD20260807074525218',
        3,
        1,
        0,
        1,
        3050,
        60,
        3,
        'SHIP60',
        60,
        3050,
        'credit',
        NULL,
        NULL,
        NULL,
        '個人發票',
        NULL,
        NULL,
        NULL,
        NULL,
        '2026-08-07 07:45:25',
        '2026-08-07 07:45:25'
    ),
    (
        2,
        'ORD20260807074656358',
        3,
        1,
        2,
        1,
        1297,
        60,
        NULL,
        NULL,
        0,
        1357,
        'credit',
        '2026-08-07 07:47:10',
        NULL,
        NULL,
        '個人發票',
        NULL,
        NULL,
        NULL,
        NULL,
        '2026-08-07 07:46:56',
        '2026-08-07 07:47:10'
    ),
    (
        3,
        'ORD20260807074737685',
        3,
        3,
        0,
        1,
        999,
        60,
        NULL,
        NULL,
        0,
        1059,
        'credit',
        NULL,
        NULL,
        NULL,
        '個人發票',
        NULL,
        NULL,
        NULL,
        NULL,
        '2026-08-07 07:47:37',
        '2026-08-07 07:47:45'
    );

INSERT INTO
    `order_items`
VALUES (
        1,
        1,
        9,
        '小宅生活｜8字貓抓板',
        '沉穩深灰',
        'images/products/avatars/cat/supplies/prod_0002_01_thumbnail.jpg',
        1280,
        1,
        1280,
        '2026-08-07 07:45:25'
    ),
    (
        2,
        1,
        8,
        '小宅生活｜8字貓抓板',
        '大地淺棕',
        'images/products/avatars/cat/supplies/prod_0002_01_thumbnail.jpg',
        1280,
        1,
        1280,
        '2026-08-07 07:45:25'
    ),
    (
        3,
        1,
        59,
        'S型可折疊靜音貓隧道',
        'S型貓隧道',
        'images/products/avatars/cat/supplies/prod_0021_01_thumbnail.jpg',
        490,
        1,
        490,
        '2026-08-07 07:45:25'
    ),
    (
        4,
        2,
        149,
        '狗狗凍乾主食餐',
        '安心雞',
        'images/products/avatars/dog/main-food/prod_0053_05_thumbnail.jpg',
        10,
        10,
        100,
        '2026-08-07 07:46:56'
    ),
    (
        5,
        2,
        89,
        '頂級木天蓼/蟲癭果棒棒',
        '潔牙木天蓼',
        'images/products/avatars/cat/treat/prod_0031_01_thumbnail.jpg',
        99,
        3,
        297,
        '2026-08-07 07:46:56'
    ),
    (
        6,
        2,
        158,
        '貓草新鮮栽培盒-貓咪生菜',
        '1盒(3入)',
        'images/products/avatars/cat/treat/prod_0038_01_thumbnail.jpg',
        450,
        2,
        900,
        '2026-08-07 07:46:56'
    ),
    (
        7,
        3,
        89,
        '頂級木天蓼/蟲癭果棒棒',
        '潔牙木天蓼',
        'images/products/avatars/cat/treat/prod_0031_01_thumbnail.jpg',
        99,
        1,
        99,
        '2026-08-07 07:47:37'
    ),
    (
        8,
        3,
        158,
        '貓草新鮮栽培盒-貓咪生菜',
        '1盒(3入)',
        'images/products/avatars/cat/treat/prod_0038_01_thumbnail.jpg',
        450,
        2,
        900,
        '2026-08-07 07:47:37'
    );

INSERT INTO
    `order_shipping_infos`
VALUES (
        1,
        1,
        '林承翰',
        '0933567890',
        '宅配',
        '桃園市中壢區中央西路50號8樓',
        NULL,
        NULL,
        NULL,
        '2026-08-07 07:45:25',
        '2026-08-07 07:45:25'
    ),
    (
        2,
        2,
        '林承翰',
        '0933567890',
        '宅配',
        '桃園市中壢區中央西路50號8樓',
        NULL,
        NULL,
        NULL,
        '2026-08-07 07:46:56',
        '2026-08-07 07:46:56'
    ),
    (
        3,
        3,
        '林承翰',
        '0933567890',
        '宅配',
        '桃園市中壢區中央西路50號8樓',
        NULL,
        NULL,
        NULL,
        '2026-08-07 07:47:37',
        '2026-08-07 07:47:37'
    );

INSERT INTO
    `order_status_logs`
VALUES (
        1,
        1,
        'order',
        1,
        '訂單成立',
        '2026-08-07 07:45:25'
    ),
    (
        2,
        1,
        'payment',
        0,
        '等待付款',
        '2026-08-07 07:45:25'
    ),
    (
        3,
        1,
        'shipping',
        1,
        '待出貨',
        '2026-08-07 07:45:25'
    ),
    (
        4,
        2,
        'order',
        1,
        '訂單成立',
        '2026-08-07 07:46:56'
    ),
    (
        5,
        2,
        'payment',
        0,
        '等待付款',
        '2026-08-07 07:46:56'
    ),
    (
        6,
        2,
        'shipping',
        1,
        '待出貨',
        '2026-08-07 07:46:56'
    ),
    (
        7,
        3,
        'order',
        1,
        '訂單成立',
        '2026-08-07 07:47:37'
    ),
    (
        8,
        3,
        'payment',
        0,
        '等待付款',
        '2026-08-07 07:47:37'
    ),
    (
        9,
        3,
        'shipping',
        1,
        '待出貨',
        '2026-08-07 07:47:37'
    ),
    (
        10,
        3,
        'order',
        3,
        '訂單取消',
        '2026-08-07 07:47:45'
    );