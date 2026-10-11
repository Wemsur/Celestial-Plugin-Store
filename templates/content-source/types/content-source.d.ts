/**
 * The type surface a Celestial Launcher content source is written against.
 *
 * A content source is its own kind of plugin: it shows no launcher UI and owns
 * no slots or routes. All it does is answer content questions — what exists,
 * what a project looks like, and how to fetch a file — and the launcher decides
 * where that file lands. That split is the whole safety property: a source can
 * propose content, never place it.
 *
 * A source's entry module exports `activate(api)`. Inside, it calls
 * `api.register(provider)` once with the functions its manifest's `capabilities`
 * claim. Implement only those; the launcher calls nothing else.
 *
 * These types mirror the launcher at content-source API version 1. Keep
 * `api_version` in the manifest in step with the version documented here.
 */

declare module '@celestial/content-source' {
	/** The launcher's closed set of content types. A source may only serve these. */
	export type ContentType =
		| 'mod'
		| 'modpack'
		| 'resourcepack'
		| 'shader'
		| 'datapack'
		| 'world'
		| 'skin'

	/** Sort keys the launcher can ask for. */
	export type ContentSort = 'relevance' | 'downloads' | 'follows' | 'newest' | 'updated'

	/**
	 * What a source can do, declared in its manifest. Anything `false` only
	 * degrades the UI: a source that cannot `resolveDownload` still browses, its
	 * install button just says so instead.
	 */
	export interface SourceCapabilities {
		/** Free-text search. */
		search: boolean
		/** Listing content without a query. */
		browse: boolean
		/** A full project page with a description and gallery. */
		detail: boolean
		/** A version list for a project. */
		versions: boolean
		/** Produce a fetchable file for a project/version. */
		resolveDownload: boolean
		/** Given installed items, report whether newer versions exist. */
		updateCheck: boolean
	}

	/**
	 * One field of the form the launcher renders so the user can add an entry by
	 * hand, for a source with no browsing of its own.
	 *
	 * The launcher owns the form and where the answers are kept; the source reads
	 * them back out of its own storage under the key `manualEntries`, as a JSON
	 * array of objects keyed by each field's `key`.
	 */
	export interface ManualEntryField {
		key: string
		label: string
		description?: string
		placeholder?: string
		/** A regex the value must match; the form shows a hint when it does not. */
		pattern?: string
		/**
		 * Present when the field is a choice rather than free text; the form then
		 * renders a dropdown. Used for the content type an entry belongs to, so one
		 * entry does not appear under every tab the source serves.
		 */
		options?: SourceSettingOption[]
		required?: boolean
	}

	export type SourceSettingType = 'toggle' | 'text' | 'number' | 'select'

	export interface SourceSettingOption {
		value: string
		label?: string
	}

	/** A setting the launcher renders as a form and stores for the source. */
	export interface SourceSettingField {
		key: string
		label: string
		description?: string
		type: SourceSettingType
		default?: string
		options?: SourceSettingOption[]
	}

	/**
	 * How your project body is presented. The launcher renders it, so no HTML
	 * from a source ever reaches the page unparsed.
	 */
	export type SourceDetailFormat = 'markdown' | 'text'

	/**
	 * The `manifest.json` a content source ships. Its shape is what the launcher
	 * validates and shows in the source manager.
	 */
	export interface ContentSourceManifest {
		/** Doubles as the source's folder name; letters, digits, `.`, `-`, `_`. */
		id: string
		name: string
		version: string
		description?: string
		author?: string
		homepage?: string
		/**
		 * An image in your own folder to show as the source's icon, e.g.
		 * `icon.svg`. Anything the webview can display works (svg, png, webp).
		 * Without one the launcher draws your name's first character instead.
		 */
		icon?: string
		/**
		 * Your theme colour as `#rrggbb`. It fills that fallback icon and tints
		 * your cards; absent means no tint.
		 */
		color?: string
		/** How `detail`'s body is presented. Defaults to `markdown`. */
		detail_format?: SourceDetailFormat
		api_version: number
		/** The bundle to load, relative to the source folder. */
		entry: string
		content_types: ContentType[]
		capabilities: SourceCapabilities
		/** Hosts the source may reach, as `example.com` or `*.example.com`. */
		hosts: string[]
		/** Set when the source needs a sign-in before it works. */
		auth?: { required: boolean; login_url?: string; help_url?: string }
		manual_entry?: ManualEntryField[]
		settings?: SourceSettingField[]
	}

