# Beam — Konventionen für Claude

Statische GitHub-Pages-App (`mcchronicle.github.io/cast/`). Kein Build-Step, alles direkt im Repo.

## Versionierung — bei JEDER Änderung hochziehen

Bei jedem PR die Version um 1 erhöhen — gleichzeitig an allen vier Stellen, sonst bleibt der Service Worker auf altem Cache hängen:

1. `index.html` — `<span>Beam · vN</span>` (im Brand-Header)
2. `tv.html` — `<span>Beam · TV · vN</span>`
3. `sw.js` — `const CACHE = 'beam-shell-vN';` (zwingt SW-Cache-Invalidierung)
4. `manifest.webmanifest` — `"version": "N"`

Schema: einfacher monoton steigender Integer. Kein Semver, kein Datum. Aktuell **v22**.

In der PR-Beschreibung den Versions-Bump erwähnen, damit der GitHub-Pages-Deployment-Status nachvollziehbar bleibt.

## Repo-Layout

- `index.html` — Sender (iPhone/Desktop), AirPlay + WebTorrent
- `tv.html` — Empfänger (Tizen/Web-Browser auf TV)
- `sw.js` — App-Shell-Cache, Videos/CDN-Skripte explizit nicht
- `manifest.webmanifest` — PWA-Manifest
- `icon.svg` — App-Icon

Externe Libs werden via CDN nachgeladen (lazy beim Klick), nicht eingecheckt:
- mqtt.js (v5 UMD) für SDP/ICE-Signaling: jsdelivr/unpkg
- mp4box.js (v0.5.4 UMD) zum on-the-fly-Fragmentieren von iPhone-MP4 zu MSE: jsdelivr/unpkg
- qrcode-generator: `cdn.jsdelivr.net/npm/qrcode-generator@…/qrcode.js`
- HLS.js: `cdn.jsdelivr.net/npm/hls.js@…/dist/hls.min.js`

Architektur (ab v22):
- WebTorrent ist raus — kein Hashing, keine Tracker, kein Pieces-Verify mehr.
- MQTT-over-WSS auf `wss://broker.emqx.io:8084/mqtt` für SDP/ICE-Exchange.
- WebRTC-DataChannel iPhone↔TV für den eigentlichen Stream (LAN-Speed).
- iPhone fragmentiert MP4-Files mit mp4box.js on-the-fly zu Init+Media-Segments.
- TV fügt Segmente direkt via MediaSource Extensions in das `<video>`-Element —
  kein komplettes File-Pufferung, also auch große Files kein RAM-Problem.

MQTT-Topics:
- `beam/{code}/offer` (iPhone publish retained, TV subscribe)
- `beam/{code}/answer` (TV publish retained, iPhone subscribe)
- `beam/{code}/ice/iphone` und `beam/{code}/ice/tv` (ICE-Kandidaten)
- `beam/{code}/tvstatus` (TV publish retained, iPhone subscribe — Wiedergabe-Status)

## Branch- und Merge-Workflow

- Entwickle auf `claude/fix-large-file-playback-V09hB` (vom System zugewiesen)
- Vor neuen Commits: Branch via `git reset --hard origin/main` auf den aktuellen main-Stand, dann Änderungen draufsetzen
- Push: `git push -u origin claude/fix-large-file-playback-V09hB --force-with-lease`
- PR auf main, Squash-Merge

## Sprachen

- UI auf Deutsch
- Kommentare auf Deutsch, wenn der WHY nicht-trivial ist
- Commit-Messages auf Deutsch
