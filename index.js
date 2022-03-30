const puppeteer = require('puppeteer-core');
const findChrome = require("./node_modules/carlo/lib/find_chrome");
const fs = require('fs');
const axios = require('axios')
const path = require('path');
(async () => {
    const findChromePath = await findChrome({});
    const executablePath = findChromePath.executablePath;
    const browser = await puppeteer.launch({
        headless: true,
        executablePath,
        defaultViewport: {
            width: 1519,
            height: 697
        }
    });
    const Music = async (url, titleSinger) => {
        const page = await browser.newPage()
        await page.goto(url, { timeout: 0 })
        const MusicUrl = await page.evaluate(() => {
            let MusicUrl = ''
            MusicUrl = document.querySelector('#myAudio').src
            return MusicUrl
        })
        await page.close()
        let list  = titleSinger.split(' - ')
        const extName = path.extname(MusicUrl)
        const ws = fs.createWriteStream(`./music/${list[1]}--${list[0]}${extName}`)
        axios.get(MusicUrl, { responseType: 'stream' }).then(res => {
            res.data.pipe(ws)
            res.data.on('close', () => {
                console.log('已下载：' + list[1] + '--' + list[0] + extName);
                ws.close()
            })
        })

    }
    const MusicDetail = async (url) => {
        const page = await browser.newPage()
        await page.goto(url)
        const MusicList = await page.evaluate(() => {
            const MusicDetailList = document.querySelectorAll('.pc_temp_songlist ul li')
            let MusicList = new Array()
            MusicDetailList.forEach(item => {
                const url = item.querySelector('a').href
                const titleSinger = item.querySelector('a').title
                MusicList.push({ titleSinger, url })
            })
            return MusicList
        })
        await page.close()
        MusicList.forEach(item => {
            Music(item.url, item.titleSinger)
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
                MusiclisList.push(url)
            })
        })
        return MusiclisList
    })
    await page.close()
    for (let i = 0; i < MusiclisList.length; i++) {
        // 把 MusiclisList[0] 中的 [0] 改为 1 或 其他的数字 ... 即可爬取   注：不可超过32
        if (MusiclisList[0] === MusiclisList[i]) {
            MusicDetail(MusiclisList[i], MusiclisList[i])
            break
        }
    }
})()