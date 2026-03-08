// Trusted Types e2e test runner
// Verifies Knockout works under Trusted Types CSP enforcement
//
// Serves via HTTP with a CSP header to enforce Trusted Types.
// Usage: node spec/runner.trusted-types.js [knockout-file]
//   Default: build/output/knockout-latest.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const PORT = 0; // auto-assign
const ROOT = path.resolve(__dirname, '..');
const koFile = process.argv[2] || 'build/output/knockout-latest.js';

var CSP = "trusted-types knockout knockout-test; require-trusted-types-for 'script'";

function serve(req, res) {
    if (req.url === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
    }
    // Map /spec/knockout.js to the build being tested
    var filePath = (req.url === '/spec/knockout.js')
        ? path.join(ROOT, koFile)
        : path.join(ROOT, req.url === '/' ? '/spec/trusted-types.html' : req.url);
    var ext = path.extname(filePath);
    var contentType = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[ext] || 'application/octet-stream';

    fs.readFile(filePath, function(err, data) {
        if (err) {
            res.writeHead(404);
            res.end('Not found: ' + req.url);
        } else {
            var headers = { 'Content-Type': contentType };
            if (ext === '.html') {
                headers['Content-Security-Policy'] = CSP;
            }
            res.writeHead(200, headers);
            res.end(data);
        }
    });
}

(async function() {
    console.log("Running Knockout Trusted Types e2e tests (" + koFile + ")");

    var server = http.createServer(serve);
    await new Promise(function(resolve) { server.listen(PORT, resolve); });
    var port = server.address().port;

    try {
        var browser = await puppeteer.launch({ headless: true });
        var page = await browser.newPage();

        var cspErrors = [];
        page.on('pageerror', function(err) { cspErrors.push(err.message); });
        page.on('console', function(msg) {
            var text = msg.text();
            if (msg.type() !== 'log') console.log('  [page ' + msg.type() + '] ' + text);
            if (msg.type() === 'error') cspErrors.push('[console] ' + text);
        });
        page.on('requestfailed', function(req) {
            if (req.url().indexOf('favicon') === -1) console.log('  [request failed] ' + req.url());
        });

        await page.goto('http://localhost:' + port + '/spec/trusted-types.html', { waitUntil: 'load' });

        try {
            await page.waitForFunction(function() { return window.__ttResults; }, { timeout: 10000 });
        } catch (waitErr) {
            console.log('  Timed out waiting for results — page may have crashed');
        }

        var results = await page.evaluate(function() { return window.__ttResults || []; });
        var passed = 0, failed = 0;

        results.forEach(function(r) {
            if (r.pass) {
                console.log('  ✓ ' + r.name);
                passed++;
            } else {
                console.log('  ✗ ' + r.name + ': ' + r.error);
                failed++;
            }
        });

        if (cspErrors.length > 0) {
            console.log('\nCSP/Trusted Types violations:');
            cspErrors.forEach(function(e) { console.log('  ' + e); });
            failed++;
        }

        console.log('\n' + passed + ' passed, ' + failed + ' failed');

        await browser.close();
        server.close();
        process.exit(failed > 0 ? 1 : 0);
    } catch (e) {
        console.error('Error:', e.message);
        server.close();
        process.exit(1);
    }
})();
