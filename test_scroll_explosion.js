const { spawn } = require('child_process');
const fs = require('fs');

async function main() {
    const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
        '--headless=new',
        '--remote-debugging-port=9230',
        '--no-sandbox',
        '--disable-gpu',
        '--window-size=1920,1080',
        'http://localhost:8080/'
    ]);

    await new Promise(r => setTimeout(r, 2000));
    const res = await fetch('http://127.0.0.1:9230/json/list');
    const list = await res.json();
    const tab = list.find(t => t.url && t.url.includes('localhost:8080'));

    if (!tab) {
        console.error('Target tab not found');
        chrome.kill();
        process.exit(1);
    }

    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    let id = 1;
    function send(method, params = {}) {
        return new Promise((resolve) => {
            const msgId = id++;
            const handler = (e) => {
                const msg = JSON.parse(e.data);
                if (msg.id === msgId) {
                    ws.removeEventListener('message', handler);
                    resolve(msg.result);
                }
            };
            ws.addEventListener('message', handler);
            ws.send(JSON.stringify({ id: msgId, method, params }));
        });
    }

    ws.onopen = async () => {
        await send('Page.enable');
        await send('Runtime.enable');

        await new Promise(r => setTimeout(r, 1200));

        // 1. Check Initial State at 0% Scroll
        const state0 = await send('Runtime.evaluate', {
            expression: `({
                status: document.getElementById('system-status')?.innerText,
                telemetry: document.getElementById('telemetry-val')?.innerText,
                stage: document.getElementById('current-stage-tag')?.innerText,
                frontWheelPos: window.RE_BikeModel.getModules().frontWheel.group.position,
                fuelTankPos: window.RE_BikeModel.getModules().fuelTank.group.position,
                enginePos: window.RE_BikeModel.getModules().engine.group.position
            })`,
            returnByValue: true
        });
        console.log('--- 1. INITIAL 0% SCROLL STATE ---');
        console.log(JSON.stringify(state0.result?.value, null, 2));

        // Capture screenshot of completely normal assembled motorcycle
        const snap0 = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync('showroom_assembled.png', Buffer.from(snap0.data, 'base64'));
        console.log('Saved showroom_assembled.png');

        // 2. Scroll to 50%
        await send('Runtime.evaluate', {
            expression: `(function() {
                const track = document.getElementById('scroll-track');
                const scrollTarget = track.offsetTop + (track.offsetHeight - window.innerHeight) * 0.5;
                window.scrollTo({ top: scrollTarget, behavior: 'instant' });
            })()`
        });

        await new Promise(r => setTimeout(r, 600));

        const state50 = await send('Runtime.evaluate', {
            expression: `({
                status: document.getElementById('system-status')?.innerText,
                telemetry: document.getElementById('telemetry-val')?.innerText,
                stage: document.getElementById('current-stage-tag')?.innerText,
                frontWheelPos: window.RE_BikeModel.getModules().frontWheel.group.position,
                fuelTankPos: window.RE_BikeModel.getModules().fuelTank.group.position,
                enginePos: window.RE_BikeModel.getModules().engine.group.position
            })`,
            returnByValue: true
        });
        console.log('--- 2. PARTIALLY EXPLODED 50% SCROLL STATE ---');
        console.log(JSON.stringify(state50.result?.value, null, 2));

        // 3. Scroll to 100% (Fully Exploded)
        await send('Runtime.evaluate', {
            expression: `(function() {
                const track = document.getElementById('scroll-track');
                const scrollTarget = track.offsetTop + (track.offsetHeight - window.innerHeight);
                window.scrollTo({ top: scrollTarget, behavior: 'instant' });
            })()`
        });

        await new Promise(r => setTimeout(r, 600));

        const state100 = await send('Runtime.evaluate', {
            expression: `({
                status: document.getElementById('system-status')?.innerText,
                telemetry: document.getElementById('telemetry-val')?.innerText,
                stage: document.getElementById('current-stage-tag')?.innerText,
                frontWheelPos: window.RE_BikeModel.getModules().frontWheel.group.position,
                fuelTankPos: window.RE_BikeModel.getModules().fuelTank.group.position,
                enginePos: window.RE_BikeModel.getModules().engine.group.position
            })`,
            returnByValue: true
        });
        console.log('--- 3. FULLY EXPLODED 100% SCROLL STATE ---');
        console.log(JSON.stringify(state100.result?.value, null, 2));

        const snap100 = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync('fully_exploded.png', Buffer.from(snap100.data, 'base64'));
        console.log('Saved fully_exploded.png');

        // 4. Scroll back UP to 0%
        await send('Runtime.evaluate', {
            expression: `window.scrollTo({ top: 0, behavior: 'instant' })`
        });

        await new Promise(r => setTimeout(r, 800));

        const stateReset = await send('Runtime.evaluate', {
            expression: `({
                status: document.getElementById('system-status')?.innerText,
                telemetry: document.getElementById('telemetry-val')?.innerText,
                stage: document.getElementById('current-stage-tag')?.innerText,
                frontWheelPos: window.RE_BikeModel.getModules().frontWheel.group.position,
                fuelTankPos: window.RE_BikeModel.getModules().fuelTank.group.position,
                enginePos: window.RE_BikeModel.getModules().engine.group.position
            })`,
            returnByValue: true
        });
        console.log('--- 4. REASSEMBLED 0% SCROLL STATE AFTER SCROLLING UP ---');
        console.log(JSON.stringify(stateReset.result?.value, null, 2));

        ws.close();
        chrome.kill();
        process.exit(0);
    };
}

main().catch(err => { console.error(err); process.exit(1); });
