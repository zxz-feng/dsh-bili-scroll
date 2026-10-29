/**
 * 提示词的「怎么逛」只能有一份。
 * 起因（2026-10-29）：新会话 / 续接会话各写一段，做开关时差点只改一处 ⇒
 * 「第一轮按开关走、后面几轮按老规矩」，而且日志里两轮都显示"跑成了"，看不出来。
 * 这条测试就是钉住它：文案只许在 browseRule() 里，两条分支都调它。
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(here, '..', 'index.js'), 'utf8')
let bad = 0
const ok = (name, cond, extra = '') => {
  console.log((cond ? '✓ ' : '✗ ') + name + (cond || !extra ? '' : '  → ' + extra))
  if (!cond) bad++
}

const defs = (src.match(/怎么逛（/g) || []).length
const calls = (src.match(/browseRule\(\)/g) || []).length
ok('逛法文案只有一份（browseRule 里两个分支）', defs === 2, `实际出现 ${defs} 处`)
ok('browseRule 只定义一次', /const browseRule = \(\) =>/.test(src) && (src.match(/const browseRule/g) || []).length === 1)
ok('两条分支各调一次（共 2 处调用）', calls === 2, `实际 ${calls} 处`)

// 两条分支各自都要调到（不能一边调一边自己写）
const iResumed = src.indexOf('接着上一轮继续值班')
const iFresh = src.indexOf('你是这个账号的 B站 助手')
const between = (a, b) => src.slice(a, b)
ok('续接分支调了 browseRule()', /browseRule\(\)/.test(between(iResumed, iFresh)), '续接段里没调用')
ok('新会话分支调了 browseRule()', /browseRule\(\)/.test(src.slice(iFresh)), '新会话段里没调用')

// 开关真的接在逛法上（不是只存在 schema 里）
const body = src.slice(src.indexOf('const browseRule = ()'), src.indexOf('const promptFor = '))
ok('browseRule 读 selfInterest', /selfInterest === false/.test(body))
ok('关着时不出现"自己挑的词"', !/自己挑的词/.test(body.split('selfInterest === false')[1].split('return')[0]))

console.log(bad ? `\n===== ✗ ${bad} 条不对 =====` : '\n===== ✓ 逛法只有一份 =====')
process.exit(bad ? 1 : 0)
