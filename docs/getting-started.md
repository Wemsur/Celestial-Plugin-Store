# 为 Celestial Launcher 写一个内容源

内容源是启动器的一类插件：它给启动器**提供下载源**（搜索、详情、下载地址），本身不提供
任何界面。

最核心的一条设计：**内容源只能「提议」内容，不能「放置」内容。**

它回答三个问题——有什么、长什么样、文件从哪下——剩下的全由启动器决定：下载走启动器的
网络层，安装位置由内容类型决定，覆盖策略、去重、排序、界面也都在启动器里。

所以一个内容源不需要关心 UI，也不需要碰文件系统。

## 目录结构

```
celestial-content-example/
├── manifest.json          声明：能做什么、能访问哪些域名
├── src/index.ts           实现
├── types/
│   └── content-source.d.ts   ← 从商店仓库的 sdk/ 复制
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .github/workflows/release.yml
```

从 `templates/content-source/` 复制一份改最快。

## 最小可用的内容源

`manifest.json`：

```json
{
  "id": "example",
  "name": "示例内容站",
  "version": "0.1.0",
  "description": "示例站的模组与整合包。",
  "author": "你的名字",
  "icon": "icon.png",
  "color": "#4a90d9",
  "detail_format": "markdown",
  "api_version": 1,
  "entry": "dist/index.js",
  "content_types": ["mod"],
  "capabilities": {
    "search": true,
    "browse": true,
    "detail": true,
    "versions": true,
    "resolve_download": true,
    "update_check": false
  },
  "hosts": ["example.com"]
}
```

`src/index.ts`：

```ts
import type {
  ContentCard,
  ContentPage,
  ContentProject,
  ContentQuery,
  ContentSourceApi,
  ContentVersion,
  DownloadDescriptor,
} from '@celestial/content-source'

export async function activate(api: ContentSourceApi) {
  async function get<T>(path: string): Promise<T> {
    const response = await api.net.fetch(`https://example.com/api${path}`, {
      headers: { accept: 'application/json' },
    })
    if (!response.ok) throw new Error(`示例站 ${response.status} ${path}`)
    return JSON.parse(response.body) as T
  }

  function toCard(item: any, contentType: string): ContentCard {
    return {
      sourceId: api.source.id,
      id: String(item.id),
      contentType: contentType as ContentCard['contentType'],
      name: item.title,
      summary: item.description,
      iconUrl: item.icon,
      downloads: item.views,
      publishedAt: item.created_at,
    }
  }

  api.register({
    async search(request: ContentQuery): Promise<ContentPage> {
      const page = await get<any>(
        `/search?q=${encodeURIComponent(request.query ?? '')}&page=${request.page}&limit=${request.limit}`,
      )
      return {
        items: page.hits.map((hit: any) => toCard(hit, request.contentType)),
        total: page.total,
      }
    },

    async detail(id: string): Promise<ContentProject> {
      const item = await get<any>(`/item/${encodeURIComponent(id)}`)
      return { ...toCard(item, 'mod'), body: item.body_markdown, links: [{ label: '在示例站查看', url: item.url }] }
    },

    async resolveDownload(id: string): Promise<DownloadDescriptor> {
      const item = await get<any>(`/item/${encodeURIComponent(id)}`)
      return { url: item.download_url, fileName: `${item.slug}.jar` }
    },
  })
}
```

只实现 `capabilities` 里声明为 `true` 的方法。声明 `false` 的能力启动器不会调用，对应的界面
会降级显示（比如没有 `resolve_download`，安装按钮就是不可用的，而不是点了报错）。

## 网络

插件在 webview 里跑，**不能自己发请求**——它的 `fetch` 受启动器 CSP 限制。所有请求都必须走：

```ts
await api.net.fetch(url, { method?, headers?, body? })
```

实际请求由启动器的 Rust 侧发出，并且**只允许访问 `manifest.json` 里 `hosts` 声明过的域名**，
其他一律拒绝。这是硬校验，绕不过去。

```json
"hosts": ["example.com", "*.example.com", "cdn.example.com"]
```

这个代理**允许** `cookie`、`referer`、`user-agent`、`authorization`——很多内容站需要看起来
像浏览器的请求，API 源需要 token。不允许的是决定连接本身的头（比如 `host`）。

## 内容类型

启动器的**封闭取值**，你的源只能从里面挑：

| 取值 | 含义 | 启动器的安装行为 |
|---|---|---|
| `mod` | 模组 | 装进 `mods/` |
| `modpack` | 整合包 | 走整合包流程（新建实例） |
| `resourcepack` | 资源包 | 装进 `resourcepacks/` |
| `shader` | 光影 | 装进 `shaderpacks/` |
| `datapack` | 数据包 | 装进 `datapacks/` |
| `world` | 世界（地图） | 解压进 `saves/`，**永不覆盖**，每次都建新副本 |
| `skin` | 皮肤 | 存到启动器数据目录的 `skins/`，不属于任何实例 |

`content_types` 声明你能提供哪些；启动器的对应标签页会把你列进去。

## 本地试装

```bash
pnpm install
pnpm build      # 产出 dist/index.js
pnpm typecheck
```

然后把**整个插件目录**（或 `manifest.json` + `dist/` + 图标）放到：

```
%APPDATA%\CelestialLauncher\content-sources\example\
```

重启启动器，在「设置 → 内容源」里就能看到它。改代码后重新构建、重装一次即可。

调试看启动器的日志窗口；`api.log(...)` 的输出会带上 `[content-source:<id>]` 前缀。

## 下一步

- [`manifest.md`](manifest.md) —— manifest 每个字段的含义
- [`api.md`](api.md) —— 接口速查
- [`publishing.md`](publishing.md) —— 发布和上架到商店
