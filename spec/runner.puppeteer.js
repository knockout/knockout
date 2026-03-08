// Knockout test runner using Puppeteer (headless Chrome)
// Replaces the deprecated PhantomJS-based runner

const path = require('path');
const puppeteer = require('puppeteer');

const specFile = process.argv[2] || 'spec/runner.html?src=build/output/knockout-latest.js';
const fileUrl = 'file:///' + path.resolve(specFile.split('?')[0]).replace(/\\/g, '/') +
    (specFile.includes('?') ? '?' + specFile.split('?')[1] : '');

console.log("Running Knockout tests in headless Chrome (Puppeteer)");

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => console.log(msg.text()));

    await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });

    try {
        await page.waitForFunction(
            () => document.body.querySelector('.symbolSummary .pending') === null,
            { timeout: 10000 }
        );
    } catch (e) {
        const lastSpec = await page.evaluate(() => {
            var specs = document.body.querySelectorAll('.results .specSummary');
            return specs.length ? specs[specs.length - 1].innerText : '(none)';
        });
        console.log("Timed out waiting for tests to complete.");
        console.log("Last test completed: " + lastSpec);
        await browser.close();
        process.exit(1);
    }

    const exitCode = await page.evaluate(() => {
        var list = document.body.querySelectorAll('.results > #details > .specDetail.failed');
        if (list && list.length > 0) {
            console.log('');
            console.log(list.length + ' test(s) FAILED:');
            for (var i = 0; i < list.length; ++i) {
                var el = list[i],
                    desc = el.querySelector('.description'),
                    msg = el.querySelector('.resultMessage.fail');
                console.log('');
                console.log(desc.innerText);
                console.log(msg.innerText);
                console.log('');
            }
            return 1;
        } else {
            console.log(document.body.querySelector('.alert > .passingAlert.bar').innerText);
            return 0;
        }
    });

    await browser.close();
    process.exit(exitCode);
})();
