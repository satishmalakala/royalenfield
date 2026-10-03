/**
 * Royal Enfield 3D Interactive Controller
 * 
 * CORE BEHAVIOR:
 * 1. Initial State: 100% NORMAL, showroom-quality, fully assembled motorcycle at 0% scroll.
 * 2. Scroll Down: Progressively separates the bike into organized 3D mechanical components (0% -> 100%).
 * 3. Scroll Up: Smoothly returns all parts to their normal assembled positions.
 * 4. Horizontal Drag: Rotates the motorcycle 360° around Y axis at any scroll stage.
 */

window.RE_App = (function () {
    let scene, camera, renderer;
    let bikeGroup, materialsObj;

    // Rotation & Scroll State
    let currentRotationY = -0.52; // Classic 3/4 front view
    let targetRotationY = -0.52;
    let rotationVelocity = 0;

    let currentProgress = 0.0; // Strictly 0.0 at page load
    let targetProgress = 0.0;

    let isDragging = false;
    let previousPointerX = 0;
    let previousPointerY = 0;

    // Mouse Parallax
    let mouseParallaxX = 0;
    let mouseParallaxY = 0;
    let targetParallaxX = 0;
    let targetParallaxY = 0;

    // Studio Lights
    let keyLight, rimLight, warmRimLight;
    let contactShadowMesh = null;

    const clock = new THREE.Clock();

    function removeLoader() {
        const loader = document.getElementById('loader');
        if (loader && !loader.dataset.dismissed) {
            loader.dataset.dismissed = 'true';
            loader.classList.add('fade-out');
            loader.classList.add('hidden');
            setTimeout(() => {
                try { loader.remove(); } catch (_) {}
            }, 800);
        }
    }

    function init() {
        const container = document.getElementById('canvas-container');

        // Safety fallback timeout
        setTimeout(removeLoader, 8000);

        try {
            // 1. Scene Setup
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x060709); // Dark cinematic studio void
            scene.fog = new THREE.FogExp2(0x060709, 0.065);

            // 2. Camera Setup (38° telephoto FOV, stable & centered)
            const aspect = window.innerWidth / window.innerHeight;
            camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 50);
            camera.position.set(2.4, 0.72, 2.3);
            camera.lookAt(0, 0.42, 0);

            // 3. Renderer Setup
            renderer = new THREE.WebGLRenderer({
                antialias: true,
                powerPreference: 'high-performance',
                alpha: false
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.25;
            renderer.outputEncoding = THREE.sRGBEncoding;
            container.appendChild(renderer.domElement);

            // 4. Materials & Radiance Map
            if (window.RE_Materials && typeof window.RE_Materials.init === 'function') {
                materialsObj = window.RE_Materials.init(renderer);
                scene.environment = materialsObj.envMap;
            } else {
                materialsObj = { materials: {} };
            }

            // 5. Studio Lighting Rig
            setupLighting();

            // 6. Build the Normal Assembled Royal Enfield Motorcycle
            const bikeData = window.RE_BikeModel.createMotorcycle(materialsObj.materials);
            bikeGroup = bikeData.bikeRoot;

            // Ground Contact Ambient Occlusion Shadow Plane (Anchors wheels and engine firmly)
            if (materialsObj.materials && materialsObj.materials.contactShadow) {
                const shadowGeom = new THREE.PlaneGeometry(2.2, 0.85);
                contactShadowMesh = new THREE.Mesh(shadowGeom, materialsObj.materials.contactShadow);
                contactShadowMesh.rotation.x = -Math.PI / 2;
                contactShadowMesh.rotation.z = Math.PI / 2;
                contactShadowMesh.position.set(0, 0.001, 0);
                bikeGroup.add(contactShadowMesh);
            }

            scene.add(bikeGroup);

            // 7. Modular Grid (Invisible at 0%, emerges on scroll)
            if (window.RE_ModularGrid && typeof window.RE_ModularGrid.init === 'function') {
                window.RE_ModularGrid.init(bikeData.modules, materialsObj.materials, scene);
            }

            // 8. Subtle Dust Particles
            if (window.RE_Particles && typeof window.RE_Particles.init === 'function') {
                window.RE_Particles.init(scene);
            }

            // 8B. Interactive Test Drive Simulator
            if (window.RE_TestDrive && typeof window.RE_TestDrive.init === 'function') {
                window.RE_TestDrive.init(scene, camera, bikeGroup, bikeData.modules, materialsObj.materials);
            }

            // 9. Event Listeners
            setupEventListeners();

            // Compute initial scroll progress immediately (guaranteed 0 at top)
            updateScrollProgress();

            // Force initial position update with progress = 0 (100% normal assembled bike)
            window.RE_BikeModel.updateDeconstruction(0, 0);
            if (window.RE_ModularGrid) window.RE_ModularGrid.update(0, 0);

            // Hide Loading Screen smoothly
            setTimeout(removeLoader, 400);

            // Start Render Loop
            animate();
        } catch (initErr) {
            console.error('[RE_App] Init error:', initErr);
            removeLoader();
        }
    }

    // Studio Lighting
    function setupLighting() {
        const ambient = new THREE.AmbientLight(0x0e131b, 0.32);
        scene.add(ambient);

        // 1. Soft Overhead Studio Key Light (diffuse softbox from top-front)
        keyLight = new THREE.DirectionalLight(0xfff7ee, 1.5);
        keyLight.position.set(2.2, 4.2, 2.5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 15;
        keyLight.shadow.bias = -0.0005;
        const d = 2.2;
        keyLight.shadow.camera.left = -d;
        keyLight.shadow.camera.right = d;
        keyLight.shadow.camera.top = d;
        keyLight.shadow.camera.bottom = -d;
        scene.add(keyLight);

        // 2. Studio Front/Side Fill Light: Soft directional fill preserving deep shadow contrasts
        const frontFillLight = new THREE.DirectionalLight(0xdbe6f5, 0.65);
        frontFillLight.position.set(3.6, 1.5, 2.5);
        scene.add(frontFillLight);

        // 3. Subtle Edge Grazing Rim Light (Cyan rim light from behind)
        rimLight = new THREE.DirectionalLight(0x00e5ff, 0.70);
        rimLight.position.set(-2.0, 3.8, -2.8);
        scene.add(rimLight);

        // 4. Warm Rear Silhouette Accent (Warm touch on exhaust tips and rear tail)
        warmRimLight = new THREE.DirectionalLight(0xff9933, 0.60);
        warmRimLight.position.set(2.5, 2.0, -3.2);
        scene.add(warmRimLight);
    }

    // Calculate Scroll Progress strictly from the Scroll Track Container
    function updateScrollProgress() {
        const track = document.getElementById('scroll-track');
        if (track) {
            const rect = track.getBoundingClientRect();
            const totalScrollable = track.offsetHeight - window.innerHeight;
            if (totalScrollable > 0) {
                const scrolled = -rect.top;
                targetProgress = Math.min(1.0, Math.max(0.0, scrolled / totalScrollable));
            } else {
                targetProgress = 0.0;
            }
        } else {
            const maxScroll = (document.documentElement.scrollHeight - window.innerHeight) || 1;
            targetProgress = Math.min(1.0, Math.max(0.0, window.scrollY / maxScroll));
        }

        updateStatusBadge(targetProgress);
    }

    // Event Listeners
    function setupEventListeners() {
        const dom = renderer.domElement;

        // Pointer Down (Horizontal Rotate)
        dom.addEventListener('pointerdown', (e) => {
            if (window.RE_TestDrive && window.RE_TestDrive.isActive()) return;
            isDragging = true;
            try { dom.setPointerCapture(e.pointerId); } catch (_) {}
            previousPointerX = e.clientX;
            previousPointerY = e.clientY;
            rotationVelocity = 0;
            dom.style.cursor = 'grabbing';
        });

        // Pointer Move
        window.addEventListener('pointermove', (e) => {
            targetParallaxX = (e.clientX / window.innerWidth - 0.5) * 2;
            targetParallaxY = (e.clientY / window.innerHeight - 0.5) * 2;

            if (!isDragging) return;
            if (window.RE_TestDrive && window.RE_TestDrive.isActive()) return;

            const deltaX = e.clientX - previousPointerX;
            const deltaY = e.clientY - previousPointerY;

            // Horizontal drag: Rotates motorcycle around Y axis
            const rotDelta = deltaX * 0.0055;
            targetRotationY += rotDelta;
            rotationVelocity = rotDelta;

            // If user drags vertically on canvas, smoothly forward scroll
            if (Math.abs(deltaY) > 2) {
                window.scrollBy({ top: -deltaY * 1.5, behavior: 'auto' });
            }

            previousPointerX = e.clientX;
            previousPointerY = e.clientY;
        });

        // Pointer Up
        window.addEventListener('pointerup', (e) => {
            if (window.RE_TestDrive && window.RE_TestDrive.isActive()) return;
            if (isDragging) {
                isDragging = false;
                try { dom.releasePointerCapture(e.pointerId); } catch (_) {}
                dom.style.cursor = 'grab';
            }
        });

        // Double-click: Resets rotation and scrolls back to normal assembled bike at top
        dom.addEventListener('dblclick', () => {
            if (window.RE_TestDrive && window.RE_TestDrive.isActive()) return;
            resetBike();
        });

        // Scroll listener strictly drives progress
        window.addEventListener('scroll', updateScrollProgress, { passive: true });

        // Resize listener
        window.addEventListener('resize', onWindowResize);

        // UI Controls
        setupUiControls();
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        updateScrollProgress();
    }

    // Reset bike to assembled normal state and scroll to top
    function resetBike() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        targetRotationY = -0.52;
        rotationVelocity = 0;
        if (window.RE_Audio) window.RE_Audio.playMagneticLock();
    }

    // Update Status Badge & Step Indicator
    function updateStatusBadge(prog) {
        const badge = document.getElementById('system-status');
        const telemetry = document.getElementById('telemetry-val');
        const slider = document.getElementById('deconstruct-slider');
        const stageTag = document.getElementById('current-stage-tag');

        if (telemetry) {
            telemetry.innerText = `${(prog * 100).toFixed(0)}% DECONSTRUCTION`;
        }
        if (slider) {
            slider.value = prog;
        }

        if (prog <= 0.05) {
            if (badge) {
                badge.innerText = 'NORMAL // FULLY ASSEMBLED';
                badge.className = 'status-badge stabilized';
            }
            if (stageTag) stageTag.innerText = 'STAGE 01 // 100% ASSEMBLED SHOWROOM';
        } else if (prog <= 0.35) {
            if (badge) {
                badge.innerText = 'INITIAL SEPARATION // 20%';
                badge.className = 'status-badge deconstructed';
            }
            if (stageTag) stageTag.innerText = 'STAGE 02 // WHEELS & TANK UNCOUPLING';
        } else if (prog <= 0.65) {
            if (badge) {
                badge.innerText = 'MAJOR COMPONENT EXPANSION // 50%';
                badge.className = 'status-badge deconstructed';
            }
            if (stageTag) stageTag.innerText = 'STAGE 03 // ENGINE & EXHAUST SEPARATED';
        } else if (prog <= 0.85) {
            if (badge) {
                badge.innerText = 'EXPLODED 3D GRID // 80%';
                badge.className = 'status-badge deconstructed';
            }
            if (stageTag) stageTag.innerText = 'STAGE 04 // CLEAN 3D EXPLODED MATRIX';
        } else {
            if (badge) {
                badge.innerText = 'COMPLETE EXPLODED VIEW // 100%';
                badge.className = 'status-badge deconstructed';
            }
            if (stageTag) stageTag.innerText = 'STAGE 05 // FULL PRODUCT ARCHITECTURE';
        }
    }

    // UI Buttons & Swatches
    function setupUiControls() {
        const audioBtn = document.getElementById('audio-toggle');
        if (audioBtn) {
            audioBtn.addEventListener('click', () => {
                const unmuted = window.RE_Audio.toggleAudio();
                audioBtn.classList.toggle('active', unmuted);
                audioBtn.querySelector('.btn-label').innerText = unmuted ? 'AUDIO ON' : 'AUDIO OFF';
            });
        }

        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetBike);
        }

        // Color Swatches
        const swatches = document.querySelectorAll('.color-swatch');
        swatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                swatches.forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                const colorHex = parseInt(swatch.dataset.color, 16);
                const name = swatch.dataset.name;
                window.RE_Materials.setBikeColor(colorHex, name);
                if (window.RE_Audio) window.RE_Audio.playUiClick();
            });
        });

        // View Modes (Studio / Grid / X-Ray)
        const modeBtns = document.querySelectorAll('.mode-btn');
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const mode = btn.dataset.mode;
                const mats = materialsObj.materials;

                if (mode === 'studio') {
                    mats.tankPaint.wireframe = false;
                    mats.castIron.wireframe = false;
                    mats.chrome.wireframe = false;
                    renderer.toneMappingExposure = 1.25;
                } else if (mode === 'grid') {
                    mats.tankPaint.wireframe = false;
                    mats.castIron.wireframe = false;
                    mats.chrome.wireframe = false;
                    renderer.toneMappingExposure = 1.4;
                } else if (mode === 'xray') {
                    mats.tankPaint.wireframe = true;
                    mats.castIron.wireframe = true;
                    mats.chrome.wireframe = true;
                    renderer.toneMappingExposure = 1.6;
                }
                if (window.RE_Audio) window.RE_Audio.playUiClick();
            });
        });

        // Module Inspection Quick Links
        const moduleLinks = document.querySelectorAll('.module-quick-link');
        moduleLinks.forEach(link => {
            link.addEventListener('click', () => {
                const modKey = link.dataset.module;
                inspectModule(modKey);
            });
        });

        const closeInspectorBtn = document.getElementById('close-inspector');
        if (closeInspectorBtn) {
            closeInspectorBtn.addEventListener('click', () => {
                const drawer = document.getElementById('inspector-drawer');
                if (drawer) drawer.classList.remove('open');
            });
        }
    }

    function inspectModule(modKey) {
        const modules = window.RE_BikeModel.getModules();
        const mod = modules[modKey];
        if (!mod) return;

        const drawer = document.getElementById('inspector-drawer');
        const title = document.getElementById('inspector-title');
        const desc = document.getElementById('inspector-desc');
        const specsList = document.getElementById('inspector-specs');

        if (title) title.innerText = `${mod.id} // ${mod.name}`;
        if (desc) desc.innerText = mod.description;

        if (specsList && mod.specs) {
            specsList.innerHTML = '';
            Object.keys(mod.specs).forEach(key => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="spec-label">${key}:</span> <span class="spec-value">${mod.specs[key]}</span>`;
                specsList.appendChild(li);
            });
        }

        if (drawer) drawer.classList.add('open');
        if (window.RE_Audio) window.RE_Audio.playUiClick();
    }

    // Animation Loop (60 FPS)
    function animate() {
        requestAnimationFrame(animate);

        const deltaTime = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();

        // If Test Drive simulator is active, let Test Drive control physics, camera, wheels, and road
        if (window.RE_TestDrive && window.RE_TestDrive.isActive()) {
            window.RE_TestDrive.update(deltaTime);
            renderer.render(scene, camera);
            return;
        }

        // 1. Inertia deceleration on horizontal rotation
        if (!isDragging) {
            targetRotationY += rotationVelocity;
            rotationVelocity *= 0.90;
        }

        // Smooth damping
        currentRotationY += (targetRotationY - currentRotationY) * 0.10;
        currentProgress += (targetProgress - currentProgress) * 0.12;

        // Apply rotation to motorcycle
        if (bikeGroup) {
            bikeGroup.rotation.y = currentRotationY;
        }

        // Camera stays stable and centered
        // Subtly frames composition as it expands outward
        const camDist = 2.4 + currentProgress * 0.35;
        camera.position.x = camDist * Math.cos(0.75) + mouseParallaxX * 0.12;
        camera.position.y = 0.72 + currentProgress * 0.10 + mouseParallaxY * 0.10;
        camera.position.z = camDist * Math.sin(0.75);
        camera.lookAt(0, 0.42 + currentProgress * 0.08, 0);

        // Dynamic Parallax Specular Highlights
        mouseParallaxX += (targetParallaxX - mouseParallaxX) * 0.05;
        mouseParallaxY += (targetParallaxY - mouseParallaxY) * 0.05;
        if (keyLight) {
            keyLight.position.x = 3.2 + mouseParallaxX * 1.2;
            keyLight.position.y = 4.2 - mouseParallaxY * 0.8;
        }

        // 2. Update Motorcycle Component Positions (strictly driven by progress)
        window.RE_BikeModel.updateDeconstruction(currentProgress, elapsedTime);

        // Update Ground Contact Shadow Opacity (fades as bike elevates in exploded matrix)
        if (contactShadowMesh) {
            contactShadowMesh.material.opacity = Math.max(0, 0.88 * (1.0 - currentProgress * 2.2));
            contactShadowMesh.visible = (contactShadowMesh.material.opacity > 0.01);
        }

        // 3. Update Modular Grid Wireframes & Tethers
        if (window.RE_ModularGrid) {
            window.RE_ModularGrid.update(currentProgress, elapsedTime);
        }

        // 4. Update Dust Particles
        if (window.RE_Particles) {
            window.RE_Particles.update(currentProgress, elapsedTime);
        }

        // 5. Audio Synthesizer Update
        if (window.RE_Audio) {
            window.RE_Audio.update(currentProgress, Math.abs(targetProgress - currentProgress));
        }

        // 6. Render
        renderer.render(scene, camera);
    }

    return {
        init,
        resetBike,
        inspectModule
    };
})();

// Auto-boot when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.RE_App.init();
    });
} else {
    window.RE_App.init();
}
