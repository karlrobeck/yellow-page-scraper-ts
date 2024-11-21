import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema.createTable("business_info")
		.addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
		.addColumn("email", "text")
		.addColumn("address", "text")
		.addColumn("website", "text")
		.addColumn("social", "text")
		.addColumn(
			"business_id",
			"integer",
			(col) => col.notNull().references("business.id"),
		)
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("business_info").execute();
}
