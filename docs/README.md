# 开发者文档

Celestial Launcher 的两类插件都通过本仓库分发。**这是索引，从下面挑一条路走。**

## 内容源（下载源）

给启动器增加一个新的内容来源——一个站点、一个 API、一个仓库。不提供界面。

| 文档 | 内容 |
|---|---|
| [**getting-started.md**](getting-started.md) | 从零写一个能装的内容源，含完整最小示例 |
| [manifest.md](manifest.md) | `manifest.json` 每个字段的含义 |
| [api.md](api.md) | 接口速查：启动器给你什么、你实现什么 |
| [publishing.md](publishing.md) | 打包、发版、上架到商店 |

想直接开工：把 [`templates/content-source/`](../templates/content-source/) 复制成一个新仓库，
按 getting-started 改。

## 启动器插件（UI 插件）

给启动器加界面和功能——侧边栏卡片、设置页、自定义路由、局域网联机等。

> 文档待补。目前的参考实现：[celestial-terracotta](https://github.com/Wemsur/celestial-terracotta)
> （最完整）、[celestial-hitokoto](https://github.com/Wemsur/celestial-hitokoto)（最小）。

## 两者的区别

| | 内容源 | 启动器插件 |
|---|---|---|
| 做什么 | 提供内容：搜索、详情、下载地址 | 给启动器加界面和功能 |
| 界面 | **没有** | 有（插槽、路由、样式） |
| 安装位置 | 由启动器按内容类型决定 | 插件自己决定 |
| 索引文件 | `content-sources.json` | `plugins.json` |
| 提交表单 | 「提交内容源」 | 「提交插件」 |

最核心的一条：**内容源只能提议内容，不能放置内容。** 它给地址，启动器负责下载、校验和
放到正确的地方。这是架构上的硬约束，不是约定。

## 类型定义

[`sdk/index.d.ts`](../sdk/index.d.ts) 是内容源接口的权威定义——只有类型，没有运行时代码。
插件仓库把它的副本放在 `types/` 下。
