/**
 * Tests for Factory<T> — in-memory (make/makeMany) and mock-db (create/createMany).
 */

import { describe, it, expect } from "vitest";
import { Factory } from "@nexusts/drizzle";

/** Minimal mock DB that records inserted rows. */
function makeMockDb() {
	const inserted: any[][] = [];
	return {
		inserted,
		insert(table: any) {
			return {
				async values(rows: any) {
					inserted.push(Array.isArray(rows) ? rows : [rows]);
				},
			};
		},
	};
}

const fakeTable = Symbol("users");

describe("Factory — make / makeMany", () => {
	it("make() returns generated data", async () => {
		const f = new Factory(fakeTable, () => ({ email: "alice@example.com", age: 30 }));
		const row = await f.make();
		expect(row).toEqual({ email: "alice@example.com", age: 30 });
	});

	it("make() applies overrides", async () => {
		const f = new Factory(fakeTable, () => ({ email: "alice@example.com", age: 30 }));
		const row = await f.make({ email: "bob@example.com" });
		expect(row).toEqual({ email: "bob@example.com", age: 30 });
	});

	it("makeMany() returns correct count", async () => {
		let n = 0;
		const f = new Factory(fakeTable, () => ({ id: ++n }));
		const rows = await f.makeMany(5);
		expect(rows).toHaveLength(5);
		expect(rows.map((r) => r.id)).toEqual([1, 2, 3, 4, 5]);
	});

	it("makeMany() applies overrides to every row", async () => {
		const f = new Factory(fakeTable, () => ({ role: "user", active: true }));
		const rows = await f.makeMany(3, { role: "admin" });
		for (const r of rows) expect(r.role).toBe("admin");
	});

	it("makeMany(0) returns empty array", async () => {
		const f = new Factory(fakeTable, () => ({ x: 1 }));
		expect(await f.makeMany(0)).toEqual([]);
	});
});

describe("Factory — create / createMany", () => {
	it("create() inserts one row and returns data", async () => {
		const db = makeMockDb();
		const f = new Factory(fakeTable, () => ({ email: "alice@example.com" }));
		const row = await f.create(db);
		expect(row).toEqual({ email: "alice@example.com" });
		expect(db.inserted).toHaveLength(1);
		expect(db.inserted[0]).toEqual([{ email: "alice@example.com" }]);
	});

	it("create() applies overrides before inserting", async () => {
		const db = makeMockDb();
		const f = new Factory(fakeTable, () => ({ role: "user", name: "default" }));
		const row = await f.create(db, { role: "admin" });
		expect(row.role).toBe("admin");
		expect(db.inserted[0]?.[0]?.role).toBe("admin");
	});

	it("createMany() inserts all rows in one call", async () => {
		const db = makeMockDb();
		const f = new Factory(fakeTable, () => ({ score: 0 }));
		const rows = await f.createMany(db, 4);
		expect(rows).toHaveLength(4);
		expect(db.inserted).toHaveLength(1);
		expect(db.inserted[0]).toHaveLength(4);
	});

	it("createMany(db, 0) skips insert and returns []", async () => {
		const db = makeMockDb();
		const f = new Factory(fakeTable, () => ({ x: 1 }));
		const rows = await f.createMany(db, 0);
		expect(rows).toEqual([]);
		expect(db.inserted).toHaveLength(0);
	});
});

describe("Factory — faker unavailable", () => {
	it("make() without faker parameter works fine", async () => {
		const f = new Factory(fakeTable, () => ({ static: true }));
		const row = await f.make();
		expect(row.static).toBe(true);
	});
});
