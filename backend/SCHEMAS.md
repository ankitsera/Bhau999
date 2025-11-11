# Database Schemas (current mapping from JPA entities)

This file documents the current table schemas as implied by the JPA entities in `src/main/java/com/matka/backend`. Use these as the reference when creating or migrating the database schema. These CREATE TABLE statements are suggestions matching the entities; adjust types/lengths to suit your MySQL settings.

---

## users

```sql
CREATE TABLE users (
  mobile_number VARCHAR(10) PRIMARY KEY,
  username VARCHAR(255),
  password VARCHAR(255) NOT NULL,
  date_signup DATETIME,
  balance INT
);
```

Notes:
- `mobile_number` is the primary key and must be exactly 10 digits (application-level validation).
- Passwords are stored as BCrypt hashes.

## game

```sql
CREATE TABLE game (
  name VARCHAR(200) NOT NULL PRIMARY KEY,
  open_time TIME,
  close_time TIME
);
```

Notes:
- `name` is the primary key (normalized to uppercase by the API).

## rate

```sql
CREATE TABLE rate (
  `type` VARCHAR(100) NOT NULL PRIMARY KEY,
  `rate` DOUBLE NOT NULL
);
```

Notes:
- `type` is used as a natural key (e.g., 'SINGLE', 'DOUBLE'). Keep it short and stable.

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
- `tx_date` and `tx_time` are set by the server if not provided.

## bets

```sql
CREATE TABLE bets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  mobile_number VARCHAR(10) NOT NULL,
  game_name VARCHAR(200) NOT NULL,
  bet_date DATE NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  amount INT NOT NULL,
  FOREIGN KEY (mobile_number) REFERENCES users(mobile_number),
  FOREIGN KEY (game_name) REFERENCES game(name),
  FOREIGN KEY (`type`) REFERENCES rate(`type`)
);
```

Notes:
- `game_name` references `game.name` (names are normalized to uppercase by the API).

## bets_history

```sql
CREATE TABLE bets_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  mobile_number VARCHAR(10) NOT NULL,
  game_name VARCHAR(200) NOT NULL,
  bet_date DATE NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  amount INT NOT NULL,
  FOREIGN KEY (mobile_number) REFERENCES users(mobile_number),
  FOREIGN KEY (game_name) REFERENCES game(name),
  FOREIGN KEY (`type`) REFERENCES rate(`type`)
);
```

## active_games

```sql
CREATE TABLE active_games (
  game_name VARCHAR(200) PRIMARY KEY,
  `open` INT,
  `close` INT,
  FOREIGN KEY (game_name) REFERENCES game(name)
);
```

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