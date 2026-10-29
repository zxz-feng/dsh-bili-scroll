/**
 * 槽位记账的回归测试（零依赖、零网络、不花 token）
 *
 * 起因（2026-10-29）：18:34 / 19:01 两轮全废在 `NO_ADAPTER`，可槽位是**先记账后跑**，
 * 于是 `state.json` 里 `windows.night = 2`、`__slotDone` 全 true ⇒ 当晚不再重试，
 * 一整晚的额度被一次环境故障吃光。
 * 现在的要求：**成功才占槽；失败不占槽，本槽最多再给一次机会**。
 * 这里用源码断言守住这条，别让人哪天顺手改回去。
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'index.js'), 'utf8')
let pass = 0, fail = 0
const ok = (name, cond) => { if (cond) { pass++; console.log('  ✓ ' + name) } else { fail++; console.log('  ✗ ' + name) } }

// 1) 定时器里只记「尝试次数」，不直接写 __slotDone
ok('定时器记 __slotTry', /const tries = Number\(st\.__slotTry\?\.\[slotKey\] \|\| 0\) \+ 1/.test(src))
ok('定时器不再抢跑记账', !/bumpState\(\{ __slotDone: \{ \.\.\.\(st\.__slotDone \|\| \{\}\), \[slotKey\]: true \} \}\)\s*\n\s*log\(`本槽随机时刻到了/.test(src))

// 2) 结束回调按 code 决定
ok('结束回调读当前槽', /dutySlotKey && String\(why \|\| ''\)\.startsWith\('window:'\)/.test(src))
ok('有「放弃」阈值', /const giveUp = dutySlotTry >= 2/.test(src))
ok('成功或放弃才落 __slotDone', /if \(code === 0 \|\| giveUp\) \{[\s\S]{0,220}__slotDone/.test(src))
ok('日志说清「不占槽」', src.includes('不占槽'))

// 3) 声明存在（否则回调里是隐式全局，多实例会串）
ok('dutySlotKey 是模块内 let', /let dutySlotKey = ''/.test(src) && /let dutySlotTry = 0/.test(src))

console.log(`\n===== ✓ 槽位记账 ${pass} 通过 / ${fail} 失败 =====`)
process.exit(fail ? 1 : 0)
