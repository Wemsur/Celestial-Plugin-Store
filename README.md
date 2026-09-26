# Celestial Plugin Store

Celestial Launcher（灵霄启动器）的插件商店索引。启动器读取本仓库 `main` 分支根目录的
`plugins.json`，把里面的条目渲染成可安装列表。

索引只是**指向下载地址的清单**，不包含也不执行任何插件代码。用户安装时，启动器仍会重新
校验插件的 `manifest.json` 并要求用户逐项授权，所以合并一个条目 PR 不等于信任其代码。

## 更新检测怎么工作

启动器**自动检测你插件仓库的最新 Release**：它读取 `github.com/<owner>/<repo>/releases/latest`
重定向到的 tag，和你本地已安装版本（`manifest.json` 里的 `version`）比较，发现更高的 tag
就提示「有更新」。

因此**你发布新版时，只需要在插件仓库打新 tag 并发布 Release**，不必回来改商店——除非你的
插件 `id`、名称、下载地址等元信息变了。商店页显示的版本号也来自这个最新 Release 的 tag，
`plugins.json` 里不再需要写版本号。

### Tag 命名规范（必须遵守）

tag 必须是下面两种形式之一，否则无法被正确比较：

- `x.x.x` —— 例如 `1.0.0`、`2.3.1`
- `vx.x.x` —— 例如 `v1.0.0`、`v2.3.1`

不要用 `release-1.0`、`1.0`、`最新版` 这类命名。版本号按数字逐段比较（`1.10.0` > `1.9.0`）。

## 如何提交 / 更新插件

### 方式一：提 Issue（推荐）

1. 点 **Issues → New issue → 「提交插件」**。
2. 按表单填写：
   - **插件 id** —— 必须和你 `manifest.json` 里的 `id` **完全一致**（更新检测靠它匹配）。
   - **插件名称**
   - **仓库（owner/repo）** —— 例如 `Wemsur/terracotta-plugin`。
   - **下载直链** —— 推荐用 GitHub「永远指向最新 Release」的直链：
     `https://github.com/<owner>/<repo>/releases/latest/download/<资源名>.zip`
   - **作者**、**简介**、**标签（tags）**（选填）。
3. 提交后，机器人会把 Issue 转成一个修改 `plugins.json` 的 PR。维护者审核无误后合并，
   你的插件即出现在商店中；PR 合并会自动关闭对应 Issue。

如果表单信息有误（缺字段、下载链接不是 https、仓库格式不对等），机器人会在 Issue 下留言
指出问题，不会生成 PR——按提示编辑 Issue 即可重新触发。

### 方式二：直接提 PR

Fork 本仓库，在 `plugins.json` 的 `plugins` 数组里追加（或按 `id` 替换）你的条目，提交 PR。
提交前请确保 JSON 合法。

## 条目字段

```json
{
  "id": "com.example.terracotta",
  "name": "陶瓦联机",
  "description": "一句话简介",
  "author": "你的名字",
  "github": "Wemsur/terracotta-plugin",
  "repo": "https://github.com/Wemsur/terracotta-plugin",
  "download": "https://github.com/Wemsur/terracotta-plugin/releases/latest/download/terracotta.zip",
  "tags": ["联机"]
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `id` | ✅ | 与 `manifest.json` 一致，商店内唯一 |
| `name` | ✅ | 显示名称 |
| `github` | ✅ | `owner/repo`，用于自动检测最新 Release 和显示版本号 |
| `download` | ✅ | `https` 直链，指向打包好的 `.zip`；推荐用 latest-release 重定向直链 |
| `repo` | 选填 | 插件主页/仓库链接，显示为可点链接（通常填 `https://github.com/<github>`） |
| `description` / `author` / `tags` / `icon` | 选填 | 元信息 |

> 注意：条目里**不要**再写 `version` 字段——版本号由启动器从最新 Release 的 tag 实时读取。

## 要求

- 插件必须托管在 **GitHub** 且有 **Releases**（自动更新检测依赖此）。
- `download` 必须是 `http(s)`，直接指向 zip 文件。
- tag 命名符合上面的规范。
- `id` 与插件 `manifest.json` 保持一致。
