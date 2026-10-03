/**
 * Royal Enfield Guerrilla 450 Photorealistic 3D Model & Modular Architecture
 * 
 * In the assembled state (progress = 0):
 * The motorcycle is 100% NORMAL, showroom-grade, fully assembled,
 * with exact mechanical contact between frame, engine, wheels, tank, seat, and exhaust.
 * 
 * Authentic Guerrilla 450 Brava Blue Roadster Features:
 * - Front Wheel: 17" 5-Split-Spoke Cast Alloy in ELECTRIC CYAN BLUE (0x00c4f0)
 * - Rear Wheel: 17" 5-Split-Spoke Cast Alloy in SATIN BLACK (0x121418)
 * - Front Suspension: 43mm Telescopic Forks with RETRO-ROADSTER RUBBER ACCORDION GAITERS (BOOTS)
 * - Front Mudguard: Tight-fitting Hugger Fender in Pearl White & Cyan with black fork stays
 * - Fuel Tank: Sculpted stamped metal roadster tank with knee recesses, fork clearance,
 *   Pearl White top, black rubber center spine pad, flush aircraft aero filler cap,
 *   and Electric Cyan to Navy diagonal flank sweep with bold ROYAL ENFIELD typography
 * - Subframe: Signature Brava Blue exposed tubular steel trellis under seat in ELECTRIC CYAN (0x00c4f0)
 * - Powertrain: 452cc Sherpa liquid-cooled single, satin black crankcase with circular clutch cover,
 *   forward-canted cylinder barrel with silver-edged cooling fins, DOHC cam cover, and front vertical radiator
 * - Exhaust: Sweeping stainless header, upswept stubby scrambler megaphone silencer in brushed stainless,
 *   and perforated laser-cut black heat shield
 * - Cockpit & Optics: Round full-color digital TFT gauge & compact Bi-LED projector headlight with circular Halo DRL
 */

