hi("#file").addEventListener('change', function () {
    hi("#file").classList.remove('req');
    hi("#progress-wrapper").classList.remove('bg-display');
    hi("#progress").style.width = 0;
    hi("#progressNumber").innerHTML = '';


    const file = hi("#file").files[0];
    const fileReader = new FileReader()

    if (file) {
        let fileSize = 0;
        if (file.size > 1024 * 1024)
            fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
        else
            fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';

        hi('#fileName').innerHTML = '文件名: ' + file.name;
        hi('#fileSize').innerHTML = '文件大小: ' + fileSize;
        hi('#fileType').innerHTML = '文件类型: ' + file.type;
    }

    fileReader.readAsBinaryString(file);
    fileReader.onload = e => {
        const md5 = SparkMD5.hashBinary(e.target.result);
        hi("#md5").value = md5;
        hi("#md5-str").innerHTML = "MD5: " + md5;
    }

})

hi("#close").addEventListener('click', function () {
    hi("#msg-wrapper").classList.add('hide');
    hi("#msg-wrapper").setAttribute("status", "hide");
})

hi("#msg-btn").addEventListener('click', function () {
    hi("#msg-wrapper").classList.toggle('hide');
    hi("#msg-wrapper").setAttribute("status", "display");
    msgCount = 0;
    hi('#msg-count').style.display = 'none';
    hi("#msg-count").innerHTML = '';
    cm.refresh();
    cm.execCommand("goDocEnd")
})



function deleteFile(obj) {
    let res = false;
    hi('#confirm-wrapper').innerHTML = `
    <div class="confirm">
        <p class="tip">是否确认删除以下文件？删除后将不可恢复</p>
        <p id="fileName">${obj.getAttribute('short-name')}</p>
        <div class="btn-wrapper">
            <button class="btn" msg="confirm">确认</button>
            <button class="btn" msg="cancel">取消</button>
        </div>
    </div>
    `
    hi('#confirm-wrapper').style.zIndex = 9;

    let btns = hi('.btn');
    for (let i of btns) {
        i.addEventListener('click', function () {
            if (i.getAttribute('msg') == 'confirm') {
                window.location.href = `/delete?file=${obj.getAttribute('file')}`
            } else {
                hi('#confirm-wrapper').innerHTML = '';
                hi('#confirm-wrapper').style.zIndex = -1;
            }
        })
    }

}

function uploadFile() {
    if (hi("#file").files[0]) {

        hi("#progress-wrapper").classList.add('bg-display');

        let fd = new FormData();
        fd.append("myfile", hi('#file').files[0]);
        fd.append("md5", hi("#md5").value);
        //console.log(fd.get("myfile"))
        let xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", uploadProgress, false);
        xhr.addEventListener("load", uploadComplete, false);
        xhr.addEventListener("error", uploadFailed, false);
        xhr.addEventListener("abort", uploadCanceled, false);
        xhr.open("POST", "/upload");
        xhr.send(fd);
    } else {
        hi("#file").classList.add('req');
    }
}

function uploadProgress(evt) {
    if (evt.lengthComputable) {
        let percentComplete = Math.round(evt.loaded * 100 / evt.total);
        hi('#progressNumber').innerHTML = percentComplete.toString() + '%';
        hi('#progress').style.width = percentComplete.toString() + '%';
    }
    else {
        hi('#progressNumber').innerHTML = '无法计算';
    }
}

function uploadComplete(evt) {
    /* 当服务器响应后，这个事件就会被触发 */
    res = JSON.parse(evt.target.responseText)

    //alert('上传完成');

    if (res['state'] == 'ok') {
        hi('#result').classList.remove('hide');
        hi('#filename-res').innerHTML = '最新上传: ' + res['filename']
        hi('#md5-res').innerHTML = 'MD5: ' + res['md5']
        
        let html = ''
        for (let i in res['list']) {
            console.log(i)
            html += `<p><a href="javascript:;" onclick="deleteFile(this);" file="${res['list'][i]}" short-name="${i}">删除 </a> | <a href="/download?file=${res['list'][i]}" target="_Blank">${i}</a></p>`
        }
        hi('#wrapper').innerHTML = html;
    } else if (res['state'] == 'exists') {
        alert(`${res['filename']} 文件已存在！`);
    }
}

function uploadFailed(evt) {
    alert("上传文件发生了错误尝试");
}

function uploadCanceled(evt) {
    alert("上传被用户取消或者浏览器断开连接");
}