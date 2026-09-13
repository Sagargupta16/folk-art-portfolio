import { sql } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "@/lib/db/client";

/**
 * Lock and validate the complete list in the same statement as its update.
 * A failed membership check changes no rows; row locks prevent a concurrent
 * deletion from turning a validated reorder into a partial write.
 * Authorization stays in the owning server action.
 */
export async function saveCompleteOrder({
	table,
	key,
	group,
	ids,
	label,
}: {
	table: PgTable;
	key: AnyPgColumn;
	group?: AnyPgColumn;
	ids: string[];
	label: string;
}): Promise<void> {
	if (
		!Array.isArray(ids) ||
		ids.length === 0 ||
		ids.some((id) => typeof id !== "string" || !id.trim())
	) {
		throw new Error(`Provide the complete ${label.toLowerCase()} list before saving its order.`);
	}
	if (new Set(ids).size !== ids.length) {
		throw new Error(`${label} order contains duplicate entries. Refresh and try again.`);
	}
	const requested = sql.join(
		ids.map((id, index) => sql`(${id}::text, ${index + 1}::integer)`),
		sql`, `,
	);
	const scope = group
		? sql`${group} = (select ${group} from ${table} where ${key} = ${ids[0]})`
		: sql`true`;
	const updated = await db.execute(sql`
		with requested(id, position) as (values ${requested}),
		current_rows as materialized (
			select ${key} as id from ${table}
			where ${scope}
			order by ${key}
			for update
		),
		validation as (
			select count(*) = ${ids.length}
				and count(requested.id) = ${ids.length} as matches
			from current_rows left join requested using (id)
		)
		update ${table} set "order" = requested.position
		from requested, validation
		where ${key} = requested.id and validation.matches
		returning ${key}
	`);
	if (updated.rows.length !== ids.length) {
		throw new Error(`${label} list changed. Refresh and try again.`);
	}
}
