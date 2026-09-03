# LearnIT — Live Demo Script (Run-of-Show)

**For the presenter(s) driving the live demo during judging.**
Target length: **~4 minutes** of demo inside a longer pitch. Everything here is on the live app — no localhost.

- **App:** learnit-mauve.vercel.app
- **Bot:** @learnit_teampura_bot
- **Presenter(s):** `[PRESENTER NAME — ROLE]` *(driver)* · `[PRESENTER NAME — ROLE]` *(narrator, optional)*

---

## Before you present (setup checklist — do this 10 min before)

- [ ] Log in to **learnit-mauve.vercel.app** on the demo machine; stay logged in.
- [ ] Confirm the account **already has processed topics** (e.g. *Networking concepts*, *Bug Bounty*) so nothing looks empty.
- [ ] Have **Telegram open** in a second tab (web.telegram.org) with **@learnit_teampura_bot** already **Started**.
- [ ] Copy a **fresh YouTube link** you have NOT saved yet into your clipboard (a short, clearly-titled educational video). Have a backup link too.
- [ ] Open two browser tabs: **Tab 1** = LearnIT Dashboard, **Tab 2** = the YouTube video (so you can copy its URL live if asked).
- [ ] Zoom the browser to ~110–125% so judges can read it.
- [ ] Silence notifications. Full-screen the browser.
- [ ] **Pre-flight the risk:** saving a brand-new link depends on live Supadata/Firecrawl/Gemini calls. If the venue Wi-Fi is shaky, plan to *show a pre-saved item finishing* instead of relying on the new one completing on stage (see Beat 3 fallback).

---

## The 4-minute run

### Beat 0 — One-line frame *(15 sec, before you touch anything)*
> "Everyone saves videos and articles they mean to learn from. They rot in bookmarks. LearnIT turns a saved link into a study guide, a briefing, and a quiz — organized by topic, not by link. Let me show you."

Land on the **Dashboard**.

---

### Beat 1 — Capture is instant *(40 sec)*
**Do:**
1. On the **Dashboard**, point at "*X topics ready to study*."
2. Paste your fresh link into the **Save a link** box. Type a title like `Networking Part 2`.
3. Click **Save link**.

**Say:**
> "I paste a link, give it a title, save. That's the entire effort from me. Notice it's already queued — status says *fetching* — and I could close this tab right now and the work would still finish on the server."

**Watch for:** the item appears immediately with a **fetching** status.

---

### Beat 2 — Show the engine *(45 sec)*
**Do:**
1. Click **02 Library** in the nav.
2. Point to the item you just saved and its **origin: web** tag.
3. Trace the stage labels aloud.

**Say:**
> "Every source travels the same road — you can watch it happen. **New**, then **Fetched** once we've pulled the transcript, then **Sorting** while it's filed under a topic, then **Done**. If anything breaks, it says *needs attention* and names the exact stage so you retry just that step — not the whole thing."

**Watch for:** the item advancing (New → Fetched → Sorting). It updates live; give it a beat.

---

### Beat 3 — The payoff: study a topic *(60 sec)* ⭐ THE MONEY SHOT
> Do NOT wait for the new item to reach Done on stage. Switch to a topic that's **already built**. This is the moment judges remember — make it clean.

**Do:**
1. Click **03 Topics**.
2. Open **Networking concepts** (or **Bug Bounty**).
3. Walk the three tabs in order: **Guide → Briefing → Quiz**.
4. In the **Quiz**, actually answer one question live.

**Say:**
> "Here's what you get back. A full **study guide** for the topic — and this isn't one video, it's every source I've saved about networking, consolidated into one current set of materials. A shorter **briefing** for review. And an interactive **quiz** — watch, I'll answer one… and it checks me. Save three more networking links tomorrow and this whole topic rebuilds to include them, automatically."

**Fallback:** if the new item from Beat 1 *did* reach Done, open its topic instead — bonus points for showing the thing you just saved. If live gen is slow, this pre-built topic carries the whole demo.

---

### Beat 4 — It runs without you: Telegram *(40 sec)*
**Do:**
1. Switch to the **Telegram** tab with **@learnit_teampura_bot**.
2. Paste a link into the chat and **send** it.
3. Show the bot reply: **"added one item"**, then the **daily digest** message with a link back to the topic.

**Say:**
> "You don't even need the website. I send a link straight to our Telegram bot — it confirms it's added, and once it's built it messages me back a daily digest with a link right into the topic. Point it at a YouTube playlist and it captures new videos on its own."

**Fallback:** if sending live is risky, show a **prior bot reply already in the chat history** and narrate it.

---

### Beat 5 — Close on trust *(20 sec)*
**Do:** click **04 Settings** briefly (show digest hour, timezone, playlist, Telegram), then stop.

**Say:**
> "Everything I saved is private to my account — enforced in the database, not just the UI. It's all running on cloud infrastructure right now, no laptop babysitting it. That's LearnIT: save a link, get a lesson."

Hand back to slides for the tech/ask.

---

## If the internet dies (hard fallback)
1. Keep talking — narrate from the pre-built **Networking concepts** topic, which is already loaded.
2. If the whole app is unreachable, cut to the recorded Jams:
   - Capture + build: `jam.dev/c/b19dd5f2-4e83-4386-816e-38f37ba1bfee`
   - Telegram automation: `jam.dev/c/2a4bf8c2-d15e-4a2c-8553-d6c50dba246b`
   - Taking the quiz: `jam.dev/c/fa716726-054d-4b53-986f-6b75b374bf11`
3. Never debug live in front of judges. Switch to the recording and keep the story moving.

---

## Timing cheat-sheet

| Beat | Screen | Seconds |
| --- | --- | --- |
| 0 Frame | Dashboard | 0:15 |
| 1 Capture | Dashboard | 0:40 |
| 2 Engine | Library | 0:45 |
| 3 Payoff ⭐ | Topics (Guide/Briefing/Quiz) | 1:00 |
| 4 Telegram | Telegram bot | 0:40 |
| 5 Close | Settings | 0:20 |
| **Total** | | **~4:00** |

## Golden rules
- **Lead with the payoff if you're short on time** — Guide/Briefing/Quiz is the demo. Capture and Library are the setup.
- **Never wait on live generation.** Pre-built topics are your safety net.
- **One driver, one talker** if you have two people. Don't both reach for the keyboard.
- **Say "topic, not link" at least twice** — it's the whole idea.
