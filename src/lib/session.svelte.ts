import { ApiError, request } from '#lib/api.ts';

export type Role = 'ADMINISTRATOR' | 'TEAM_MEMBER';

export type CurrentUser = {
	id: string;
	username: string;
	email: string;
	first_name: string;
	last_name: string;
	name: string;
	role: Role;
	is_administrator: boolean;
};

class Session {
	user = $state<CurrentUser | null>(null);
	checked = $state(false);
	#pending: Promise<CurrentUser | null> | null = null;

	get isAdmin() {
		return this.user?.is_administrator ?? false;
	}

	/** Resolves the signed-in user once per page load; later calls reuse the result. */
	load(force = false): Promise<CurrentUser | null> {
		if (this.checked && !force) return Promise.resolve(this.user);
		this.#pending ??= request<CurrentUser>('/auth/me/', { quietUnauthorized: true })
			.then((user) => (this.user = user))
			.catch((error) => {
				if (error instanceof ApiError && error.isUnauthorized) return (this.user = null);
				throw error;
			})
			.finally(() => {
				this.checked = true;
				this.#pending = null;
			});
		return this.#pending;
	}

	async login(username: string, password: string) {
		this.user = await request<CurrentUser>('/auth/login/', {
			method: 'POST',
			json: { username, password },
			quietUnauthorized: true
		});
		this.checked = true;
		return this.user;
	}

	async logout() {
		try {
			await request('/auth/logout/', { method: 'POST', quietUnauthorized: true });
		} finally {
			this.user = null;
			this.checked = true;
		}
	}

	expire() {
		this.user = null;
		this.checked = true;
	}
}

export const session = new Session();
