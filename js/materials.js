/**
 * Materials & Procedural Textures for Royal Enfield Guerrilla 450 Visualization
 * Generates photorealistic PBR materials, custom studio environment map,
 * and high-definition procedural canvas textures for authentic clearcoat paint,
 * brushed stainless steel, cast alloys, vulcanized tire rubber, and leather.
 */

window.RE_Materials = (function () {
    const materials = {};
    const textures = {};

    // 1. Procedural Studio Softbox Environment Map
    function generateStudioEnvironment(renderer) {
        const width = 2048;
        const height = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Dark charcoal background with subtle vertical vignette
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#040508');
        bgGrad.addColorStop(0.5, '#0a0d13');
        bgGrad.addColorStop(1, '#020305');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Softbox 1: Overhead main key light (broad soft white/warm)
        const keyGrad = ctx.createRadialGradient(width * 0.5, height * 0.20, 10, width * 0.5, height * 0.20, 420);
        keyGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        keyGrad.addColorStop(0.25, 'rgba(245, 248, 255, 0.85)');
        keyGrad.addColorStop(0.65, 'rgba(190, 210, 240, 0.35)');
        keyGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = keyGrad;
        ctx.beginPath();
        ctx.ellipse(width * 0.5, height * 0.20, 500, 240, 0, 0, Math.PI * 2);
        ctx.fill();

        // Softbox 2: Strong cyan/blue rim light on left rear
        const rimLeft = ctx.createRadialGradient(width * 0.12, height * 0.42, 10, width * 0.12, height * 0.42, 320);
        rimLeft.addColorStop(0, 'rgba(100, 220, 255, 1.0)');
        rimLeft.addColorStop(0.35, 'rgba(40, 150, 255, 0.55)');
        rimLeft.addColorStop(0.75, 'rgba(10, 60, 160, 0.15)');
        rimLeft.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = rimLeft;
        ctx.beginPath();
        ctx.ellipse(width * 0.12, height * 0.42, 280, 380, 0, 0, Math.PI * 2);
        ctx.fill();

        // Softbox 3: Warm golden/amber rim light on right front
        const rimRight = ctx.createRadialGradient(width * 0.88, height * 0.42, 10, width * 0.88, height * 0.42, 300);
        rimRight.addColorStop(0, 'rgba(255, 220, 160, 0.95)');
        rimRight.addColorStop(0.35, 'rgba(255, 160, 70, 0.45)');
        rimRight.addColorStop(0.75, 'rgba(180, 80, 20, 0.10)');
        rimRight.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = rimRight;
        ctx.beginPath();
        ctx.ellipse(width * 0.88, height * 0.42, 260, 340, 0, 0, Math.PI * 2);
        ctx.fill();

        // Horizon subtle metallic glow strip
        const horizGrad = ctx.createLinearGradient(0, height * 0.46, 0, height * 0.54);
        horizGrad.addColorStop(0, 'rgba(0,0,0,0)');
        horizGrad.addColorStop(0.5, 'rgba(120, 160, 210, 0.22)');
        horizGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = horizGrad;
        ctx.fillRect(0, height * 0.46, width, height * 0.08);

        const envTexture = new THREE.CanvasTexture(canvas);
        envTexture.mapping = THREE.EquirectangularReflectionMapping;

        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        const renderTarget = pmremGenerator.fromEquirectangular(envTexture);
        envTexture.dispose();
        pmremGenerator.dispose();

        return renderTarget.texture;
    }

    // 2. High-Detail Roadster Radial Tire Tread Bump Texture
    // U (width of canvas 512) maps across tube cross-section -> repeat.x = 1
    // V (height of canvas 128) maps around wheel circumference -> repeat.y = 28
    function createTireTreadTexture() {
        const width = 512;
        const height = 128;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Neutral bump height (mid-grey)
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, width, height);

        // Center drainage groove (dark channel running longitudinally)
        ctx.fillStyle = '#1c1c1c';
        ctx.fillRect(width * 0.47, 0, width * 0.06, height);

        // Angled roadster sipes
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';

        for (let y = 0; y < height; y += 32) {
            // Left sipes
            ctx.beginPath();
            ctx.moveTo(width * 0.44, y);
            ctx.lineTo(width * 0.16, y + 24);
            ctx.stroke();

            // Right sipes
            ctx.beginPath();
            ctx.moveTo(width * 0.56, y);
            ctx.lineTo(width * 0.84, y + 24);
            ctx.stroke();

            // Shoulder edge notches
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(width * 0.12, y + 12);
            ctx.lineTo(width * 0.02, y + 28);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(width * 0.88, y + 12);
            ctx.lineTo(width * 0.98, y + 28);
            ctx.stroke();
            ctx.lineWidth = 8;
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 28);
        return texture;
    }

    // 3. Dedicated Flank Decal Texture for Guerrilla 450 Brava Blue
    // Guarantees 100% crisp typography and proper orientation on both left & right sides
    function createTankFlankTexture(isRightSide = false) {
        const width = 1024;
        const height = 512;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Transparent background so it sits smoothly on the Pearl White tank body
        ctx.clearRect(0, 0, width, height);

        ctx.save();
        if (isRightSide) {
            // Flip horizontally so the diagonal sweep matches direction
            ctx.translate(width, 0);
            ctx.scale(-1, 1);
        }

        // Bold Dynamic Diagonal Swoop: Electric Cyan to Navy
        const grad = ctx.createLinearGradient(width * 0.05, height * 0.80, width * 0.85, height * 0.10);
        grad.addColorStop(0, '#00d4ff'); // Electric Cyan
        grad.addColorStop(0.35, '#0090d8'); // Cobalt Blue
        grad.addColorStop(0.70, '#06357a'); // Royal Navy
        grad.addColorStop(1.0, '#041224'); // Midnight Ink

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(width * 0.02, height * 0.90);
        ctx.lineTo(width * 0.94, height * 0.90);
        ctx.lineTo(width * 0.98, height * 0.22);
        ctx.bezierCurveTo(width * 0.65, height * 0.12, width * 0.35, height * 0.22, width * 0.02, height * 0.52);
        ctx.closePath();
        ctx.fill();

        // Razor-sharp Electric Cyan Pin Accent
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(width * 0.02, height * 0.52);
        ctx.bezierCurveTo(width * 0.35, height * 0.22, width * 0.65, height * 0.12, width * 0.98, height * 0.22);
        ctx.stroke();

        // White Secondary Pinstripe
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(width * 0.04, height * 0.49);
        ctx.bezierCurveTo(width * 0.36, height * 0.19, width * 0.66, height * 0.09, width * 0.97, height * 0.19);
        ctx.stroke();

        ctx.restore();

        // Authentic Bold ROYAL ENFIELD Typography (Centered and clearly visible)
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 70px "Inter", "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.letterSpacing = '8px';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
        ctx.fillText('ROYAL ENFIELD', width * 0.50, height * 0.52);
        ctx.shadowColor = 'transparent';

        // Subtitle: GUERRILLA 450 // SHERPA
        ctx.fillStyle = '#38bdf8';
        ctx.font = '800 24px monospace';
        ctx.letterSpacing = '6px';
        ctx.fillText('GUERRILLA 450', width * 0.50, height * 0.68);

        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = 8;
        return texture;
    }

    // 4. Dedicated Front Hugger Mudguard Texture (Pearl White + Electric Cyan Center Stripe)
    function createFrontFenderTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Gloss Pearl White base
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, size, size);

        // Center Electric Cyan Racing Stripe
        ctx.fillStyle = '#00c4f0';
        ctx.fillRect(size * 0.44, 0, size * 0.12, size);

        // Dark Navy Pinstripes bordering the Cyan Stripe
        ctx.fillStyle = '#091522';
        ctx.fillRect(size * 0.425, 0, size * 0.015, size);
        ctx.fillRect(size * 0.560, 0, size * 0.015, size);

        // Front edge tip accent
        ctx.fillStyle = '#0f141c';
        ctx.fillRect(0, size * 0.94, size, size * 0.06);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    // 5. Perforated Honeycomb Radiator Mesh Texture
    function createRadiatorMeshTexture() {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0c0e12';
        ctx.fillRect(0, 0, size, size);

        // Honeycomb hex grid pattern
        ctx.strokeStyle = '#262d38';
        ctx.lineWidth = 2;
        const hexR = 8;
        const stepX = hexR * 1.732;
        const stepY = hexR * 1.5;

        for (let y = 0; y < size + hexR; y += stepY) {
            const offsetX = (Math.floor(y / stepY) % 2) * (stepX * 0.5);
            for (let x = 0; x < size + hexR; x += stepX) {
                ctx.beginPath();
                for (let a = 0; a < 6; a++) {
                    const angle = (a * Math.PI) / 3;
                    const hx = x + offsetX + Math.cos(angle) * hexR;
                    const hy = y + Math.sin(angle) * hexR;
                    if (a === 0) ctx.moveTo(hx, hy);
                    else ctx.lineTo(hx, hy);
                }
                ctx.closePath();
                ctx.stroke();
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 6);
        return texture;
    }

    // 6. Perforated Exhaust Heat Shield Texture
    function createHeatShieldTexture() {
        const width = 512;
        const height = 256;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Brushed dark titanium base
        ctx.fillStyle = '#1c1f24';
        ctx.fillRect(0, 0, width, height);

        // Horizontal brushed hairline streaks
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        for (let y = 0; y < height; y += 3) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Perforated cooling slots (Guerrilla scrambler signature)
        ctx.fillStyle = '#060709';
        ctx.strokeStyle = '#38424e';
        ctx.lineWidth = 3;

        for (let x = 70; x < width - 60; x += 75) {
            for (let y = 50; y < height - 50; y += 80) {
                ctx.beginPath();
                ctx.roundRect(x, y, 52, 28, 14);
                ctx.fill();
                ctx.stroke();
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    // 7. Micro-Grain Seat Vinyl / Leather Texture
    function createSeatLeatherTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#14161a';
        ctx.fillRect(0, 0, size, size);

        // Subtle leather pore noise
        const imgData = ctx.getImageData(0, 0, size, size);
        for (let i = 0; i < imgData.data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 16;
            imgData.data[i] = Math.max(0, Math.min(255, imgData.data[i] + noise));
            imgData.data[i + 1] = Math.max(0, Math.min(255, imgData.data[i + 1] + noise));
            imgData.data[i + 2] = Math.max(0, Math.min(255, imgData.data[i + 2] + noise));
        }
        ctx.putImageData(imgData, 0, 0);

        // Subtle longitudinal contour seams
        ctx.strokeStyle = '#0a0b0d';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(size * 0.25, 0);
        ctx.lineTo(size * 0.25, size);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(size * 0.75, 0);
        ctx.lineTo(size * 0.75, size);
        ctx.stroke();

        // White/Silver edge stitching dashes
        ctx.strokeStyle = '#b0b8c4';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(size * 0.25, 0);
        ctx.lineTo(size * 0.25, size);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(size * 0.75, 0);
        ctx.lineTo(size * 0.75, size);
        ctx.stroke();

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 4);
        return texture;
    }

    // 8. Contact Ambient Occlusion Shadow Texture (Directly under wheels & engine)
    function createContactShadowTexture() {
        const width = 1024;
        const height = 512;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, width, height);

        function drawContactPatch(cx, cy, rx, ry, alpha, blur) {
            ctx.save();
            ctx.shadowColor = `rgba(0, 0, 0, ${alpha})`;
            ctx.shadowBlur = blur;
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        const midY = height * 0.5;

        // Front tire contact patch (at x ~ 0.78 * width)
        drawContactPatch(width * 0.78, midY, 65, 26, 0.95, 18);
        drawContactPatch(width * 0.78, midY, 110, 48, 0.45, 36);

        // Rear tire contact patch (at x ~ 0.22 * width)
        drawContactPatch(width * 0.22, midY, 82, 34, 0.95, 20);
        drawContactPatch(width * 0.22, midY, 135, 58, 0.45, 40);

        // Engine sump & lower frame ambient occlusion shadow (between wheels)
        drawContactPatch(width * 0.50, midY, 190, 65, 0.70, 32);
        drawContactPatch(width * 0.50, midY, 260, 95, 0.35, 50);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    // 9. Procedural Full-Color Circular TFT Instrument Cluster
    function createTftScreenTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const cx = 256, cy = 256;

        ctx.fillStyle = '#05070a';
        ctx.beginPath();
        ctx.arc(cx, cy, 250, 0, Math.PI * 2);
        ctx.fill();

        // Outer cyan tachometer arc (0 to 10,000 RPM)
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(cx, cy, 220, Math.PI * 0.75, Math.PI * 1.85);
        ctx.stroke();

        // Redline zone
        ctx.strokeStyle = '#ff3366';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(cx, cy, 220, Math.PI * 1.85, Math.PI * 2.25);
        ctx.stroke();

        // Digital Speed: 105 km/h
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 115px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('105', cx, cy - 20);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '700 24px monospace';
        ctx.fillText('KM/H', cx, cy + 46);

        // Gear display: 5
        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 36px monospace';
        ctx.fillText('N  1  2  3  4 [5] 6', cx, cy + 96);

        // Performance Mode
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px monospace';
        ctx.fillText('RIDE MODE // PERFORMANCE', cx, cy + 140);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    // 10. Procedural Headlight Prismatic Glass Texture
    function createHeadlightLensTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#8080ff';
        ctx.fillRect(0, 0, size, size);

        const cx = size / 2;
        const cy = size / 2;

        for (let r = 20; r < 240; r += 20) {
            ctx.strokeStyle = (r % 40 === 0) ? '#a0a0ff' : '#6060c0';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        for (let x = 40; x < size - 40; x += 16) {
            ctx.strokeStyle = '#9090e0';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, 40);
            ctx.lineTo(x, size - 40);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    // Master Initializer: Generates All Photorealistic PBR Materials
    function init(renderer) {
        const envMap = generateStudioEnvironment(renderer);

        textures.tireTread = createTireTreadTexture();
        textures.tankFlankLeft = createTankFlankTexture(false);
        textures.tankFlankRight = createTankFlankTexture(true);
        textures.frontFender = createFrontFenderTexture();
        textures.radiatorMesh = createRadiatorMeshTexture();
        textures.heatShield = createHeatShieldTexture();
        textures.seatGrain = createSeatLeatherTexture();
        textures.contactShadow = createContactShadowTexture();
        textures.tftScreen = createTftScreenTexture();
        textures.headlightLens = createHeadlightLensTexture();

        // 1. Mirror Chrome (Exhaust ports, stanchions, mirrors, levers, axle caps)
        materials.chrome = new THREE.MeshStandardMaterial({
            color: 0xf6f9fc,
            metalness: 0.98,
            roughness: 0.03,
            envMap: envMap,
            envMapIntensity: 1.8
        });

        // 2. Brushed Aluminum (Engine cooling fins, footpegs, triple trees)
        materials.brushedAlloy = new THREE.MeshStandardMaterial({
            color: 0xdde3ea,
            metalness: 0.88,
            roughness: 0.22,
            envMap: envMap,
            envMapIntensity: 1.3
        });

        // 3. Cast Iron / Dark Engine Core
        materials.castIron = new THREE.MeshStandardMaterial({
            color: 0x1f2328,
            metalness: 0.75,
            roughness: 0.42,
            envMap: envMap,
            envMapIntensity: 0.9
        });

        // 4. Multi-Coat High-Gloss Pearl White Clearcoat Paint (Guerrilla 450 Tank Body)
        materials.tankPaint = new THREE.MeshPhysicalMaterial({
            color: 0xfafcff,
            metalness: 0.12,
            roughness: 0.10,
            clearcoat: 1.0,
            clearcoatRoughness: 0.03,
            reflectivity: 0.98,
            envMap: envMap,
            envMapIntensity: 1.6
        });
        materials.tankGuerrilla = materials.tankPaint;

        // 4B. Left & Right Flank Livery Decal Materials (Crisp Brava Blue & Typography)
        materials.tankFlankLeft = new THREE.MeshPhysicalMaterial({
            map: textures.tankFlankLeft,
            transparent: true,
            roughness: 0.12,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04,
            reflectivity: 0.98,
            envMap: envMap,
            envMapIntensity: 1.6,
            side: THREE.DoubleSide
        });

        materials.tankFlankRight = new THREE.MeshPhysicalMaterial({
            map: textures.tankFlankRight,
            transparent: true,
            roughness: 0.12,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04,
            reflectivity: 0.98,
            envMap: envMap,
            envMapIntensity: 1.6,
            side: THREE.DoubleSide
        });

        materials.guerrillaBadge = materials.tankFlankLeft;
        materials.tankBadge = materials.tankFlankLeft;

        // 4C. Front Hugger Mudguard Livery (Pearl White + Electric Cyan Center Stripe)
        materials.frontFender = new THREE.MeshPhysicalMaterial({
            map: textures.frontFender,
            color: 0xffffff,
            metalness: 0.18,
            roughness: 0.12,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04,
            reflectivity: 0.98,
            envMap: envMap,
            envMapIntensity: 1.5,
            side: THREE.DoubleSide
        });

        // 4D. Electric Cyan Blue Gloss Paint (Front Rim & Subframe Trellis - rich pigment with clearcoat!)
        materials.cyanAlloy = new THREE.MeshPhysicalMaterial({
            color: 0x00c4f0, // Vibrant Electric Cyan Blue
            metalness: 0.22, // Low metalness so cyan color is 100% rich and saturated!
            roughness: 0.16,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04,
            reflectivity: 0.98,
            envMap: envMap,
            envMapIntensity: 1.4
        });

        // 4E. Satin Black Alloy (Rear Wheel Rim & Spoke Hubs - deep dark roadster finish!)
        materials.blackAlloy = new THREE.MeshStandardMaterial({
            color: 0x121417, // Dark Roadster Alloy
            metalness: 0.35, // Low metalness so it stays deep black without washing out into grey
            roughness: 0.28,
            envMap: envMap,
            envMapIntensity: 0.8
        });

        // 4F. Modern Scrambler Brushed Stainless Exhaust & Silencer
        materials.brushedExhaust = new THREE.MeshStandardMaterial({
            color: 0xd4d9e0,
            metalness: 0.92,
            roughness: 0.22,
            envMap: envMap,
            envMapIntensity: 1.5
        });

        // 4G. Perforated Slotted Heat Shield
        materials.heatShield = new THREE.MeshStandardMaterial({
            map: textures.heatShield,
            color: 0x141619,
            metalness: 0.40,
            roughness: 0.32,
            envMap: envMap,
            envMapIntensity: 0.9
        });

        // 4H. Sherpa 450 Liquid-Cooled Engine Black (Deep matte crankcase casting)
        materials.sherpaBlack = new THREE.MeshStandardMaterial({
            color: 0x121417,
            metalness: 0.25,
            roughness: 0.38,
            envMap: envMap,
            envMapIntensity: 0.75
        });

        // 4I. Front Fork Rubber Accordion Gaiters (Boots)
        materials.rubberGaiters = new THREE.MeshStandardMaterial({
            color: 0x0d0f12,
            roughness: 0.92,
            metalness: 0.02
        });

        // 4J. Modern Roadster Textured Black Bench Seat
        materials.roadsterSeat = new THREE.MeshStandardMaterial({
            map: textures.seatGrain,
            bumpMap: textures.seatGrain,
            bumpScale: 0.015,
            color: 0x141619,
            roughness: 0.82,
            metalness: 0.02
        });
        materials.quiltedLeather = materials.roadsterSeat;

        // 4K. Radiator Honeycomb Protective Mesh
        materials.radiatorMesh = new THREE.MeshStandardMaterial({
            map: textures.radiatorMesh,
            color: 0x16181d,
            metalness: 0.45,
            roughness: 0.45
        });

        // 4L. Full-Color Digital TFT Gauge Face
        materials.tftScreen = new THREE.MeshBasicMaterial({
            map: textures.tftScreen
        });

        // 4M. Circular LED Halo DRL Ring
        materials.haloDRL = new THREE.MeshBasicMaterial({
            color: 0x00e5ff
        });

        // 4N. Contact Ambient Occlusion Shadow Plane
        materials.contactShadow = new THREE.MeshBasicMaterial({
            map: textures.contactShadow,
            transparent: true,
            opacity: 0.88,
            depthWrite: false
        });

        // 5. Roadster Radial Tire Rubber (Deep non-reflective vulcanized tire rubber with tread bump)
        materials.tireRubber = new THREE.MeshStandardMaterial({
            color: 0x0e1013,
            bumpMap: textures.tireTread,
            bumpScale: 0.006,
            roughness: 0.92,
            metalness: 0.01
        });

        // 6. Tubular Frame Powdercoat (Satin Matte Black)
        materials.frameBlack = new THREE.MeshStandardMaterial({
            color: 0x111316,
            metalness: 0.35,
            roughness: 0.35,
            envMap: envMap,
            envMapIntensity: 0.8
        });

        // 7. Headlight Lens (Prismatic Refractive Glass)
        materials.glassLens = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.08,
            roughness: 0.08,
            transmission: 0.88,
            ior: 1.52,
            transparent: true,
            opacity: 0.90,
            normalMap: textures.headlightLens,
            normalScale: new THREE.Vector2(0.2, 0.2),
            envMap: envMap,
            envMapIntensity: 2.2
        });

        // 8. Headlight Inner Chrome Reflector
        materials.reflector = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 1.0,
            roughness: 0.02,
            envMap: envMap,
            envMapIntensity: 2.5
        });

        // 9. Glowing Halogen/LED Core
        materials.lightBulb = new THREE.MeshBasicMaterial({
            color: 0xfff4d0
        });

        // 10. Amber Indicator Glass
        materials.amberGlass = new THREE.MeshPhysicalMaterial({
            color: 0xff8c00,
            metalness: 0.1,
            roughness: 0.15,
            transmission: 0.72,
            transparent: true,
            opacity: 0.85,
            envMap: envMap
        });

        // 11. Ruby Red Taillight
        materials.rubyTaillight = new THREE.MeshPhysicalMaterial({
            color: 0xff1122,
            metalness: 0.15,
            roughness: 0.1,
            transmission: 0.65,
            transparent: true,
            opacity: 0.92,
            envMap: envMap
        });

        // 12. Brake Rotor (Perforated Brushed Steel)
        materials.brakeRotor = new THREE.MeshStandardMaterial({
            color: 0xbac0c6,
            metalness: 0.88,
            roughness: 0.32,
            side: THREE.DoubleSide,
            envMap: envMap,
            envMapIntensity: 0.8
        });

        // 13. Brake Caliper (Brembo/ByBre Anodized Black/Gunmetal)
        materials.brakeCaliper = new THREE.MeshStandardMaterial({
            color: 0x16181d,
            metalness: 0.82,
            roughness: 0.28,
            envMap: envMap
        });

        // 14. Gold Accents & Floating Rotor Bobbins
        materials.goldAccent = new THREE.MeshStandardMaterial({
            color: 0xf5c352,
            metalness: 0.92,
            roughness: 0.18,
            envMap: envMap
        });

        // 15. Holographic Cubic Grid Glass Panel Material
        materials.hologramPanel = new THREE.MeshBasicMaterial({
            color: 0x00e5ff,
            transparent: true,
            opacity: 0.05,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        // 16. Cyber Wireframe Edge Line Material
        materials.wireframeEdge = new THREE.LineBasicMaterial({
            color: 0x00e5ff,
            transparent: true,
            opacity: 0.75,
            linewidth: 1
        });

        // 17. Laser Tether Line Material
        materials.laserTether = new THREE.LineDashedMaterial({
            color: 0x00e5ff,
            dashSize: 0.15,
            gapSize: 0.1,
            transparent: true,
            opacity: 0.6
        });

        // 18. Rider / Biker Materials
        materials.riderJacket = new THREE.MeshStandardMaterial({
            color: 0x101215,
            roughness: 0.58,
            metalness: 0.20,
            envMap: envMap,
            envMapIntensity: 0.85
        });

        materials.riderAccent = new THREE.MeshStandardMaterial({
            color: 0x00c4f0,
            roughness: 0.32,
            metalness: 0.28,
            envMap: envMap,
            envMapIntensity: 1.3
        });

        materials.riderHelmet = new THREE.MeshStandardMaterial({
            color: 0x07090b,
            roughness: 0.08,
            metalness: 0.88,
            envMap: envMap,
            envMapIntensity: 2.4
        });

        materials.riderVisor = new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            roughness: 0.03,
            metalness: 0.98,
            envMap: envMap,
            envMapIntensity: 3.2
        });

        materials.riderPants = new THREE.MeshStandardMaterial({
            color: 0x16181b,
            roughness: 0.78,
            metalness: 0.08
        });

        materials.riderBoots = new THREE.MeshStandardMaterial({
            color: 0x111315,
            roughness: 0.48,
            metalness: 0.22
        });

        materials.riderGloves = new THREE.MeshStandardMaterial({
            color: 0x131518,
            roughness: 0.52,
            metalness: 0.20
        });

        return {
            materials,
            textures,
            envMap
        };
    }

    // Color Theme Preset Switcher
    function setBikeColor(hexColor, name) {
        if (materials.tankPaint) {
            materials.tankPaint.color.setHex(hexColor);
            if (name === 'CHROME') {
                materials.tankPaint.metalness = 0.98;
                materials.tankPaint.roughness = 0.05;
            } else if (name === 'STEALTH') {
                materials.tankPaint.metalness = 0.45;
                materials.tankPaint.roughness = 0.55;
            } else {
                materials.tankPaint.metalness = 0.75;
                materials.tankPaint.roughness = 0.16;
            }
        }
    }

    return {
        init,
        materials,
        textures,
        setBikeColor
    };
})();
