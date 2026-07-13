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
  On this machine:  http://localhost
  On the office LAN: http://toms-macbook-air.local   <- bookmark this
  Also reachable at: http://192.168.1.42
  Data file: .../valerie-tracker/data.json
```

## The URL to bookmark

Both Valerie and Tom bookmark the **`.local` URL** printed at startup
(`http://<machine-name>.local`). It follows the machine even when the
router hands it a new IP, so the bookmark never breaks. The plain IP URL
also works as a fallback for devices that don't speak Bonjour/mDNS.

To make the link prettier, rename the Mac (System Settings → General →
Sharing → Local hostname) to e.g. `milo` and the tracker becomes
`http://milo.local`.

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

It serves on port 80 by default (so the URL needs no port suffix).
If something else on the machine already uses port 80:

`PORT=8845 node server.js` → bookmark `http://<machine-name>.local:8845`
