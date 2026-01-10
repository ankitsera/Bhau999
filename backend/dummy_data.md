# Dummy data SQL

Below are example MySQL-compatible INSERT statements you can use to populate the application's tables with sample data for local testing. Run them in order (or adapt to your environment). They assume the tables: `users`, `game`, `active_games`, `game_history`, `bets`, `bets_history`, `transactions`, `properties`, `rate`.

-- 1) Games
```sql
INSERT INTO `game` (`name`, `open_time`, `close_time`) VALUES
('MADHUR', '08:00:00', '12:30:00'),
('MALINI', '13:00:00', '18:00:00'),
('SRIDEVI', '19:00:00', '23:30:00');
```

-- 2) Rates (bet types)
```sql
INSERT INTO `rate` (`type`, `rate`) VALUES
('Ank', 1.95),
('Jodi', 9.5),
('jodi', 80.0);
```

-- 3) Users
```sql
INSERT INTO `users` (`mobile_number`, `username`, `password`, `date_signup`, `balance`, `account_number`, `account_holder_name`, `ifsc_code`, `upi_id`) VALUES
('9876543210', 'alice', 'password123', '2025-12-01 09:00:00', 10000, '123456789012', 'Alice A', 'ABCD0123456', 'alice@upi'),
('9123456789', 'bob', 'hunter2', '2025-12-02 10:30:00', 5000, '234567890123', 'Bob B', 'EFGH0001111', 'bob@upi'),
('9012345678', 'carol', 'passw0rd', '2025-12-03 11:00:00', 2500, NULL, NULL, NULL, NULL);
```

-- 4) Active games (current configured games and any declared open/close results)
-- Note: DB columns are named `open` and `close` (Java mapped fields may differ), so we write to those columns.
```sql
INSERT INTO `active_games` (`game_name`, `open`, `close`) VALUES
('MADHUR', NULL, NULL),     -- not declared yet
('MALINI', 12, NULL),       -- open declared as 12
('SRIDEVI', NULL, 77);      -- close declared as 77
```

-- 5) Game history (example previous-day results)
```sql
INSERT INTO `game_history` (`game_name`, `hist_date`, `open`, `close`) VALUES
('MADHUR', '2025-12-31', 5, 25),
('MALINI', '2025-12-31', 12, 34),
('SRIDEVI', '2025-12-31', 7, 77);
```

-- 5b) Additional game history (two more prior days)
```sql
INSERT INTO `game_history` (`game_name`, `hist_date`, `open`, `close`) VALUES
('MADHUR', '2025-12-30', 3, 21),
('MALINI', '2025-12-30', 10, 32),
('SRIDEVI', '2025-12-30', 9, 66),
('MADHUR', '2025-12-29', 8, 28),
('MALINI', '2025-12-29', 4, 14),
('SRIDEVI', '2025-12-29', 2, 55);
```

-- 6) Bets (active bets table)
```sql
INSERT INTO `bets` (`mobile_number`, `game_name`, `type`, `amount`, `bet_value`, `open_close`, `bet_time`) VALUES
('9876543210', 'MADHUR', 'Ank', 100, 5, 'Open', '2025-12-31 12:15:00'),
('9123456789', 'MALINI', 'Jodi', 50, 12, 'Open', '2025-12-31 14:05:00'),
('9012345678', 'SRIDEVI', 'jodi', 10, 77, 'Close', '2025-12-31 20:30:00');
```

-- 7) Bets history (example past bets)
```sql
INSERT INTO `bets_history` (`mobile_number`, `game_name`, `bet_time`, `type`, `amount`, `bet_value`, `open_close`) VALUES
('9876543210', 'MADHUR', '2025-12-31 12:15:00', 'Ank', 100, 5, 'Open'),
('9123456789', 'MALINI', '2025-12-31 14:05:00', 'Jodi', 50, 12, 'Open');
```

-- 7b) Additional bets history for the two extra days
```sql
INSERT INTO `bets_history` (`mobile_number`, `game_name`, `bet_time`, `type`, `amount`, `bet_value`, `open_close`) VALUES
('9876543210', 'MADHUR', '2025-12-30 11:45:00', 'Ank', 150, 3, 'Open'),
('9123456789', 'MALINI', '2025-12-30 15:20:00', 'Jodi', 75, 10, 'Open'),
('9012345678', 'SRIDEVI', '2025-12-30 20:10:00', 'jodi', 20, 66, 'Close'),
('9876543210', 'MADHUR', '2025-12-29 13:30:00', 'Ank', 200, 8, 'Close'),
('9123456789', 'MALINI', '2025-12-29 16:40:00', 'Jodi', 100, 4, 'Open'),
('9012345678', 'SRIDEVI', '2025-12-29 21:05:00', 'jodi', 5, 55, 'Close');
```

-- 8) Transactions
```sql
INSERT INTO `transactions` (`mobile_number`, `amount`, `tx_date`, `tx_time`) VALUES
('9876543210', 5000, '2025-12-01', '09:05:00'),
('9123456789', 2000, '2025-12-02', '10:45:00');
```

-- 9) Properties
```sql
INSERT INTO `properties` (`prop_key`, `prop_value`) VALUES
('min_bet_amount', '10'),
('max_bet_amount', '10000'),
('maintenance_mode', 'false');
```

-- Notes
-- * Adjust the date/time literals to match your DB timezone/format. These statements are MySQL-compatible.
-- * If you have foreign key constraints, you may need to disable or insert in a specific order (rates/games/users before bets).
-- * If any of the tables use different column names in your DB, adapt the insert column lists accordingly.

-- End of dummy data
