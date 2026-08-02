INSERT INTO `coupons` (
  `title`,
  `code`,
  `discount_type`,
  `discount_value`,
  `min_amount`,
  `start_at`,
  `end_at`,
  `is_active`,
  `usage_limit_per_user`
)
VALUES
  ('mofu新毛友9折見面禮', 'MOFUHI90', 'percent', 90, 0, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1, 1),
  ('毛孩好物滿千折百', 'GOOD100', 'fixed', 100, 1000, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1, 1),
  ('補貨路上免運到家', 'SHIP60', 'fixed', 60, 1500, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1, NULL);