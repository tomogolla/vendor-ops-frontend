import { ApiError } from '#lib/api.ts';

/** Loading / error / data state for one async request, with retry. Stale responses are ignored. */
export class Resource<T> {
	data = $state<T | undefined>();
	error = $state<Error | null>(null);
	loading = $state(false);
	#run = 0;
	#fetcher: (() => Promise<T>) | null = null;

	get loaded() {
		return this.data !== undefined;
	}

	get forbidden() {
		return this.error instanceof ApiError && this.error.isForbidden;
	}

	get notFound() {
		return this.error instanceof ApiError && this.error.status === 404;
	}

	async load(fetcher?: () => Promise<T>) {
		if (fetcher) this.#fetcher = fetcher;
		if (!this.#fetcher) return;
		const run = ++this.#run;
		this.loading = true;
		this.error = null;
		try {
			const data = await this.#fetcher();
			if (run === this.#run) this.data = data;
		} catch (error) {
			if (run === this.#run) this.error = error instanceof Error ? error : new Error(String(error));
		} finally {
			if (run === this.#run) this.loading = false;
		}
	}

	retry = () => this.load();
}