window.RE_BikeModel = (function () {
    const modules = {};
    let bikeRoot = null;

    // =========================================================================
    // 1. MODERN 5-SPLIT-SPOKE CAST ALLOY WHEEL (Guerrilla 450)
    // =========================================================================
    function buildGuerrillaWheel(radius, width, rimMat, spokeMat, materials, isFront = true) {
        const wheelGroup = new THREE.Group();

        // 1. Roadster Radial Tire (Deep black vulcanized rubber with rounded roadster crown)
        // Outer radius = radius + 0.055 = 0.335m. Exactly touches ground at y = 0 when axle is at y = 0.335m.
        const tireGeom = new THREE.TorusGeometry(radius, 0.055, 32, 64);
        const tireMesh = new THREE.Mesh(tireGeom, materials.tireRubber);
        tireMesh.castShadow = true;
        tireMesh.receiveShadow = true;
        wheelGroup.add(tireMesh);

        // Tire Sidewall Ring (Smooth matte rubber with subtle bevel)
        [-1, 1].forEach(side => {
            const sidewallGeom = new THREE.RingGeometry(radius - 0.025, radius + 0.038, 48);
            const sidewall = new THREE.Mesh(sidewallGeom, materials.tireRubber);
            sidewall.position.z = side * (width * 0.42);
            wheelGroup.add(sidewall);
        });

        // 2. 17" Cast Alloy Drop-Center Rim
        const rimRadius = radius - 0.035;
        const rimOuterGeom = new THREE.TorusGeometry(rimRadius, 0.016, 20, 64);
        const rimOuter = new THREE.Mesh(rimOuterGeom, rimMat);
        rimOuter.castShadow = true;
        wheelGroup.add(rimOuter);

        // Deep Alloy Rim Bed
        const rimBedGeom = new THREE.CylinderGeometry(rimRadius - 0.010, rimRadius - 0.010, width * 0.72, 48, 1, true);
        const rimBed = new THREE.Mesh(rimBedGeom, rimMat);
        rimBed.rotation.x = Math.PI / 2;
        wheelGroup.add(rimBed);

        // 3. Central Machined Cast Alloy Hub
        const hubRadius = 0.055;
        const hubWidth = width * 0.85;
        const hubGeom = new THREE.CylinderGeometry(hubRadius, hubRadius, hubWidth, 32);
        const hubMesh = new THREE.Mesh(hubGeom, materials.blackAlloy);
        hubMesh.rotation.x = Math.PI / 2;
        hubMesh.castShadow = true;
        wheelGroup.add(hubMesh);

        // Center Axle Bore & Hex Nut Caps
        const axleGeom = new THREE.CylinderGeometry(0.015, 0.015, width * 1.25, 16);
        const axleMesh = new THREE.Mesh(axleGeom, materials.chrome);
        axleMesh.rotation.x = Math.PI / 2;
        wheelGroup.add(axleMesh);

        [-1, 1].forEach(side => {
            const nutGeom = new THREE.CylinderGeometry(0.022, 0.022, 0.018, 6);
            const nutMesh = new THREE.Mesh(nutGeom, materials.chrome);
            nutMesh.position.z = side * width * 0.62;
            nutMesh.rotation.x = Math.PI / 2;
            wheelGroup.add(nutMesh);
        });

        // 4. 5-Split-Spoke Cast Alloy Design (10 angled spoke arms branching from hub to rim)
        const spokePairs = 5;
        for (let i = 0; i < spokePairs; i++) {
            const baseAngle = (i / spokePairs) * Math.PI * 2;
            const splitOffsets = [-0.10, 0.10];

            splitOffsets.forEach(splitAngle => {
                const rimAngle = baseAngle + splitAngle;

                const startX = Math.cos(baseAngle) * (hubRadius * 0.95);
                const startY = Math.sin(baseAngle) * (hubRadius * 0.95);
                const startZ = 0;

                const endX = Math.cos(rimAngle) * (rimRadius - 0.010);
                const endY = Math.sin(rimAngle) * (rimRadius - 0.010);
                const endZ = 0;

                const start = new THREE.Vector3(startX, startY, startZ);
                const end = new THREE.Vector3(endX, endY, endZ);
                const dist = start.distanceTo(end);

                // Tapered rectangular alloy spoke arm
                const spokeArmGeom = new THREE.BoxGeometry(0.014, dist, 0.016);
                spokeArmGeom.translate(0, dist * 0.5, 0);

                const spokeArm = new THREE.Mesh(spokeArmGeom, spokeMat);
                spokeArm.position.copy(start);
                spokeArm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
                spokeArm.castShadow = true;
                wheelGroup.add(spokeArm);
            });

            // Hub spoke fillet gusset
            const gussetGeom = new THREE.CylinderGeometry(0.016, 0.022, 0.038, 8);
            const gusset = new THREE.Mesh(gussetGeom, spokeMat);
            gusset.position.set(Math.cos(baseAngle) * (hubRadius * 1.15), Math.sin(baseAngle) * (hubRadius * 1.15), 0);
            gusset.rotation.z = baseAngle + Math.PI / 2;
            wheelGroup.add(gusset);
        }

        // 5. Brake Rotor & Caliper
        // Front: 310mm Ventilated Disc with Floating Bobbins & ByBre Radial Caliper
        // Rear: 270mm Disc + 44T Drive Sprocket & Chain
        const discOuterR = isFront ? (radius * 0.48) : (radius * 0.42);
        const discInnerR = discOuterR * 0.64;

        // Perforated stainless steel annular rotor
        const discGeom = new THREE.RingGeometry(discInnerR, discOuterR, 48);
        const discMesh = new THREE.Mesh(discGeom, materials.brakeRotor);
        discMesh.position.z = width * 0.38;
        discMesh.rotation.x = Math.PI / 2;
        discMesh.castShadow = true;
        wheelGroup.add(discMesh);

        // Floating carrier mounting bobbins
        const bobbinCount = isFront ? 6 : 5;
        for (let b = 0; b < bobbinCount; b++) {
            const bAngle = (b / bobbinCount) * Math.PI * 2;
            const bx = Math.cos(bAngle) * discInnerR;
            const by = Math.sin(bAngle) * discInnerR;
            const bobbinGeom = new THREE.CylinderGeometry(0.007, 0.007, 0.010, 12);
            const bobbin = new THREE.Mesh(bobbinGeom, materials.goldAccent);
            bobbin.position.set(bx, by, width * 0.38);
            bobbin.rotation.x = Math.PI / 2;
            wheelGroup.add(bobbin);
        }

        // Modern Radial-Mount ByBre Caliper
        const caliperGeom = new THREE.BoxGeometry(0.048, 0.072, 0.032);
        const caliperMesh = new THREE.Mesh(caliperGeom, materials.frameBlack);
        caliperMesh.position.set(discOuterR * 0.94, isFront ? 0.05 : -0.04, width * 0.38);
        caliperMesh.rotation.z = isFront ? -0.32 : 0.35;
        caliperMesh.castShadow = true;
        wheelGroup.add(caliperMesh);

        // Caliper Emblem
        const caliperBadge = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.012, 0.034), isFront ? materials.cyanAlloy : materials.brushedAlloy);
        caliperBadge.position.set(discOuterR * 0.94, isFront ? 0.05 : -0.04, width * 0.38);
        caliperBadge.rotation.z = isFront ? -0.32 : 0.35;
        wheelGroup.add(caliperBadge);

        // Rear 44T Drive Sprocket on Left Side
        if (!isFront) {
            const sprocRadius = radius * 0.44;
            const sprocInnerR = sprocRadius * 0.62;
            const sprocGeom = new THREE.RingGeometry(sprocInnerR, sprocRadius, 36);
            const sprocMesh = new THREE.Mesh(sprocGeom, materials.castIron);
            sprocMesh.position.z = -width * 0.42;
            sprocMesh.rotation.x = Math.PI / 2;
            wheelGroup.add(sprocMesh);

            // Drive Chain Rollers wrapping around sprocket
            const chainCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-0.05, sprocRadius * 0.95, -width * 0.42),
                new THREE.Vector3(-sprocRadius * 0.95, 0, -width * 0.42),
                new THREE.Vector3(-0.05, -sprocRadius * 0.95, -width * 0.42)
            ]);
            const chainGeom = new THREE.TubeGeometry(chainCurve, 20, 0.007, 8, false);
            const chainMesh = new THREE.Mesh(chainGeom, materials.sherpaBlack);
            wheelGroup.add(chainMesh);
        }

        // Rotate wheel by 90° so tire rolls longitudinally in the YZ plane with axle along X
        wheelGroup.rotation.y = Math.PI / 2;

        return wheelGroup;
    }

    // =========================================================================
    // 2. SCULPTED ROADSTER FUEL TANK (Guerrilla 450 Brava Blue)
    // Multi-coat Pearl White clearcoat body with stamped shoulder creases,
    // deep ergonomic knee recesses, flush aero filler cap, rubber spine pad,
    // and dedicated left & right Brava Blue "ROYAL ENFIELD" flank graphics
    // =========================================================================
    function buildGuerrillaTank(materials) {
        const tankGroup = new THREE.Group();

        const length = 0.54;
        const halfL = length * 0.5;
        const nz = 32;
        const nTheta = 32;

        const vertices = [];
        const uvs = [];
        const indices = [];

        for (let i = 0; i <= nz; i++) {
            const u = i / nz; // 0 (rear) to 1 (front)
            const pz = -halfL + u * length;
            const zNorm = pz / halfL; // -1 (rear) to +1 (front)

            // Cross-sectional width, height, and center elevation along tank length
            let baseW = 0.135;
            let baseH = 0.110;
            let centerY = 0.01;

            if (zNorm > 0.45) {
                // Front fork clearance and steering head taper
                const f = (zNorm - 0.45) / 0.55;
                baseW *= (1.0 + 0.12 * Math.sin(f * Math.PI) - 0.35 * f);
                baseH *= (1.0 - 0.32 * f);
                centerY += 0.01 * (1 - f);
            } else if (zNorm < -0.1) {
                // Rear taper smoothly meeting the saddle nose
                const r = (-0.1 - zNorm) / 0.9;
                baseW *= (1.0 - 0.50 * r);
                baseH *= (1.0 - 0.42 * r);
                centerY -= 0.018 * r;
            } else {
                // Muscular mid-tank shoulders
                baseW *= 1.15;
                baseH *= 1.08;
                centerY += 0.015;
            }

            for (let j = 0; j <= nTheta; j++) {
                const v = j / nTheta;
                const theta = v * Math.PI * 2; // 0 to 2PI

                let rx = Math.sin(theta);
                let ry = Math.cos(theta);

                let localW = baseW;
                let localH = baseH;

                // 1. Stamped shoulder line crease on top-outer diagonals (theta ~ PI/4, 7PI/4)
                const shoulderDist = Math.min(
                    Math.abs(theta - Math.PI * 0.25),
                    Math.abs(theta - Math.PI * 1.75)
                );
                if (shoulderDist < 0.4) {
                    localW *= (1.0 + (0.4 - shoulderDist) * 0.14);
                    localH *= (1.0 + (0.4 - shoulderDist) * 0.10);
                }

                // 2. Sculpted knee recesses (rider knees grip both sides between zNorm -0.55 and +0.20)
                if (zNorm > -0.55 && zNorm < 0.20) {
                    const kneeZ = Math.sin((zNorm + 0.55) / 0.75 * Math.PI);
                    const flankFactor = Math.pow(Math.abs(rx), 1.8);
                    if (flankFactor > 0.4) {
                        localW *= (1.0 - kneeZ * 0.24 * flankFactor);
                    }
                }

                // 3. Underside Frame Backbone Tunnel (concave notch over backbone tube)
                if (ry < -0.15) {
                    ry = Math.max(-0.40, ry * 0.55);
                    if (Math.abs(rx) < 0.45) {
                        ry += 0.12 * (1.0 - Math.abs(rx) / 0.45);
                    }
                }

                const px = rx * localW;
                const py = centerY + ry * localH;

                vertices.push(px, py, pz);
                uvs.push(u, v);
            }
        }

        const stride = nTheta + 1;
        for (let i = 0; i < nz; i++) {
            for (let j = 0; j < nTheta; j++) {
                const a = i * stride + j;
                const b = (i + 1) * stride + j;
                const c = (i + 1) * stride + (j + 1);
                const d = i * stride + (j + 1);

                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        const tankGeom = new THREE.BufferGeometry();
        tankGeom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        tankGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        tankGeom.setIndex(indices);
        tankGeom.computeVertexNormals();

        // High-Gloss Multi-Coat Pearl White Tank Body
        const tankMesh = new THREE.Mesh(tankGeom, materials.tankPaint);
        tankMesh.castShadow = true;
        tankMesh.receiveShadow = true;
        tankGroup.add(tankMesh);

        // =====================================================================
        // BRAVA BLUE FLANK GRAPHICS (Left & Right)
        // Perfectly positioned over knee recesses with upright ROYAL ENFIELD
        // =====================================================================
        function createCurvedDecal(isRightSide) {
            const decalW = 0.35;
            const decalH = 0.155;
            const geom = new THREE.PlaneGeometry(decalW, decalH, 14, 8);
            const pos = geom.attributes.position;
            for (let k = 0; k < pos.count; k++) {
                const lx = pos.getX(k);
                const ly = pos.getY(k);
                // Subtle curvature matching tank radius
                const curveZ = -Math.pow(lx / (decalW * 0.5), 2) * 0.016 - Math.pow(ly / (decalH * 0.5), 2) * 0.008;
                pos.setZ(k, curveZ);
            }
            geom.computeVertexNormals();

            const mat = isRightSide ? materials.tankFlankRight : materials.tankFlankLeft;
            if (mat) {
                mat.polygonOffset = true;
                mat.polygonOffsetFactor = -2.0;
                mat.polygonOffsetUnits = -4.0;
                mat.depthWrite = false;
            }
            const decalMesh = new THREE.Mesh(geom, mat);
            const side = isRightSide ? 1 : -1;
            // Positioned right in the center of the sculpted roadster tank flank
            decalMesh.position.set(side * 0.154, 0.046, 0.040);
            decalMesh.rotation.y = side * (Math.PI / 2 - 0.18);
            decalMesh.rotation.x = -0.05;
            return decalMesh;
        }

        tankGroup.add(createCurvedDecal(false)); // Left Flank Decal
        tankGroup.add(createCurvedDecal(true));  // Right Flank Decal

        // Modern Flush Aero Fuel Filler Cap (Aircraft-style flip latch with hex perimeter)
        const capBaseGeom = new THREE.CylinderGeometry(0.040, 0.042, 0.008, 32);
        const capBase = new THREE.Mesh(capBaseGeom, materials.blackAlloy);
        capBase.position.set(0.025, 0.118, 0.06);
        tankGroup.add(capBase);

        const capRingGeom = new THREE.TorusGeometry(0.036, 0.003, 12, 32);
        const capRing = new THREE.Mesh(capRingGeom, materials.chrome);
        capRing.position.set(0.025, 0.121, 0.06);
        capRing.rotation.x = Math.PI / 2;
        tankGroup.add(capRing);

        const capFlipGeom = new THREE.CylinderGeometry(0.030, 0.030, 0.009, 24);
        const capFlip = new THREE.Mesh(capFlipGeom, materials.brushedAlloy);
        capFlip.position.set(0.025, 0.122, 0.06);
        tankGroup.add(capFlip);

        // Allen bolts on filler cap ring
        for (let b = 0; b < 6; b++) {
            const bAngle = (b / 6) * Math.PI * 2;
            const boltGeom = new THREE.CylinderGeometry(0.002, 0.002, 0.004, 6);
            const bolt = new THREE.Mesh(boltGeom, materials.chrome);
            bolt.position.set(0.025 + Math.cos(bAngle) * 0.035, 0.123, 0.06 + Math.sin(bAngle) * 0.035);
            tankGroup.add(bolt);
        }

        // Center Spine Rubber Tank Pad
        const spineGeom = new THREE.BoxGeometry(0.036, 0.006, length * 0.60);
        const spineMesh = new THREE.Mesh(spineGeom, materials.sherpaBlack);
        spineMesh.position.set(0, 0.120, -0.02);
        tankGroup.add(spineMesh);

        return tankGroup;
    }

    // =========================================================================
    // 3. SHERPA 450 LIQUID-COOLED MODERN POWERTRAIN & RADIATOR
    // Detailed crankcase, circular clutch casing with medallion, finned DOHC
    // cylinder head, coolant pump, front vertical radiator & honeycomb mesh
    // =========================================================================
    function buildSherpaEngine(materials) {
        const engineGroup = new THREE.Group();

        // 1. Main Crankcase & 6-Speed Transmission Core
        const crankGeom = new THREE.BoxGeometry(0.26, 0.22, 0.38);
        const crankMesh = new THREE.Mesh(crankGeom, materials.sherpaBlack);
        crankMesh.position.set(0, 0, 0);
        crankMesh.castShadow = true;
        crankMesh.receiveShadow = true;
        engineGroup.add(crankMesh);

        // Brushed Alloy Sump Skid Guard (Bash Plate)
        const bashGeom = new THREE.BoxGeometry(0.22, 0.016, 0.36);
        const bashMesh = new THREE.Mesh(bashGeom, materials.brushedAlloy);
        bashMesh.position.set(0, -0.12, 0.01);
        bashMesh.castShadow = true;
        engineGroup.add(bashMesh);

        // 2. Right-Side Clutch Casing with Embossed Royal Enfield Medallion
        const clutchGeom = new THREE.CylinderGeometry(0.108, 0.108, 0.058, 36);
        const clutch = new THREE.Mesh(clutchGeom, materials.sherpaBlack);
        clutch.position.set(0.155, -0.01, 0.04);
        clutch.rotation.z = Math.PI / 2;
        clutch.castShadow = true;
        engineGroup.add(clutch);

        // Machined Outer Accent Trim Ring (Electric Cyan Blue)
        const clutchRim = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.005, 16, 36), materials.cyanAlloy);
        clutchRim.position.set(0.186, -0.01, 0.04);
        clutchRim.rotation.y = Math.PI / 2;
        engineGroup.add(clutchRim);

        // Center Medallion
        const medal = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.008, 24), materials.brushedAlloy);
        medal.position.set(0.187, -0.01, 0.04);
        medal.rotation.z = Math.PI / 2;
        engineGroup.add(medal);

        // 3. Left-Side Alternator / Stator Cover & Starter Motor
        const altGeom = new THREE.CylinderGeometry(0.092, 0.092, 0.052, 28);
        const altCover = new THREE.Mesh(altGeom, materials.sherpaBlack);
        altCover.position.set(-0.15, 0.01, 0.02);
        altCover.rotation.z = Math.PI / 2;
        altCover.castShadow = true;
        engineGroup.add(altCover);

        // Starter Motor atop crankcase
        const starterGeom = new THREE.CylinderGeometry(0.034, 0.034, 0.14, 20);
        const starter = new THREE.Mesh(starterGeom, materials.blackAlloy);
        starter.position.set(-0.06, 0.11, 0.12);
        starter.rotation.z = Math.PI / 2;
        engineGroup.add(starter);

        // 4. Forward-Canted Cylinder Barrel (~15° tilt)
        const cylinderGeom = new THREE.CylinderGeometry(0.076, 0.084, 0.16, 28);
        const cylinderMesh = new THREE.Mesh(cylinderGeom, materials.sherpaBlack);
        cylinderMesh.position.set(0, 0.16, 0.05);
        cylinderMesh.rotation.x = -0.26; // Forward tilt
        cylinderMesh.castShadow = true;
        engineGroup.add(cylinderMesh);

        // Machined Cylinder Horizontal Accent Cooling Fins (Silver-edged contrast)
        for (let r = 0; r < 5; r++) {
            const ringGeom = new THREE.TorusGeometry(0.082, 0.0028, 8, 28);
            const ringMesh = new THREE.Mesh(ringGeom, materials.brushedAlloy);
            ringMesh.position.set(0, 0.11 + r * 0.025, 0.04 + r * 0.007);
            ringMesh.rotation.x = Math.PI / 2 - 0.26;
            engineGroup.add(ringMesh);
        }

        // 5. DOHC 4-Valve Cylinder Head & Cam Cover
        const headGeom = new THREE.BoxGeometry(0.165, 0.082, 0.165);
        const head = new THREE.Mesh(headGeom, materials.sherpaBlack);
        head.position.set(0, 0.28, 0.07);
        head.rotation.x = -0.26;
        head.castShadow = true;
        engineGroup.add(head);

        const camCoverGeom = new THREE.CylinderGeometry(0.046, 0.046, 0.155, 24);
        const camCover = new THREE.Mesh(camCoverGeom, materials.blackAlloy);
        camCover.position.set(0, 0.33, 0.06);
        camCover.rotation.z = Math.PI / 2;
        camCover.rotation.x = -0.26;
        camCover.castShadow = true;
        engineGroup.add(camCover);

        // Spark plug & ignition lead
        const plugGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.045, 10);
        const plug = new THREE.Mesh(plugGeom, materials.cyanAlloy);
        plug.position.set(0.04, 0.34, 0.09);
        plug.rotation.z = 0.3;
        engineGroup.add(plug);

        // 6. PROMINENT VERTICAL RADIATOR & HONEYCOMB MESH
        const radGroup = new THREE.Group();

        // Radiator Core Body with Perforated Honeycomb Mesh Texture
        const radCoreGeom = new THREE.BoxGeometry(0.19, 0.25, 0.035);
        const radCore = new THREE.Mesh(radCoreGeom, materials.radiatorMesh);
        radCore.position.set(0, 0.20, 0.24);
        radCore.rotation.x = -0.15;
        radGroup.add(radCore);

        // Radiator Side Shrouds / Tanks
        [-0.105, 0.105].forEach(side => {
            const shroudGeom = new THREE.BoxGeometry(0.024, 0.26, 0.045);
            const shroud = new THREE.Mesh(shroudGeom, materials.blackAlloy);
            shroud.position.set(side, 0.20, 0.24);
            shroud.rotation.x = -0.15;
            radGroup.add(shroud);
        });

        // Top Filler Cap in Electric Cyan
        const radCapGeom = new THREE.CylinderGeometry(0.016, 0.016, 0.025, 14);
        const radCap = new THREE.Mesh(radCapGeom, materials.cyanAlloy);
        radCap.position.set(0.095, 0.33, 0.22);
        radGroup.add(radCap);

        // Black Rubber Coolant Hoses connecting Radiator to Engine
        const hoseCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.08, 0.14, 0.23),
            new THREE.Vector3(-0.12, 0.10, 0.16),
            new THREE.Vector3(-0.11, 0.04, 0.08)
        ]);
        const hoseGeom = new THREE.TubeGeometry(hoseCurve, 16, 0.012, 10, false);
        const hose = new THREE.Mesh(hoseGeom, materials.tireRubber);
        radGroup.add(hose);

        // Metallic hose clamps
        [-0.08, -0.11].forEach((cx, idx) => {
            const clampGeom = new THREE.CylinderGeometry(0.014, 0.014, 0.008, 12);
            const clamp = new THREE.Mesh(clampGeom, materials.chrome);
            clamp.position.set(cx, idx === 0 ? 0.14 : 0.04, idx === 0 ? 0.23 : 0.08);
            radGroup.add(clamp);
        });

        engineGroup.add(radGroup);

        // 7. Gear shift lever (Left) & Rear brake master cylinder (Right)
        const shiftGeom = new THREE.CylinderGeometry(0.007, 0.007, 0.09, 8);
        const shift = new THREE.Mesh(shiftGeom, materials.brushedAlloy);
        shift.position.set(-0.18, -0.04, 0.10);
        shift.rotation.x = 0.65;
        engineGroup.add(shift);

        return engineGroup;
    }

    // =========================================================================
    // 4. SCRAMBLER STUBBY EXHAUST & SLOTTED HEAT SHIELD (Guerrilla 450)
    // Sweeping stainless header, reverse-megaphone silencer, perforated shield
    // =========================================================================
    function buildGuerrillaExhaust(materials) {
        const exhaustGroup = new THREE.Group();

        // 1. Single Right-Side Stainless Header Pipe
        // Starts at forward-facing cylinder exhaust port and sweeps under crankcase
        const headerCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.03, 0.44, 0.15),   // Exhaust port
            new THREE.Vector3(0.07, 0.33, 0.25),   // Sweeps forward & around radiator
            new THREE.Vector3(0.13, 0.18, 0.22),   // Curves down right down-tube
            new THREE.Vector3(0.14, 0.12, 0.02),   // Curves along right side of sump
            new THREE.Vector3(0.15, 0.13, -0.18),  // Meets under-belly cat chamber
            new THREE.Vector3(0.17, 0.16, -0.32)   // Enters scrambler silencer
        ]);
        const headerGeom = new THREE.TubeGeometry(headerCurve, 32, 0.021, 16, false);
        const header = new THREE.Mesh(headerGeom, materials.brushedExhaust);
        header.castShadow = true;
        exhaustGroup.add(header);

        // Exhaust Port Billet Collar
        const collarGeom = new THREE.CylinderGeometry(0.032, 0.032, 0.018, 16);
        const collar = new THREE.Mesh(collarGeom, materials.brushedAlloy);
        collar.position.set(0.03, 0.44, 0.15);
        collar.rotation.x = 0.7;
        exhaustGroup.add(collar);

        // Oxygen sensor (O2 sensor bung)
        const o2Geom = new THREE.CylinderGeometry(0.008, 0.008, 0.022, 10);
        const o2Sensor = new THREE.Mesh(o2Geom, materials.blackAlloy);
        o2Sensor.position.set(0.135, 0.15, 0.10);
        o2Sensor.rotation.z = 0.5;
        exhaustGroup.add(o2Sensor);

        // 2. Modern Upswept Stubby Scrambler Megaphone Silencer in Brushed Stainless
        const silencerGeom = new THREE.CylinderGeometry(0.054, 0.028, 0.38, 32);
        const silencer = new THREE.Mesh(silencerGeom, materials.brushedExhaust);
        silencer.position.set(0.185, 0.22, -0.48);
        silencer.rotation.x = -Math.PI / 2 - 0.28; // Dynamic upswept scrambler angle
        silencer.rotation.y = 0.08;
        silencer.castShadow = true;
        exhaustGroup.add(silencer);

        // Tapered Black Alloy Billet End Cap
        const tipGeom = new THREE.CylinderGeometry(0.040, 0.054, 0.045, 32);
        const tip = new THREE.Mesh(tipGeom, materials.blackAlloy);
        tip.position.set(0.195, 0.29, -0.66);
        tip.rotation.x = -Math.PI / 2 - 0.28;
        tip.rotation.y = 0.08;
        exhaustGroup.add(tip);

        // Machined Inner Exhaust Core
        const baffleGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.012, 20);
        const baffle = new THREE.Mesh(baffleGeom, materials.sherpaBlack);
        baffle.position.set(0.20, 0.31, -0.68);
        baffle.rotation.x = -Math.PI / 2 - 0.28;
        exhaustGroup.add(baffle);

        // 3. Perforated Slotted Heat Shield (Guards rider boot from header/silencer joint)
        const shieldGeom = new THREE.CylinderGeometry(0.028, 0.035, 0.18, 20, 1, true, 0, Math.PI);
        const shield = new THREE.Mesh(shieldGeom, materials.heatShield || materials.blackAlloy);
        shield.position.set(0.165, 0.14, -0.22);
        shield.rotation.x = Math.PI / 2 - 0.15;
        shield.castShadow = true;
        exhaustGroup.add(shield);

        // Shield Chrome Mounting Screws
        [-0.05, 0.05].forEach(sy => {
            const screwGeom = new THREE.CylinderGeometry(0.004, 0.004, 0.006, 8);
            const screw = new THREE.Mesh(screwGeom, materials.chrome);
            screw.position.set(0.185, 0.14 + sy * 0.4, -0.22 + sy);
            screw.rotation.z = Math.PI / 2;
            exhaustGroup.add(screw);
        });

        return exhaustGroup;
    }

    // =========================================================================
    // 5. OPTICAL BI-LED PROJECTOR HEADLIGHT & CIRCULAR HALO DRL
    // =========================================================================
    function buildGuerrillaHeadlight(materials) {
        const headlightGroup = new THREE.Group();

        // Compact Round Die-Cast Casing in Satin Black
        const casingGeom = new THREE.SphereGeometry(0.096, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.62);
        const casing = new THREE.Mesh(casingGeom, materials.blackAlloy);
        casing.rotation.x = -Math.PI / 2;
        casing.castShadow = true;
        headlightGroup.add(casing);

        // Outer Bezel Ring in Satin Gunmetal
        const bezelGeom = new THREE.TorusGeometry(0.092, 0.008, 16, 48);
        const bezel = new THREE.Mesh(bezelGeom, materials.blackAlloy);
        bezel.position.z = 0.035;
        headlightGroup.add(bezel);

        // SIGNATURE FULL-CIRCULAR LED HALO DRL RING (Cyan / Crisp White)
        const haloGeom = new THREE.TorusGeometry(0.078, 0.006, 16, 48);
        const halo = new THREE.Mesh(haloGeom, materials.haloDRL);
        halo.position.z = 0.040;
        headlightGroup.add(halo);

        // Prismatic Clear Outer Glass Lens
        const lensGeom = new THREE.CylinderGeometry(0.090, 0.090, 0.008, 36);
        const lens = new THREE.Mesh(lensGeom, materials.glassLens);
        lens.position.z = 0.042;
        lens.rotation.x = Math.PI / 2;
        headlightGroup.add(lens);

        // Central Bi-LED Projector Optic Core
        const projGeom = new THREE.SphereGeometry(0.034, 24, 24);
        const proj = new THREE.Mesh(projGeom, materials.lightBulb);
        proj.position.z = 0.018;
        headlightGroup.add(proj);

        // Chrome Inner Parabolic Reflector Dish
        const dishGeom = new THREE.CylinderGeometry(0.082, 0.024, 0.040, 32, 1, true);
        const dish = new THREE.Mesh(dishGeom, materials.reflector);
        dish.position.z = 0.010;
        dish.rotation.x = -Math.PI / 2;
        headlightGroup.add(dish);

        // Horizontal Center Divider Bar
        const barGeom = new THREE.BoxGeometry(0.14, 0.012, 0.008);
        const bar = new THREE.Mesh(barGeom, materials.blackAlloy);
        bar.position.z = 0.038;
        headlightGroup.add(bar);

        // Compact Front Turn Indicators on Black Stalks
        [-0.14, 0.14].forEach(ox => {
            const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 10), materials.blackAlloy);
            stalk.position.set(ox * 0.75, -0.01, -0.01);
            stalk.rotation.z = Math.PI / 2;
            headlightGroup.add(stalk);

            const ledGeom = new THREE.BoxGeometry(0.028, 0.014, 0.018);
            const led = new THREE.Mesh(ledGeom, materials.amberGlass);
            led.position.set(ox, -0.01, 0.01);
            headlightGroup.add(led);
        });

        return headlightGroup;
    }

    // =========================================================================
    // 6. COCKPIT & CIRCULAR COLOR TFT DISPLAY (Guerrilla 450)
    // =========================================================================
    function buildGuerrillaHandlebars(materials) {
        const barGroup = new THREE.Group();

        // Upper Triple Tree Billet Clamp
        const clampGeom = new THREE.BoxGeometry(0.24, 0.026, 0.065);
        const clamp = new THREE.Mesh(clampGeom, materials.blackAlloy);
        clamp.position.set(0, 0, 0);
        clamp.rotation.x = -0.42;
        clamp.castShadow = true;
        barGroup.add(clamp);

        // Handlebar Risers
        [-0.055, 0.055].forEach(ox => {
            const riserGeom = new THREE.CylinderGeometry(0.015, 0.018, 0.040, 16);
            const riser = new THREE.Mesh(riserGeom, materials.blackAlloy);
            riser.position.set(ox, 0.028, 0.008);
            barGroup.add(riser);
        });

        // Modern Wide Roadster Low-Rise Fat-Bar Handlebar in Satin Black
        const barCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.35, 0.075, -0.04),
            new THREE.Vector3(-0.22, 0.065, -0.01),
            new THREE.Vector3(-0.055, 0.048, 0.008),
            new THREE.Vector3(0, 0.048, 0.008),
            new THREE.Vector3(0.055, 0.048, 0.008),
            new THREE.Vector3(0.22, 0.065, -0.01),
            new THREE.Vector3(0.35, 0.075, -0.04)
        ]);
        const barGeom = new THREE.TubeGeometry(barCurve, 32, 0.013, 14, false);
        const bar = new THREE.Mesh(barGeom, materials.blackAlloy);
        bar.castShadow = true;
        barGroup.add(bar);

        // Knurled Rubber Grips, Bar-End Weights, Levers & Mirrors
        [-1, 1].forEach(side => {
            const gripGeom = new THREE.CylinderGeometry(0.017, 0.017, 0.10, 16);
            const grip = new THREE.Mesh(gripGeom, materials.tireRubber);
            grip.position.set(0.29 * side, 0.072, -0.028);
            grip.rotation.z = side * -1.52;
            barGroup.add(grip);

            // Bar-End Weighted Cap
            const capGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.02, 16);
            const cap = new THREE.Mesh(capGeom, materials.blackAlloy);
            cap.position.set(0.355 * side, 0.076, -0.042);
            cap.rotation.z = side * -1.52;
            barGroup.add(cap);

            // Black Forged Brake & Clutch Levers
            const leverGeom = new THREE.BoxGeometry(0.10, 0.008, 0.012);
            const lever = new THREE.Mesh(leverGeom, materials.brushedAlloy);
            lever.position.set(0.25 * side, 0.06, 0.018);
            lever.rotation.y = side * -0.26;
            barGroup.add(lever);

            // Handlebar Switch Cubes (Left: indicators/horn, Right: ignition/starter)
            const cubeGeom = new THREE.BoxGeometry(0.028, 0.032, 0.030);
            const cube = new THREE.Mesh(cubeGeom, materials.sherpaBlack);
            cube.position.set(0.23 * side, 0.068, -0.018);
            barGroup.add(cube);

            // Low-Profile Roadster Mirrors
            const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.14, 10), materials.blackAlloy);
            stalk.position.set(0.24 * side, 0.14, -0.01);
            stalk.rotation.z = side * -0.28;
            barGroup.add(stalk);

            const mirrorHead = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.040, 0.010, 20), materials.blackAlloy);
            mirrorHead.position.set(0.28 * side, 0.21, -0.01);
            mirrorHead.rotation.x = 0.2;
            mirrorHead.rotation.y = side * -0.2;
            barGroup.add(mirrorHead);

            const glass = new THREE.Mesh(new THREE.CircleGeometry(0.038, 20), materials.reflector);
            glass.position.set(0.28 * side, 0.21, -0.005);
            glass.rotation.x = 0.2;
            glass.rotation.y = side * -0.2;
            barGroup.add(glass);
        });

        // 4-INCH CIRCULAR FULL-COLOR DIGITAL TFT INSTRUMENT CLUSTER
        const tftGeom = new THREE.CylinderGeometry(0.052, 0.048, 0.028, 32);
        const tftCasing = new THREE.Mesh(tftGeom, materials.blackAlloy);
        tftCasing.position.set(0.03, 0.08, 0.035);
        tftCasing.rotation.x = -0.52;
        barGroup.add(tftCasing);

        // Digital Color Screen Face displaying Speed, Tachometer, Gear & Modes
        const screenGeom = new THREE.CircleGeometry(0.048, 32);
        const screen = new THREE.Mesh(screenGeom, materials.tftScreen);
        screen.position.set(0.03, 0.092, 0.045);
        screen.rotation.x = -0.52;
        barGroup.add(screen);

        return barGroup;
    }

    // =========================================================================
    // 7. CONTOURED ROADSTER BENCH SADDLE (Guerrilla 450)
    // Low-slung 780mm rider pocket, stepped pillion, contrast perimeter stitching
    // =========================================================================
    function buildGuerrillaSeat(materials) {
        const seatGroup = new THREE.Group();

        const length = 0.52;
        const width = 0.22;
        const height = 0.07;

        const seatGeom = new THREE.BoxGeometry(width, height, length, 12, 4, 16);
        const pos = seatGeom.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            let px = pos.getX(i);
            let py = pos.getY(i);
            let pz = pos.getZ(i);

            const zNorm = pz / (length * 0.5); // -1 (rear) to +1 (front)

            // Taper front narrow to meet fuel tank snugly
            if (zNorm > 0.2) {
                px *= (1.0 - (zNorm - 0.2) * 0.48);
            }

            // Rider contour scoop for comfortable ergonomics
            if (zNorm > -0.3 && zNorm < 0.5) {
                py -= Math.cos((zNorm - 0.1) * Math.PI) * 0.018;
            }

            // Sleek rear roadster rounding
            if (zNorm < -0.3) {
                py += 0.014;
                px *= (1.0 - Math.pow(Math.abs(zNorm + 0.3) * 0.72, 2));
            }

            pos.setXYZ(i, px, py, pz);
        }
        seatGeom.computeVertexNormals();

        const seatMesh = new THREE.Mesh(seatGeom, materials.roadsterSeat);
        seatMesh.castShadow = true;
        seatMesh.receiveShadow = true;
        seatGroup.add(seatMesh);

        // Low-Profile Rear Passenger Grab Handle
        const grabCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.12, -0.02, -0.10),
            new THREE.Vector3(-0.13, 0.015, -0.22),
            new THREE.Vector3(0, 0.02, -0.28),
            new THREE.Vector3(0.13, 0.015, -0.22),
            new THREE.Vector3(0.12, -0.02, -0.10)
        ]);
        const grabGeom = new THREE.TubeGeometry(grabCurve, 24, 0.009, 10, false);
        const grab = new THREE.Mesh(grabGeom, materials.blackAlloy);
        grab.castShadow = true;
        seatGroup.add(grab);

        return seatGroup;
    }

    // =========================================================================
    // 8. TUBULAR STEEL FRAME & SIGNATURE ELECTRIC CYAN BLUE SUBFRAME TRELLIS
    // =========================================================================
    function buildGuerrillaFrame(materials) {
        const frameGroup = new THREE.Group();

        // Steering Head Neck Tube
        const neckGeom = new THREE.CylinderGeometry(0.034, 0.034, 0.18, 16);
        const neck = new THREE.Mesh(neckGeom, materials.frameBlack);
        neck.position.set(0, 0.72, 0.44);
        neck.rotation.x = -0.42;
        neck.castShadow = true;
        frameGroup.add(neck);

        // Main Backbone Tube (Satin Black)
        const spineCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0.70, 0.42),
            new THREE.Vector3(0, 0.64, 0.18),
            new THREE.Vector3(0, 0.54, -0.06)
        ]);
        const spineGeom = new THREE.TubeGeometry(spineCurve, 16, 0.024, 12, false);
        const spine = new THREE.Mesh(spineGeom, materials.frameBlack);
        spine.castShadow = true;
        frameGroup.add(spine);

        // Twin Down-Tubes cradling Sherpa Engine (Satin Black)
        [-0.075, 0.075].forEach(ox => {
            const downCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(ox * 0.7, 0.67, 0.43),
                new THREE.Vector3(ox, 0.46, 0.33),
                new THREE.Vector3(ox, 0.20, 0.22),
                new THREE.Vector3(ox, 0.14, 0.02),
                new THREE.Vector3(ox, 0.14, -0.14),
                new THREE.Vector3(ox * 0.8, 0.22, -0.18)
            ]);
            const downGeom = new THREE.TubeGeometry(downCurve, 24, 0.015, 10, false);
            const downTube = new THREE.Mesh(downGeom, materials.frameBlack);
            downTube.castShadow = true;
            frameGroup.add(downTube);
        });

        // =====================================================================
        // SIGNATURE GUERRILLA 450 FEATURE:
        // EXPOSED REAR SUBFRAME TRELLIS IN ELECTRIC CYAN BLUE (0x00c4f0)!
        // Prominently exposed on outer flanks directly under the seat!
        // =====================================================================
        const subframeGroup = new THREE.Group();

        // Upper Trellis Rails in Cyan
        [-0.118, 0.118].forEach(ox => {
            const subGeom = new THREE.CylinderGeometry(0.014, 0.014, 0.48, 14);
            const subRail = new THREE.Mesh(subGeom, materials.cyanAlloy);
            subRail.position.set(ox, 0.53, -0.28);
            subRail.rotation.x = Math.PI / 2;
            subRail.castShadow = true;
            subframeGroup.add(subRail);

            // Diagonal Trellis Struts connecting swingarm pivot to upper rails
            const diagCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(ox * 0.92, 0.24, -0.16),
                new THREE.Vector3(ox, 0.38, -0.28),
                new THREE.Vector3(ox, 0.52, -0.42)
            ]);
            const diagTube = new THREE.Mesh(new THREE.TubeGeometry(diagCurve, 16, 0.014, 10, false), materials.cyanAlloy);
            diagTube.castShadow = true;
            subframeGroup.add(diagTube);

            // Trellis Cross-Truss Geometries forming the triangular cage
            const trussGeom = new THREE.CylinderGeometry(0.011, 0.011, 0.18, 8);
            const truss = new THREE.Mesh(trussGeom, materials.cyanAlloy);
            truss.position.set(ox, 0.43, -0.24);
            truss.rotation.x = 0.58;
            subframeGroup.add(truss);
        });

        // Rear Trellis Hoop loop in Cyan
        const loopCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.118, 0.53, -0.52),
            new THREE.Vector3(0, 0.53, -0.56),
            new THREE.Vector3(0.118, 0.53, -0.52)
        ]);
        const loopGeom = new THREE.TubeGeometry(loopCurve, 18, 0.014, 10, false);
        const loop = new THREE.Mesh(loopGeom, materials.cyanAlloy);
        subframeGroup.add(loop);

        frameGroup.add(subframeGroup);

        // Footpegs & Rider Brackets
        [-1, 1].forEach(side => {
            const bracketGeom = new THREE.BoxGeometry(0.03, 0.06, 0.08);
            const bracket = new THREE.Mesh(bracketGeom, materials.blackAlloy);
            bracket.position.set(0.16 * side, 0.24, -0.06);
            frameGroup.add(bracket);

            const pegGeom = new THREE.CylinderGeometry(0.014, 0.014, 0.09, 12);
            const peg = new THREE.Mesh(pegGeom, materials.tireRubber);
            peg.position.set(0.20 * side, 0.22, -0.06);
            peg.rotation.z = Math.PI / 2;
            frameGroup.add(peg);

            // Passenger peg on rear subframe
            const pPeg = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.07, 10), materials.brushedAlloy);
            pPeg.position.set(0.16 * side, 0.32, -0.34);
            pPeg.rotation.z = Math.PI / 2;
            frameGroup.add(pPeg);
        });

        return frameGroup;
    }

    // =========================================================================
    // 9. SUSPENSION MODULE (43mm Forks with ACCORDION RUBBER GAITERS & Monoshock)
    // =========================================================================
    function buildGuerrillaSuspension(materials) {
        const suspGroup = new THREE.Group();

        const rake = -0.42; // Roadster rake matching steering neck
        const forkSpacing = 0.092;

        // Lower Triple Tree in Satin Black
        const lowerClampGeom = new THREE.BoxGeometry(0.24, 0.026, 0.065);
        const lowerClamp = new THREE.Mesh(lowerClampGeom, materials.blackAlloy);
        lowerClamp.position.set(0, 0.68, 0.46);
        lowerClamp.rotation.x = rake;
        suspGroup.add(lowerClamp);

        // 43mm Front Telescopic Forks: Chrome Stanchions + Black Sliders + ACCORDION BOOTS!
        [-forkSpacing, forkSpacing].forEach(ox => {
            // Lower Alloy Fork Slider (extending upward from front axle at 0.335, 0.65)
            const sliderGeom = new THREE.CylinderGeometry(0.024, 0.022, 0.24, 20);
            const slider = new THREE.Mesh(sliderGeom, materials.blackAlloy);
            slider.position.set(ox, 0.44, 0.60);
            slider.rotation.x = rake;
            slider.castShadow = true;
            suspGroup.add(slider);

            // Front Axle Lug holding front wheel axle at (ox, 0.335, 0.65)
            const lugGeom = new THREE.BoxGeometry(0.034, 0.040, 0.040);
            const lug = new THREE.Mesh(lugGeom, materials.blackAlloy);
            lug.position.set(ox, 0.335, 0.65);
            lug.rotation.x = rake;
            suspGroup.add(lug);

            // Caliper mounting tab on right slider
            if (ox > 0) {
                const calMountGeom = new THREE.BoxGeometry(0.02, 0.05, 0.04);
                const calMount = new THREE.Mesh(calMountGeom, materials.blackAlloy);
                calMount.position.set(ox + 0.015, 0.40, 0.62);
                calMount.rotation.x = rake;
                suspGroup.add(calMount);
            }

            // Upper Chrome Stanchion Tube passing into triple tree
            const tubeGeom = new THREE.CylinderGeometry(0.019, 0.019, 0.26, 16);
            const tube = new THREE.Mesh(tubeGeom, materials.chrome);
            tube.position.set(ox, 0.63, 0.49);
            tube.rotation.x = rake;
            suspGroup.add(tube);

            // =================================================================
            // RETRO-ROADSTER RUBBER ACCORDION GAITERS (BOOTS)
            // Signature Guerrilla 450 aesthetic feature from reference image!
            // =================================================================
            const gaiterGroup = new THREE.Group();
            gaiterGroup.position.set(ox, 0.56, 0.53);
            gaiterGroup.rotation.x = rake;

            const bellowsCount = 7;
            const bellowHeight = 0.020;
            for (let b = 0; b < bellowsCount; b++) {
                const by = (b - bellowsCount * 0.5) * bellowHeight;
                // Outer rubber rib
                const ribGeom = new THREE.TorusGeometry(0.026, 0.005, 10, 24);
                const rib = new THREE.Mesh(ribGeom, materials.rubberGaiters || materials.tireRubber);
                rib.position.y = by;
                rib.rotation.x = Math.PI / 2;
                gaiterGroup.add(rib);

                // Inner connecting sleeve
                const sleeveGeom = new THREE.CylinderGeometry(0.021, 0.021, bellowHeight, 16);
                const sleeve = new THREE.Mesh(sleeveGeom, materials.rubberGaiters || materials.tireRubber);
                sleeve.position.y = by;
                gaiterGroup.add(sleeve);
            }
            suspGroup.add(gaiterGroup);
        });

        // Rear Cast Aluminum Swingarm in Satin Black
        [-0.092, 0.092].forEach(ox => {
            const armGeom = new THREE.BoxGeometry(0.022, 0.038, 0.50);
            const arm = new THREE.Mesh(armGeom, materials.frameBlack);
            arm.position.set(ox, 0.315, -0.40);
            arm.rotation.x = 0.08;
            arm.castShadow = true;
            suspGroup.add(arm);
        });

        // Swingarm Cross Brace
        const crossGeom = new THREE.BoxGeometry(0.17, 0.03, 0.05);
        const crossMesh = new THREE.Mesh(crossGeom, materials.frameBlack);
        crossMesh.position.set(0, 0.29, -0.26);
        suspGroup.add(crossMesh);

        // Central Linkage Monoshock
        const shockGroup = new THREE.Group();
        const shockBody = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.22, 16), materials.blackAlloy);
        shockGroup.add(shockBody);

        // Coiled Monoshock Spring (Electric Cyan Blue)
        const coilCurve = new THREE.CatmullRomCurve3(
            Array.from({ length: 36 }, (_, i) => {
                const t = (i / 36) * Math.PI * 10;
                const r = 0.025;
                const y = (i / 36) * 0.16 - 0.08;
                return new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r);
            })
        );
        const coilGeom = new THREE.TubeGeometry(coilCurve, 42, 0.0048, 10, false);
        const coil = new THREE.Mesh(coilGeom, materials.cyanAlloy);
        shockGroup.add(coil);

        shockGroup.position.set(0, 0.40, -0.22);
        shockGroup.rotation.x = -0.52;
        suspGroup.add(shockGroup);

        return suspGroup;
    }

    // =========================================================================
    // 10. ROADSTER BODYWORK & FENDERS (Tight Front Hugger & Rear Tail Tidy)
    // =========================================================================
    function buildGuerrillaFenders(materials) {
        const fendersGroup = new THREE.Group();

        // 1. FRONT ROADSTER HUGGER FENDER
        // Sits tightly over 17" wheel (R = 0.342m, exactly 7mm off the 0.335m tire)
        const centerY = 0.335;
        const centerZ = 0.65;
        const radius = 0.342;
        const fenderWidth = 0.115;
        const startAngle = -0.32;
        const endAngle = 0.52;
        const segments = 32;
        const lateralSegments = 6;

        const fGeom = new THREE.BufferGeometry();
        const fVerts = [];
        const fUvs = [];
        const fIndices = [];

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = startAngle + t * (endAngle - startAngle);
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);

            for (let j = 0; j <= lateralSegments; j++) {
                const u = j / lateralSegments;
                const lateralOffset = (u - 0.5) * fenderWidth;
                const normalizedLat = (u - 0.5) * 2;
                const r = radius + 0.005 * (1 - normalizedLat * normalizedLat);

                const px = lateralOffset;
                const py = centerY + r * cosA;
                const pz = centerZ + r * sinA;

                fVerts.push(px, py, pz);
                fUvs.push(u, t);
            }
        }

        const rowStride = lateralSegments + 1;
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < lateralSegments; j++) {
                const a = i * rowStride + j;
                const b = (i + 1) * rowStride + j;
                const c = (i + 1) * rowStride + (j + 1);
                const d = i * rowStride + (j + 1);

                fIndices.push(a, b, d);
                fIndices.push(b, c, d);
            }
        }

        fGeom.setAttribute('position', new THREE.Float32BufferAttribute(fVerts, 3));
        fGeom.setAttribute('uv', new THREE.Float32BufferAttribute(fUvs, 2));
        fGeom.setIndex(fIndices);
        fGeom.computeVertexNormals();

        const frontFender = new THREE.Mesh(fGeom, materials.frontFender);
        frontFender.castShadow = true;
        frontFender.receiveShadow = true;
        fendersGroup.add(frontFender);

        // Stamped Satin Black Fender Mounting Brackets Bolted to Fork Sliders
        [-0.074, 0.074].forEach(ox => {
            const stayGeom = new THREE.BoxGeometry(0.010, 0.10, 0.016);
            const stay = new THREE.Mesh(stayGeom, materials.blackAlloy);
            stay.position.set(ox, 0.42, 0.635);
            stay.rotation.x = -0.42;
            fendersGroup.add(stay);

            // Mounting hex bolt
            const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.006, 6), materials.chrome);
            bolt.position.set(ox + (ox > 0 ? 0.006 : -0.006), 0.42, 0.635);
            bolt.rotation.z = Math.PI / 2;
            fendersGroup.add(bolt);
        });

        // 2. REAR TIRE HUGGER & ROADSTER TAIL SPLASH GUARD
        const rearCenterY = 0.335;
        const rearCenterZ = -0.65;
        const rearRadius = 0.352;
        const rearWidth = 0.138;
        const rStartAngle = 0.48;
        const rEndAngle = -0.72;

        const rGeom = new THREE.BufferGeometry();
        const rVerts = [];
        const rUvs = [];
        const rIndices = [];

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = rStartAngle + t * (rEndAngle - rStartAngle);
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);

            for (let j = 0; j <= lateralSegments; j++) {
                const u = j / lateralSegments;
                const lateralOffset = (u - 0.5) * rearWidth;
                const normalizedLat = (u - 0.5) * 2;
                const r = rearRadius + 0.005 * (1 - normalizedLat * normalizedLat);

                const px = lateralOffset;
                const py = rearCenterY + r * cosA;
                const pz = rearCenterZ + r * sinA;

                rVerts.push(px, py, pz);
                rUvs.push(u, t);
            }
        }

        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < lateralSegments; j++) {
                const a = i * rowStride + j;
                const b = (i + 1) * rowStride + j;
                const c = (i + 1) * rowStride + (j + 1);
                const d = i * rowStride + (j + 1);

                rIndices.push(a, b, d);
                rIndices.push(b, c, d);
            }
        }

        rGeom.setAttribute('position', new THREE.Float32BufferAttribute(rVerts, 3));
        rGeom.setAttribute('uv', new THREE.Float32BufferAttribute(rUvs, 2));
        rGeom.setIndex(rIndices);
        rGeom.computeVertexNormals();

        const rearFender = new THREE.Mesh(rGeom, materials.blackAlloy);
        rearFender.castShadow = true;
        rearFender.receiveShadow = true;
        fendersGroup.add(rearFender);

        // Slim Integrated LED Brake Light Strip
        const tailLightGeom = new THREE.BoxGeometry(0.11, 0.016, 0.025);
        const tailLight = new THREE.Mesh(tailLightGeom, materials.rubyTaillight);
        tailLight.position.set(0, 0.52, -0.58);
        fendersGroup.add(tailLight);

        // License Plate Holder & Tail Tidy
        const plateHolder = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.006), materials.blackAlloy);
        plateHolder.position.set(0, 0.42, -0.72);
        plateHolder.rotation.x = -0.35;
        fendersGroup.add(plateHolder);

        // Rear LED Mini Bullet Indicators
        [-0.11, 0.11].forEach(ox => {
            const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.04, 8), materials.blackAlloy);
            stalk.position.set(ox * 0.75, 0.46, -0.62);
            stalk.rotation.z = Math.PI / 2;
            fendersGroup.add(stalk);

            const amber = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.012, 0.016), materials.amberGlass);
            amber.position.set(ox, 0.46, -0.62);
            fendersGroup.add(amber);
        });

        return fendersGroup;
    }

    // =========================================================================
    // 11. SIDE PANELS & POWER BAY (Guerrilla 450)
    // =========================================================================
    function buildGuerrillaSidePanels(materials) {
        const battGroup = new THREE.Group();

        // Angular Roadster Side Panels in Satin Black bridging Tank, Subframe & Engine
        [-1, 1].forEach(side => {
            const panelGeom = new THREE.BoxGeometry(0.02, 0.14, 0.22);
            const panel = new THREE.Mesh(panelGeom, materials.sherpaBlack);
            panel.position.set(0.115 * side, 0.44, -0.10);
            panel.rotation.y = side * 0.12;
            panel.castShadow = true;
            battGroup.add(panel);

            // Cyan Accent Slash Strip on side panel
            const slashGeom = new THREE.BoxGeometry(0.024, 0.008, 0.12);
            const slash = new THREE.Mesh(slashGeom, materials.cyanAlloy);
            slash.position.set(0.116 * side, 0.44, -0.10);
            slash.rotation.y = side * 0.12;
            slash.rotation.x = 0.25;
            battGroup.add(slash);
        });

        // High-Density 12V Battery & ECU Telemetry Core
        const core = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.16), materials.blackAlloy);
        core.position.set(0, 0.42, -0.10);
        battGroup.add(core);

        return battGroup;
    }

    // =========================================================================
    // MASTER CONSTRUCTOR: Assembles the Complete Motorcycle
    // At progress = 0: All parts are in their exact showroom assembled position!
    // =========================================================================
    function createMotorcycle(materials) {
        bikeRoot = new THREE.Group();
        bikeRoot.name = "RoyalEnfield_Master";

        // 1. FRONT WHEEL MODULE (Guerrilla 450 Electric Cyan Rim & Spokes)
        // Assembled Center: (0, 0.335, 0.65) - touches ground at y = 0
        const frontWheelGroup = new THREE.Group();
        const frontWheelMesh = buildGuerrillaWheel(0.28, 0.11, materials.cyanAlloy, materials.cyanAlloy, materials, true);
        frontWheelMesh.position.set(0, 0.335, 0.65);
        frontWheelGroup.add(frontWheelMesh);
        bikeRoot.add(frontWheelGroup);

        modules.frontWheel = {
            id: 'MOD-01',
            name: 'FRONT KINETIC WHEEL // 17" ELECTRIC CYAN ALLOY',
            group: frontWheelGroup,
            basePos: new THREE.Vector3(0, 0, 0),
            explodedOffset: new THREE.Vector3(0, -0.06, 0.95),
            boxSize: new THREE.Vector3(0.28, 0.70, 0.70),
            boxCenter: new THREE.Vector3(0, 0.335, 0.65),
            description: '17-inch 5-split-spoke cast alloy wheel in factory Electric Cyan Blue, 120/70-R17 tubeless radial tire, 310mm ventilated rotor with ByBre radial-mount caliper.',
            specs: {
                Rim: '17 x 3.5 in Cast Alloy / Electric Cyan',
                Spokes: '5-Split-Spoke (10 Alloy Arms)',
                Brake: '310mm Ventilated Disc / ByBre ABS',
                Tire: '120/70-R17 Tubeless Radial'
            }
        };

        // 2. REAR WHEEL MODULE (Guerrilla 450 Satin Black Rim & Spokes)
        // Assembled Center: (0, 0.335, -0.65) - touches ground at y = 0
        const rearWheelGroup = new THREE.Group();
        const rearWheelMesh = buildGuerrillaWheel(0.28, 0.15, materials.blackAlloy, materials.blackAlloy, materials, false);
        rearWheelMesh.position.set(0, 0.335, -0.65);
        rearWheelGroup.add(rearWheelMesh);
        bikeRoot.add(rearWheelGroup);

        modules.rearWheel = {
            id: 'MOD-02',
            name: 'REAR TRACTION WHEEL // 17" SATIN BLACK ALLOY',
            group: rearWheelGroup,
            basePos: new THREE.Vector3(0, 0, 0),
            explodedOffset: new THREE.Vector3(0, -0.06, -0.95),
            boxSize: new THREE.Vector3(0.32, 0.70, 0.70),
            boxCenter: new THREE.Vector3(0, 0.335, -0.65),
            description: '17-inch 5-split-spoke cast alloy wheel in Satin Black, wide 160/60-R17 radial roadster tire, 270mm disc, and 44T steel chain drive sprocket.',
            specs: {
                Rim: '17 x 4.5 in Cast Alloy / Satin Black',
                Drive: '525 Heavy-Duty O-Ring Chain',
                Brake: '270mm Ventilated Disc / Single Piston',
                Tire: '160/60-R17 Tubeless Radial'
            }
        };

        // 3. SUSPENSION MODULE (43mm Forks with ACCORDION BOOTS & Monoshock)
        const suspGroup = new THREE.Group();
        const suspMesh = buildGuerrillaSuspension(materials);
        suspGroup.add(suspMesh);
        bikeRoot.add(suspGroup);

        modules.suspension = {
            id: 'MOD-03',
            name: 'SUSPENSION // 43mm FORKS & MONOSHOCK',
            group: suspGroup,
            basePos: new THREE.Vector3(0, 0, 0),
            explodedOffset: new THREE.Vector3(0, 0.35, 0.45),
            boxSize: new THREE.Vector3(0.36, 0.65, 0.70),
            boxCenter: new THREE.Vector3(0, 0.48, 0.48),
            description: 'Front 43mm telescopic forks with signature rubber accordion gaiters (140mm travel), rear cast aluminum swingarm with progressive Monoshock in Electric Cyan.',
            specs: {
                Front: '43mm Telescopic with Rubber Gaiters',
                Rear: 'Link-type Monoshock / 150mm Travel',
                Preload: '7-Step Adjustable Monoshock',
                Finish: 'Satin Gunmetal & Cyan Spring'
            }
        };

        // 4. OPTICAL NACELLE & LED HEADLIGHT MODULE
        // Position: (0, 0.69, 0.53)
        const headlightGroup = new THREE.Group();
        const headlightMesh = buildGuerrillaHeadlight(materials);
        headlightMesh.position.set(0, 0.69, 0.53);
        headlightGroup.add(headlightMesh);
        bikeRoot.add(headlightGroup);

        modules.headlight = {
            id: 'MOD-04',
            name: 'OPTICAL NACELLE // LED HALO DRL',
            group: headlightGroup,
            basePos: new THREE.Vector3(0, 0, 0),
            explodedOffset: new THREE.Vector3(0, 0.55, 0.85),
            boxSize: new THREE.Vector3(0.42, 0.30, 0.30),
            boxCenter: new THREE.Vector3(0, 0.69, 0.53),
            description: 'Round compact roadster LED headlight featuring a full circular LED Halo DRL ring in Electric Cyan, central Bi-LED projector optic, and LED turn signals.',
            specs: {
                Optics: 'Bi-LED Projector Core',
                DRL: 'Full Circular LED Halo Ring',
                Casing: 'Die-cast Satin Black Alloy',
                Indicators: 'Compact Amber LED Stalks'
            }
        };

        // 5. COCKPIT & DIGITAL COLOR TFT MODULE
        // Position: (0, 0.74, 0.42)
        const barGroup = new THREE.Group();
        const barMesh = buildGuerrillaHandlebars(materials);
        barMesh.position.set(0, 0.74, 0.42);
        barGroup.add(barMesh);
        bikeRoot.add(barGroup);

        modules.handlebars = {
            id: 'MOD-05',
            name: 'COCKPIT // COLOR TFT & FAT-BAR',
            group: barGroup,
            basePos: new THREE.Vector3(0, 0, 0),
            explodedOffset: new THREE.Vector3(0, 0.80, 0.35),
            boxSize: new THREE.Vector3(0.78, 0.36, 0.30),
            boxCenter: new THREE.Vector3(0, 0.80, 0.42),
            description: 'Modern low-rise fat-bar handlebar in satin black, circular 4-inch full-color digital TFT display with tachometer & telemetry, and dual angular mirrors.',
            specs: {
                Gauge: '4-inch Full-Color Circular TFT',
                Bar: 'Tapered Fat-Bar in Satin Black',
                Telemetry: 'Digital Speed, Tachometer, Gear [5]',
                Mirrors: 'Dual Low-Profile Roadster Mirrors'
            }
        };

        // 6. SCULPTED ROADSTER FUEL TANK MODULE
        // Position: (0, 0.62, 0.16)
        const tankGroup = new THREE.Group();
        const tankMesh = buildGuerrillaTank(materials);
        tankMesh.position.set(0, 0.62, 0.16);
        tankGroup.add(tankMesh);
        bikeRoot.add(tankGroup);

        modules.fuelTank = {
            id: 'MOD-06',
            name: 'ROADSTER TANK // 11L BRAVA BLUE',
            group: tankGroup,
            basePos: new THREE.Vector3(0, 0, 0),
            explodedOffset: new THREE.Vector3(0, 0.90, 0.05),
            boxSize: new THREE.Vector3(0.34, 0.28, 0.58),
            boxCenter: new THREE.Vector3(0, 0.62, 0.16),
            description: 'Sculpted roadster fuel tank in Brava Blue livery: Pearl White top, Electric Cyan-to-Deep Navy flank sweep, bold ROYAL ENFIELD typography, and flush aero cap.',
            specs: {
                Capacity: '11.0 Liters (Roadster Compact)',
                Livery: 'Brava Blue / Pearl White & Cyan',
                Finish: 'Multi-Coat High-Gloss Clearcoat',
                Cap: 'Aero Flush-Mount Aircraft Flip Cap'
            }
        };

        // 7. SADDLE & BENCH SEAT MODULE
        // Position: (0, 0.55, -0.26)
        const seatGroup = new THREE.Group();
        const seatMesh = buildGuerrillaSeat(materials);
        seatMesh.position.set(0, 0.55, -0.26);
        seatGroup.add(seatMesh);
        bikeRoot.add(seatGroup);

        modules.seat = {
            id: 'MOD-07',
            name: 'SADDLE // CONTOURED ROADSTER BENCH',
            group: seatGroup,
            basePos: new THREE.Vector3(0, 0, 0),
            explodedOffset: new THREE.Vector3(0, 0.75, -0.55),
            boxSize: new THREE.Vector3(0.30, 0.20, 0.58),
            boxCenter: new THREE.Vector3(0, 0.56, -0.26),
            description: 'One-piece contoured roadster bench seat in textured charcoal leather, sculpted rider bucket for low 780mm standover height, and low-profile rear grab rails.',
            specs: {
                Upholstery: 'Textured Roadster Black Vinyl',
                Height: '780mm Ergonomic Low Saddle',
                Pillion: 'Stepped Dual-Density Profile',
                GrabRail: 'Integrated Satin Black Steel Loop'
            }
        };

        // 8. SHERPA 450 POWERTRAIN & RADIATOR MODULE
        // Position: (0, 0.33, 0.05)
        const engineGroup = new THREE.Group();
        const engineMesh = buildSherpaEngine(materials);
        engineMesh.position.set(0, 0.33, 0.05);
        engineGroup.add(engineMesh);
        bikeRoot.add(engineGroup);

        modules.engine = {
            id: 'MOD-08',
            name: 'POWERTRAIN // 452cc SHERPA LIQUID-COOLED',
            group: engineGroup,
            basePos: new THREE.Vector3(0, 0, 0),
            explodedOffset: new THREE.Vector3(0, -0.55, 0.0),
            boxSize: new THREE.Vector3(0.40, 0.48, 0.46),
            boxCenter: new THREE.Vector3(0, 0.33, 0.05),
            description: 'Sherpa 450: 452cc single-cylinder DOHC 4-valve liquid-cooled engine with front vertical radiator, protective honeycomb mesh, ride-by-wire throttle, and slipper clutch.',
            specs: {
                Displacement: '452 cc / Liquid-Cooled Single',
                Power: '40.0 PS @ 8,000 rpm',
                Torque: '40.0 Nm @ 5,500 rpm',
                Cooling: 'Front Vertical Aluminum Radiator'
            }
        };

        // 9. SCRAMBLER STUBBY EXHAUST MODULE
        const exhaustGroup = new THREE.Group();
        const exhaustMesh = buildGuerrillaExhaust(materials);
        exhaustGroup.add(exhaustMesh);
        bikeRoot.add(exhaustGroup);

        modules.exhaust = {
            id: 'MOD-09',
            name: 'EXHAUST // SCRAMBLER STUBBY MEGAPHONE',
            group: exhaustGroup,
            basePos: new THREE.Vector3(0, 0, 0),
            explodedOffset: new THREE.Vector3(0, -0.45, -0.55),
            boxSize: new THREE.Vector3(0.46, 0.32, 1.10),
            boxCenter: new THREE.Vector3(0.12, 0.22, -0.32),
            description: 'Single right-side stainless header pipe curving under the crankcase into a modern upswept stubby scrambler megaphone silencer with laser-cut slotted heat shield.',
            specs: {
                Layout: 'Single Right-Hand Scrambler Run',
                Material: 'Brushed Stainless & Black Alloy Tip',
                Silencer: 'Stubby Upswept Reverse Megaphone',
                Shield: 'Perforated Slotted Boot Heat Guard'
            }
        };

        // 10. CHASSIS & BRAVA BLUE TRELLIS SUBFRAME MODULE
        const frameGroup = new THREE.Group();
        const frameMesh = buildGuerrillaFrame(materials);
        frameGroup.add(frameMesh);
        bikeRoot.add(frameGroup);

        modules.frame = {
            id: 'MOD-10',
            name: 'CHASSIS // BRAVA BLUE TRELLIS SUBFRAME',
            group: frameGroup,
            basePos: new THREE.Vector3(0, 0, 0),
            explodedOffset: new THREE.Vector3(0, 0.05, 0),
            boxSize: new THREE.Vector3(0.34, 0.62, 1.05),
            boxCenter: new THREE.Vector3(0, 0.44, 0.0),
            description: 'Steel tubular twin-spar frame in satin black paired with the signature Guerrilla Brava Blue tubular steel trellis subframe painted in Electric Cyan Blue.',
            specs: {
                MainFrame: 'Steel Tubular Twin-Spar Spine',
                Subframe: 'Electric Cyan Blue Trellis (0x00c4f0)',
                RakeAngle: '24.2° Agile Roadster Rake',
                Weight: '185 kg Kerb Weight'
            }
        };

        // 11. POWER BAY & ROADSTER SIDE PANELS MODULE
        const battGroup = new THREE.Group();
        const battMesh = buildGuerrillaSidePanels(materials);
        battGroup.add(battMesh);
        bikeRoot.add(battGroup);

        modules.batteryModule = {
            id: 'MOD-11',
            name: 'POWER BAY // ECU & SIDE PANELS',
            group: battGroup,
            basePos: new THREE.Vector3(0, 0, 0),
            explodedOffset: new THREE.Vector3(-0.65, 0.15, -0.20),
            boxSize: new THREE.Vector3(0.34, 0.24, 0.26),
            boxCenter: new THREE.Vector3(0, 0.42, -0.10),
            description: 'Sculpted roadster side panels with cyan accent lines enclosing the 12V 8Ah sealed gel battery, ride-by-wire engine ECU, and CAN-bus telemetry module.',
            specs: {
                Battery: '12V 8Ah Sealed AGM Maintenance-Free',
                ECU: 'Ride-by-Wire Engine Control System',
                Telemetry: 'CAN-bus Digital Sensor Hub',
                Panels: 'High-Impact Satin Polycarbonate'
            }
        };

        // 12. ROADSTER FENDERS & BODYWORK MODULE
        const fendersGroup = new THREE.Group();
        const fendersMesh = buildGuerrillaFenders(materials);
        fendersGroup.add(fendersMesh);
        bikeRoot.add(fendersGroup);

        modules.fenders = {
            id: 'MOD-12',
            name: 'BODYWORK // ROADSTER FENDERS & TAIL',
            group: fendersGroup,
            basePos: new THREE.Vector3(0, 0, 0),
            explodedOffset: new THREE.Vector3(0, 0.55, -0.65),
            boxSize: new THREE.Vector3(0.34, 0.52, 1.75),
            boxCenter: new THREE.Vector3(0, 0.44, 0.0),
            description: 'Short roadster front hugger fender hugging the 17" cyan wheel, rear tire hugger splash guard, slim integrated LED taillight strip, and license bracket.',
            specs: {
                Front: 'Short Roadster Hugger / Pearl White',
                Rear: 'Satin Black Tire Splash Guard',
                Taillight: 'Integrated Slim LED Brake Strip',
                Indicators: 'Compact Rear Mini LED Bullets'
            }
        };

        return {
            bikeRoot,
            modules
        };
    }

    // Scroll-Driven Deconstruction Function (0.0 to 1.0)
    function updateDeconstruction(progress, elapsedTime) {
        if (!modules) return;

        // Eased progress (strictly 0 at top of page)
        const ease = Math.min(1.0, Math.max(0.0, progress));

        Object.keys(modules).forEach(key => {
            const mod = modules[key];
            if (!mod.group) return;

            // When progress is 0: target is EXACTLY basePos (0, 0, 0)
            const targetX = mod.basePos.x + mod.explodedOffset.x * ease;
            const targetY = mod.basePos.y + mod.explodedOffset.y * ease;
            const targetZ = mod.basePos.z + mod.explodedOffset.z * ease;

            mod.group.position.set(targetX, targetY, targetZ);
            mod.group.rotation.set(0, 0, 0);
        });

        // The assembled motorcycle sits firmly on the ground turntable (y = 0)
        // When exploded, slightly elevate entire composition to stay centered
        if (bikeRoot) {
            bikeRoot.position.y = ease * 0.12;
        }
    }

    return {
        createMotorcycle,
        updateDeconstruction,
        getModules: () => modules,
        getRoot: () => bikeRoot
    };
})();
