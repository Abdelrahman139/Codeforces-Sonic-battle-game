# ⚡ Sonic Battle - Competitive Coding Arena

A high-energy, real-time competitive coding game using React, Vite, Tailwind CSS, and the Codeforces API.

## 🎮 Features

- Multi-player lobby system (2-4 players)
- Codeforces handle validation
- Configurable problem filtering (categories, rating, duration)
- Real-time match progress tracking
- Spectator mode with emoji bursts
- 16-bit Sonic-themed aesthetic

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

## 🎯 Game Rules

1. Players enter their Codeforces handles in the lobby
2. Configure match settings (categories, max rating, duration)
3. Problems are pre-filtered to exclude any solved by players
4. One random problem awards double points (hidden until results)
5. First to solve (AC) wins the points
6. Final Lap mode doubles all points in the last 25% of match time

## 🛠️ Tech Stack

- React 18
- Vite
- Tailwind CSS
- Framer Motion
- Axios
- Codeforces API

## 📝 License

MIT
