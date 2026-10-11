import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// 从配置文件自身的位置解析，所以 vite 在哪个目录被调用都能找到项目根。
const projectRoot = fileURLToPath(new URL('.', import.meta.url))

// 内容源没有界面，所以这个构建不需要 Vue，也不需要任何别名垫片：
// 它是纯 TypeScript，没有运行期依赖，打成启动器可以直接 import 的一个 ES 模块。
export default defineConfig({
	build: {
		target: 'chrome105',
		lib: {
			entry: join(projectRoot, 'src/index.ts'),
			formats: ['es'],
			fileName: () => 'index.js',
		},
		// 加载失败时要靠人读产物排查。
		sourcemap: true,
		minify: false,
		emptyOutDir: true,
	},
})
