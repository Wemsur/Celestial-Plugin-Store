# 接口速查

完整定义见 [`sdk/index.d.ts`](../sdk/index.d.ts)——那是权威来源，这份文档只是导读。

## 入口

```ts
export async function activate(api: ContentSourceApi) {
  api.register({ /* 你的 provider */ })
}
```

启动器加载你的 bundle 后调用一次 `activate`。在里面调用**一次** `api.register(provider)`。

---

# 启动器给你的（`api`）

## `api.source`

```ts
api.source.id        // 你在 manifest 里的 id
api.source.name
api.source.version
api.source.manifest  // 解析后的整个 manifest
```

## `api.net.fetch(url, options?)`

唯一的网络出口。只允许 manifest 的 `hosts` 里声明过的域名。

```ts
const response = await api.net.fetch('https://example.com/api/items', {
  method: 'GET',                                  // 默认 GET
  headers: { accept: 'application/json' },        // 可选
  body: '{"a":1}',                                // 可选，字符串
})

response.status     // 200
response.ok         // true
response.headers    // { 'content-type': 'application/json', ... }
response.body       // 响应体字符串（不是 stream，自己 JSON.parse）
response.final_url  // 跟随重定向后的最终地址
```

允许 `cookie`、`referer`、`user-agent`、`authorization` 头；决定连接本身的头（如 `host`）
会被忽略。响应体有大小上限（16 MiB），请求体也有（4 MiB）。

## `api.storage`

源自己的键值存储，落在启动器的数据目录里。

```ts
await api.storage.get('token')        // string | null
await api.storage.set('token', '...')
await api.storage.remove('token')
await api.storage.keys()              // string[]
```

值一律是字符串；存对象自己 `JSON.stringify`。

## `api.settings`

读用户按 manifest 的 `settings` 填的值。**只读**——要改值让用户去设置页改。

```ts
await api.settings.get('apiKey')   // string | null（没填过且无 default 时是 null）
await api.settings.all()           // Record<string, string>
```

## `api.i18n.locale`

启动器当前界面语言，**实时读取**（用户切换语言后你下次读就是新值）。

```ts
const isChinese = api.i18n.locale.toLowerCase().startsWith('zh')
```

用它把你的站点标签翻译成用户的语言。注意**筛选用的 id 不要跟着翻译**——只有显示名该翻译。

## `api.log(...args)`

输出到启动器日志，自动加 `[content-source:<id>]` 前缀。排查线上问题基本靠它。

---

# 你要实现的（provider）

只实现 manifest 里 `capabilities` 声明为 `true` 的那些。所有方法都可以是 `async`。

## `search(request)` / `browse(request)`

```ts
async search(request: ContentQuery): Promise<ContentPage>
```

```ts
request = {
  query?: string          // 搜索词。browse 时为空
  contentType: ContentType
  gameVersion?: string    // 用户在侧边栏选的
  loader?: string
  sort: 'relevance' | 'downloads' | 'follows' | 'newest' | 'updated'
  page: number            // 从 1 开始
  limit: number
  filters?: Record<string, unknown>   // 你在 filters() 里声明的组 → 用户勾选的选项 id
}
```

返回：

```ts
{ items: ContentCard[], total: number }   // total 是总数，用于分页器
```

`ContentCard`：

```ts
{
  sourceId: string        // 填 api.source.id
  id: string              // 你自己的项目 id，之后会传回 detail/versions
  contentType: ContentType
  name: string
  summary?: string
  iconUrl?: string
  author?: string
  downloads?: number      // 原始值，启动器会乘上源倍率再排序
  follows?: number
  publishedAt?: string    // ISO 8601
  updatedAt?: string
  gameVersions?: string[]
  loaders?: string[]
  tags?: string[]         // 显示在卡片上的标签
}
```

> 关于 `sort: 'relevance'`：搜索词为空时，启动器会按整体热度排；有搜索词时保留你返回的顺序。
> 所以你自己按站点最合理的方式排即可。

## `detail(id, contentType)`

```ts
async detail(id: string, contentType: ContentType): Promise<ContentProject>
```

在 `ContentCard` 的基础上加：

```ts
{
  body?: string                                  // 正文，按 manifest 的 detail_format 渲染
  gallery?: { url: string; title?: string }[]
  license?: string
  links?: { label: string; url: string }[]       // 相关链接（详见下）
  versions?: ContentVersion[]
}
```

`body` 是 Markdown（默认）或纯文本，由启动器渲染并消毒。

