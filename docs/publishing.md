# 发布与上架

## 打包成什么

启动器安装插件时读的是**一个 zip**，里面必须是：

```
manifest.json
dist/index.js        ← 或 manifest.entry 指到的入口
icon.png             ← manifest.icon 声明的那个文件（如果声明了）
```

`dist/` 里的其他东西（sourcemap 之类）带上没关系。**不要把 `src/`、`node_modules` 打进去。**

## Tag 命名（硬要求）

tag 必须是下面两种之一，否则更新检测无法正确比较：

- `x.x.x` —— `1.0.0`、`2.3.1`
- `vx.x.x` —— `v1.0.0`、`v2.3.1`

不要用 `release-1.0`、`1.0`、`latest`。版本号按数字逐段比较（`1.10.0` > `1.9.0`）。

**并且 tag 要和 `manifest.json` 里的 `version` 一致。** 启动器拿「最新 Release 的 tag」
和本地已装的 `version` 比较来判断有没有更新——两者不一致会导致用户永远被提示有更新，
或者永远收不到更新。模板里的发布工作流会在打包前拦住这种情况。

## 为什么资产名不带版本号

发布出来的 zip 应该叫 **`<你的id>.zip`**（比如 `pixelmap.zip`），**不要**叫
`pixelmap-0.1.0.zip`。

因为商店索引里的下载地址写死成：

```
https://github.com/<owner>/<repo>/releases/latest/download/<你的id>.zip
```

`releases/latest` 永远指向最新那个 Release。资产名固定，这个链接就**永远有效**——
于是：

> **发布新版只需要打新 tag 并推送，不用回来改商店。**

如果资产名带版本号，每次发版链接都会断，就得回来改商店——这正是要避免的。

## 发布流程

模板仓库已经带了 `.github/workflows/release.yml`，做四件事：

1. 构建、类型检查
2. 校验 tag 与 `manifest.json` 的 `version` 一致
3. 打包成 `<id>.zip`
4. 挂到 Release

所以：

```bash
# 改完代码，把 manifest.json 的 version 改好
git commit -am "0.2.0"
git tag v0.2.0
git push && git push --tags
```

等 Actions 跑完，Release 就绪，启动器那边的用户会自动看到更新提示。

## 上架到商店

在 [Celestial-Plugin-Store](https://github.com/Wemsur/Celestial-Plugin-Store) 提一个
**「提交内容源」** Issue，按表单填。机器人会自动把它转成修改 `content-sources.json` 的 PR，
维护者审核后合并，你的源就出现在所有用户的「设置 → 内容源」里。

表单里需要填的：

| 字段 | 说明 |
|---|---|
| 内容源 id | 和 `manifest.json` 的 `id` 完全一致 |
| 内容源名称 | |
| 仓库 | `owner/repo`，用于自动检测最新 Release |
| 下载直链 | `https://github.com/<owner>/<repo>/releases/latest/download/<id>.zip` |
| 提供的内容类型 | 多选，和 `manifest.json` 的 `content_types` 对上 |

信息有误时机器人会在 Issue 下留言指出，编辑 Issue 即可重试。

也可以直接提 PR 改 `content-sources.json`。

## 之后更新

**只打新 tag。** 商店条目不用动。

除非这些变了：`id`、名称、仓库、下载地址——那就再提一次 Issue（机器人按 `id` 覆盖已有条目）。
另外 `content_types` 变了也要更新商店条目，因为它决定了你的源出现在哪些标签页下。

## 保持类型副本同步

插件仓库里的 `types/content-source.d.ts` 是权威类型（商店仓库 `sdk/index.d.ts`）的副本。
启动器契约更新时，重新同步：

```bash
curl -fsSL https://raw.githubusercontent.com/Wemsur/Celestial-Plugin-Store/main/sdk/index.d.ts \
  -o types/content-source.d.ts
```

仓库里的 `sdk-drift` 工作流会在每次推送和 PR 时自动比对，副本过期会失败，所以不用担心忘了。

---

# 一些实操建议

**调试**：本地装好后遇到问题先看启动器日志。`api.log(...)` 的输出带 `[content-source:<id>]`
前缀。

**超时**：`api.net.fetch` 由启动器发出，别在插件里写重试风暴——站点被封或限流时，
失败就让它失败，把原因 `api.log` 出来比反复重试更有用。

**筛选 id vs 显示名**：`filters()` 返回的 `options[].id` 是**回传给你做筛选的**，必须稳定；
`label` 才是显示名，可以随 `api.i18n.locale` 翻译。把 id 也翻译了会导致筛选直接失灵。

**内容类型的语义**：`world` 会在 `saves/` 下**新建副本、永不覆盖**（玩家的存档不能被覆盖）；
`skin` 属于启动器而不是实例。这两个不需要你做额外的事，但你得知道它们的语义和别的不一样。
