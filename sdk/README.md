# 内容源类型定义

`sdk/index.d.ts` 是 Celestial Launcher 内容源接口的**权威定义**——这个文件是唯一来源，
插件仓库里的副本都从它复制。

它**只有类型，没有运行时代码**。插件用 `import type { ... } from '@celestial/content-source'`
引入，构建后这些引用会被完全抹掉，产物里不含任何对应代码。（可以自己验证：
`grep -c '@celestial' dist/index.js` 结果是 `0`。）

## 插件仓库怎么用它

把本文件复制到插件仓库的 `types/content-source.d.ts`，并在 `tsconfig.json` 的 `include`
里加上 `"types"`：

```json
{ "include": ["src", "types", "vite.config.ts"] }
```

这个文件里是一个 `declare module '@celestial/content-source' { ... }` 环境声明，被纳入编译
后模块名即可解析，**不需要安装任何依赖**——所以插件仓库没有 `dependencies`。

不要在插件仓库里修改副本。要改契约就改这里的 `sdk/index.d.ts`，再让各插件同步。

## 版本

契约版本由每个插件 `manifest.json` 里的 `api_version` 声明。当前是 `1`。
启动器拒绝 `api_version` 高于自己支持上限的插件。

## 同步检查

各插件仓库带一个 `sdk-drift` 工作流，会拉取本文件并与仓库里的副本比对，不一致即失败。
`docs/getting-started.md` 里有一行命令可以本地重新同步。