	/** A search or browse request, in neutral terms. */
	export interface ContentQuery {
		query?: string
		contentType: ContentType
		gameVersion?: string
		loader?: string
		sort: ContentSort
		/** 1-based. */
		page: number
		limit: number
		category?: string
		filters?: Record<string, unknown>
	}

	/** One card in the merged Discover list. */
	export interface ContentCard {
		sourceId: string
		/** The source's own id for this project; unique within the source. */
		id: string
		contentType: ContentType
		name: string
		summary?: string
		iconUrl?: string
		author?: string
		/** Raw count; the launcher applies the source's multiplier when sorting. */
		downloads?: number
		follows?: number
		/** ISO 8601. */
		publishedAt?: string
		updatedAt?: string
		gameVersions?: string[]
		loaders?: string[]
		tags?: string[]
	}

	export interface ContentPage {
		items: ContentCard[]
		total: number
	}

	/**
	 * One sidebar filter group your source offers, e.g. its own categories.
	 *
	 * A group whose `header` matches a built-in one — `categories`, `features`,
	 * `performance impact` — is merged into that section's options; any other
	 * header stands as its own section. Option ids are unique within the group
	 * and are handed back to `search`/`browse` in `ContentQuery.filters`.
	 */
	export interface SourceFilterGroup {
		id: string
		header: string
		options: SourceFilterOption[]
	}

	export interface SourceFilterOption {
		id: string
		/** Shown label; falls back to the id. */
		label?: string
	}

	/** An alias kept for readability at the call sites of `filters`. */
	export type ContentFilterGroup = SourceFilterGroup
	export type ContentFilterOption = SourceFilterOption

	/** One file of a modpack plan: where to fetch it and what to call it. */
	export interface ContentModpackFile {
		url: string
		fileName: string
		/** sha1, when the source can supply one; recorded unverified when absent. */
		hashSha1?: string
		/**
		 * Instance-relative directory the file belongs in — `mods`,
		 * `resourcepacks`, `shaderpacks`. Defaults to `mods`.
		 */
		folder?: string
	}

	/**
	 * What a modpack zip expands to, once its manifest is understood. The
	 * launcher creates the instance from `gameVersion`/`loader`, downloads every
	 * file, and unpacks the zip's overrides — a source never writes an instance.
	 */
	export interface ContentModpackPlan {
		gameVersion: string
		loader: 'vanilla' | 'forge' | 'neoforge' | 'fabric' | 'quilt'
		loaderVersion?: string
		files: ContentModpackFile[]
	}

	/**
	 * One downloadable file inside a version. A version that offers several — a
	 * GitHub release with one asset per loader, say — lists them so the user can
	 * pick, instead of your matching rule deciding silently.
	 */
	export interface ContentFile {
		/** Your own id for this file; it is handed back to `resolveDownload`. */
		id: string
		name: string
		/** Bytes, when known. */
		size?: number
	}

	export interface ContentVersion {
		id: string
		name?: string
		versionNumber?: string
		gameVersions?: string[]
		loaders?: string[]
		publishedAt?: string
		downloads?: number
		channel?: string
		/** The changelog for this version, in your declared `detail_format`. */
		body?: string
		/** The page for this version on your site, when it has one. */
		url?: string
		/** The files this version offers, when there is more than one worth showing. */
		files?: ContentFile[]
	}

	/** A project page. Every field past the card is optional; the page degrades. */
	export interface ContentProject extends ContentCard {
		body?: string
		gallery?: { url: string; title?: string }[]
		license?: string
		links?: { label: string; url: string }[]
		versions?: ContentVersion[]
	}

	/**
	 * Everything the launcher needs to fetch one file.
	 *
	 * The source does not place the file: it says where the bytes are and what
	 * the fetch needs, and the launcher installs it into the right folder for the
	 * content type. `hash` is optional — a source that cannot supply one is
	 * downloaded and recorded without verification.
	 */
	export interface DownloadDescriptor {
		url: string
		/** Headers the fetch needs (Referer, User-Agent, Cookie). */
		headers?: Record<string, string>
		/** Suggested name; the launcher falls back to the URL's last segment. */
		fileName?: string
		hash?: { algorithm: 'sha1' | 'sha512'; value: string }
	}

