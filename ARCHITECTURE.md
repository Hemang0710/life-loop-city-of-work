# Architecture Plan

## Frontend
Phaser scenes:
- BootScene
- CityScene
- UIScene
- MiniGameScene

## Backend
Node.js + Express + Socket.IO:
- player sync
- movement sync
- shared presence
- simple trade support

## Save Strategy
- localStorage for player progress
- backend only for live multiplayer state
