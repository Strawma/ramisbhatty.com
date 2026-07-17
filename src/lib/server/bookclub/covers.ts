interface OpenLibraryDocument {
	cover_i?: number;
}

interface OpenLibrarySearchResponse {
	docs?: unknown[];
}

const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const COVER_LOOKUP_TIMEOUT_MS = 5_000;

function hasCover(document: unknown): document is OpenLibraryDocument {
	return (
		typeof document === 'object' &&
		document !== null &&
		'cover_i' in document &&
		typeof document.cover_i === 'number' &&
		Number.isInteger(document.cover_i) &&
		document.cover_i > 0
	);
}

export async function findBookCover(
	fetcher: typeof fetch,
	title: string,
	author: string
): Promise<string | null> {
	const url = new URL(OPEN_LIBRARY_SEARCH_URL);
	url.searchParams.set('title', title);
	url.searchParams.set('author', author);
	url.searchParams.set('limit', '5');
	url.searchParams.set('fields', 'title,author_name,cover_i');

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), COVER_LOOKUP_TIMEOUT_MS);

	try {
		const response = await fetcher(url, {
			headers: { accept: 'application/json', 'user-agent': 'ramisbhatty.com book club' },
			signal: controller.signal
		});
		if (!response.ok) return null;

		const payload = (await response.json()) as OpenLibrarySearchResponse;
		const cover = payload.docs?.find(hasCover);

		return cover ? `https://covers.openlibrary.org/b/id/${cover.cover_i}-L.jpg` : null;
	} catch {
		return null;
	} finally {
		clearTimeout(timeout);
	}
}
