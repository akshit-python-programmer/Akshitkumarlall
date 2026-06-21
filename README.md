# Akshit Kumar Lall — Portfolio

A single-page personal portfolio for my work in **Computer Vision, AI/ML, full-stack development, and robotics**. Built entirely from scratch using vanilla web technologies (HTML5, CSS3, vanilla ES6+ JavaScript) without heavy modern frameworks or build pipelines. The site integrates sophisticated, low-latency scroll-driven **Three.js** interactive 3D simulations.

🔗 **Live URL:** Enabled via GitHub Pages on the `main` branch.

---

## 🛠️ Deep Technical Architecture

This project is a study in highly optimized vanilla frontend architecture. To achieve flawless, 60fps scrolling on both mobile devices and high-refresh monitors alongside heavy WebGL resources, several specialized techniques were designed:

### 1. High-Performance WebGL/Three.js Optimization Pipeline
- **Adaptive Resolution Capping:** To prevent rendering bottlenecks on 4K/Retina displays, pixel ratios are strictly capped using `Math.min(window.devicePixelRatio, 1.5)`.
- **Runtime Viewport Frustum Culling & CPU Gates:** 
  - Dynamic grass and vegetation instances maintain active frustum culling.
  - Rendering loops for both 3D scenes (Drift Journey & Desert Contact) utilize `IntersectionObserver` visibility gates, executing early-returns to completely freeze render operations and CPU math when the sections scroll off-screen.
- **Damped Kinematic Motion Math:** Rather than standard linear interpolations (`lerp`) which feel rigid, the scroll-driven Mazda RX7 utilizes a critically-damped `smoothDamp` algorithm. This creates elastic, organic easing as it glides between milestones, with velocity low-passed into `velSmooth` to prevent visual jitter on irregular scrolling devices.
- **Hardware-Targeted Dynamic Feature Loading (Low-End Fallback):**
  - High-end post-processing features (such as `EffectComposer`, `UnrealBloomPass`, and `OutputPass`) are loaded conditionally. 
  - On page load, hardware heuristics are evaluated (requiring $\ge 8$ logical CPU cores, $\ge 4\text{GB}$ RAM, and precision pointer inputs). Only when passed, the engine asynchronously imports the heavy post-processing modules. Low-end and mobile environments fall back automatically to standard WebGL rendering to keep scrolling fluid.
- **Environment Theme Synchronization:** The WebGL environment listens to global `themechange` window events, dynamically swapping skies, realigning fog density, and adjusting parented car headlamp intensities (from `5` to `14`) on the fly.

### 2. Audio Synthesis & Engine Synchronization
- **Adaptive Audio Engine:** A custom-buffered engine noise (`car sound.mp3`) is synchronized with scroll behavior.
- Rather than basic on/off states, engine sound attributes (playback rate, volume) are mapped to the low-passed scroll velocity, gated strictly behind user gesture-activation rules to meet modern browser autoplay standards.

### 3. Media Streaming & Memory Management
- **Lazy-Loaded Single-Decoder Video Pipeline:**
  - Running several high-definition bento videos simultaneously is a massive memory leak. A custom `video-manager.js` intercepts all video elements.
  - Video tags are pre-rendered with blank placeholders. Real-time media streams are lazy-loaded only when modal views or cards are active, restricting hardware decoding to a maximum of **one active decoder instance** across the DOM.

### 4. Zero-Flicker Custom Dark Mode Engine
- **Early Execution Theme Injector:** A synchronous boot-script is embedded directly into the HTML `<head>` before any paint events. This reads from `localStorage` or prefers-color-scheme, applying `documentElement.dataset.theme = "dark"` instantly, preventing Flash of Unstyled Content (FOUC).
- **Specificity-Isolated Styling:** Dark mode styling targets `:root[data-theme="dark"]` specifically to cleanly isolate overrides from baseline CSS properties. Vivid neo-brutalist pastel tokens remain colorful by design while section backgrounds are adjusted.

### 5. Local Server MIME Bypass
- **Inlined ES6 Modules:** Windows-based Python HTTP servers serve external `.js` files with a `text/plain` Content-Type, triggering strict browser CORS blockages for standard module scripts. To guarantee frictionless local execution without requiring complex dev servers, all heavy ES-module JS (such as the Three.js scenes) are fully inlined as `<script type="module">` tags, keeping CDN importmaps functional.

---

## 💻 Tech Stack

| Domain | Technologies |
|---|---|
| **Core Layout** | HTML5 (Semantic tags), Custom CSS3 variables, CSS Grid, Flexbox |
| **Styling Paradigm** | Append-only Neo-Brutalist overlay system (`css/neo-brutal.css`) |
| **Logic & Pipeline** | Vanilla JavaScript (ES6+ Modules, IntersectionObserver, requestAnimationFrame) |
| **3D Rendering** | [Three.js r160](https://threejs.org/) (Custom shader components, shadowless SpotLights, CatmullRomCurve3 path-following) |
| **Typography & Assets** | Google Fonts (Inter, Press Start 2P, IBM Plex Mono, JetBrains Mono), custom cursors |
| **Back-end Services** | Serverless integration via [FormSubmit](https://formsubmit.co/) |

---

## 📂 Project Structure

```
.
├── index.html            # Core page. Declares bento grids, modal markup, styling definitions, and inlined 3D scripts
├── next-gen-camera.html  # Dedicated Next Gen Camera page (Console emulator and visual component breakdowns)
├── cv-lab.html           # Computer Vision showcase lab
├── web-lab.html          # Web Studio showcase lab
├── create-lab.html       # Creative Design showcase lab
├── innovation-lab.html   # Hardware development lab
├── css/
│   ├── neo-brutal.css    # Neo-brutalist overrides (zero-blur hard shadows, flat saturated colors, font mappings)
│   └── labs.css          # Common responsive layouts for standard sub-labs
├── js/
│   └── video-manager.js  # Lazy-loading single-instance HTML5 video management wrapper
└── assets/               # Standardized repository for static textures, certificate PDFs, and GLB meshes
```

---

## 🚀 Running Locally

Because the project utilizes ES6 modules with CDN importmaps, launching the file via standard double-clicking (`file://` protocol) will fail CORS restrictions. Launch a local web server:

```powershell
# Run using Python
python -m http.server 3000

# Open your browser to
http://localhost:3000
```

---

## 🌐 Production Deployment

The project is configured for continuous delivery via **GitHub Pages**. The pipeline triggers automatically upon commits to the `main` branch. 

---

## 📬 Contact Details

- **Email:** akshitkumarlal@gmail.com
- **LinkedIn:** [linkedin.com/in/akshitkumarlall](https://linkedin.com/in/akshitkumarlall)
- **GitHub:** [github.com/akshit-python-programmer](https://github.com/akshit-python-programmer)