	/** One installed item handed to a source for an update check. */
	export interface UpdateQueryItem {
		id: string
		contentType: ContentType
		/** The version this item is currently on, as the source gave it. */
		currentVersionId?: string
		gameVersion?: string
		loader?: string
		/** The rule it was installed under, round-tripped from the install. */
		installRule?: Record<string, unknown>
	}

	export interface UpdateResult {
		id: string
		/** The newer version, or undefined when the item is current. */
		latestVersionId?: string
		latestVersionName?: string
	}

	/** The functions a source provides. Implement only the ones it claims. */
	export interface ContentSourceProvider {
		search?(request: ContentQuery): Promise<ContentPage>
		browse?(request: ContentQuery): Promise<ContentPage>
		detail?(id: string, contentType: ContentType): Promise<ContentProject>
		versions?(id: string, request: ContentQuery): Promise<ContentVersion[]>
		/**
		 * `fileId` names one of the version's `files`, when the user picked one
		 * rather than letting your own rule choose.
		 */
		resolveDownload?(
			id: string,
			versionId?: string,
			fileId?: string,
		): Promise<DownloadDescriptor>
		checkUpdate?(items: UpdateQueryItem[]): Promise<UpdateResult[]>
		/**
		 * The sidebar filter groups you offer, per content type. The selections
		 * come back to `search`/`browse` as `request.filters` — a record of group
		 * id to the option ids the user ticked. Omit it and your source simply
		 * contributes no filter sections.
		 */
		filters?(contentType: ContentType): Promise<SourceFilterGroup[]>
		/**
		 * Turn a modpack's manifest (the raw `manifest.json` of a CurseForge-style
		 * pack, handed back by the launcher after it has staged the zip) into an
		 * install plan. This is where the per-file URLs get resolved, because the
		 * resolution is your API's business; the launcher then does the actual
		 * installing. Implement it only if your source serves modpacks.
		 */
		resolveModpack?(manifestJson: string): Promise<ContentModpackPlan>
	}

	export interface SourceFetchOptions {
		method?: string
		headers?: Record<string, string>
		body?: string
	}

	export interface SourceFetchResult {
		status: number
		ok: boolean
		headers: Record<string, string>
		body: string
		/** The final URL after redirects. */
		final_url?: string
	}

	/** The object handed to a source's `activate`. */
	export interface ContentSourceApi {
		/** Current launcher UI language, read live when the user changes it. */
		readonly i18n: { readonly locale: string }
		readonly source: {
			readonly id: string
			readonly name: string
			readonly version: string
			readonly manifest: ContentSourceManifest
		}
		/**
		 * Fetch through the launcher, which makes the request from Rust where the
		 * webview's CSP does not apply. The host must be one the manifest declared
		 * in `hosts`; anything else is refused. Unlike the launcher-plugin proxy
		 * this permits `cookie`, `referer`, `user-agent` and `authorization`,
		 * which content sites routinely require.
		 */
		readonly net: {
			fetch(url: string, options?: SourceFetchOptions): Promise<SourceFetchResult>
		}
		/** Key/value storage in the source's own data folder. */
		readonly storage: {
			get(key: string): Promise<string | null>
			set(key: string, value: string): Promise<void>
			remove(key: string): Promise<void>
			keys(): Promise<string[]>
		}
		/** Values of the settings the user filled in from the manifest. */
		readonly settings: {
			get(key: string): Promise<string | null>
			all(): Promise<Record<string, string>>
		}
		/** Register this source's provider. Call it once, from `activate`. */
		register(provider: ContentSourceProvider): void
		log(...args: unknown[]): void
	}

	/**
	 * The storage key the launcher keeps manually-added entries under: a JSON
	 * array of objects keyed by the `manual_entry` fields' `key`s. Read it with
	 * `api.storage.get('manualEntries')`.
	 */
	export type ManualEntriesStorageKey = 'manualEntries'

	/** Implement this in your entry module. */
	export function activate(api: ContentSourceApi): void | Promise<void>
}
