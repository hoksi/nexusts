/**
 * Sample UserService.
 *
 * Shows the Nest-style DI pattern: the service is `@Injectable()`, and
 * any controller that depends on it via constructor injection is wired
 * automatically by the container.
 */
import { Injectable } from "../../core/decorators/injectable.js";

export interface User {
	id: number;
	name: string;
	email: string;
}

@Injectable()
export class UserService {
	private users: User[] = [
		{ id: 1, name: "Alice", email: "alice@example.com" },
		{ id: 2, name: "Bob", email: "bob@example.com" },
	];

	findAll(): User[] {
		return this.users;
	}

	findById(id: number): User | undefined {
		return this.users.find((u) => u.id === id);
	}

	create(data: Omit<User, "id">): User {
		const id = this.users.length + 1;
		const user = { id, ...data };
		this.users.push(user);
		return user;
	}

	update(id: number, data: Partial<Omit<User, "id">>): User | undefined {
		const idx = this.users.findIndex((u) => u.id === id);
		if (idx === -1) return undefined;
		this.users[idx] = { ...this.users[idx], ...data };
		return this.users[idx];
	}

	delete(id: number): boolean {
		const idx = this.users.findIndex((u) => u.id === id);
		if (idx === -1) return false;
		this.users.splice(idx, 1);
		return true;
	}
}
