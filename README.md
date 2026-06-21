# Akshit Kumar Lall — Portfolio

A single-page personal portfolio for my work in **Computer Vision, AI/ML, full-stack development and robotics**. Built from scratch with plain HTML, CSS and JavaScript — no framework, no build step — with a couple of interactive **Three.js** 3D scenes layered in.

🔗 **Live:** enable GitHub Pages on the `main` branch (`Settings → Pages`).

---

## Highlights

- **Scroll-driven 3D "drift journey"** — a low-poly car drifts down a winding road past my life milestones as you scroll, with a smoke trail, roadside scenery and engine audio (Three.js).
- **3D desert-road contact scene** — a slowly rotating model sits behind a glassmorphism contact form.
- **Neo-brutalist design language** — flat pastel fills, hard zero-blur shadows, chunky mono/pixel type.
- **Project showcase** — a bento grid of projects with category filters and detail modals; videos lazy-load one decoder at a time to stay smooth.
- **Interactive "labs"** — standalone sub-pages for Computer Vision, Web, Create and the Next Gen Camera project.
- **Details:** a custom pixel-art cursor, VHS-styled client testimonials, an animated typewriter intro, scroll-reveal animations, and a fully responsive layout that adapts down to mobile.
- **Performance-minded 3D** — DPR is capped, off-screen frames are skipped, and a heavier bloom post-process only loads on capable devices.

---

## Tech Stack

| Area | Used |
|------|------|
| Markup / Styling | HTML5, modern CSS (custom properties, grid, flexbox — no CSS framework) |
| Scripting | Vanilla JavaScript (ES modules) |
| 3D | [Three.js](https://threejs.org/) r160 (GLTF models, post-processing) |
| Icons / Fonts | Font Awesome 6, Google Fonts (Inter, JetBrains Mono, IBM Plex Mono, Press Start 2P) |
| Forms | [FormSubmit](https://formsubmit.co/) for the contact form |

---

## Run it locally

It's a static site, so any local web server works. With Python:

```bash
python -m http.server 3000
# then open http://localhost:3000
```

> Tip: open it through a server (not the `file://` protocol) so the ES-module 3D scenes load correctly.

---

## Project Structure

```
.
├── index.html            # the main single-page site (sections + most CSS/JS)
├── next-gen-camera.html  # dedicated page for the Next Gen Camera project
├── cv-lab.html           # Computer Vision lab
├── web-lab.html          # Web studio lab
├── create-lab.html       # Create lab
├── innovation-lab.html   # Next Gen Camera lab
├── css/
│   ├── neo-brutal.css    # neo-brutalist styles (hero, about, journey, contact, testimonials)
│   └── labs.css          # shared styles for the lab sub-pages
├── js/
│   └── video-manager.js  # lazy-loads project videos one at a time
└── assets/               # 3D models, images, certificates, project media, fonts/cursors
```

---

## Deployment

Hosted with **GitHub Pages** straight from the `main` branch — no build pipeline. Push to `main` and it ships.

---

## Contact

**Akshit Kumar Lall** — founder of AKL Robotics

- Email: akshitkumarlal@gmail.com
- LinkedIn: [linkedin.com/in/akshitkumarlall](https://linkedin.com/in/akshitkumarlall)
- GitHub: [github.com/akshit-python-programmer](https://github.com/akshit-python-programmer)
