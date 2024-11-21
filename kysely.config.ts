import { defineConfig } from "kysely-ctl";
import { Database as SQLite } from "bun:sqlite";
import { BunSqliteDialect } from "kysely-bun-sqlite";

export default defineConfig({
    dialect: new BunSqliteDialect({
        database: new SQLite(process.env.DATABASE_URL!),
    }),
});
