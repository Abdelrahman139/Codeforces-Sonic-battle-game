# ⚡ Sonic Battle - Competitive Coding Arena

A high-energy, real-time competitive coding game built with React, Vite, and Tailwind CSS, powered by the **Codeforces API**. Compete with friends in a 16-bit retro-themed arena where speed and efficiency are everything!

---

## 🎮 Game Features

- **Multiplayer Lobby**: Supports 2-4 players with live Codeforces handle validation.
- **Dynamic Problem Filtering**: Filter by category, difficulty rating (800-3000), and match duration.
- **Real-Time Leaderboard**: Watch as players climb the ranks with animated progress bars.
- **Spectator Mode**: Share your match URL and let others join the hype with interactive **Emoji Bursts** (🎉, ⚡, 🔥).
- **Retro Aesthetic**: Immersive 16-bit Sonic-themed UI powered by **Framer Motion**.

## 🎯 Key Mechanics

| Feature | Description |
| :--- | :--- |
| **Mystery Problem** | One random problem awards **2x points**, revealed only at the end of the match! |
| **Final Lap** | In the last 25% of match time, all points are **doubled** for an intense finish. |
| **First-to-Solve** | The first player to get an Accepted (AC) verdict on a problem claims the points. |
| **Point Formula** | Points scale exponentially with difficulty: `500 * (1.32^((Rating - 800)/200))` |

## 🚀 Getting Started

### Installation
Clone the repository and install dependencies:
```bash
npm install
```

### Development
Launch the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### Build
Generate a production-ready bundle:
```bash
npm run build
```

## 🛠️ Tech Stack

- **Frontend**: [React 18](https://react.dev/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Data Fetching**: [Axios](https://axios-http.com/)
- **Backend API**: [Codeforces API](https://codeforces.com/apiHelp)

## 📁 Project Structure

- `src/components`: UI components including Lobby, Match, and Results.
- `src/services`: API integration and match polling logic.
- `src/assets`: Sonic-themed images and sound effects.
- `src/utils`: Helper functions for point calculation and formatting.

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Gotta code fast!* 🦔💨
