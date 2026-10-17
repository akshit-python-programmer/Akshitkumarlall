# Akshit Kumar Lall Portfolio

Single-page portfolio site built with plain HTML, CSS, and JavaScript.

## Run locally

Use any local HTTP server from the project root:

```powershell
python -m http.server 3000
```

Then open http://localhost:3000

## Main files

- index.html: main portfolio page
- next-gen-camera.html: standalone Next Gen Camera page
- css/neo-brutal.css: main style overrides
- css/labs.css: styles for lab sub-pages
- js/video-manager.js: lazy-loading behavior for project videos
- assets/previews/: short, compressed clips + poster frames used by project cards (full videos load only in the project modal)
- projects.json: project card and modal data
- robots.txt and sitemap.xml: search crawler access and public page URLs
- 404.html: GitHub Pages not-found response

## Contact

- Email: akshitkumarlal@gmail.com
- LinkedIn: https://linkedin.com/in/akshitkumarlall
- GitHub: https://github.com/akshit-python-programmer

## Adding media

- Images: add a `.webp` version (max ~1600px wide) and reference that instead of large PNG/JPG files.
- Project card video: create a small preview clip and poster, e.g.

```bash
ffmpeg -ss 0 -i input.mp4 -t 10 -an -vf "scale='min(640,iw)':-2,fps=24" -c:v libx264 -crf 30 -movflags +faststart assets/previews/name.mp4
ffmpeg -ss 1 -i assets/previews/name.mp4 -frames:v 1 -quality 70 assets/previews/name.webp
```
