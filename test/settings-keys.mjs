/**
 * 设置页 ↔ 配置字段 对账（零依赖、零 token、不联网）
 * ============================================================================
 * 为什么要有这个：设置页是「字符串键」拼出来的，写错一个字母不会报错 ——
 * 表现是「输入框能填、点了保存、下次打开又空了」，而且没有任何日志。
 * 这个脚本只做两件事：
 *   1. 页面碰到的每个配置键，必须在 index.js 的 DEFAULTS 里存在（防拼错）
 *   2. 打印 DEFAULTS 里**页面还没露出来**的键（防漏；漏了不报错，只是看覆盖率）
 * 用法：node test/settings-keys.mjs [--strict]   （--strict：有未覆盖键就非零退出）
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const idx = readFileSync(join(root, 'index.js'), 'utf8')
const page = readFileSync(join(root, 'client.js'), 'utf8')

/* ── DEFAULTS 里的键 ── */
const m = idx.match(/const DEFAULTS = \{([\s\S]*?)\n  \}/)
if (!m) { console.error('✗ index.js 里找不到 DEFAULTS'); process.exit(1) }
const defaults = new Set([...m[1].matchAll(/([a-zA-Z][a-zA-Z0-9_]*):/g)].map((x) => x[1]))

/* ── 页面碰到的键：dv('x') / patch({ x: … }) / k: 'x' / 直接 cfg.x ── */
const touched = new Set()
for (const r of page.matchAll(/\bdv\('([a-zA-Z][a-zA-Z0-9_]*)'\)/g)) touched.add(r[1])
for (const r of page.matchAll(/\bk: '([a-zA-Z][a-zA-Z0-9_]*)'/g)) touched.add(r[1])
for (const r of page.matchAll(/patch\(\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*:/g)) touched.add(r[1])
for (const r of page.matchAll(/patch\(\{\s*\[k\]/g)) touched.add('(动态)')
for (const r of page.matchAll(/\bcfg\.([a-zA-Z][a-zA-Z0-9_]*)/g)) touched.add(r[1])
touched.delete('(动态)')
// 峰谷两个子开关是「按 WINDOWS 表循环」渲染的（页面里没有 dv('noon') 这种写法）—— 手写进来
for (const k of ['noon', 'night']) touched.add(k)

const unknown = [...touched].filter((k) => !defaults.has(k)).sort()
const missing = [...defaults].filter((k) => !touched.has(k)).sort()

let fail = 0
console.log(`DEFAULTS 共 ${defaults.size} 个键，页面碰到 ${touched.size} 个`)
console.log(`\n【拼错的键】${unknown.length ? '' : '无'}`)
for (const k of unknown) { console.log(`  ✗ ${k} —— DEFAULTS 里没有这个键，存了也不会生效`); fail++ }

console.log(`\n【页面还没露出来的键】${missing.length ? missing.length + ' 个' : '无（全覆盖）'}`)
if (missing.length) console.log('  ' + missing.join(', '))

if (process.argv.includes('--strict') && missing.length) {
  console.log('\n✗ --strict：还有键没露在页面上')
  fail += 1
}
console.log(`\n===== ${fail ? '✗ 有 ' + fail + ' 处问题' : '✓ 全部对上'} =====`)
process.exit(fail ? 1 : 0)
