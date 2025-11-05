# Backend (Spring Boot) — README

This README explains how to build, run and test the Spring Boot backend located in `backend/`.

## Prerequisites
- Java 17 (OpenJDK 17)
- Maven (or use the included Maven wrapper `mvnw.cmd` on Windows)
- MySQL server running and accessible (or adjust datasource to another DB)
- (Optional) Postman or curl for calling the HTTP endpoints

Project package: `com.matka.backend`

## Database configuration
The project reads datasource configuration from `src/main/resources/application.properties`. By default it is configured to:

```
spring.datasource.url=jdbc:mysql://localhost:3306/matka_user_db
spring.datasource.username=papa
spring.datasource.password=papa@123
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
```

Change these values if your MySQL credentials or database name differ.

### Create the database and grant privileges
Open a MySQL client (or MySQL Workbench) and run:

```sql
CREATE DATABASE IF NOT EXISTS matka_user_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- If the user doesn't exist, create it (example):
CREATE USER IF NOT EXISTS 'papa'@'localhost' IDENTIFIED BY 'papa@123';
GRANT ALL PRIVILEGES ON matka_user_db.* TO 'papa'@'localhost';
FLUSH PRIVILEGES;
```

Notes:
- The JPA entity `User` maps its primary key to `mobile_number` (see `User.java`).
- `spring.jpa.hibernate.ddl-auto=update` will create or update the `users` table if it does not exist, but it will not change existing primary keys or drop unique constraints. If you drop the `users` table and restart the app, Hibernate will recreate it according to the entity mapping.

## Build
Open PowerShell in the `backend` folder and run:

```powershell
# Using the included Maven wrapper (Windows)
.\mvnw.cmd clean package

# Or if you have Maven installed globally
mvn clean package
```

To skip tests during the build:

```powershell
.\mvnw.cmd clean package -DskipTests
```

## Run
Start the application (keep this terminal open to watch logs):

```powershell
# Using Maven wrapper
.\mvnw.cmd spring-boot:run

# Or run the JAR after building
java -jar target\backend-0.0.1-SNAPSHOT.jar
```

The app runs by default on `http://localhost:8080`. Controller logs (INFO) are printed to the console.

## API endpoints
Base path: `/api/auth`

- `POST /api/auth/signup` — register a new user
  - JSON body: `{ "mobileNumber": "<mobile>", "username": "<name>", "password": "<pw>" }`
  - On success: HTTP 200, body: `"Signup successful"`

- `POST /api/auth/login` — login using mobile number and password
  - JSON body: `{ "usernameOrMobile": "<mobile>", "password": "<pw>" }`
  - On success: HTTP 200, body: `"Login successful"`

Notes:
- The code currently requires login by mobile number only (username is not unique). Passwords are hashed with BCrypt before being stored.
- Security configuration allows unauthenticated access to `/api/auth/**`.

## Test the API (examples)

Using PowerShell (recommended):

```powershell
$body = @{ mobileNumber = '9991112222'; username = 'testuser'; password = 'Paw0rd' } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/signup' -Method Post -ContentType 'application/json' -Body $body
```

Using curl.exe (if installed):

```powershell
curl.exe -X POST "http://localhost:8080/api/auth/signup" -H "Content-Type: application/json" -d "{\"mobileNumber\":\"9991112222\",\"username\":\"testuser\",\"password\":\"Paw0rd\"}"
```

Using Postman:
- Method: POST
- URL: `http://localhost:8080/api/auth/signup`
- Headers: `Content-Type: application/json`
- Body: raw JSON as above

Watch the application console for log lines like:

```
Received signup request for mobile='9991112222', username='testuser'
Signup successful for mobile='9991112222'
```

## Verify the DB entry
Connect to MySQL and run:

```sql
USE matka_user_db;
SELECT mobile_number, username, password FROM users WHERE mobile_number = '9991112222';
```

The `password` column should contain a BCrypt hash (starts with `$2a$` or `$2b$`).

## Troubleshooting
- 401 Unauthorized on `/api/auth/**`: make sure the `SecurityConfig` class is present (it permits `/api/auth/**`). Restart the app after changes.
- No logs in the console when calling an endpoint: ensure you started the app in the foreground (e.g. `mvnw.cmd spring-boot:run`) and that the request targets the correct URL and port.
- Table schema mismatch (columns named differently): the `User` entity explicitly maps to `mobile_number`. If an older `users` table exists with different columns, either drop it (Hibernate will recreate) or ALTER it to match the entity. Always backup before destructive changes.

## Development tips
- To run tests without MySQL, consider adding a `src/test/resources/application-test.properties` that configures an in-memory H2 database and activate that profile for tests.
- Keep `spring.jpa.hibernate.ddl-auto=update` for development; use `validate` in production and manage schema changes with migrations (Flyway or Liquibase).


