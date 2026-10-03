/**
 * Royal Enfield Guerrilla 450 // Interactive Test Drive Simulator
 * 
 * Features:
 * - High-Speed Infinite Highway with scrolling neon road markers
 * - Wheel rotation physics (Front Electric Cyan wheel & Rear Satin Black wheel spin with velocity)
 * - Counter-steer leaning & dynamic roll physics (bike leans into corners)
 * - Procedural Sherpa 450 single-cylinder engine exhaust audio (idle thump, acceleration roar, gear shifts)
 * - Dual Camera Modes: Dynamic 3rd-person chase cam & 1st-person cockpit view
 * - Fullscreen Cockpit HUD: Live Digital Speedometer, Gear [1-6], Tachometer (RPM), Lean Angle, Throttle/Brake bars
 * - Keyboard (WASD / Arrows / Space) + Touch / Mouse on-screen pedal controls
 */

window.RE_TestDrive = (function () {
    let isActive = false;
    let scene = null;
    let camera = null;
    let bikeGroup = null;
    let modules = null;
    let materials = null;

    // Driving Physics State
    let speed = 0.0;          // km/h (0 to 145)
    let targetSpeed = 0.0;
    let rpm = 1400.0;         // Engine RPM (1400 idle to 8500 redline)
    let currentGear = 'N';
    let throttle = 0.0;       // 0 to 1
    let brake = 0.0;          // 0 to 1
    let steer = 0.0;          // -1 (left) to +1 (right)
    let lateralPos = 0.0;     // meters from center lane (-3.0 to +3.0)
    let bikeRoll = 0.0;        // current lean angle in radians
    let bikePitch = 0.0;       // acceleration squat / braking dive

    // Camera Mode: 'chase' or 'cockpit'
    let cameraMode = 'chase';

    // Highway & Environment Objects
    let highwayGroup = null;
    let roadTexture = null;
    let roadMesh = null;
    let speedStreaks = null;
    let streakPositions = null;
    const streakCount = 200;
    let roadsideBeacons = [];

    // Lighting
    let headlightBeam = null;
    let taillightGlow = null;

    // Procedural Audio Engine
    let audioCtx = null;
    let engineOsc = null;
    let engineSubOsc = null;
    let engineGain = null;
    let engineFilter = null;
    let isAudioActive = false;

    // Wheel spin tracking
    let wheelRotation = 0.0;

    // Human Rider (Man / Biker) 3D Model & Dynamic Articulation Nodes
    let riderGroup = null;
    let riderTorso = null;
    let riderHead = null;

    // AI Autonomous Cruise Pilot
    let isAutoDrive = false;
    let autoDriveTimer = 0.0;

    // 360-Degree Camera Orbit System
    let orbitAngleH = 0.0;     // Horizontal yaw: 0 = behind, PI/2 = right, PI = front, 3PI/2 = left
    let targetOrbitH = 0.0;
    let orbitAngleV = 0.22;    // Vertical pitch: ~12 deg above horizon
    let targetOrbitV = 0.22;
    let orbitDistance = 3.35;  // Distance in meters from motorcycle
    let targetOrbitDist = 3.35;
    let isOrbitDragging = false;
    let isAutoOrbit = false;
    let dragStartX = 0;
    let dragStartY = 0;

    // Key states
    const keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        brake: false
    };

    // Initialize 3D Highway & Test Drive Environment
    function init(sc, cam, bg, mods, mats) {
        scene = sc;
        camera = cam;
        bikeGroup = bg;
        modules = mods;
        materials = mats;

        buildHighway();
        buildSpeedStreaks();
        buildHeadlightBeam();
        buildRider();
        setupInputHandlers();
    }

    // 1. Build High-Speed Highway Ground Plane
    function buildHighway() {
        highwayGroup = new THREE.Group();
        highwayGroup.name = "TestDrive_Highway";
        highwayGroup.visible = false;

        // Procedural High-Contrast Roadster Asphalt Texture
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // Dark asphalt with subtle noise
        ctx.fillStyle = '#080a0e';
        ctx.fillRect(0, 0, 1024, 1024);

        // Asphalt micro-grain
        for (let i = 0; i < 6000; i++) {
            const gx = Math.random() * 1024;
            const gy = Math.random() * 1024;
            const val = Math.floor(15 + Math.random() * 20);
            ctx.fillStyle = `rgb(${val},${val + 2},${val + 6})`;
            ctx.fillRect(gx, gy, 2, 2);
        }

        // Road Outer Edge Lines (Solid Cyber Cyan & White)
        ctx.strokeStyle = '#00c4f0';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(120, 0);
        ctx.lineTo(120, 1024);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(904, 0);
        ctx.lineTo(904, 1024);
        ctx.stroke();

        // Shoulder Rumble Strips (Alternating Cyan & Charcoal blocks)
        for (let y = 0; y < 1024; y += 64) {
            ctx.fillStyle = (Math.floor(y / 64) % 2 === 0) ? '#00e5ff' : '#141c24';
            ctx.fillRect(70, y, 40, 50);
            ctx.fillRect(914, y, 40, 50);
        }

        // Center High-Speed Dashed Stripes (Vibrant Electric White/Cyan)
        ctx.fillStyle = '#ffffff';
        for (let y = 0; y < 1024; y += 128) {
            ctx.fillRect(502, y + 20, 20, 80);
        }

        // Sub-lane dashes
        ctx.fillStyle = 'rgba(0, 196, 240, 0.45)';
        for (let y = 0; y < 1024; y += 128) {
            ctx.fillRect(310, y + 20, 10, 50);
            ctx.fillRect(704, y + 20, 10, 50);
        }

        roadTexture = new THREE.CanvasTexture(canvas);
        roadTexture.wrapS = THREE.RepeatWrapping;
        roadTexture.wrapT = THREE.RepeatWrapping;
        roadTexture.repeat.set(1, 12);

        // Highway Plane: 14 meters wide, 140 meters long
        const roadGeom = new THREE.PlaneGeometry(14, 140, 1, 1);
        const roadMat = new THREE.MeshStandardMaterial({
            map: roadTexture,
            roughness: 0.82,
            metalness: 0.15
        });
        roadMesh = new THREE.Mesh(roadGeom, roadMat);
        roadMesh.rotation.x = -Math.PI / 2;
        roadMesh.position.set(0, -0.002, 35); // Extends from z = -35 to z = +105
        roadMesh.receiveShadow = true;
        highwayGroup.add(roadMesh);

        // Roadside Light Beacons along Highway Edges
        roadsideBeacons = [];
        for (let b = 0; b < 16; b++) {
            const zPos = -10 + b * 9.0;
            [-6.2, 6.2].forEach(bx => {
                const beaconGeom = new THREE.CylinderGeometry(0.06, 0.08, 0.9, 12);
                const beaconMat = new THREE.MeshStandardMaterial({ color: 0x14181f, metalness: 0.8 });
                const beacon = new THREE.Mesh(beaconGeom, beaconMat);
                beacon.position.set(bx, 0.45, zPos);

                const topGlowGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.18, 12);
                const topGlowMat = new THREE.MeshBasicMaterial({ color: bx < 0 ? 0x00c4f0 : 0x00e5ff });
                const topGlow = new THREE.Mesh(topGlowGeom, topGlowMat);
                topGlow.position.set(bx, 0.9, zPos);

                highwayGroup.add(beacon);
                highwayGroup.add(topGlow);
                roadsideBeacons.push({ beacon, topGlow, zStart: zPos });
            });
        }

        scene.add(highwayGroup);
    }

    // 2. High-Speed Particle Streaks System
    function buildSpeedStreaks() {
        const geom = new THREE.BufferGeometry();
        streakPositions = new Float32Array(streakCount * 6); // Line segments (2 points each)

        for (let i = 0; i < streakCount; i++) {
            const idx = i * 6;
            const rx = (Math.random() - 0.5) * 12.0;
            const ry = 0.2 + Math.random() * 3.5;
            const rz = -5 + Math.random() * 45;

            streakPositions[idx] = rx;
            streakPositions[idx + 1] = ry;
            streakPositions[idx + 2] = rz;

            // Tail of streak
            streakPositions[idx + 3] = rx;
            streakPositions[idx + 4] = ry;
            streakPositions[idx + 5] = rz - 0.8;
        }

        geom.setAttribute('position', new THREE.BufferAttribute(streakPositions, 3));
        const mat = new THREE.LineBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.65,
            linewidth: 1.5
        });

        speedStreaks = new THREE.LineSegments(geom, mat);
        speedStreaks.visible = false;
        scene.add(speedStreaks);
    }

    // 3. Dynamic Headlight Beam Projector
    function buildHeadlightBeam() {
        // High-intensity roadster spotlight casting forward onto asphalt
        headlightBeam = new THREE.SpotLight(0xf0f8ff, 0, 45, Math.PI * 0.22, 0.6, 1.2);
        headlightBeam.position.set(0, 0.72, 0.55);
        headlightBeam.target.position.set(0, 0.1, 16);
        scene.add(headlightBeam);
        scene.add(headlightBeam.target);

        // Rear Brake Light Point Glow
        taillightGlow = new THREE.PointLight(0xff1122, 0, 4.0);
        taillightGlow.position.set(0, 0.52, -0.62);
        scene.add(taillightGlow);
    }

    // =========================================================================
    // 3B. BUILD HUMAN RIDER / BIKER (Man mounted on Guerrilla 450)
    // =========================================================================
    function buildRider() {
        if (!bikeGroup || !materials) return;

        riderGroup = new THREE.Group();
        riderGroup.name = "TestDrive_Rider";
        riderGroup.visible = false; // Hidden in showroom deconstruction mode

        // Ensure materials exist with fallbacks
        const jacketMat = materials.riderJacket || materials.sherpaBlack || new THREE.MeshStandardMaterial({ color: 0x16181b, roughness: 0.65 });
        const accentMat = materials.riderAccent || materials.cyanAlloy || new THREE.MeshStandardMaterial({ color: 0x00c4f0 });
        const helmetMat = materials.riderHelmet || materials.blackAlloy || new THREE.MeshStandardMaterial({ color: 0x0e1014, roughness: 0.15 });
        const visorMat = materials.riderVisor || materials.haloDRL || new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.95 });
        const pantsMat = materials.riderPants || materials.sherpaBlack || new THREE.MeshStandardMaterial({ color: 0x181a1d, roughness: 0.78 });
        const bootsMat = materials.riderBoots || materials.blackAlloy || new THREE.MeshStandardMaterial({ color: 0x111315, roughness: 0.50 });
        const glovesMat = materials.riderGloves || materials.sherpaBlack || new THREE.MeshStandardMaterial({ color: 0x141619, roughness: 0.55 });
        const sliderMat = materials.brushedAlloy || new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });

        // 1. Lower Body / Pelvis / Saddle Contact
        // Sits squarely in the Guerrilla roadster saddle bucket at (0, 0.58, -0.18)
        const hipsGroup = new THREE.Group();
        hipsGroup.position.set(0, 0.58, -0.18);

        const pelvisGeom = new THREE.CylinderGeometry(0.12, 0.10, 0.12, 16);
        pelvisGeom.scale(1.1, 1.0, 1.3);
        const pelvis = new THREE.Mesh(pelvisGeom, pantsMat);
        pelvis.castShadow = true;
        hipsGroup.add(pelvis);

        // Belt & Buckle
        const beltGeom = new THREE.CylinderGeometry(0.122, 0.122, 0.024, 16);
        beltGeom.scale(1.12, 1.0, 1.32);
        const belt = new THREE.Mesh(beltGeom, jacketMat);
        belt.position.y = 0.05;
        hipsGroup.add(belt);

        const buckleGeom = new THREE.BoxGeometry(0.035, 0.026, 0.012);
        const buckle = new THREE.Mesh(buckleGeom, sliderMat);
        buckle.position.set(0, 0.05, 0.14);
        hipsGroup.add(buckle);

        // 2. Legs & Boots (Left & Right)
        [-1, 1].forEach(side => {
            const legGroup = new THREE.Group();

            // Thigh (From hip to knee hugging the Guerrilla tank knee recesses)
            const hipPoint = new THREE.Vector3(side * 0.11, 0.57, -0.16);
            const kneePoint = new THREE.Vector3(side * 0.15, 0.52, 0.04);
            const anklePoint = new THREE.Vector3(side * 0.18, 0.25, -0.06);

            // Muscular Thigh Tube
            const thighCurve = new THREE.CatmullRomCurve3([
                hipPoint,
                new THREE.Vector3(side * 0.14, 0.55, -0.06),
                kneePoint
            ]);
            const thighGeom = new THREE.TubeGeometry(thighCurve, 12, 0.052, 12, false);
            const thigh = new THREE.Mesh(thighGeom, pantsMat);
            thigh.castShadow = true;
            legGroup.add(thigh);

            // Knee Armor Cup
            const kneeArmorGeom = new THREE.SphereGeometry(0.048, 14, 10);
            kneeArmorGeom.scale(0.8, 1.1, 1.2);
            const kneeArmor = new THREE.Mesh(kneeArmorGeom, jacketMat);
            kneeArmor.position.copy(kneePoint);
            kneeArmor.position.z += 0.02;
            legGroup.add(kneeArmor);

            // Electric Cyan Knee Slider Accent (Brava Blue Match)
            const sliderGeom = new THREE.CylinderGeometry(0.022, 0.022, 0.015, 12);
            const slider = new THREE.Mesh(sliderGeom, accentMat);
            slider.position.set(side * 0.175, 0.52, 0.04);
            slider.rotation.z = side * (Math.PI / 2);
            legGroup.add(slider);

            // Shin / Calf Tube (From knee to ankle)
            const shinCurve = new THREE.CatmullRomCurve3([
                kneePoint,
                new THREE.Vector3(side * 0.17, 0.38, -0.01),
                anklePoint
            ]);
            const shinGeom = new THREE.TubeGeometry(shinCurve, 12, 0.044, 12, false);
            const shin = new THREE.Mesh(shinGeom, pantsMat);
            shin.castShadow = true;
            legGroup.add(shin);

            // High-Top Technical Roadster Riding Boot
            const bootGroup = new THREE.Group();
            bootGroup.position.copy(anklePoint);

            // Boot Ankle/Calf Shaft
            const bootShaftGeom = new THREE.CylinderGeometry(0.044, 0.038, 0.12, 12);
            const bootShaft = new THREE.Mesh(bootShaftGeom, bootsMat);
            bootShaft.position.set(0, 0.02, 0);
            bootShaft.rotation.x = -0.25;
            bootGroup.add(bootShaft);

            // Boot Foot / Sole (resting squarely on footpeg at y = 0.22, z = -0.06)
            const footGeom = new THREE.BoxGeometry(0.075, 0.055, 0.16);
            const foot = new THREE.Mesh(footGeom, bootsMat);
            foot.position.set(0, -0.03, 0.04);
            foot.rotation.x = 0.12; // Slight downward toe tilt towards controls
            foot.castShadow = true;
            bootGroup.add(foot);

            // Boot Sole Tread
            const soleGeom = new THREE.BoxGeometry(0.078, 0.012, 0.165);
            const sole = new THREE.Mesh(soleGeom, materials.tireRubber || pantsMat);
            sole.position.set(0, -0.055, 0.04);
            sole.rotation.x = 0.12;
            bootGroup.add(sole);

            // Magnesium Toe Slider
            const toeSliderGeom = new THREE.BoxGeometry(0.02, 0.018, 0.045);
            const toeSlider = new THREE.Mesh(toeSliderGeom, sliderMat);
            toeSlider.position.set(side * 0.042, -0.035, 0.10);
            bootGroup.add(toeSlider);

            legGroup.add(bootGroup);
            riderGroup.add(legGroup);
        });

        riderGroup.add(hipsGroup);

        // 3. Torso & Upper Body Group (Pivots at waist for dynamic tuck and leaning)
        riderTorso = new THREE.Group();
        riderTorso.position.set(0, 0.60, -0.17); // Pivot point at waist
        riderTorso.rotation.x = 0.32; // Natural roadster forward cant (~18°)

        // Main Chest / Ribcage
        const chestGeom = new THREE.CylinderGeometry(0.17, 0.12, 0.32, 16);
        chestGeom.scale(1.22, 1.0, 0.95);
        const chest = new THREE.Mesh(chestGeom, jacketMat);
        chest.position.set(0, 0.16, 0);
        chest.castShadow = true;
        riderTorso.add(chest);

        // Electric Cyan Racing Livery Stripes on Chest & Back
        const stripeGeom = new THREE.BoxGeometry(0.032, 0.31, 0.008);
        [-0.07, 0.07].forEach(sx => {
            // Front stripes
            const fStripe = new THREE.Mesh(stripeGeom, accentMat);
            fStripe.position.set(sx, 0.16, 0.125);
            riderTorso.add(fStripe);

            // Back stripes
            const bStripe = new THREE.Mesh(stripeGeom, accentMat);
            bStripe.position.set(sx, 0.16, -0.125);
            riderTorso.add(bStripe);
        });

        // Center Zipper Track
        const zipGeom = new THREE.BoxGeometry(0.012, 0.30, 0.006);
        const zip = new THREE.Mesh(zipGeom, sliderMat);
        zip.position.set(0, 0.16, 0.128);
        riderTorso.add(zip);

        // Aerodynamic Speed Hump on Upper Back (Track Racing Profile)
        const humpGeom = new THREE.SphereGeometry(0.075, 14, 10);
        humpGeom.scale(0.85, 1.8, 0.65);
        const hump = new THREE.Mesh(humpGeom, jacketMat);
        hump.position.set(0, 0.22, -0.12);
        hump.rotation.x = -0.25;
        riderTorso.add(hump);

        // Broad Shoulder Armor Caps
        [-0.20, 0.20].forEach(sx => {
            const shGeom = new THREE.SphereGeometry(0.065, 14, 10);
            shGeom.scale(1.1, 0.9, 1.0);
            const shoulder = new THREE.Mesh(shGeom, jacketMat);
            shoulder.position.set(sx, 0.28, 0.02);
            riderTorso.add(shoulder);

            // Shoulder Outer Titanium Slider Plate
            const shPlateGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.012, 12);
            const shPlate = new THREE.Mesh(shPlateGeom, accentMat);
            shPlate.position.set(sx + (sx > 0 ? 0.05 : -0.05), 0.28, 0.02);
            shPlate.rotation.z = Math.PI / 2;
            riderTorso.add(shPlate);
        });

        // 4. Head, Neck & Full-Face Helmet
        riderHead = new THREE.Group();
        riderHead.position.set(0, 0.34, 0.04); // Base of neck on torso

        // Neck
        const neckGeom = new THREE.CylinderGeometry(0.052, 0.060, 0.08, 14);
        const neck = new THREE.Mesh(neckGeom, jacketMat);
        neck.position.set(0, 0.03, 0.01);
        neck.rotation.x = -0.15;
        riderHead.add(neck);

        // Full-Face Aerodynamic Helmet Shell
        const helmetShellGeom = new THREE.SphereGeometry(0.125, 24, 20);
        helmetShellGeom.scale(0.96, 1.12, 1.20);
        const helmetShell = new THREE.Mesh(helmetShellGeom, helmetMat);
        helmetShell.position.set(0, 0.14, 0.02);
        helmetShell.castShadow = true;
        riderHead.add(helmetShell);

        // Helmet Chin Guard / Mouth Aperture
        const chinGeom = new THREE.BoxGeometry(0.12, 0.09, 0.13);
        const chin = new THREE.Mesh(chinGeom, helmetMat);
        chin.position.set(0, 0.09, 0.10);
        chin.rotation.x = -0.22;
        riderHead.add(chin);

        // Chin Intake Vent
        const chinVentGeom = new THREE.BoxGeometry(0.055, 0.022, 0.015);
        const chinVent = new THREE.Mesh(chinVentGeom, accentMat);
        chinVent.position.set(0, 0.075, 0.165);
        riderHead.add(chinVent);

        // Top Crown Air Scoops
        [-0.035, 0.035].forEach(vx => {
            const scoopGeom = new THREE.BoxGeometry(0.022, 0.016, 0.08);
            const scoop = new THREE.Mesh(scoopGeom, accentMat);
            scoop.position.set(vx, 0.255, 0.02);
            scoop.rotation.x = 0.15;
            riderHead.add(scoop);
        });

        // Rear Aerodynamic Spoiler / Diffuser
        const spoilerGeom = new THREE.BoxGeometry(0.15, 0.035, 0.06);
        const spoiler = new THREE.Mesh(spoilerGeom, accentMat);
        spoiler.position.set(0, 0.16, -0.12);
        spoiler.rotation.x = -0.35;
        riderHead.add(spoiler);

        // Crown Racing Stripe in Electric Cyan
        const crownStripeGeom = new THREE.BoxGeometry(0.028, 0.015, 0.26);
        const crownStripe = new THREE.Mesh(crownStripeGeom, accentMat);
        crownStripe.position.set(0, 0.252, 0.02);
        riderHead.add(crownStripe);

        // Iridium Cyan Mirrored Chrome Visor
        // Curved cylindrical visor sitting tightly in face aperture
        const visorGeom = new THREE.CylinderGeometry(0.118, 0.118, 0.075, 24, 1, true, -Math.PI * 0.32, Math.PI * 0.64);
        const visor = new THREE.Mesh(visorGeom, visorMat);
        visor.position.set(0, 0.138, 0.035);
        visor.rotation.x = 0.18;
        riderHead.add(visor);

        // Visor Side Pivot Ratchet Screws
        [-0.122, 0.122].forEach(px => {
            const screwGeom = new THREE.CylinderGeometry(0.016, 0.016, 0.012, 12);
            const screw = new THREE.Mesh(screwGeom, sliderMat);
            screw.position.set(px, 0.138, 0.02);
            screw.rotation.z = Math.PI / 2;
            riderHead.add(screw);
        });

        riderTorso.add(riderHead);
        riderGroup.add(riderTorso);

        // 5. Arms & Knuckle-Armored Riding Gloves Gripping Handlebars
        buildRiderArms(riderGroup, jacketMat, accentMat, glovesMat, sliderMat);

        // Mount rider directly onto motorcycle root
        bikeGroup.add(riderGroup);
    }

    // Build Riding Arms Reaching Smoothly to Handlebars
    function buildRiderArms(parentGroup, jacketMat, accentMat, glovesMat, sliderMat) {
        [-1, 1].forEach(side => {
            const armGroup = new THREE.Group();

            const shoulderPt = new THREE.Vector3(side * 0.19, 0.88, 0.11);
            const elbowPt = new THREE.Vector3(side * 0.26, 0.78, 0.23);
            const wristPt = new THREE.Vector3(side * 0.29, 0.812, 0.375);

            // Upper arm bicep sleeve
            const bicepCurve = new THREE.CatmullRomCurve3([
                shoulderPt,
                new THREE.Vector3(side * 0.23, 0.83, 0.17),
                elbowPt
            ]);
            const bicepGeom = new THREE.TubeGeometry(bicepCurve, 12, 0.045, 12, false);
            const bicep = new THREE.Mesh(bicepGeom, jacketMat);
            bicep.castShadow = true;
            armGroup.add(bicep);

            // Bicep Cyan Accent Stripe
            const armStripeCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(side * 0.21, 0.89, 0.11),
                new THREE.Vector3(side * 0.25, 0.83, 0.18),
                new THREE.Vector3(side * 0.28, 0.78, 0.23)
            ]);
            const armStripeGeom = new THREE.TubeGeometry(armStripeCurve, 10, 0.010, 8, false);
            const armStripe = new THREE.Mesh(armStripeGeom, accentMat);
            armGroup.add(armStripe);

            // Elbow Armor Slider Cup
            const elbowGeom = new THREE.SphereGeometry(0.042, 12, 10);
            elbowGeom.scale(0.9, 0.9, 1.2);
            const elbow = new THREE.Mesh(elbowGeom, jacketMat);
            elbow.position.copy(elbowPt);
            elbow.position.y -= 0.01;
            armGroup.add(elbow);

            // Elbow Slider Titanium Puck
            const elbowPuckGeom = new THREE.CylinderGeometry(0.022, 0.022, 0.012, 12);
            const elbowPuck = new THREE.Mesh(elbowPuckGeom, sliderMat);
            elbowPuck.position.set(side * 0.28, 0.77, 0.23);
            elbowPuck.rotation.z = side * (Math.PI / 2);
            armGroup.add(elbowPuck);

            // Forearm sleeve
            const forearmCurve = new THREE.CatmullRomCurve3([
                elbowPt,
                new THREE.Vector3(side * 0.28, 0.80, 0.31),
                wristPt
            ]);
            const forearmGeom = new THREE.TubeGeometry(forearmCurve, 12, 0.038, 12, false);
            const forearm = new THREE.Mesh(forearmGeom, jacketMat);
            forearm.castShadow = true;
            armGroup.add(forearm);

            // Gauntlet Glove Wrist Cuff
            const cuffGeom = new THREE.CylinderGeometry(0.042, 0.038, 0.06, 14);
            const cuff = new THREE.Mesh(cuffGeom, glovesMat);
            cuff.position.copy(wristPt);
            cuff.rotation.x = Math.PI / 2 - 0.2;
            armGroup.add(cuff);

            // Glove Knuckle Armor Shell & Clenched Hand
            const handGroup = new THREE.Group();
            handGroup.position.set(side * 0.29, 0.812, 0.392);

            // Clenched Hand Palm / Body
            const palmGeom = new THREE.BoxGeometry(0.065, 0.050, 0.085);
            const palm = new THREE.Mesh(palmGeom, glovesMat);
            palm.rotation.z = side * -0.15;
            handGroup.add(palm);

            // Molded Carbon Knuckle Guard
            const knuckleGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.062, 12);
            const knuckle = new THREE.Mesh(knuckleGeom, accentMat);
            knuckle.position.set(0, 0.026, 0.01);
            knuckle.rotation.z = Math.PI / 2;
            handGroup.add(knuckle);

            // Fingers curling around the handlebar grip
            const fingersGeom = new THREE.CylinderGeometry(0.024, 0.024, 0.075, 12);
            const fingers = new THREE.Mesh(fingersGeom, glovesMat);
            fingers.position.set(0, -0.012, 0.015);
            fingers.rotation.z = Math.PI / 2;
            handGroup.add(fingers);

            // Thumb wrapped underneath
            const thumbGeom = new THREE.CylinderGeometry(0.010, 0.010, 0.035, 8);
            const thumb = new THREE.Mesh(thumbGeom, glovesMat);
            thumb.position.set(side * -0.025, -0.022, -0.015);
            thumb.rotation.y = side * 0.6;
            handGroup.add(thumb);

            // Index/Middle Finger Levers Gesture:
            // Left hand: two fingers resting over clutch lever
            // Right hand: two fingers covering front brake lever
            const leverFingerGeom = new THREE.BoxGeometry(0.016, 0.012, 0.055);
            const leverFinger = new THREE.Mesh(leverFingerGeom, glovesMat);
            leverFinger.position.set(side * 0.012, 0.005, 0.045);
            leverFinger.rotation.x = -0.18;
            handGroup.add(leverFinger);

            armGroup.add(handGroup);
            parentGroup.add(armGroup);
        });
    }

    // 4. Procedural Single-Cylinder Exhaust Audio Synthesizer (Sherpa 450)
    function initAudio() {
        if (isAudioActive && audioCtx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            audioCtx = new AudioContext();

            // Lowpass resonant filter (tuned to motorcycle exhaust cylinder acoustics)
            engineFilter = audioCtx.createBiquadFilter();
            engineFilter.type = 'lowpass';
            engineFilter.frequency.value = 280;
            engineFilter.Q.value = 3.5;

            // Primary cylinder firing pulse oscillator
            engineOsc = audioCtx.createOscillator();
            engineOsc.type = 'sawtooth';
            engineOsc.frequency.value = 24; // Idle firing rate (~1400 RPM)

            // Sub-bass exhaust thump oscillator
            engineSubOsc = audioCtx.createOscillator();
            engineSubOsc.type = 'triangle';
            engineSubOsc.frequency.value = 48;

            engineGain = audioCtx.createGain();
            engineGain.gain.value = 0.08;

            engineOsc.connect(engineFilter);
            engineSubOsc.connect(engineFilter);
            engineFilter.connect(engineGain);
            engineGain.connect(audioCtx.destination);

            engineOsc.start();
            engineSubOsc.start();
            isAudioActive = true;
        } catch (e) {
            console.warn('[RE_TestDrive] Audio init skipped:', e);
        }
    }

    // Update procedural audio pitch & volume based on driving physics
    function updateAudio(currentRpm, currentSpeed, isAcceling) {
        if (!isAudioActive || !audioCtx) return;
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const now = audioCtx.currentTime;
        // Sherpa 450 4-stroke single fires every 2 crankshaft revolutions:
        // Firing rate (Hz) = (RPM / 60) * 0.5
        const firingFreq = Math.max(16, (currentRpm / 60) * 0.5);
        engineOsc.frequency.setTargetAtTime(firingFreq * 2.2, now, 0.06);
        engineSubOsc.frequency.setTargetAtTime(firingFreq * 1.1, now, 0.06);

        // Exhaust note filter opens as throttle increases
        const targetCutoff = 220 + (currentRpm / 8500) * 850 + (isAcceling ? 350 : 0);
        engineFilter.frequency.setTargetAtTime(targetCutoff, now, 0.08);

        // Volume increases with speed and acceleration
        const targetVol = 0.06 + (currentSpeed / 140) * 0.12 + (isAcceling ? 0.06 : 0);
        engineGain.gain.setTargetAtTime(targetVol, now, 0.06);
    }

    function stopAudio() {
        if (engineGain && audioCtx) {
            engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
        }
    }

    // Auto-Drive AI Pilot Toggle & HUD Synchronization
    function toggleAutoDrive() {
        isAutoDrive = !isAutoDrive;
        autoDriveTimer = 0.0;
        updateAutoDriveUI();
    }

    function updateAutoDriveUI() {
        const btn = document.getElementById('auto-drive-btn');
        const label = document.getElementById('auto-label');
        if (btn) {
            if (isAutoDrive) {
                btn.classList.add('active');
                if (label) label.innerText = 'AUTO CRUISE: ON';
            } else {
                btn.classList.remove('active');
                if (label) label.innerText = 'AUTO CRUISE';
            }
        }
    }

    // Toggle 360-Degree Continuous Panoramic Auto-Orbit
    function toggleAutoOrbit() {
        if (cameraMode === 'cockpit') {
            cameraMode = 'chase';
            const camLabel = document.getElementById('cam-label');
            if (camLabel) camLabel.innerText = 'CHASE CAM';
            if (riderGroup) riderGroup.visible = true;
        }
        isAutoOrbit = !isAutoOrbit;
        updateOrbitUI();
    }

    function updateOrbitUI() {
        const btn = document.getElementById('drive-360-btn');
        const label = document.getElementById('orbit-label');
        if (btn) {
            if (isAutoOrbit) {
                btn.classList.add('active');
                if (label) label.innerText = '360° AUTO: ON';
            } else {
                btn.classList.remove('active');
                if (label) label.innerText = '360° ORBIT';
            }
        }
    }

    function resetOrbit() {
        targetOrbitH = 0.0;
        targetOrbitV = 0.22;
        targetOrbitDist = 3.35;
        isAutoOrbit = false;
        updateOrbitUI();
    }

    // 5. Setup Keyboard and On-Screen Touch/Click Handlers
    function setupInputHandlers() {
        window.addEventListener('keydown', (e) => {
            if (!isActive) {
                if (e.key === 't' || e.key === 'T') {
                    startTestDrive();
                }
                return;
            }

            if (e.key === 'z' || e.key === 'Z') {
                toggleAutoDrive();
                return;
            }

            if (e.key === 'x' || e.key === 'X') {
                toggleAutoOrbit();
                return;
            }

            if (e.key === 'r' || e.key === 'R') {
                resetOrbit();
                return;
            }

            // Manual inputs disengage Auto Cruise
            if (isAutoDrive && (e.key === 'w' || e.key === 'W' || e.key === 's' || e.key === 'S' || e.key === 'a' || e.key === 'A' || e.key === 'd' || e.key === 'D' || e.key.startsWith('Arrow') || e.key === ' ')) {
                isAutoDrive = false;
                updateAutoDriveUI();
            }

            if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
                keys.forward = true;
            } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
                keys.backward = true;
            } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
                keys.left = true;
            } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
                keys.right = true;
            } else if (e.key === ' ') {
                keys.brake = true;
            } else if (e.key === 'c' || e.key === 'C') {
                toggleCamera();
            } else if (e.key === 'Escape') {
                stopTestDrive();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (!isActive) return;
            if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
                keys.forward = false;
            } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
                keys.backward = false;
            } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
                keys.left = false;
            } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
                keys.right = false;
            } else if (e.key === ' ') {
                keys.brake = false;
            }
        });

        // Test Drive Triggers in Showroom HUD
        const testDriveBtn = document.getElementById('test-drive-btn');
        if (testDriveBtn) {
            testDriveBtn.addEventListener('click', toggleTestDrive);
        }

        const heroDriveBtn = document.getElementById('hero-drive-btn');
        if (heroDriveBtn) {
            heroDriveBtn.addEventListener('click', startTestDrive);
        }

        // Test Drive Cockpit Overlay Buttons
        const exitBtn = document.getElementById('exit-drive-btn');
        if (exitBtn) {
            exitBtn.addEventListener('click', stopTestDrive);
        }

        const camBtn = document.getElementById('drive-cam-btn');
        if (camBtn) {
            camBtn.addEventListener('click', toggleCamera);
        }

        const autoBtn = document.getElementById('auto-drive-btn');
        if (autoBtn) {
            autoBtn.addEventListener('click', toggleAutoDrive);
        }

        const orbitBtn = document.getElementById('drive-360-btn');
        if (orbitBtn) {
            orbitBtn.addEventListener('click', toggleAutoOrbit);
        }

        // 360-Degree Mouse & Touch Orbit Drag Interaction
        window.addEventListener('pointerdown', (e) => {
            if (!isActive) return;
            // Ignore clicks on HUD buttons & controls
            if (e.target.closest && (e.target.closest('.drive-btn') || e.target.closest('.drive-ctrl-btn') || e.target.closest('.hud-btn') || e.target.closest('.color-swatch'))) return;
            isOrbitDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            // Pause auto orbit when user grabs manual control
            if (isAutoOrbit) {
                isAutoOrbit = false;
                updateOrbitUI();
            }
        });

        window.addEventListener('pointermove', (e) => {
            if (!isActive || !isOrbitDragging || cameraMode === 'cockpit') return;
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;

            // 360-degree horizontal yaw rotation
            targetOrbitH -= dx * 0.0065;

            // Vertical pitch (road-level to high overview)
            targetOrbitV += dy * 0.0045;
            targetOrbitV = Math.max(-0.02, Math.min(0.72, targetOrbitV));

            dragStartX = e.clientX;
            dragStartY = e.clientY;
        });

        window.addEventListener('pointerup', () => {
            isOrbitDragging = false;
        });

        // Mouse wheel distance zoom in/out (1.8m to 6.5m)
        window.addEventListener('wheel', (e) => {
            if (!isActive || cameraMode === 'cockpit') return;
            targetOrbitDist += e.deltaY * 0.0028;
            targetOrbitDist = Math.max(1.8, Math.min(6.5, targetOrbitDist));
        }, { passive: true });

        // Double click resets orbit back directly behind motorcycle
        window.addEventListener('dblclick', (e) => {
            if (!isActive) return;
            if (e.target.closest && (e.target.closest('.drive-btn') || e.target.closest('.drive-ctrl-btn'))) return;
            resetOrbit();
        });

        // On-screen Drive Pedal Buttons (Touch & Mouse hold)
        bindPedalButton('btn-accel', () => {
            if (isAutoDrive) { isAutoDrive = false; updateAutoDriveUI(); }
            keys.forward = true;
        }, () => keys.forward = false);

        bindPedalButton('btn-brake', () => {
            if (isAutoDrive) { isAutoDrive = false; updateAutoDriveUI(); }
            keys.backward = true;
        }, () => keys.backward = false);

        bindPedalButton('btn-steer-left', () => {
            if (isAutoDrive) { isAutoDrive = false; updateAutoDriveUI(); }
            keys.left = true;
        }, () => keys.left = false);

        bindPedalButton('btn-steer-right', () => {
            if (isAutoDrive) { isAutoDrive = false; updateAutoDriveUI(); }
            keys.right = true;
        }, () => keys.right = false);
    }

    function bindPedalButton(btnId, onDown, onUp) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        ['mousedown', 'touchstart'].forEach(evt => {
            btn.addEventListener(evt, (e) => {
                e.preventDefault();
                onDown();
            }, { passive: false });
        });
        ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(evt => {
            btn.addEventListener(evt, (e) => {
                e.preventDefault();
                onUp();
            }, { passive: false });
        });
    }

    function toggleCamera() {
        cameraMode = (cameraMode === 'chase') ? 'cockpit' : 'chase';
        const label = document.getElementById('cam-label');
        if (label) {
            label.innerText = (cameraMode === 'chase') ? 'CHASE CAM' : 'COCKPIT';
        }
        if (cameraMode === 'cockpit') {
            isAutoOrbit = false;
            updateOrbitUI();
        }
        if (riderGroup) {
            riderGroup.visible = (cameraMode === 'chase');
        }
    }

    // Toggle Test Drive
    function toggleTestDrive() {
        if (isActive) stopTestDrive();
        else startTestDrive();
    }

    // Enter Test Drive Mode
    function startTestDrive() {
        if (isActive) return;
        isActive = true;

        // Reset motorcycle to 100% normal assembled state
        if (window.RE_BikeModel) {
            window.RE_BikeModel.updateDeconstruction(0, 0);
        }

        // Realign bike to face straight forward down the highway (+Z)
        if (bikeGroup) {
            bikeGroup.rotation.set(0, 0, 0);
            bikeGroup.position.set(0, 0, 0);
        }

        // Mount Human Rider on the motorcycle in Chase Cam
        if (riderGroup) {
            riderGroup.visible = (cameraMode === 'chase');
        }

        // Reset Auto Drive & 360 Orbit
        isAutoDrive = false;
        updateAutoDriveUI();
        orbitAngleH = 0.0;
        targetOrbitH = 0.0;
        orbitAngleV = 0.22;
        targetOrbitV = 0.22;
        orbitDistance = 3.35;
        targetOrbitDist = 3.35;
        isAutoOrbit = false;
        updateOrbitUI();

        // Hide showroom floor grid and modular tethers
        const showroomFloor = scene.getObjectByName('Turntable_Floor');
        if (showroomFloor) showroomFloor.visible = false;

        const modularGrid = scene.getObjectByName('ModularGrid_Root');
        if (modularGrid) modularGrid.visible = false;

        // Show Highway, Speed Streaks, and Headlight Beam
        if (highwayGroup) highwayGroup.visible = true;
        if (speedStreaks) speedStreaks.visible = true;
        if (headlightBeam) headlightBeam.intensity = 4.2;
        if (taillightGlow) taillightGlow.intensity = 0.8;

        // Show Cockpit HUD Overlay
        const overlay = document.getElementById('test-drive-overlay');
        if (overlay) overlay.classList.remove('hidden');

        // Hide showroom HUD layer & narrative cards
        const hudLayer = document.querySelector('.hud-layer');
        if (hudLayer) hudLayer.style.display = 'none';

        const heroSection = document.getElementById('section-1');
        if (heroSection) heroSection.style.opacity = '0';
        const scrollTrack = document.getElementById('scroll-track');
        if (scrollTrack) scrollTrack.style.opacity = '0';
        const showcaseSec = document.getElementById('section-3');
        if (showcaseSec) showcaseSec.style.opacity = '0';

        // Update HUD Header Button State
        const btn = document.getElementById('test-drive-btn');
        if (btn) btn.classList.add('active');

        // Initialize Audio
        initAudio();

        // Initial speed kick so the bike starts rolling immediately
        targetSpeed = 35.0;
        speed = 20.0;
    }

    // Exit Test Drive Mode
    function stopTestDrive() {
        if (!isActive) return;
        isActive = false;

        // Hide Human Rider when returning to Showroom exploded deconstruction
        if (riderGroup) {
            riderGroup.visible = false;
        }

        // Reset Auto Drive & 360 Orbit
        isAutoDrive = false;
        updateAutoDriveUI();
        isAutoOrbit = false;
        updateOrbitUI();

        // Stop Audio
        stopAudio();

        // Hide Highway and FX
        if (highwayGroup) highwayGroup.visible = false;
        if (speedStreaks) speedStreaks.visible = false;
        if (headlightBeam) headlightBeam.intensity = 0;
        if (taillightGlow) taillightGlow.intensity = 0;

        // Restore Showroom Turntable Floor
        const showroomFloor = scene.getObjectByName('Turntable_Floor');
        if (showroomFloor) showroomFloor.visible = true;

        // Hide Cockpit HUD Overlay
        const overlay = document.getElementById('test-drive-overlay');
        if (overlay) overlay.classList.add('hidden');

        // Restore showroom HUD layer & narrative cards
        const hudLayer = document.querySelector('.hud-layer');
        if (hudLayer) hudLayer.style.display = '';

        const heroSection = document.getElementById('section-1');
        if (heroSection) heroSection.style.opacity = '1';
        const scrollTrack = document.getElementById('scroll-track');
        if (scrollTrack) scrollTrack.style.opacity = '1';
        const showcaseSec = document.getElementById('section-3');
        if (showcaseSec) showcaseSec.style.opacity = '1';

        // Restore HUD Header Button State
        const btn = document.getElementById('test-drive-btn');
        if (btn) btn.classList.remove('active');

        // Reset bike orientation and position
        if (bikeGroup) {
            bikeGroup.position.set(0, 0, 0);
            bikeGroup.rotation.set(0, -0.52, 0); // Front 3/4 showroom angle
        }

        // Reset speeds
        speed = 0;
        targetSpeed = 0;
        steer = 0;
        lateralPos = 0;
        bikeRoll = 0;

        // Reset camera FOV
        if (camera) {
            camera.fov = 45;
            camera.updateProjectionMatrix();
        }
    }

    // Main Simulation Step (called inside render loop when isActive)
    function update(deltaTime) {
        if (!isActive) return;
        const dt = Math.min(0.1, Math.max(0.001, deltaTime));

        // 1. Process Throttle & Braking Input (with Auto-Drive AI Pilot)
        let isAcceling = keys.forward;
        let targetSteer = 0;

        if (isAutoDrive) {
            autoDriveTimer += dt;
            // Autonomous highway cruising: smooth acceleration, gear shifts, high speed
            targetSpeed = 126.0 + Math.sin(autoDriveTimer * 0.45) * 12.0;
            throttle = Math.min(1.0, throttle + dt * 2.5);
            brake = 0.0;
            isAcceling = true;

            // Autonomous lane weaving across highway lanes with authentic roadster transitions
            const targetLaneX = Math.sin(autoDriveTimer * 0.72) * 2.1 + Math.sin(autoDriveTimer * 0.28) * 0.8;
            const laneError = targetLaneX - lateralPos;
            targetSteer = Math.max(-1.0, Math.min(1.0, laneError * 0.85));
        } else {
            if (keys.forward) {
                throttle = Math.min(1.0, throttle + dt * 2.8);
                targetSpeed = 142.0; // Max speed in km/h
            } else {
                throttle = Math.max(0.0, throttle - dt * 2.0);
                if (!keys.backward && !keys.brake) {
                    targetSpeed = Math.max(15.0, targetSpeed - dt * 14.0); // Coasting drag
                }
            }

            if (keys.backward || keys.brake) {
                brake = Math.min(1.0, brake + dt * 4.0);
                targetSpeed = 0.0;
            } else {
                brake = Math.max(0.0, brake - dt * 3.5);
            }

            if (keys.left) targetSteer -= 1.0;
            if (keys.right) targetSteer += 1.0;
        }

        // Smooth speed acceleration & deceleration
        const accelRate = keys.backward ? 35.0 : (isAcceling ? 26.0 : 12.0);
        speed += (targetSpeed - speed) * Math.min(1.0, dt * (accelRate / 10));
        speed = Math.max(0.0, Math.min(145.0, speed));

        // 2. Realistic Sherpa 450 Transmission Gear & RPM Calculation
        if (speed < 1.0) {
            currentGear = 'N';
            rpm = 1400.0 + throttle * 1200.0; // Revving in neutral
        } else if (speed < 30.0) {
            currentGear = '1';
            rpm = 2500 + (speed / 30.0) * 5500;
        } else if (speed < 55.0) {
            currentGear = '2';
            rpm = 3000 + ((speed - 30.0) / 25.0) * 5200;
        } else if (speed < 80.0) {
            currentGear = '3';
            rpm = 3500 + ((speed - 55.0) / 25.0) * 4800;
        } else if (speed < 105.0) {
            currentGear = '4';
            rpm = 4000 + ((speed - 80.0) / 25.0) * 4400;
        } else if (speed < 125.0) {
            currentGear = '5';
            rpm = 4500 + ((speed - 105.0) / 20.0) * 3800;
        } else {
            currentGear = '6';
            rpm = 5000 + ((speed - 125.0) / 20.0) * 3500;
        }
        rpm = Math.min(8800.0, Math.max(1400.0, rpm));

        // Update Audio Engine
        updateAudio(rpm, speed, isAcceling);

        // 3. Steering & Dynamic Leaning Physics
        steer += (targetSteer - steer) * Math.min(1.0, dt * 8.0);

        // Lateral lane displacement
        const speedFactor = Math.min(1.0, speed / 35.0);
        lateralPos += steer * dt * (3.8 * speedFactor);
        lateralPos = Math.max(-3.5, Math.min(3.5, lateralPos));

        // Dynamic Motorcycle Roll (Leaning into turn)
        // Up to ~22° (0.38 rad) lean at speed
        const targetRoll = -steer * 0.38 * speedFactor;
        bikeRoll += (targetRoll - bikeRoll) * Math.min(1.0, dt * 6.5);

        // Acceleration squat / Braking dive
        const targetPitch = (throttle * 0.025) - (brake * 0.035);
        bikePitch += (targetPitch - bikePitch) * Math.min(1.0, dt * 8.0);

        // 4. Apply Transforms to Motorcycle
        if (bikeGroup) {
            bikeGroup.position.x = lateralPos;
            bikeGroup.position.y = Math.sin(Date.now() * 0.015) * 0.003; // Micro road flutter
            bikeGroup.position.z = 0;

            bikeGroup.rotation.z = bikeRoll;   // Leaning roll
            bikeGroup.rotation.x = bikePitch;  // Squat / Dive
            bikeGroup.rotation.y = steer * 0.08; // Steering heading angle
        }

        // 4B. Dynamic Articulation of Human Rider Model (Man / Biker)
        if (riderGroup && riderGroup.visible) {
            const tuckFactor = Math.min(1.0, speed / 115.0);

            // Upper Body / Torso
            if (riderTorso) {
                // High-speed aerodynamic tuck down over tank (crouches lower as speed increases)
                riderTorso.rotation.x = 0.30 + tuckFactor * 0.20;

                // Dynamic body hang-off into apex of curve (rider body leans into corner)
                const hangOffRoll = -steer * 0.20 * speedFactor;
                riderTorso.rotation.z = hangOffRoll;

                // Engine heartbeat vibration flutter
                const engineFlutter = Math.sin(Date.now() * 0.02) * 0.0012 * (rpm / 3500);
                riderTorso.position.y = 0.60 + engineFlutter;
            }

            // Head and Full-Face Helmet
            if (riderHead) {
                // Counter-pitch so eyes look level forward down the highway while crouching
                riderHead.rotation.x = -tuckFactor * 0.16;

                // Head turns smoothly into the corner apex
                riderHead.rotation.y = steer * 0.25;
                riderHead.rotation.z = -steer * 0.08;
            }
        }

        // Steer front fork & handlebars into corner
        if (modules && modules.handlebars && modules.handlebars.group) {
            modules.handlebars.group.rotation.y = steer * 0.14;
        }

        // 5. High-Speed Wheel Spin Animation
        // Wheel outer radius is 0.335m. Angular velocity omega = v / r.
        const speedMps = (speed * 1000) / 3600;
        const spinDelta = (speedMps / 0.335) * dt;
        wheelRotation += spinDelta;

        if (modules) {
            // Front Wheel Spin
            if (modules.frontWheel && modules.frontWheel.group) {
                const fwMesh = modules.frontWheel.group.children[0];
                if (fwMesh) {
                    // Wheel lies in YZ plane with axle along X
                    fwMesh.rotation.x = wheelRotation;
                }
            }
            // Rear Wheel Spin
            if (modules.rearWheel && modules.rearWheel.group) {
                const rwMesh = modules.rearWheel.group.children[0];
                if (rwMesh) {
                    rwMesh.rotation.x = wheelRotation;
                }
            }
        }

        // 6. Infinite Highway Scrolling
        if (roadTexture) {
            roadTexture.offset.y -= (speed / 140.0) * dt * 5.5;
        }

        // Roadside Beacons Scrolling
        const beaconSpeed = (speed / 140.0) * dt * 45.0;
        roadsideBeacons.forEach(b => {
            b.beacon.position.z -= beaconSpeed;
            b.topGlow.position.z -= beaconSpeed;
            if (b.beacon.position.z < -15) {
                b.beacon.position.z += 140;
                b.topGlow.position.z += 140;
            }
        });

        // 7. Speed Warp Streaks Animation
        if (speedStreaks && streakPositions) {
            const pos = speedStreaks.geometry.attributes.position.array;
            const streakSpeed = Math.max(0.5, (speed / 140.0) * 75.0) * dt;
            const tailLen = 0.4 + (speed / 140.0) * 2.8;

            for (let i = 0; i < streakCount; i++) {
                const idx = i * 6;
                pos[idx + 2] -= streakSpeed;
                pos[idx + 5] = pos[idx + 2] - tailLen;

                if (pos[idx + 2] < -10) {
                    pos[idx + 2] += 55.0;
                    pos[idx + 5] = pos[idx + 2] - tailLen;
                    pos[idx] = (Math.random() - 0.5) * 12.0;
                    pos[idx + 3] = pos[idx];
                }
            }
            speedStreaks.geometry.attributes.position.needsUpdate = true;
        }

        // 8. Dynamic Lighting Updates
        if (headlightBeam) {
            headlightBeam.position.set(lateralPos, 0.72, 0.55);
            headlightBeam.target.position.set(lateralPos + steer * 1.5, 0.1, 16);
        }

        if (taillightGlow) {
            taillightGlow.position.set(lateralPos, 0.52, -0.62);
            taillightGlow.intensity = brake > 0.05 ? 3.5 : 0.8;
            taillightGlow.color.setHex(brake > 0.05 ? 0xff0022 : 0xaa1122);
        }

        // 9. Dynamic Driving Camera System with Full 360-Degree Orbit
        if (cameraMode === 'chase' || cameraMode === 'orbit') {
            if (isAutoOrbit) {
                targetOrbitH += dt * 0.45; // Smooth continuous 360° panoramic rotation
            }

            // Damping towards target orbit angles
            orbitAngleH += (targetOrbitH - orbitAngleH) * Math.min(1.0, dt * 9.0);
            orbitAngleV += (targetOrbitV - orbitAngleV) * Math.min(1.0, dt * 9.0);
            orbitDistance += (targetOrbitDist - orbitDistance) * Math.min(1.0, dt * 8.0);

            // Center of focus: the motorcycle and rider
            const focusX = lateralPos;
            const focusY = 0.68 + bikePitch * 0.4;
            const focusZ = 0.0;

            const cosV = Math.cos(orbitAngleV);
            const sinV = Math.sin(orbitAngleV);
            const sinH = Math.sin(orbitAngleH);
            const cosH = Math.cos(orbitAngleH);

            const camX = focusX + sinH * cosV * orbitDistance - Math.sin(bikeRoll) * 0.35 * cosH;
            const camY = Math.max(0.22, focusY + sinV * orbitDistance + (speed / 140.0) * 0.12);
            const camZ = focusZ - cosH * cosV * orbitDistance;

            camera.position.x += (camX - camera.position.x) * Math.min(1.0, dt * 10.0);
            camera.position.y += (camY - camera.position.y) * Math.min(1.0, dt * 10.0);
            camera.position.z += (camZ - camera.position.z) * Math.min(1.0, dt * 10.0);

            // Dynamic FOV speed-warp effect
            if (camera.fov) {
                camera.fov = 46 + (speed / 140.0) * 6.0;
                camera.updateProjectionMatrix();
            }

            // Lead target ahead along viewing azimuth
            const lookLeadZ = cosH * 1.5;
            const lookLeadX = (steer * 0.6) * cosH;
            camera.lookAt(focusX + lookLeadX, focusY + 0.05, focusZ + lookLeadZ);
        } else {
            // First-Person Cockpit View (Eye level right above saddle looking over bars & TFT)
            if (camera.fov) {
                camera.fov = 48;
                camera.updateProjectionMatrix();
            }
            camera.position.set(lateralPos, 0.96 + bikePitch * 0.4, -0.16);
            camera.rotation.set(0, 0, bikeRoll * 0.4);
            camera.lookAt(lateralPos + steer * 0.9, 0.84, 8.0);
        }

        // 10. Update On-Screen Cockpit HUD Instruments
        updateCockpitHUD();
    }

    // Update Cockpit HUD Elements
    function updateCockpitHUD() {
        const speedDisp = document.getElementById('speed-display');
        if (speedDisp) {
            speedDisp.innerText = Math.round(speed).toString();
        }

        const gearDisp = document.getElementById('gear-display');
        if (gearDisp) {
            gearDisp.innerText = currentGear;
        }

        const rpmDisp = document.getElementById('rpm-display');
        if (rpmDisp) {
            rpmDisp.innerText = Math.round(rpm).toString();
        }

        const tachBar = document.getElementById('tach-bar');
        if (tachBar) {
            const rpmPct = Math.min(100, Math.max(0, ((rpm - 1400) / (8500 - 1400)) * 100));
            tachBar.style.width = `${rpmPct.toFixed(1)}%`;
            tachBar.style.background = rpm > 7800 ? '#ff3366' : (rpm > 6000 ? '#f59e0b' : '#00e5ff');
        }

        const leanMeter = document.getElementById('lean-meter');
        if (leanMeter) {
            const leanDeg = Math.round(Math.abs(bikeRoll) * (180 / Math.PI));
            const dir = bikeRoll > 0.03 ? 'L' : (bikeRoll < -0.03 ? 'R' : 'C');
            leanMeter.innerText = dir === 'C' ? '0° C' : `${leanDeg}° ${dir}`;
        }

        const leanInd = document.getElementById('lean-indicator');
        if (leanInd) {
            // -100% to +100%
            const rollPct = (-bikeRoll / 0.38) * 50;
            leanInd.style.transform = `translateX(${rollPct.toFixed(1)}px)`;
        }

        const thrFill = document.getElementById('thr-meter-fill');
        if (thrFill) {
            thrFill.style.height = `${(throttle * 100).toFixed(0)}%`;
        }

        const brkFill = document.getElementById('brk-meter-fill');
        if (brkFill) {
            brkFill.style.height = `${(brake * 100).toFixed(0)}%`;
        }
    }

    return {
        init,
        startTestDrive,
        stopTestDrive,
        toggleTestDrive,
        toggleCamera,
        toggleAutoOrbit,
        resetOrbit,
        update,
        isActive: () => isActive
    };
})();
