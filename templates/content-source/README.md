# 内容源模板

复制这个目录成一个新仓库，就是一份能跑的内容源骨架。

1. 改 `manifest.json`：`id`、`name`、`content_types`、`hosts` 至少这几项
2. 放一个图标，文件名和 manifest 的 `icon` 对上
3. 改 `src/index.ts`，接到你站点自己的接口上
4. `pnpm install && pnpm build`

写之前先读 [docs/getting-started.md](../../docs/getting-started.md)。

## 注意

- `types/content-source.d.ts` 是权威类型的副本，**不要改它**。过期了由 `sdk-drift`
  工作流报出来，同步方法见 [docs/publishing.md](../../docs/publishing.md#保持类型副本同步)。
- 发布时打 `v0.1.0` 这样的 tag，资产名固定成 `<id>.zip`，商店链接才永远有效。
