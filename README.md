# ROYAL ENFIELD // ZERO-GRAVITY 3D EXPERIENCE
### Engineered to Move Beyond Gravity

An ultra-immersive, cinematic, futuristic 3D interactive website featuring a classic **Royal Enfield** motorcycle suspended in an anti-gravity dark 3D environment with cubic modular deconstruction.

---

## 🌟 Key Features

### 1. Photorealistic Royal Enfield Classic Motorcycle
- **Iconic Teardrop Tank**: Sculpted compound curvature, authentic rubber knee grips, 3D golden Royal Enfield winged medallions, and vintage Monza flip cap.
- **Engine & Powertrain**: 648cc parallel-twin cylinder block with 11 horizontal cooling fin layers, polished chrome clutch casing with medallion, spark plugs with high-tension ignition leads, throttle bodies, and shift linkage.
- **Exhaust System**: Dual sweeping mirror-chrome header pipes curving beneath the cradle frame into authentic upswept pea-shooter reverse-cone silencers with heat shields.
- **Wheels & Brakes**: 19-inch front and 18-inch rear aluminum rims laced with 36 cross-pattern chrome wire spokes, deep vintage rubber tire sipes, 320mm floating rotor with Brembo gold caliper, rear drive sprocket and roller chain.
- **Cockpit & Optics**: Curved bullet nacelle with chrome bezel, prismatic glass lens, twin signature "Tiger Eyes" pilot lamps, wide touring handlebars, circular analog speedometer with backlit dial, and dual round mirrors.
- **Saddle & Bodywork**: Quilted cognac leather saddle with contrast stitching and brass stud rivets, valanced steel mudguards, and Lucas-style ruby taillight.

### 2. Cubic Modular 3D Deconstruction (The Core Signature)
- The motorcycle is divided into **12 discrete mechanical modules**:
  1. `MOD-01`: Front Kinetic Wheel (19" Spoked + Brake)
  2. `MOD-02`: Rear Traction Wheel (18" Final Drive)
  3. `MOD-03`: Optical Nacelle (Tiger Eyes & Projector)
  4. `MOD-04`: Cockpit & Controls (Handlebars & Speedo)
  5. `MOD-05`: Teardrop Reservoir (13.7L Fuel Tank)
  6. `MOD-06`: Powertrain (648cc Air-Cooled Twin)
  7. `MOD-07`: Exhaust Runners (Pea-Shooter Silencers)
  8. `MOD-08`: Saddle (Quilted Cognac Leather)
  9. `MOD-09`: Chassis (Tubular Twin-Cradle Frame)
  10. `MOD-10`: Suspension (Gaiters & Dual Shocks)
  11. `MOD-11`: Power Bay (Toolboxes & Harness)
  12. `MOD-12`: Bodywork (Steel Mudguards & Tail)
- Each module is framed by **glowing geometric cubic wireframes**, **laser-cut corner brackets**, and **transparent holographic glass panels** that gently emerge as the bike deconstructs.
- **Laser Tether Lines** dynamically connect floating modules back to the central Harris Performance chassis in zero gravity.
- **3D Floating Billboards** display real-time module designations and telemetry coordinates.

### 3. Mouse & Touch Drag Interaction
- **Horizontal Drag**: Rotates the motorcycle smoothly in 3D around the Y axis with realistic angular momentum.
- **Vertical Drag**: Controls the anti-gravity deconstruction expansion height along the 3D grid.
- **Realistic Inertia & Damping**: Parts decelerate gently when releasing the mouse and return with magnetic attraction when reversing.
- **Double Click**: Resets the entire motorcycle to its assembled pristine state with smooth easing.
- **Dynamic Parallax Lighting**: Studio key and rim lights track mouse coordinates, sweeping specular reflections across chrome surfaces.

### 4. 6-Chapter Scroll Narrative
- **Section 01 // Equilibrium**: Complete form suspended in zero gravity.
- **Section 02 // Activation**: Gravitational flux and ambient energy activation.
- **Section 03 // Decoupling**: Modular uncoupling along the 3D grid.
- **Section 04 // Zero-G Matrix**: Fully exploded mechanical sculpture with coordinate telemetry.
- **Section 05 // Reconvergence**: Magnetic snap-in reassembly.
- **Section 06 // Architecture**: Complete interactive module explorer with technical specification drawers.

### 5. Procedural Web Audio Synthesizer
- Built using the native HTML5 Web Audio API (zero external sound files needed).
- Deep 52Hz zero-gravity hum modulated by LFO.
- Deconstruction kinetic whoosh modulated by drag velocity.
- Resonant metallic click upon magnetic lock reassembly.

### 6. Bespoke Finishes & View Modes
- **5 Classic Royal Enfield Colorways**:
  - *British Racing Green*
  - *Interstellar Polished Chrome*
  - *Jet Black & Gold Coachlines*
  - *Desert Storm Matte*
  - *Apex Royal Crimson*
- **3 View Modes**:
  - `STUDIO`: Photorealistic lighting, deep reflections, and ACES Filmic tone mapping.
  - `GRID`: Anti-gravity bounding boxes, corner brackets, and laser tether lines.
  - `X-RAY`: Futuristic holographic wireframe model rendering.

---

## 🚀 How to Run

### Method 1: Instant Local Server (Recommended)
Double-click `start-server.bat` or run:
```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 8080
```
Then open:
```
http://localhost:8080/
```

### Method 2: Direct File Open
You can also open `index.html` directly in any modern browser (Chrome, Edge, Firefox, Safari). All Three.js and GSAP libraries are bundled locally in the `vendor/` directory for 100% offline support.

---

## 🛠️ Tech Stack
- **Three.js (r128)**: WebGL 3D rendering, custom PBR materials, procedural HDR radiance environment map, and particle systems.
- **GSAP (GreenSock)**: Smooth state interpolation and kinetic easing.
- **HTML5 Canvas**: Procedural normal and bump maps (vintage tire siping, quilted leather, speedometer gauge, tank wing crests).
- **Web Audio API**: Real-time synthesized ambient soundscape and tactile feedback.
- **Modern CSS**: Cyberpunk glassmorphism, responsive aerospace HUD, and cinematic typography.
