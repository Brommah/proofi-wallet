# HEARTBEAT.md - Periodieke Checks

## Elke heartbeat (check state file voor timing)

### Quick checks (2-4x per dag)
- [ ] Unread important emails? (als Gmail gekoppeld)
- [ ] Calendar events komende 4 uur?
- [ ] Weer check als Mart mogelijk naar buiten gaat

### Track state in:
`memory/heartbeat-state.json`

## Hoe te gebruiken
- Check `memory/heartbeat-state.json` voor laatste check times
- Roteer door checks, niet alles elke keer
- Alleen melden als er iets IS, anders HEARTBEAT_OK

## Nachtmodus
- 23:00 - 08:00: HEARTBEAT_OK tenzij urgent
- Weekend ochtenden: later starten
