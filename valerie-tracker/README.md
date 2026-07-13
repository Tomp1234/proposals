# Valerie's Daily Tracker

A live daily tracker for Valerie's SDR schedule. She fills it in through the
day; Tom opens the same URL and sees her numbers update within a few seconds.

## The URL to bookmark

**https://hey.milo.ai/valerie-tracker/**

That's it. It's hosted on Cloudflare alongside the proposals site, so it is
always on, works from any network (office, home, phone), and there is nothing
to run or keep awake. Both Valerie and Tom bookmark the same link.

Note: there is no login. Anyone with the link can view and edit the board, so
share it only with people who should see it.

## How it works day to day

- The current time-block is highlighted automatically (UK time).
- Valerie ticks blocks done and fills in numbers as she goes; everything saves
  instantly and syncs to every open copy of the page within a few seconds.
- The scorecard at the top sums dials, conversations, and meetings from the two
  call blocks, and shows green when she's on pace for the time of day.
- In Wrap-up, **Generate EOD note** builds her note to Tom from the day's
  numbers; **Copy to clipboard** and paste into Slack or email.
- **Reset for tomorrow** (top right) archives today's numbers into History and
  clears the board. If anyone opens the board and the data is from a previous
  day, it prompts to archive and start fresh (an untouched board just rolls
  over silently).
- **History** (top right) shows one row per day: date, dials, conversations,
  meetings, blocks completed.

## How it's hosted

Pushing this repo to GitHub triggers the Cloudflare deploy of the proposals
site. [worker.js](worker.js) is the entry point: it serves the tracker page at
`/valerie-tracker/`, handles its API, and stores all board data in a
Cloudflare Durable Object (survives deploys — data is not in this repo).
Everything else on hey.milo.ai is untouched static assets.

## Backing up the data

The board and history live in the Durable Object, not in a file. For a manual
backup, save the JSON state:

```bash
curl -s https://hey.milo.ai/valerie-tracker/api/state > tracker-backup-$(date +%F).json
```

## Running it locally instead (optional)

The original LAN mode still works if you ever want it — one machine on the
office network, zero dependencies:

```bash
cd valerie-tracker
node server.js          # serves on port 80; data persists in data.json
```

It prints the URL to bookmark (`http://<machine-name>.local`). Use
`PORT=8845 node server.js` if port 80 is taken. Note the local and cloud
boards are separate — pick one and stick with it (the cloud one).
