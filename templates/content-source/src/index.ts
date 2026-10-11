/**
 * 一个最小的内容源。
 *
 * 启动器加载后会调用一次 activate()，在里面 register 一个 provider。
 * 只实现 manifest 的 capabilities 里声明为 true 的方法——声明了却没实现，
 * 启动器真的会调，然后失败。
 *
 * 完整字段说明见 docs/api.md。
 */

import type {
	ContentCard,
	ContentPage,
	ContentProject,
	ContentQuery,
	ContentSourceApi,
	ContentVersion,
	DownloadDescriptor,
} from '@celestial/content-source'

/** 站点返回的形状。改成你站点实际的字段。 */
interface SiteItem {
	id: number
	title: string
	description: string | null
	icon: string | null
	views: number
	created_at: string
	body_markdown: string | null
	download_url: string
	slug: string
}

interface SitePage {
	hits: SiteItem[]
	total: number
}

const SITE = 'https://example.com/api'

export async function activate(api: ContentSourceApi) {
	/**
	 * 唯一的网络出口。只有 manifest.hosts 里声明过的域名能访问，其他一律被
	 * 后端拒绝——这是硬校验，绕不过去。
	 */
	async function get<T>(path: string): Promise<T> {
		const response = await api.net.fetch(`${SITE}${path}`, {
			headers: { accept: 'application/json' },
		})
		if (!response.ok) {
			throw new Error(`示例站 ${response.status} ${path}`)
		}
		return JSON.parse(response.body) as T
	}

	function toCard(item: SiteItem, contentType: string): ContentCard {
		return {
			sourceId: api.source.id,
			id: String(item.id),
			contentType: contentType as ContentCard['contentType'],
			name: item.title,
			summary: item.description ?? undefined,
			iconUrl: item.icon ?? undefined,
			downloads: item.views,
			publishedAt: item.created_at,
		}
	}

	api.register({
		async search(request: ContentQuery): Promise<ContentPage> {
			const params = new URLSearchParams({
				page: String(request.page),
				limit: String(request.limit),
			})
			if (request.query?.trim()) params.set('q', request.query.trim())

			const page = await get<SitePage>(`/search?${params.toString()}`)
			return {
				items: page.hits.map((hit) => toCard(hit, request.contentType)),
				total: page.total,
			}
		},

		async detail(id: string): Promise<ContentProject> {
			const item = await get<SiteItem>(`/item/${encodeURIComponent(id)}`)
			return {
				...toCard(item, 'mod'),
				// 按 manifest.detail_format 渲染；markdown 会经启动器消毒后显示。
				body: item.body_markdown ?? undefined,
				links: [{ label: '在示例站查看', url: `https://example.com/item/${item.slug}` }],
			}
		},

		async versions(id: string): Promise<ContentVersion[]> {
			const item = await get<SiteItem>(`/item/${encodeURIComponent(id)}`)
			return [
				{
					id: String(item.id),
					name: item.title,
					versionNumber: '1.0.0',
					publishedAt: item.created_at,
					channel: 'release',
					// 用启动器的拼写，侧边栏筛选才对得上
					loaders: ['fabric'],
					url: `https://example.com/item/${item.slug}`,
				},
			]
		},

		/**
		 * 只给地址，不碰文件。
		 *
		 * 下载、校验、放到哪个文件夹、怎么覆盖，全由启动器按内容类型决定
		 * （模组进 mods/、资源包进 resourcepacks/、世界进 saves/ 且永不覆盖）。
		 */
		async resolveDownload(id: string): Promise<DownloadDescriptor> {
			const item = await get<SiteItem>(`/item/${encodeURIComponent(id)}`)
			return {
				url: item.download_url,
				fileName: `${item.slug}.jar`,
				// 有 hash 就带上，启动器会校验
				// hash: { algorithm: 'sha1', value: '...' },
			}
		},
	})
}