`links` 是条目的站外链接。**如果其中一条指向 CurseForge 或 Modrinth 的项目页**
（形如 `https://www.curseforge.com/minecraft/modpacks/<slug>` 或
`https://modrinth.com/mod/<slug>`），且用户装了对应的内容源，启动器会把这条链接**变成
站内跳转**——直接打开那个源的对应项目页，用户可以在那里安装。这用在"你只是收录、真正的文件
在别的源"的情况：你只要把页面上本来就有的那个 URL 放进 `links`，不必知道对方的安装方式。
指向别处的链接（网盘、Discord、wiki）照常当外链打开。

## `versions(id, request)`

```ts
async versions(id: string, request: ContentQuery): Promise<ContentVersion[]>
```

```ts
{
  id: string
  name?: string
  versionNumber?: string        // 表格"版本"列显示的就是它
  gameVersions?: string[]
  loaders?: string[]            // 用启动器的拼写：forge/fabric/neoforge/quilt
  publishedAt?: string
  downloads?: number
  channel?: string              // 'release' | 'beta' | 'alpha'
  body?: string                 // 更新日志
  url?: string                  // 该版本在你站点的页面
  files?: ContentFile[]         // 一个版本有多个文件时列出，让用户选
}
```

## `resolveDownload(id, versionId?, fileId?)`

```ts
async resolveDownload(id: string, versionId?: string, fileId?: string): Promise<DownloadDescriptor>
```

```ts
{
  url: string                              // 必填，文件直链
  headers?: Record<string, string>         // 需要 referer / cookie / UA 时
  fileName?: string                        // 装上之后叫什么
  hash?: { algorithm: 'sha1' | 'sha512'; value: string }   // 可选，给了就校验
}
```

**你只给地址，不碰文件。** 下载、校验、放到哪个文件夹、怎么覆盖，全部由启动器按内容类型
决定。`fileId` 是用户在 `versions()` 返回的 `files` 里挑的那个。

## `openDownload(id, versionId?, fileId?)`

```ts
async openDownload(id: string, versionId?: string, fileId?: string): Promise<{ url: string; fileName?: string }>
```

给一个**网页**地址，而不是文件直链。用在文件没法直接下的时候——比如站点下载要先过验证码、
或者要登录，只有浏览器能过。启动器会开一个窗口加载这个页面，用户自己在里面下载；用户下到的
文件被启动器捕获、放进暂存目录，再按内容类型装好。

```ts
async openDownload(id: string): Promise<{ url: string; fileName?: string }> {
  // url 的 host 必须在你 manifest 的 hosts 里，否则启动器拒绝开窗
  return { url: `https://example.com/download/${id}.html`, fileName: 'some-mod.jar' }
}
```

**不要试图绕过验证码。** 这个方法的全部意义就是把用户送到站点自己的页面上，让他在那里
完成站点要求他做的事；插件只负责指路。`fileName` 只决定暂存文件叫什么，不影响安装位置。

## `filters(contentType)`

```ts
async filters(contentType: ContentType): Promise<SourceFilterGroup[]>
```

```ts
[{ id: 'category', header: 'categories', options: [{ id: '4780', label: '数据包' }] }]
```

`header` 命中启动器内置的 `categories` / `features` / `performance impact` 时，你的选项会
**并进那一个分组**；其他 header 单独成组。用户勾选的结果通过 `request.filters` 回传给你：

```ts
request.filters   // { category: ['4780', '12'] }
```

**选项 id 保持稳定**（用站点自己的数字 id 最省事），`label` 才是给人看的、可以跟着语言变。

## `checkUpdate(items)`

```ts
async checkUpdate(items: UpdateQueryItem[]): Promise<UpdateResult[]>
```

```ts
// 传入
{ id, contentType, currentVersionId?, gameVersion?, loader?, installRule? }

// 返回（没有更新就只回 id）
{ id, latestVersionId?, latestVersionName? }
```

`installRule` 是安装时你给的规则原样带回来的，用于"我当时是按正则挑的文件"这类情况。

## `resolveModpack(manifestJson)`

只在你提供整合包时才需要。

```ts
async resolveModpack(manifestJson: string): Promise<ContentModpackPlan>
```

启动器下载好整合包 zip 后，会把里面的 `manifest.json`（CurseForge 格式）原文交给你；你
把它解析成文件清单：

```ts
{
  gameVersion: string
  loader: 'vanilla' | 'forge' | 'neoforge' | 'fabric' | 'quilt'
  loaderVersion?: string
  files: { url: string; fileName: string; hashSha1?: string; folder?: string }[]
}
```

`folder` 是实例内的相对目录（`mods`、`resourcepacks`、`shaderpacks`），默认 `mods`。

解析交给你的原因：每个源解析文件 URL 的方式不同（CurseForge 靠它自己的批量接口）。
但**建实例、装原版和加载器、解压 overrides、把文件放进对应目录，仍然是启动器做的**。
