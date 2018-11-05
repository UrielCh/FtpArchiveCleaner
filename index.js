const PromiseFtp = require('promise-ftp')
const moment = require('moment')
const prettyBytes = require('pretty-bytes');

const host = process.env.FTP_HOST
const user = process.env.FTP_USER
const password = process.env.FTP_PASS

const main = async () => {
    const ftp = new PromiseFtp();
    const dayToKeep = 2;  
    const now = moment()
    const serverMessage = await ftp.connect({ host, user, password })
    console.log(serverMessage)
    const list = await ftp.list('/')
    let totalSize = 0
    let totalCount = 0
    let dropSize = 0
    let dropCount = 0
    for (const { name, size } of list) {
        const dt = name.match('\\d{4}-\\d{2}-\\d{2}')
        if (!dt)
            continue;
        const fileDate = new moment(dt[0])
        const diff = now.diff(fileDate, 'day')
        console.log(`item: ${name} size: ${prettyBytes(size)}`)
        // 1 month + keep only fit sunday
        if (diff > 28)
            if (fileDate.date() > 7) { // 1-31
                console.log(`Delete ${name}, old month `)
                await ftp.delete(name)
                dropSize += Number(size)
                dropCount++;
                continue;
            }
        if (diff > 7)
            if (fileDate.day() != dayToKeep) { // 0-6
                console.log(`Delete ${name}, old Day`)
                await ftp.delete(name)
                dropSize += Number(size)
                dropCount++;
                continue
            }
        totalSize += Number(size)
        totalCount++
        //if (diff < 7) await ftp.site(`SYMLINK ${fileDate.format('dddd')}.zip ${name}`)
    }
    await ftp.end()
    console.log(`Clean done ${dropCount} files deleted ${prettyBytes(dropSize)}`)
    console.log(`Keep ${totalCount} files ${prettyBytes(totalSize)}`)
}

if (!host || !user || !password)
    console.log('Missing FTP_HOST, FTP_USER, FTP_PASS env variable');
else
    main();
