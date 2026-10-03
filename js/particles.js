/**
 * Particle Systems & Atmospheric Effects
 * Generates floating metallic dust, anti-gravity kinetic embers,
 * and zero-g swirling particles between separated mechanical modules.
 */

window.RE_Particles = (function () {
    let dustParticles = null;
    let kineticParticles = null;
    const dustCount = 600;
    const kineticCount = 400;

    let dustPositions = null;
    let kineticPositions = null;
    let kineticVelocities = null;

    // Helper: Create circular soft particle sprite texture
    function createParticleTexture(colorHex = '#ffffff') {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, colorHex);
        grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
        grad.addColorStop(0.7, 'rgba(0, 229, 255, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);

        return new THREE.CanvasTexture(canvas);
    }

    function init(scene) {
        // 1. Ambient Zero-G Micro Dust
        const dustGeom = new THREE.BufferGeometry();
        dustPositions = new Float32Array(dustCount * 3);

        for (let i = 0; i < dustCount; i++) {
            dustPositions[i * 3] = (Math.random() - 0.5) * 8;     // X: -4 to +4
            dustPositions[i * 3 + 1] = Math.random() * 3.5 - 0.5;  // Y: -0.5 to 3.0
            dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 8; // Z: -4 to +4
        }
        dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

        const dustMat = new THREE.PointsMaterial({
            size: 0.035,
            map: createParticleTexture('#c0d8f0'),
            transparent: true,
            opacity: 0.45,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        dustParticles = new THREE.Points(dustGeom, dustMat);
        scene.add(dustParticles);

        // 2. Kinetic Anti-Gravity Separation Particles (Between components)
        const kineticGeom = new THREE.BufferGeometry();
        kineticPositions = new Float32Array(kineticCount * 3);
        kineticVelocities = new Float32Array(kineticCount * 3);

        for (let i = 0; i < kineticCount; i++) {
            // Clustered along motorcycle body
            kineticPositions[i * 3] = (Math.random() - 0.5) * 0.8;
            kineticPositions[i * 3 + 1] = 0.2 + Math.random() * 0.7;
            kineticPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.8;

            // Random initial expansion vectors
            kineticVelocities[i * 3] = (Math.random() - 0.5) * 0.02;
            kineticVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
            kineticVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
        }
        kineticGeom.setAttribute('position', new THREE.BufferAttribute(kineticPositions, 3));

        const kineticMat = new THREE.PointsMaterial({
            size: 0.045,
            map: createParticleTexture('#00e5ff'),
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        kineticParticles = new THREE.Points(kineticGeom, kineticMat);
        scene.add(kineticParticles);
    }

    function update(progress, elapsedTime) {
        if (!dustParticles || !kineticParticles) return;

        // 1. Update Ambient Dust
        const dPos = dustParticles.geometry.attributes.position.array;
        for (let i = 0; i < dustCount; i++) {
            const idx = i * 3;
            // Gentle floating oscillation
            dPos[idx + 1] += Math.sin(elapsedTime * 0.8 + i) * 0.0012;
            dPos[idx] += Math.cos(elapsedTime * 0.5 + i * 0.5) * 0.0008;

            // Wrap bounds
            if (dPos[idx + 1] > 3.2) dPos[idx + 1] = -0.4;
            if (dPos[idx + 1] < -0.4) dPos[idx + 1] = 3.2;
        }
        dustParticles.geometry.attributes.position.needsUpdate = true;

        // 2. Update Kinetic Separation Particles
        const kPos = kineticParticles.geometry.attributes.position.array;
        const expansionFactor = 1.0 + progress * 2.2;

        for (let i = 0; i < kineticCount; i++) {
            const idx = i * 3;
            const seed = i * 0.23;

            // Swirl around modules when deconstructed
            const swirlRadius = (0.3 + Math.sin(seed) * 0.5) * expansionFactor;
            const angle = elapsedTime * (0.8 + (i % 5) * 0.2) + seed;

            kPos[idx] = Math.cos(angle) * swirlRadius;
            kPos[idx + 1] = 0.4 + Math.sin(angle * 0.7) * (0.35 * expansionFactor);
            kPos[idx + 2] = Math.sin(angle) * (1.1 * expansionFactor) + (Math.cos(seed * 2) * 0.5);
        }
        kineticParticles.geometry.attributes.position.needsUpdate = true;

        // Kinetic opacity increases with deconstruction progress
        kineticParticles.material.opacity = Math.min(0.85, 0.15 + progress * 0.7);
        kineticParticles.material.size = 0.035 + progress * 0.025;
    }

    return {
        init,
        update
    };
})();
