/**
 * Modular Cubic Grid & Technical Visualization System
 * 
 * At progress = 0: Completely invisible, clean showroom environment.
 * When scrolling: Progressively reveals laser corner brackets,
 * bounding wireframes, and dynamic coordinate annotations.
 */

window.RE_ModularGrid = (function () {
    const gridElements = [];
    let gridRoot = null;
    let tetherLinesGroup = null;
    let floorMesh = null;
    let ringsGroup = null;

    // Helper: Create 3D Corner Bracket L-shape
    function createCornerBracket(size = 0.04, color = 0x00e5ff) {
        const bracketGroup = new THREE.Group();
        const mat = new THREE.LineBasicMaterial({ color: color, linewidth: 2, transparent: true, opacity: 0 });

        const pts = [
            [new THREE.Vector3(0, 0, 0), new THREE.Vector3(size, 0, 0)],
            [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, size, 0)],
            [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, size)]
        ];

        pts.forEach(([p1, p2]) => {
            const geom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
            bracketGroup.add(new THREE.Line(geom, mat));
        });

        return bracketGroup;
    }

    // Helper: Create 3D Canvas Billboard Tag for Module
    function createModuleBillboard(modId, modName) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Holographic Dark Card
        ctx.fillStyle = 'rgba(6, 12, 20, 0.88)';
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(4, 4, 504, 120, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(8, 8, 8, 112);

        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(`[${modId}] // 3D MODULAR COMPONENT`, 32, 42);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px "Inter", sans-serif';
        ctx.fillText(modName.split('//')[0].trim(), 32, 80);

        ctx.fillStyle = '#7a9eb8';
        ctx.font = '18px monospace';
        ctx.fillText('STATUS: EXPLODED VIEW // ALIGNED', 32, 110);

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0 });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(0.65, 0.16, 1);
        return { sprite, texture, canvas, ctx, modId, modName };
    }

    // Build Cubic Modular Enclosure for a Module
    function buildModuleBox(moduleKey, modData, materials) {
        const boxGroup = new THREE.Group();
        boxGroup.name = `Box_${moduleKey}`;

        const size = modData.boxSize;
        const center = modData.boxCenter;

        const w = size.x;
        const h = size.y;
        const d = size.z;

        // Thin Wireframe Outlines
        const boxGeom = new THREE.BoxGeometry(w, h, d);
        const wireframeGeom = new THREE.WireframeGeometry(boxGeom);
        const wireframeMat = new THREE.LineBasicMaterial({
            color: 0x00e5ff,
            transparent: true,
            opacity: 0,
            depthWrite: false
        });
        const wireframe = new THREE.LineSegments(wireframeGeom, wireframeMat);
        wireframe.visible = false;
        boxGroup.add(wireframe);

        // Holographic Glass Panel
        const panelMat = (materials && materials.hologramPanel) ? materials.hologramPanel.clone() : new THREE.MeshBasicMaterial({
            color: 0x00e5ff,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        panelMat.opacity = 0;
        const panelMesh = new THREE.Mesh(boxGeom, panelMat);
        panelMesh.visible = false;
        boxGroup.add(panelMesh);

        // Corner Brackets
        const cornersGroup = new THREE.Group();
        cornersGroup.visible = false;
        const cornerSize = Math.min(w, h, d) * 0.20;

        const cornerCoords = [
            { x: -w / 2, y: -h / 2, z: -d / 2, rx: 0, ry: 0, rz: 0 },
            { x: w / 2, y: -h / 2, z: -d / 2, rx: 0, ry: -Math.PI / 2, rz: 0 },
            { x: -w / 2, y: h / 2, z: -d / 2, rx: Math.PI / 2, ry: 0, rz: 0 },
            { x: w / 2, y: h / 2, z: -d / 2, rx: Math.PI / 2, ry: -Math.PI / 2, rz: 0 },
            { x: -w / 2, y: -h / 2, z: d / 2, rx: 0, ry: Math.PI / 2, rz: 0 },
            { x: w / 2, y: -h / 2, z: d / 2, rx: 0, ry: Math.PI, rz: 0 },
            { x: -w / 2, y: h / 2, z: d / 2, rx: -Math.PI / 2, ry: 0, rz: 0 },
            { x: w / 2, y: h / 2, z: d / 2, rx: -Math.PI / 2, ry: Math.PI, rz: 0 }
        ];

        cornerCoords.forEach(c => {
            const bracket = createCornerBracket(cornerSize, 0x00e5ff);
            bracket.position.set(c.x, c.y, c.z);
            bracket.rotation.set(c.rx, c.ry, c.rz);
            cornersGroup.add(bracket);
        });
        boxGroup.add(cornersGroup);

        // Billboard Label
        const billboard = createModuleBillboard(modData.id, modData.name);
        billboard.sprite.visible = false;
        billboard.sprite.position.set(0, h * 0.55 + 0.1, 0);
        boxGroup.add(billboard.sprite);

        boxGroup.position.copy(center);
        boxGroup.visible = false;
        modData.group.add(boxGroup);

        gridElements.push({
            moduleKey,
            modData,
            boxGroup,
            wireframe,
            wireframeMat,
            panelMesh,
            panelMat,
            cornersGroup,
            billboard,
            center
        });
    }

    // Initialize Grid Elements
    function init(modules, materials, scene) {
        gridRoot = new THREE.Group();
        gridRoot.name = "ModularGrid_Root";
        scene.add(gridRoot);

        tetherLinesGroup = new THREE.Group();
        tetherLinesGroup.name = "LaserTethers_Group";
        scene.add(tetherLinesGroup);

        Object.keys(modules).forEach(key => {
            buildModuleBox(key, modules[key], materials);
        });

        buildFloorGrid(materials, scene);
    }

    // Studio Turntable Ground Floor
    function buildFloorGrid(materials, scene) {
        // Procedural radial vignette shadow/contact texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const cx = 256, cy = 256;
        const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 250);
        grad.addColorStop(0, 'rgba(10, 13, 18, 0.95)');
        grad.addColorStop(0.35, 'rgba(8, 10, 14, 0.85)');
        grad.addColorStop(0.70, 'rgba(6, 7, 9, 0.40)');
        grad.addColorStop(1.0, 'rgba(6, 7, 9, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);

        const floorTex = new THREE.CanvasTexture(canvas);
        const floorGeom = new THREE.CircleGeometry(5.2, 64);
        const floorMat = new THREE.MeshStandardMaterial({
            map: floorTex,
            transparent: true,
            roughness: 0.85,
            metalness: 0.1,
            depthWrite: false
        });
        floorMesh = new THREE.Mesh(floorGeom, floorMat);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.position.y = -0.002;
        floorMesh.receiveShadow = true;
        scene.add(floorMesh);

        // Concentric Studio Turntable Rings
        ringsGroup = new THREE.Group();
        ringsGroup.position.y = 0.001;
        for (let r = 0.6; r <= 2.4; r += 0.6) {
            const ringGeom = new THREE.RingGeometry(r, r + 0.006, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x00e5ff,
                transparent: true,
                opacity: 0.12 - r * 0.025,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.rotation.x = -Math.PI / 2;
            ringsGroup.add(ring);
        }
        scene.add(ringsGroup);
    }

    // Update Modular Grid & Tether Lines on Scroll Progress
    function update(progress, elapsedTime) {
        if (!gridElements.length) return;

        // Clear dynamic laser tethers
        while (tetherLinesGroup.children.length > 0) {
            const child = tetherLinesGroup.children[0];
            if (child.geometry) child.geometry.dispose();
            tetherLinesGroup.remove(child);
        }

        // Strict opacity curve:
        // Progress 0.00 - 0.25: completely invisible (100% normal clean bike)
        // Progress 0.25 - 0.70: wireframes and brackets smoothly emerge
        // Progress 0.70 - 1.00: billboards and laser tethers clearly visible
        let boxOpacity = 0;
        let panelOpacity = 0;
        let billboardOpacity = 0;

        if (progress > 0.25) {
            boxOpacity = Math.min(0.85, (progress - 0.25) * 1.6);
            panelOpacity = Math.min(0.12, (progress - 0.35) * 0.22);
        }
        if (progress > 0.65) {
            billboardOpacity = Math.min(0.95, (progress - 0.65) * 2.8);
        }

        const frameOrigin = new THREE.Vector3(0, 0.45, 0.0);
        const showGrid = (progress > 0.05);
        if (gridRoot) gridRoot.visible = showGrid;
        if (tetherLinesGroup) tetherLinesGroup.visible = (progress > 0.40);
        if (ringsGroup) ringsGroup.visible = showGrid;

        gridElements.forEach(item => {
            item.boxGroup.visible = showGrid;
            item.wireframe.visible = (progress > 0.25);
            item.panelMesh.visible = (progress > 0.35);
            item.cornersGroup.visible = (progress > 0.25);
            item.billboard.sprite.visible = (progress > 0.65);

            if (showGrid) {
                item.wireframeMat.opacity = boxOpacity;
                item.panelMat.opacity = panelOpacity;

                item.cornersGroup.children.forEach(bracket => {
                    bracket.children.forEach(line => {
                        line.material.opacity = boxOpacity;
                    });
                });

                item.billboard.sprite.material.opacity = billboardOpacity;
            }

            // Draw laser tether lines from central chassis to separated modules if exploded
            if (progress > 0.40 && item.moduleKey !== 'frame') {
                const worldPos = new THREE.Vector3();
                item.boxGroup.getWorldPosition(worldPos);

                const lineGeom = new THREE.BufferGeometry().setFromPoints([
                    frameOrigin,
                    worldPos
                ]);

                const lineMat = new THREE.LineDashedMaterial({
                    color: 0x00e5ff,
                    dashSize: 0.05,
                    gapSize: 0.03,
                    transparent: true,
                    opacity: boxOpacity * 0.5
                });

                const tether = new THREE.Line(lineGeom, lineMat);
                tether.computeLineDistances();
                tetherLinesGroup.add(tether);
            }
        });
    }

    return {
        init,
        update,
        getElements: () => gridElements
    };
})();
