const puppeteer = require("puppeteer");
const fs = require('fs');
var HTMLParser = require('node-html-parser');
var stdin = process.openStdin();
stdin.setRawMode( true );
stdin.resume();
stdin.setEncoding( 'utf8' );

const selectors_1 = ("" + fs.readFileSync("common_1.css")).split("\n").join(" ");
const selectors_2 = ("" + fs.readFileSync("common_2.css")).split("\n").join(" ");

const checkPage = async (url) => {
    const browser = await puppeteer.launch({
        devtools: false,
        headless: true,
        args: ['--no-sandbox']
    });
    const page = (await browser.pages())[0];
    stdin.on('data', async function(key) { 
        if ( key === '\u0003' ) {
            process.exit();
        }
        if (key === '*') {
            fs.appendFile("/usr/results/results.txt", url+"\n", err => {
                if (err) {
                    console.error(err);
                }
            });
        }
    });

    try {
        await page.goto(url, {waitUntil: 'domcontentloaded',timeout: 10000});

        await new Promise(r => setTimeout(r, 4000));
        var html = await page.content();
        var document = HTMLParser.parse(html);
        if ((document.querySelector(selectors_1) != null) || (document.querySelector(selectors_2) != null)) {
            console.log(url);
            fs.appendFile("/usr/results/results.txt", url+"\n", err => {
                if (err) {
                    console.error(err);
                }
            });
        }
        await browser.close();
    }
    catch {
        await browser.close();
    }
}

const runCrawler = async (urls) => {
    for (u of urls) {
        u = u.split(",")[1];
        console.log(u);
        if (/^www./.test(u)) {
            await checkPage("http://" + u);
        }
        else {
            await checkPage("http://www." + u);
        }
        
    }
}

fs.readFile('top-1m.csv', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    runCrawler(data.split("\n"));
});

