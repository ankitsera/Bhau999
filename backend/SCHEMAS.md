# Database Schemas (summary)

This file summarizes the important tables/columns and recent changes to the schema that the backend expects.

Important tables and relevant columns

- `game` (primary key: `name` VARCHAR)
  - `name` VARCHAR PRIMARY KEY
  - `open_time` TIME NULL  -- when the game opens each day
  - `close_time` TIME NULL -- when the game closes each day

- `bets` (active bets)
  - `id` BIGINT AUTO_INCREMENT
  - `mobile_number` VARCHAR (FK to `users.mobile_number`)
  - `game_name` VARCHAR (FK to `game.name`)
  - `type` VARCHAR (FK to `rate.type`)
  - `amount` INT
  - `bet_value` INT
  - `open_close` VARCHAR ("Open" | "Close" | NULL)
  - `bet_time` DATETIME  -- NOTE: changed from a DATE/TIME column to DATETIME
  - `result` VARCHAR NULL ("Won" | "Lost" | NULL)

- `bets_history` (archived bets)
  - same columns as `bets` but persisted historically
  - uses `bet_time` DATETIME as well

- `transactions`
  - `id` BIGINT AUTO_INCREMENT
  - `mobile_number` VARCHAR
  - `amount` INT
  - `tx_date` DATE
  - `tx_time` TIME
  - `initiator` VARCHAR NULL  -- new column; values like "Admin" or "Bet placed"
  - `status` VARCHAR NULL     -- new column; e.g., "Pending", "Approved", "Rejected"
  - `remarks` VARCHAR(100) NULL -- new column for short notes

Notes and migration hints
- `bets.bet_time` changed to DATETIME: you'll need to alter the column type in MySQL:
  - ALTER TABLE `bets` MODIFY COLUMN `bet_time` DATETIME NULL;
  - ALTER TABLE `bets_history` MODIFY COLUMN `bet_time` DATETIME NULL;

- `transactions` new columns sample ALTERs:
  - ALTER TABLE `transactions` ADD COLUMN `initiator` VARCHAR(100) NULL;
  - ALTER TABLE `transactions` ADD COLUMN `status` VARCHAR(50) NULL;
  - ALTER TABLE `transactions` ADD COLUMN `remarks` VARCHAR(100) NULL;

If you use migrations (Flyway/Liquibase) add proper migration files to make these schema edits reproducible.
# Database Schemas (current mapping from JPA entities)

This file documents the current table schemas as implied by the JPA entities in `src/main/java/com/matka/backend`. Use these as the reference when creating or migrating the database schema. These CREATE TABLE statements are suggestions matching the entities; adjust types/lengths to suit your MySQL settings.

---

## users

```sql
CREATE TABLE users (
  mobile_number VARCHAR(10) PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  date_signup DATETIME,
  balance INT DEFAULT 0,
  account_holder_name VARCHAR(255),
  account_number VARCHAR(255),
  ifsc_code VARCHAR(50),
  upi_id VARCHAR(255)
);
```

Notes:

* `mobile_number` is the primary key and is used throughout the schema as the canonical user identifier.
* This project currently stores passwords in plain text (development mode). This is insecure — for production you MUST switch to hashed passwords (BCrypt/Argon2) and plan a migration for existing passwords.

---

## game

```sql
CREATE TABLE game (
  name VARCHAR(200) NOT NULL PRIMARY KEY,
  open_time TIME,
  close_time TIME
);
```

Notes:

* `name` is the primary key (APIs normalize game names to uppercase).

---

## rate

```sql
CREATE TABLE rate (
  `type` VARCHAR(100) NOT NULL PRIMARY KEY,
  `rate` DOUBLE NOT NULL
);
```

Notes:

* `type` is used as a natural key (e.g., 'SINGLE', 'DOUBLE'). Keep it short and stable.

---

## transactions

```sql
CREATE TABLE transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  mobile_number VARCHAR(10) NOT NULL,
  amount INT NOT NULL,
  tx_date DATE NOT NULL,
  tx_time TIME NOT NULL,
  FOREIGN KEY (mobile_number) REFERENCES users(mobile_number)
);
```

Notes:

* `tx_date` and `tx_time` are set by the server if not provided.

---

## bets

```sql
CREATE TABLE bets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  mobile_number VARCHAR(10) NOT NULL,
  game_name VARCHAR(200) NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  amount INT NOT NULL,
  bet_value INT,
  open_close VARCHAR(20),
  FOREIGN KEY (mobile_number) REFERENCES users(mobile_number),
  FOREIGN KEY (game_name) REFERENCES game(name),
  FOREIGN KEY (`type`) REFERENCES rate(`type`)
);
```

Notes:

* The `bet_date` column was removed from the live `bets` table; the application no longer stores per-bet dates.
* Historical bets are kept in `bets_history` with a `bet_date` assigned by the daily rollup job.

---

## bets_history

```sql
CREATE TABLE bets_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  mobile_number VARCHAR(10) NOT NULL,
  game_name VARCHAR(200) NOT NULL,
  bet_date DATE NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  amount INT NOT NULL,
  bet_value INT,
  open_close VARCHAR(20),
  FOREIGN KEY (mobile_number) REFERENCES users(mobile_number),
  FOREIGN KEY (game_name) REFERENCES game(name),
  FOREIGN KEY (`type`) REFERENCES rate(`type`)
);
```

Notes:

* `bets_history` stores snapshots of bets. The daily rollup job moves current bets into `bets_history` and sets `bet_date` to the previous day.

---

## active_games

```sql
CREATE TABLE active_games (
  game_name VARCHAR(200) PRIMARY KEY,
  `open` INT,
  `close` INT,
  FOREIGN KEY (game_name) REFERENCES game(name)
);
```

Notes:

* `active_games` holds the in-play open/close values for each game. The daily rollup job moves these into `game_history` and re-populates `active_games` from the `game` table.

---

## game_history

```sql
CREATE TABLE game_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  game_name VARCHAR(200) NOT NULL,
  hist_date DATE NOT NULL,
  `open` INT,
  `close` INT,
  FOREIGN KEY (game_name) REFERENCES game(name)
);
```

Notes:

* `game_history` stores daily snapshots of `active_games` (hist_date is the snapshot date).

---

## Migration notes (recent changes)

* Added columns to `users`: `account_holder_name`, `account_number`, `ifsc_code`, `upi_id`.

  * If you are not using automatic schema updates, run an ALTER TABLE to add these columns.

* Removed `bet_date` from `bets`. If you have historical bet data, migrate it into `bets_history` with the correct dates before dropping the column.

* A scheduled daily rollup (02:00 server time) moves rows:

  * `active_games` -> `game_history` (hist_date = yesterday)
  * `game` -> `active_games` (repopulate with null open/close)
  * `bets` -> `bets_history` (bet_date = yesterday), then clears `bets`

---

## Security note

* The repository currently stores passwords in plain text by explicit request during development. This is unsafe for any real deployment. Before production, enable a PasswordEncoder (BCrypt/Argon2), migrate stored passwords, and secure endpoints.
