const puppeteer = require('puppeteer-core');
const findChrome = require("./node_modules/carlo/lib/find_chrome");
const fs = require('fs');
const axios = require('axios')
const path = require('path');
(async () => {
    const findChromePath = await findChrome({});
    const executablePath = findChromePath.executablePath;
    const browser = await puppeteer.launch({
        headless: false,
        executablePath,
        defaultViewport: {
            width: 1519,
            height: 697
        }
    });
    const Music = async (url, title, singer) => {
        const page = await browser.newPage()
        await page.goto(url, { timeout: 0 })
        const MusicUrl = await page.evaluate(() => {
            let MusicUrl = ''
            MusicUrl = document.querySelector('#myAudio').src
            return MusicUrl
        })
        await page.close()
        const extName = path.extname(MusicUrl)
        const ws = fs.createWriteStream(`./music/${title}${singer}${extName}`)
        axios.get(MusicUrl, { responseType: 'stream' }).then(res => {
            res.data.pipe(ws)
            res.data.on('close', () => {
                console.log('已下载：' + title + singer + extName);
                ws.close()
            })
        })

    }
    const MusicDetail = async (url, description) => {
        const page = await browser.newPage()
        await page.goto(url)
        const MusicList = await page.evaluate(() => {
            const MusicDetailList = document.querySelectorAll('.pc_temp_songlist ul li')
            let MusicList = new Array()
            MusicDetailList.forEach(item => {
                const url = item.querySelector('a').href
                const title = item.querySelector('a').innerText
                const singer = item.querySelector('a span').innerHTML
                MusicList.push({ title, singer, url })
            })
            return MusicList
        })
        await page.close()
        MusicList.forEach(item => {
            Music(item.url, item.title, item.singer)
        })
    }

    const page = (await browser.pages())[0]
    await page.goto('https://www.kugou.com/yy/rank/home/1-6666.html?from=rank')
    const MusiclisList = await page.evaluate(() => {
        const Musiclist = document.querySelectorAll('.pc_rank_sidebar')
        let MusiclisList = new Array()
        Musiclist.forEach(item => {
            const Musiclis = item.querySelectorAll('ul li')
            Musiclis.forEach(Musiclisitem => {
                const url = Musiclisitem.querySelector('a').href
                const description = Musiclisitem.querySelector('a').innerText
                MusiclisList.push({
                    description,
                    url
                })
            })
        })
        return MusiclisList
    })
    await page.close()
    for (let i = 0; i < MusiclisList.length; i++) {
        if (MusiclisList[0] === MusiclisList[i]) {
            MusicDetail(MusiclisList[i].url, MusiclisList[i].description)
            break
        }
    }
})()