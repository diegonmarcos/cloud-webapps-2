# Cloud Services Dashboard

A modern, responsive dashboard for managing cloud infrastructure services, built with TypeScript and Sass.

## 🚀 Features

- **Modern Tech Stack**: TypeScript + Sass for maintainable code
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **3D Card Effects**: Interactive hover effects with perspective transforms
- **Service Status Monitoring**: Real-time status indicators for all services
- **Modular Architecture**: Clean separation of concerns with TypeScript classes

## 📁 Project Structure

```
cloud/
├── src_static/
│   ├── scss/
│   │   ├── _variables.scss     # Color, spacing, and typography variables
│   │   ├── _mixins.scss         # Reusable Sass mixins
│   │   ├── _base.scss           # Base styles and reset
│   │   ├── _animations.scss     # Keyframe animations
│   │   ├── components/
│   │   │   ├── _header.scss     # Header component styles
│   │   │   └── _card.scss       # Card component styles
│   │   └── main.scss            # Main entry point
│   └── typescript/
│       ├── types.ts             # TypeScript type definitions
│       ├── card-effects.ts      # 3D card hover effects
│       ├── notification.ts      # Notification system
│       ├── service-handler.ts   # Service click handlers
│       ├── status-monitor.ts    # Status monitoring
│       └── main.ts              # Application entry point
├── dist/                        # Build output directory
├── 1.ops/
│   └── build.sh                 # POSIX-compliant build script
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Tech Stack

- **CSS**: Sass (SCSS syntax)
- **JavaScript**: TypeScript (ES2015+)
- **Build Tools**:
  - `sass` for CSS preprocessing
  - `esbuild` for TypeScript bundling
  - `eslint` for linting
  - `prettier` for code formatting

## 📦 Installation

```bash
# Navigate to the cloud directory
cd cloud/

# Install dependencies
npm install
```

## 🏗️ Build Commands

### Production Build
```bash
# Build for production (minified, no source maps)
npm run build

# Or use the build script
./1.ops/build.sh build
```

### Development Mode
```bash
# Start development mode with file watching
npm run dev

# Or use the build script
./1.ops/build.sh dev
```

### Individual Builds
```bash
# Build CSS only
npm run build:css

# Build JavaScript only
npm run build:js
```

### Cleaning
```bash
# Clean build artifacts
npm run clean

# Or use the build script
./1.ops/build.sh clean
```

## 🧪 Code Quality

```bash
# Lint TypeScript
npm run lint

# Format code
npm run format
```

## 🚀 Integration with Main Build System

This project is integrated with the main repository build system:

```bash
# From repository root
./1.ops/build_main.sh build-cloud       # Build cloud dashboard
./1.ops/build_main.sh dev-cloud         # Start dev server
./1.ops/build_main.sh build             # Build all projects (includes cloud)
```

## 📊 Services

The dashboard manages the following cloud services:

- **Proxy**: Reverse proxy and load balancing
- **Firewall**: Network security and protection
- **Mail**: Email server and management
- **Sync**: File synchronization service
- **Drive**: Cloud storage and file management
- **VPS Oracle**: Oracle Cloud virtual server
- **Analytics**: Traffic and usage statistics
- **VPS Local**: Local virtual private server
- **Terminal**: Command line interface access
- **Ops Dashboard**: Operations monitoring and control

## 🎨 Customization

### Colors

Edit `src_static/scss/_variables.scss` to customize colors:

```scss
$bg-primary: #0a0e27;
$bg-secondary: #151a33;
$accent-blue: #4a9eff;
$accent-purple: #8b5cf6;
```

### Service URLs

Edit `src_static/typescript/service-handler.ts` to update service URLs:

```typescript
private serviceUrls: ServiceUrls = {
  'proxy': '/proxy',
  'firewall': '/firewall',
  // ...
};
```

## 📝 License

MIT

## 👤 Author

Diego Nepomuceno Marcos
