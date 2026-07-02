---
title: "Build a Jira Health Agent with Claude Code - Step by Step"
description: "A hands-on guide to building a Jira project health monitor with Claude Code, MCP servers, and Telegram - without writing a single line of code."
pubDate: "Jul 02 2026"
tags: ["ai-first", "ai-agents", "claude-code", "mcp", "guide"]
categories: ["AI-FIRST"]
heroImage: "../../assets/blog/build-a-jira-health-agent-with-claude-code/hero.png"
ogImage: "../../assets/blog/build-a-jira-health-agent-with-claude-code/hero.png"
---

In [The Three Layers of Building AI Agents](/blog/the-three-layers-of-ai-agents/), I mapped out the three ways people build agents - from ready-made personal assistants down to raw SDKs where you wire the loop yourself. This post picks up where that one left off: we're staying at **Layer 2**, using Claude Code as the orchestration platform, and building a real agent that does real work - **without writing a single line of code**.

The agent we're building is a **Jira project health monitor**. Once a day, it:

- checks the active sprint in every Jira project you give it access to,
- groups tickets by status and calculates completion,
- flags stale tickets and overloaded assignees,
- and posts a health report straight to your Telegram.

If you're new to agents - or fuzzy on what actually makes something an "agent" rather than just a chatbot - read [AI First: What Is an AI Agent?](/blog/ai-first-what-is-an-ai-agent/) first. Everything we assemble here is built from the four building blocks that post introduces (brain, tools, memory, guardrails) plus the loop that ties them together - and at the end, we'll map the finished agent back to those blocks so you can see exactly where each one lives.

## Prerequisites

Before you start, you need:

- **Claude Code CLI** installed (`npm install -g @anthropic-ai/claude-code`)
- **Claude Pro, Max, or Team subscription** (scheduled tasks require a paid plan)
- **Jira Cloud account** with API token access
- **Telegram account** (a regular user account, not a bot) + API credentials from my.telegram.org
- **Node.js v18+** installed

---

## Step 1: Create your Jira API token

