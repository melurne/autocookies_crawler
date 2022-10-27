const puppeteer = require("puppeteer");
const fs = require('fs');
var HTMLParser = require('node-html-parser');
var stdin = process.openStdin();
stdin.setRawMode( true );
stdin.resume();
stdin.setEncoding( 'utf8' );

let curr;
let lastvisited = ("" + fs.readFileSync("/usr/results/lastvisited.txt"));

console.log(lastvisited);


const selectors_1 = ("" + fs.readFileSync("common_1.css")).split("\n").join(" ");
const selectors_2 = ("" + fs.readFileSync("common_2.css")).split("\n").join(" ");

const checkPage = async (url) => {
    curr = url;
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
            el = document.querySelector(selectors_1) != null ? document.querySelector(selectors_1) : document.querySelector(selectors_2)
            console.log(el);
            fs.writeFile("/usr/results/"+ url.replaceAll("/", "_").replace("\r", "") +".txt", el.toString(), err => {
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
        if (u.split(',')[0]<=lastvisited) {continue;}

        target = u.split(",")[1];
        console.log(target);
        if (/^www./.test(target)) {
            await checkPage("http://" + target);
        }
        else {
            await checkPage("http://www." + target);
        }
        fs.writeFile("/usr/lastvisited.txt", u.split(',')[0],  err => {
            if (err) {
                console.error(err);
            }
        });
        lastvisited = u.split(',')[0];
    }
}

fs.readFile('top-1m.csv', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    runCrawler(data.split("\n"));
});

