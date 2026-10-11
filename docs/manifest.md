# manifest.json 字段

启动器会**逐项校验**这个文件；不合规的内容源不会被加载，并在「设置 → 内容源」里报出原因。

## 标识

| 字段 | 必填 | 说明 |
|---|---|---|
| `id` | ✅ | 唯一标识，**同时用作文件夹名**。只允许字母、数字、`.`、`-`、`_` |
| `name` | ✅ | 显示名称 |
| `version` | ✅ | 语义化版本，如 `0.1.0`。**必须和发布时打的 tag 一致**（见 [publishing](publishing.md)） |
| `description` | | 一句话说明 |
| `author` | | 作者 |
| `homepage` | | 主页 |

## 外观

| 字段 | 说明 |
|---|---|
| `icon` | **你自己目录内的**图片相对路径，如 `icon.png`、`icon.svg`。svg / png / webp 都行；不允许 `..` 或绝对路径 |
| `color` | 主题色 `#rrggbb`。卡片左侧渐变、详情页背景、以及没有图标时的降级标记都用它 |

没有 `icon` 时，启动器用 `name` 的首字母画在 `color` 色的圆角方块上。

## 能力声明

```json
"capabilities": {
  "search": true,
  "browse": true,
  "detail": true,
  "versions": true,
  "resolve_download": true,
  "update_check": false
}
```

| 能力 | 对应实现 | 声明为 `false` 的后果 |
|---|---|---|
| `search` | `search(request)` | 搜索框对你这个源不起作用 |
| `browse` | `browse(request)` | 不带关键词浏览时不列出你的内容 |
| `detail` | `detail(id)` | 点进去没有详情页内容 |
| `versions` | `versions(id, request)` | 版本标签页不显示 |
| `resolve_download` | `resolveDownload(id, versionId?, fileId?)` | **安装按钮不可用** |
| `update_check` | `checkUpdate(items)` | 不参与更新检查 |

声明 `false` 只是降级，不会报错。**但别声明你实现不了的能力**——启动器会真的去调。

## 内容类型

```json
"content_types": ["mod", "resourcepack"]
```

取值必须是启动器的封闭集合（见 [getting-started](getting-started.md#内容类型)）。
不在这个列表里的类型，启动器会拒绝整个 manifest。

## 网络白名单

```json
"hosts": ["example.com", "*.example.com"]
```

`api.net.fetch` **只能**访问这里声明过的域名，其他一律被后端拒绝。支持 `*.example.com`
这样的通配子域。

## 呈现方式

```json
"detail_format": "markdown"
```

| 取值 | 说明 |
|---|---|
| `markdown`（默认） | `detail` 返回的 `body` 按 Markdown 渲染，经过 XSS 消毒 |
| `text` | 按纯文本原样显示，不解释任何格式字符 |

启动器渲染你的正文，所以**你返回的 HTML 不会原样进入页面**。

## 设置项

声明后启动器**自动生成表单**，用户填的值存进源的存储，你用 `api.settings.get(key)` 读回。

```json
"settings": [
  {
    "key": "apiKey",
    "label": "API Key",
    "description": "留空则使用内置值。",
    "type": "text",
    "default": ""
  },
  {
    "key": "region",
    "label": "线路线路",
    "type": "select",
    "default": "auto",
    "options": [
      { "value": "auto", "label": "自动" },
      { "value": "mirror", "label": "镜像" }
    ]
  }
]
```

`type` 取值：`text`、`number`、`toggle`、`select`。值一律以**字符串**存取。

## 手动条目（没有目录的源才需要）

像 GitHub 这种「没有可浏览的内容目录」的源，可以让用户手工添加条目。声明字段后启动器
生成表单，用户填的条目以 JSON 数组形式存在源的存储里，键名 `manualEntries`。

```json
"manual_entry": [
  {
    "key": "repo",
    "label": "仓库（owner/name）",
    "placeholder": "FabricMC/fabric-api",
    "pattern": "^[^/\\s]+/[^/\\s]+$",
    "required": true
  },
  {
    "key": "type",
    "label": "内容类型",
    "required": true,
    "options": [
      { "value": "mod", "label": "模组" },
      { "value": "resourcepack", "label": "资源包" }
    ]
  }
]
```

读回：

```ts
const raw = await api.storage.get('manualEntries')   // JSON 字符串或 null
const entries = raw ? JSON.parse(raw) : []
```

带 `options` 的字段在表单里渲染成下拉框；没有的渲染成输入框。`pattern` 是正则，不匹配时
表单会给出提示（但真正的把关在你自己的校验里）。

## 登录

```json
"auth": { "required": true, "login_url": "https://example.com/login" }
```

声明 `required` 的内容源，启动器会在界面里提示需要登录并提供链接。**登录态本身要靠
`api.storage` 保存**（比如把 cookie 存进去，请求时通过 `headers` 带上）。

## 其他

| 字段 | 说明 |
|---|---|
| `api_version` | 契约版本，当前是 `1`。高于启动器支持上限的会被拒绝 |
| `entry` | 入口 bundle，相对目录，通常是 `dist/index.js` |
