# The GP Edge

A premium educational and productivity SaaS platform for Australian GP registrars, providing adaptive mock exams (AKT/KFP), an MBS billing item explorer, and clinical autofill templates.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Typography:** DM Sans & DM Serif Display (Google Fonts)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
├── app/
│   ├── globals.css      # Global styles & Tailwind directives
│   ├── layout.tsx       # Root layout with metadata
│   └── page.tsx         # Landing page
├── components/
│   ├── Header.tsx       # Fixed navigation header
│   ├── Hero.tsx         # Hero section with CTAs
│   ├── StatsBar.tsx     # Glassmorphic stats bar
│   ├── BentoGrid.tsx    # Core tools bento grid
│   ├── IntelligenceEngine.tsx  # Dark mode feature section
│   ├── Footer.tsx       # Multi-column footer
│   └── Logo.tsx         # SVG logo component
├── tailwind.config.ts   # Tailwind configuration
└── package.json
```

## Design System

- **Colors:** Teal (#0D9488) & White with slate neutrals
- **Cards:** Neomorphic shadows, rounded-3xl corners
- **Effects:** Subtle glassmorphism with backdrop-blur
- **Animations:** Desktop static, micro-interactions only (hover states)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
# The-GP-Edge-official
# The-GP-Edge-official
