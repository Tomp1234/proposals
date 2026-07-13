# Valerie's Daily Tracker

A live daily tracker for Valerie's SDR schedule. She fills it in through the day;
Tom opens the same URL and sees her numbers update within a few seconds.
No accounts, no database, no dependencies: one Node process and one JSON file.

## Start it

You need Node.js installed (any recent version). Then:

```bash
cd valerie-tracker
node server.js
```

That's it. No `npm install`, the server has zero dependencies.

On startup it prints the URLs, for example:

```
Valerie's tracker is running.
  On this machine:  http://localhost:8845
  On the office LAN: http://192.168.1.42:8845   <- bookmark this
  Data file: .../valerie-tracker/data.json
```

## The URL to bookmark

Both Valerie and Tom bookmark the **LAN URL** printed at startup
(`http://<office-machine-ip>:8845`). If the office machine's IP changes,
restart the server and it prints the new one. Tip: give the machine a fixed
IP in the router settings so the bookmark never breaks.

## How it works day to day

- The current time-block is highlighted automatically.
- Valerie ticks blocks done and fills in numbers as she goes; everything saves
  instantly and survives refreshes and reboots.
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

## Backing up the data

Everything lives in one file: `valerie-tracker/data.json` (today's board plus
the full history). To back it up, copy it anywhere:

```bash
cp data.json ~/Dropbox/valerie-tracker-backup-$(date +%F).json
```

The file is written atomically on every change, so copying it while the server
runs is safe. To restore, stop the server, put the backup back as `data.json`,
and start it again.

## Keeping it running after a reboot (optional, macOS)

The data survives a reboot automatically; the server just needs starting again
(`node server.js`). To have macOS start it on login, add it to
Login Items, or run:

```bash
(crontab -l 2>/dev/null; echo "@reboot cd $(pwd) && /usr/local/bin/node server.js >> tracker.log 2>&1") | crontab -
```

## Changing the port

`PORT=9000 node server.js`
