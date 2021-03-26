function init(cm, value) {
    let status = true;
    fetch("/msg", {
        method: "POST",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `msg=${value}`,
    })
        .then(res => res.json())
        .then(json => {
            hi('#status').innerHTML = '<span class="ok">在线</span>';
            hi('.banner')[0].classList.remove('no-con');
            let tmp = SparkMD5.hashBinary(json['log'].toString())
            if (md5 != tmp) {
                let html = ''
                let res = json['log']
                res.reverse()
                res.forEach(item => {
                    item.forEach(line => {
                        //html += line;
                        html += /^\[\d{4}\-\d{2}\-\d{2}\ (\d{2}\:){2}\d{2}\].*/.test(line) ? line : ' ' + line;
                    })
                    html += '\n'
                });
                cm.setValue(html)
                cm.execCommand("goDocEnd")
                md5 = tmp
                if (msgCount > 0 && hi("#msg-wrapper").getAttribute('status') == 'hide') {

                    hi('#msg-count').style.display = 'inline';
                    hi('#msg-count').innerHTML = msgCount;

                } else {
                    hi('#msg-count').style.display = 'none';
                    hi('#msg-count').innerHTML = '';
                    msgCount = 0;
                }
                msgCount += 1
            }
        })
        .catch(error => {
            hi('#status').innerHTML = '<span class="fail">离线</span>'
            hi('.banner')[0].classList.add('no-con');
        })

}

var msgCount = 0

let md5 = '';
let cm = CodeMirror.fromTextArea(hi("#log"), {
    lineNumbers: false,
    styleActiveLine: true,
    lineWrapping: true,
    matchBrackets: true,
    readOnly: true,
});

let input = CodeMirror.fromTextArea(hi(`#strings`), {
    lineNumbers: false,
    styleActiveLine: true,
    lineWrapping: true,
    matchBrackets: true,
    readOnly: false,
});

init(cm, '')
setInterval(init, 2000, cm, '');

hi("#submit").addEventListener('click', function () {
    init(cm, input.getValue())
    input.setValue('')
})

document.addEventListener('keydown', function (e) {
    if (e.key == 'Alt') {
        document.addEventListener('keydown', function (e) {
            if (e.key == 'Enter') {
                init(cm, input.getValue())
                input.setValue('')
            }
        })
    }
});