No prompt needed - this is manual setup in your browser.

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **"Create API token"**
3. Name it: `claude-jira-health-agent`
4. Copy the token immediately (you won't see it again)
5. Save it somewhere safe (password manager, `.env` file - NOT in git)

---

## Step 2: Create your Telegram credentials + session string

The agent posts its report through the community **`telegram-mcp`** server (chigwell), which runs as a **user account**, not a bot. That's deliberate: a bot can't start a direct message to someone who hasn't messaged it first, but a user account can DM you directly (the agent posts the report to your own account). You do **not** create a bot via @BotFather.

### Clone the `telegram-mcp` server

`telegram-mcp` runs from a local checkout, so add it as a git submodule - this keeps the third-party code out of your repo history:

```bash
git submodule add https://github.com/chigwell/telegram-mcp.git mcp/telegram-mcp
cd mcp/telegram-mcp && uv sync
cd ..
```

### Get your API credentials

1. Go to https://my.telegram.org/apps and sign in
2. Create an app, then copy the **`api_id`** and **`api_hash`**

### Generate a session string

From the submodule you just cloned:

```bash
cd mcp/telegram-mcp
uv run session_string_generator.py          # interactive
# or pick a method explicitly:
# uv run session_string_generator.py --qr    # scan QR from another logged-in device
# uv run session_string_generator.py --phone # phone number + verification code
```

Save the generated session string somewhere safe - it grants full access to the account, so treat it like a password.

You now have three values - **`api_id`**, **`api_hash`**, and the **session string**. You'll plug them into `.mcp.json` (and verify everything works) in Step 3.

---

## Step 3: Configure your MCP servers via `.mcp.json`

Both tools the agent needs - **Jira** (read tickets) and **Telegram** (post the report) - are MCP servers configured in a single `.mcp.json` at your project root. The Jira block uses the API token from Step 1; the Telegram block uses the submodule and credentials you set up in Step 2.

For Jira we use the **token-based `mcp-atlassian`** server, not Atlassian's official OAuth connector. The official connector authorizes **one site per connection**, so it can only see a single Jira URL at a time. The token-based server has no such limit - you add one block per Jira project/site, and they all work at once.

### Create `.mcp.json`

Add one `mcp-atlassian` block **per Jira project/site**. Two are shown below, so the agent can read from both sites at once:

```json
{
  "mcpServers": {
    "mcp-atlassian-project-a": {
      "command": "uvx",
      "args": ["mcp-atlassian"],
      "env": {
        "JIRA_URL": "https://your-company.atlassian.net",
        "JIRA_USERNAME": "your-email@company.com",
        "JIRA_API_TOKEN": "your-api-token-from-step-1"
      }
    },
    "mcp-atlassian-project-b": {
      "command": "uvx",
      "args": ["mcp-atlassian"],
      "env": {
        "JIRA_URL": "https://your-other-site.atlassian.net",
        "JIRA_USERNAME": "your-email@company.com",
        "JIRA_API_TOKEN": "your-api-token-from-step-1"
      }
    },
    "telegram-mcp": {
      "command": "uv",
      "args": [
        "--directory",
        "/absolute/path/to/your-project/mcp/telegram-mcp",
        "run",
        "main.py"
      ],
      "env": {
        "TELEGRAM_API_ID": "your-api-id",
        "TELEGRAM_API_HASH": "your-api-hash",
        "TELEGRAM_SESSION_STRING_WORK": "your-session-string"
      }
    }
  }
}
```

> The `telegram-mcp` block uses an **absolute path** - replace `/absolute/path/to/your-project` with your own machine's path. Absolute paths resolve more reliably than relative ones across MCP clients.

### Test it

With `.mcp.json` in place, both servers are live. Test each:

**Jira** - you should see projects from **both** sites:

```
List all Jira projects I have access to.
```

**Telegram** - the message should land in your own chat:

```
Send a test message to myself saying "Jira health agent is online 🤖"
```

---

## Step 4: Create the CLAUDE.md instruction file

This is the "SOUL" of your agent - it tells Claude Code what to do, how to behave, and what NOT to do.

Create a file called `CLAUDE.md` in your project root:

```markdown
# Jira Project Health Agent

## Role

You are a project health assistant. Your job is to check the active sprint in **each Jira project** you have access to, analyze ticket status, and report project health via Telegram.

## What to do

For **each Jira project/site** configured in `.mcp.json`:

1. Fetch that project's active sprint
2. Get all issues in that sprint
3. Group issues by status: To Do, In Progress, In Review, Done
4. Calculate completion percentage
5. Flag tickets that haven't changed status in 3+ days or over due (stale tickets)
6. Flag assignees who have more than 5 open tickets (overloaded)
7. Build a health report section for that project

Then post **one** Telegram message to myself containing a section for every project.

## Report format

Repeat this block once per project, all in one message:

🏥 [Project] - Sprint "[Sprint Name]" Health Report

📊 Status breakdown:
To Do: X tickets
In Progress: X tickets
In Review: X tickets
Done: X tickets (XX% complete)

⚠️ Flags:
→ X tickets haven't moved in 3+ days + over due
• PROJ-XXX: "title" (status, X days)
→ X assignees have 5+ open tickets

📋 Overall: [1-2 sentence summary]

## Guardrails - what NOT to do

- NEVER modify, update, or transition any Jira ticket. Read-only access only.
- NEVER name individuals as "underperforming" - only flag patterns.
- If the Jira API fails after 3 attempts, post a message saying the health check
  could not be completed and stop.
- If a project has no active sprint, skip it and say so in the report - don't abort
  the whole run.
- Keep each project's section tight - about 10 lines each.
```

No prompt needed for this step - you're creating a file manually.

---

## Step 5: Test the agent manually

Start Claude Code in the directory where your `CLAUDE.md` lives:

```bash
claude
```

**Prompt to type:**

```
Run the Jira project health check. For each Jira project, fetch its active sprint and all its issues. Then post one health report (a section per project) to Telegram.
```

Watch what happens. Claude Code will:

1. Read your CLAUDE.md instructions
2. Call the Atlassian MCP to fetch sprint data
3. Analyze the tickets (grouping, flagging stale ones)
4. Call the Telegram MCP to post the report

**If something goes wrong:**

- "No tools found" → run `claude mcp list` to verify both servers are connected
- "Unauthorized" from Jira → check your API token and JIRA_URL
- Telegram message not appearing → your session string is invalid/expired (regenerate it in Step 2), or the recipient blocked the account; confirm `TELEGRAM_SESSION_STRING_WORK` is set in your local `.mcp.json`
- Wrong sprint → be more specific: `"Check the active sprint in project PROJ"`

---

## Step 6: Schedule it to run daily

Once the manual test works, automate it. There are **three** ways to schedule Claude Code - but only two work for this agent:

| Option                            | Runs where                    | Custom MCP?        | Model                                          | Fits this agent? |
| --------------------------------- | ----------------------------- | ------------------ | ---------------------------------------------- | ---------------- |
| **A. Claude Desktop app**         | Your machine (while awake)    | ✅ own config      | Anthropic only                                 | ✅ yes           |
| **B. Claude Code CLI** (`/loop`)  | Your machine (session-scoped) | ✅ `.mcp.json`     | Anthropic, or others via custom base URL/model | ✅ yes           |
| **C. Cloud Routines** (claude.ai) | Anthropic's cloud             | ❌ Connectors only | Anthropic only                                 | ❌ no            |

`telegram-mcp` and the token-based `mcp-atlassian` are **custom MCP servers** that run as local processes. Only clients that run **on your machine** (Desktop, CLI) can start them - so this agent uses **Option A** (while awake) or **Option B** (quick). Option C runs on Anthropic's cloud and only supports Anthropic's curated **Connectors** (official OAuth integrations); it can't launch a local server like `telegram-mcp`, so it isn't viable here.

> Claude Code's built-in scheduling (`/loop` and the cron tools) is documented at https://code.claude.com/docs/en/scheduled-tasks.

### Option A: Claude Desktop app - Cowork scheduled task (runs while your computer is awake)

In the Claude Desktop app, scheduled runs live under **Cowork → Scheduled**. The app runs on your machine, so it _can_ drive your custom MCP servers - but it does **not** read your project's `.mcp.json`; it has its own MCP config.

1. **Add the MCP servers to Desktop** (one-time): **Settings → Developer → Local MCP servers → Edit Config**, and add `telegram-mcp` and `mcp-atlassian` with the same `command` / `args` / `env` as in your `.mcp.json`.
2. Go to **Cowork → Scheduled** and click **New task** - or, as the app suggests, type `/schedule` inside an existing Cowork task.
3. Set it to recur on your schedule and use this prompt:
   ```
   Run the daily Jira project health check and post the report to my Saved Messages.
   ```
4. Turn on **Keep awake** if you want runs to fire while you're idle.

> ⚠️ Per the app: **"Scheduled tasks only run while your computer is awake."** It's local, not cloud - if your Mac/PC is asleep or off at the scheduled time, that run is skipped.

### Option B: Claude Code CLI (session-scoped - runs while terminal is open)

In Claude Code, type:

```
/loop daily at 9am Run the daily Jira project health check and post the report to my Saved Messages.
```

> ⚠️ CLI scheduled tasks are **session-scoped** - they stop when you close the terminal. For persistent daily scheduling, use Option A.

---

## Step 7: Verify and iterate

After the first scheduled run:

1. Check your Saved Messages - did the report arrive?
2. Check the report quality - are the numbers accurate?
3. Refine CLAUDE.md if needed:
   - Adjust the "3+ days" threshold for stale tickets
   - Change the "5+ open tickets" threshold for overload
   - Add/remove specific Jira projects to focus on
   - Change the Telegram target (Saved Messages, a chat, or a group)

**Prompt to refine (in Claude Code):**

```
The health report is working but I want to add one thing:
also include a section showing tickets that were added to the sprint after it started (scope creep). Update CLAUDE.md accordingly.
```

---

## What you just built - mapped to the 4 building blocks

| Building block     | What's handling it                                               |
| ------------------ | ---------------------------------------------------------------- |
| **LLM (Brain)**    | Claude (Opus/Sonnet) - reasons about ticket data                 |
| **Tools & Skills** | Atlassian MCP (Jira read) + Telegram MCP (send message)          |
| **Memory**         | Short-term only - current sprint data within the session         |
| **Guardrails**     | CLAUDE.md rules: read-only, no naming individuals, 3 retries max |
| **Loop**           | Scheduled task triggers the observe→think→act cycle daily        |

---

## Total cost

- **Claude subscription:** Pro ($20/mo) or Max ($100/mo)
- **MCP servers:** Free (token-based `mcp-atlassian` + `telegram-mcp` / chigwell)
- **Infrastructure:** None - runs on your machine (Claude Desktop app or CLI)
- **Code written:** Zero lines

---

## Example code

A complete working example that follows this guide lives at **<https://github.com/trongdth/TAL/tree/develop/07-agents/jira-health-agent>** - clone it with submodules to see the finished layout (`CLAUDE.md`, `.mcp.json.example`, `.gitignore`, `.gitmodules`, and the `mcp/telegram-mcp` submodule) all wired together:

```bash
git clone --recurse-submodules https://github.com/trongdth/TAL
```

Your own code is still zero lines; `mcp/telegram-mcp` is third-party, tracked by reference.
