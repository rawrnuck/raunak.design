# raunak.design

A portfolio website showcasing Raunak Mandil's work as a Designer. Built as a single-page application with HTML, CSS, and JavaScript, featuring an interactive slideshow interface inspired by fashion editorial lookbooks.

## Project Overview

This project is a high-fashion editorial lookbook interface adapted for a personal portfolio. It presents work across four disciplines: Systems, Identity, Motion, and Editorial. The interface auto-advances through slides, with manual navigation via keyboard, mouse, or touch.

## Layout and Grid Structure

The layout uses CSS Grid for a structured, responsive design:

### Main Grid (`.shell`)
- **Columns**: 200px (sidebar) | 1fr (main content) | 280px (panel)
- **Rows**: 48px (masthead) | 1fr (content) | 56px (filmstrip)
- **Total**: 3x3 grid with borders for a framed look

### Components:
1. **Masthead** (top row, spans all columns): Brand name, navigation, meta info
2. **Sidebar Left** (column 1, rows 2-3): Counter, navigation dots, project details, arrows
3. **Image Stage** (column 2, row 2): Full-bleed image slideshow with Ken Burns transitions
4. **Filmstrip** (column 2, row 3): Thumbnail grid (4 columns) for quick navigation
5. **Panel Right** (column 3, rows 2-3): Project titles, discipline-specific details, and interactive project lists

### Responsive Design
- On mobile, the grid stacks vertically
- Sidebar and panel collapse or reposition
- Touch gestures replace mouse interactions

## JavaScript Functionality

The JavaScript handles slideshow logic, animations, and interactions:

### Data Structure
- `DATA` array: 4 objects, each representing a portfolio category
- Each object contains: eyebrow, name, sub, dotLabel, details (tools/role/style/influence), projects (list of 4 interactive rows), projectImages (slideshow assets)

### Core Functions
- `goTo(idx)`: Transitions to a specific slide
  - Updates active classes for slides, thumbnails, dots
  - Fades out/in content with 270ms delay
  - Resets auto-advance timer

- `renderContent()`: Updates DOM with current slide data
  - Counter numbers, headlines, details, inspiration quotes

- `resetProgress()`: Animates gold progress line over 5.5 seconds
- `startAuto()` / `resetAuto()`: Manages auto-advance timer

### Interactions
- **Navigation**: Arrows, dots, thumbnails, keyboard (arrows/space), touch swipe
- **Auto-advance**: Every 5.5 seconds, with progress bar
- **Click zones**: Left/right halves of image stage for navigation

### Custom Cursor
- Outer cursor: Lerp interpolation (13% easing) for smooth follow
- Inner cursor: Direct mouse position
- Hover states: Enlarges on interactive elements
- Labels: "NEXT →" / "← PREV" on click zones

### Animations
- Slide transitions: Opacity and scale (0.75s cubic-bezier)
- Content fades: Class-based opacity transitions
- Progress line: Linear width animation
- Thumbnail filters: Grayscale to color on hover/active

## Typography and Styling

- **Fonts**: Cormorant Garamond (serif), Unbounded (sans), Space Mono (mono)
- **Colors**: Cream background, ink text, gold accents, steel grays
- **Effects**: Custom cursor, mix-blend-mode multiply, stroke outlines on headlines

## Technical Details

- **No frameworks**: Pure HTML/CSS/JS
- **Performance**: RequestAnimationFrame for cursor lerp
- **Accessibility**: Keyboard navigation, semantic HTML
- **Browser support**: Modern browsers with CSS Grid support

## Usage

1. Open `index.html` in a browser
2. Navigate with arrows, clicks, or wait for auto-advance
3. Responsive on mobile with touch support

## Development

- Edit `DATA` array in `script.js` to update content
- Modify CSS variables for theming
- Images in `./images/` folder
