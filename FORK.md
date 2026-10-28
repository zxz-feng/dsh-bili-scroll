# 这是个人 fork（私人版）

上游：[c1overzz/dsh-bili-scroll](https://github.com/c1overzz/dsh-bili-scroll)（MIT）。
基线：npm 上的 **2.0.4**，原样导入后在本仓库第 1、2 个 commit 里留了基线，方便随时 diff。

## 为什么 fork

上游更新很快（现在已到 2.3.x），但我这边要的是**自己用的那一套行为**：

- 私信是「会话」而不是一问一答（带轮数、锁重试、断了能续）
- 额度按「工具实际挑中」记账，不按报告正文里写了几个 BV
- 设置读回确认、依赖真能 import 才算就绪、面板与原生设置的键优先级
- `sameOriginOk` 里原来写死了一台服务器的公网 IP —— 换机器装就永远 403，
  这里改成了标准同源判断

这些改动**不打算提 PR**（上游有上游的取舍，我只要能在我自己的机器/服务器上
装上去就是这个行为）。所以：**不追上游**，但保留随时 rebase 的能力。

## 怎么跟上游（需要的时候）

```bash
# 看上游现在怎么样
npm view dsh-bili-scroll version

# 取一版新的当基线（不打 tag，只取树）
mkdir -p /tmp/upstream && cd /tmp/upstream && npm pack dsh-bili-scroll@<版本>
tar xzf dsh-bili-scroll-<版本>.tgz

# 看我这版 vs 上游那版差在哪（**一定要忽略换行符**，上游是 CRLF）
diff -ru --strip-trailing-cr package /path/to/这个仓库 \
  -x node_modules -x .git | less
```

真要合并时，建议：把上游新版本整篇覆盖 → 单独一个 commit（"vendor: 跟上 x.y.z"）→
再把上面这几块改动重新贴回去（每块一个 commit）。这样历史一直是「基线 + 我的改动」，
不会变成一坨。

## 与上游的差异清单（改了什么）

| 位置 | 改了什么 |
|---|---|
| `index.js` | 私信会话（`dmSession` / `dmPromptFor` / `runDmReplyOnce`） |
| `index.js` | 额度记账（`countPickedByTool` / `countPickedToday` / `bumpState` / `roundsToday` / `reportFileOf`） |
| `index.js` | 依赖就绪判断、设置读回、键优先级、找不到 dsh 时出声 |
| `index.js` | `sameOriginOk` 去机器专属 IP，改标准同源判断 |
| `vendor/bilibili-mcp/mcp_server.py` | 新增 `bili_pick` 工具（落盘"挑中什么/为什么/什么档位"） |

具体见 `git log`。

## 署名

上游 `LICENSE` 第一行是 `Copyright (c) 2026 c1overzz`，**不要动**；MIT 正文也别动。
内含第三方 `vendor/bilibili-mcp`（MIT，AGI_Ananas），见 `NOTICE.md`。
我自己的改动同样以 MIT 发布（同一份 LICENSE 覆盖）。
