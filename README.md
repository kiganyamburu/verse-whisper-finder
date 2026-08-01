# VerseFinder

VerseFinder is a modern, responsive web application built with React, Next.js, Tailwind CSS, and shadcn/ui. Like Shazam for music, it identifies Bible scriptures from spoken audio inputs or uploaded audio files.

---

## Features

* **Real Voice Recording:** Capture speech directly from your microphone using the HTML5 `MediaRecorder` API.
* **Audio Playback:** Review and play back your recorded voice clips before matching.
* **Audio Uploads:** Upload pre-recorded audio files (`audio/*`) to trigger recognition.
* **Dark Mode Support:** Smooth theme toggling (Light, Dark, and System settings) supported globally.
* **Database Match Simulation:** Visual indicator showcasing waveform analysis and database queries.

---

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18.x or later is recommended).

### Setup and Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

3. **Build the production bundle:**
   ```bash
   npm run build
   ```

4. **Start production server:**
   ```bash
   npm run start
   ```

---

## Project Structure

* `src/app/` — Root layout, providers context, and Page router views.
* `src/components/` — Application components (AudioRecorder, ThemeToggle, HeroSection, Header, VerseResults).
* `src/components/ui/` — Base UI primitives (buttons, cards, badges, toast viewports) managed by shadcn.
* `src/hooks/` — Custom hooks (e.g. `useToast`).
* `src/lib/` — Helper utility functions.
