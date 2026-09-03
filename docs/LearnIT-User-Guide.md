# LearnIT — User Guide

Turn the links you save into study material you'll actually use. This guide walks through everything you can do in LearnIT, step by step.

**Where to go:** the app lives at **learnit-mauve.vercel.app**. The Telegram bot is **@learnit_teampura_bot**.

The app has four sections, shown in the side navigation:

> **01 Dashboard** · **02 Library** · **03 Topics** · **04 Settings**

---

## 1. Create your account

1. Open **learnit-mauve.vercel.app**.
2. You'll land on the sign-in screen. New here? Choose **Sign up** and enter your email, a display name, and a password. Returning? Just **Sign in**.
3. You're taken to your **Dashboard**. Everything you save from now on is private to your account.

---

## 2. Save your first link (from the web)

1. On the **Dashboard**, find the **Save a link** box.
2. Paste a link — a YouTube video or an article both work.
3. *(Optional)* Add a short title or a note so you remember why you saved it.
4. Click **Save link**.

That's it. The item is queued immediately and its status shows as **fetching**. You don't wait around — LearnIT does the slow work in the background, even if you close the tab.

> **Tip:** LearnIT cleans up messy YouTube URLs automatically (it strips the `&list=` and `&index=` playlist junk), so you can paste straight from the address bar.

---

## 3. Save a link from Telegram (no app needed)

You can feed LearnIT without opening the website at all.

1. **Connect Telegram once:** go to **04 Settings**, find the Telegram section, and open your personal connect link. It opens **@learnit_teampura_bot** in Telegram. Press **Start**.
2. **Send any link** to the bot — paste a YouTube or article URL and send.
3. The bot replies **"added one item"** and confirms it's processing.
4. When the material is ready, the bot sends you a message with a link straight to the finished **topic**, where you can start studying.

To disconnect or re-link later, return to **Settings → Telegram** and use **Disconnect** / create a new link.

---

## 4. Watch it being built (the Library)

Open **02 Library** to see every source you've saved and exactly where each one is in the pipeline.

Each item moves through these stages, and the Library updates live:

> **New → Fetched → Sorting → Sorted → Done**

- **New** — saved and queued.
- **Fetched** — the video transcript or article text has been retrieved.
- **Sorting** — LearnIT is filing the source under the right topic.
- **Done** — the topic's materials are built and ready.

Each item also shows its **origin** — *web* or *telegram* — so you can tell how it came in.

**If something needs attention:** a source that can't be processed is flagged and names the stage that failed. Open it and press **Retry** to re-run just that stage. The rest of your library keeps working normally.

---

## 5. Study a topic (the main event)

Open **03 Topics** to see your topics — each one is a subject built from every source you've saved about it (for example, *Networking concepts* or *Bug Bounty*).

Click a topic to open it. You get three ways to study, and you move through them in order:

1. **Guide** — a structured study guide covering the whole topic.
2. **Briefing** — a tighter summary for quick review.
3. **Quiz** — interactive questions to test yourself. Answer them right there in the page to check what stuck.

> **Why topics beat bookmarks:** save three sources about the same subject and LearnIT consolidates them into *one* current set of materials — rebuilt automatically whenever you add a new source. Earlier versions are kept, so nothing is lost.

---

## 6. Set up automation (Settings)

Open **04 Settings → Integrations** to make LearnIT run on its own:

- **Daily digest hour + timezone** — choose when you get your once-a-day Telegram summary of finished work, in your own local time.
- **YouTube playlist capture** — point LearnIT at a playlist and it will pick up new videos automatically, respecting your daily capture limit.
- **Daily capture limit** — a guardrail so automated capture stays under control.
- **Telegram** — connect or disconnect the bot (see section 3).

### Auto-capture a YouTube playlist (step by step)

Point LearnIT at a playlist once, and it will keep pulling in new videos for you.

1. In **04 Settings → Integrations**, find the **playlist** field.
2. Paste your YouTube playlist link. LearnIT reads the **playlist ID straight from the link** — you don't have to find it yourself.
3. Turn on **Enable captures**.
4. Click **Save**. Your playlist is now armed for polling.
5. To pull it in right away, go to **01 Dashboard** and use **Sync from playlist** (you don't have to wait for the automatic poll). Refresh the page to see the results.
6. Open **02 Library** — the new items appear with origin **YouTube playlist**, and travel the same New → Fetched → Sorting → Done pipeline as any other source. They'll be ready in a few minutes.

> Playlist polling respects your **daily capture limit**, so a large playlist is brought in gradually rather than all at once.

*Recorded walkthrough:* [Part 1 — add & sync a playlist](https://jam.dev/c/f57f27c4-fd82-4bc5-9ba3-3a70e53363cd) · [Part 2 — playlist items in the Library](https://jam.dev/c/3978b14d-8875-458b-9241-7f4b2ffc3f3b)

---

## Quick reference

| I want to… | Go to | Do this |
| --- | --- | --- |
| Save a link | **01 Dashboard** | Paste URL → **Save link** |
| Save without the website | **Telegram** | Send a link to **@learnit_teampura_bot** |
| Check progress | **02 Library** | Watch New → Fetched → Sorting → Done |
| Fix a stuck item | **02 Library** | Open it → **Retry** |
| Study | **03 Topics** | Open a topic → Guide → Briefing → Quiz |
| Get a daily summary | **04 Settings** | Set digest hour + timezone, connect Telegram |
| Auto-capture a playlist | **04 Settings** | Paste a playlist link → Enable captures → Save |
| Pull a playlist in now | **01 Dashboard** | **Sync from playlist** |

---

## Frequently asked

**Do I have to keep the app open while it processes?**
No. Capture is instant; the rest happens in the background on the server. Come back anytime, or wait for the Telegram digest.

**How long until a topic is ready?**
The worker picks up jobs about once a minute and runs them through fetch → sort → build. A single source is usually ready within a few minutes.

**Can other people see what I save?**
No. Every item, topic, and setting is private to your account, enforced at the database level.

**What kinds of links work?**
YouTube videos (transcript-based) and web articles. Paste the normal URL — no special formatting needed.
