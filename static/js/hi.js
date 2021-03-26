function hi(tag) {
    const regId = /^#.*/
    const regClass = /^\..*/
    if (regId.test(tag))
        return document.getElementById(tag.substr(1))
    else if (regClass.test(tag))
        return document.getElementsByClassName(tag.substr(1))
}

// 正则匹配
function match(value, item) {
    const reg = {
        'iplist': /^((\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.){3}(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])(\/(\d{1,2}|1\d\d|2[0-4]\d|25[0-5]))+$$/,
        'ip': /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$$/,
        'uptime': /.*up\ {1,}(\d{1,2}:\d{1,2},|\d\ days?,|\d{1,2}\ min\w{0,}?,).*/,
        'df': /(8\d|100)%.*\/.*/,
        'timestamp': /\[\d{4}(-\d{2}){2} \d{2}(:\d{2}){2}\]|\w{3}\ \w{3}\ \d{2} (\d{2}\:){2}\d{2}\ \d{4}|\d{4}\-\d{2}\-\d{2}\ (\d{2}\:){2}\d{2}\.\d{3}\:.*/,
        'path': /.*\;.*|.*\|.*|.*\&.*|.*shutdown.*|.*reboot.*|.*rm.*|.*>.*|.*mv.*|.*mkfs.*|.*dd.*|.*\\x.*/,
        'err': /.*Degraded.*|.*(err|ERR).*|.*(OFFLINE|Offline)\ .*|.*(FAILED|Failed).*|.*Laser_Flt.*/
    }
    return reg[item].test(value)
}

const toPercent = point => `${Number(point * 100).toFixed(1)}%`;


function ipParse(ipString) {
    let iplist = ipString.replace(/\s*/g, '').replace(/\,$$/g, '').split(',')
    let iplist_tmp = [];
    for (let item of iplist) {
        if (match(item, 'iplist')) {
            let field = item.split('/')
            let tmp = field[0].split('.')
            let head = `${tmp[0]}.${tmp[1]}.${tmp[2]}`
            for (let i of field) {
                if (!match(i, 'ip')) {
                    iplist_tmp.push(`${head}.${i}`)
                } else {
                    iplist_tmp.push(i)
                }
            }
        } else {
            iplist_tmp.push(item)
        }
    }
    return iplist_tmp
}