import web
import time
import hashlib
import os
import re
import json
import socket
from PIL import Image
import qrcode
import base64
from urllib.parse import unquote, quote
from pathlib import Path

web.config.debug = False

urls = (
    '/msg', 'Msg',
    '/upload', 'Upload',
    '/file', 'File',
    '/login', 'Login',
    '/logout', 'Logout',
    '/download', 'Download',
    '/delete', 'Delete',
    '/(js|css|images|plugins|src)/(.*)', 'static'
)


class MyApplication(web.application):
    def run(self, port=8080, *middleware):
        func = self.wsgifunc(*middleware)
        return web.httpserver.runsimple(func, ('0.0.0.0', port))


app = MyApplication(urls, globals())
session = web.session.Session(
    app, web.session.DiskStore('sessions'), {'login': 0})
render = web.template.render('templates/')

log_home = './log'


class static:
    def GET(self, media, file):
        try:
            with open(media + '/' + file, 'r', encoding='utf-8') as f:
                return f.read()
        except:
            print("error")
            return '404'


def tree(path):
    files = []
    for item in os.listdir(path):
        if os.path.isdir(os.path.join(path, item)):
            files.extend(tree(os.path.join(path, item)))
        else:
            files.append(os.path.join(path, item))
    return files


def Log(cmd, data):
    log = "[%s] %s\n" % (time.strftime(
        "%Y-%m-%d %H:%M:%S", time.localtime()), cmd)
    for line in data['msg']:
        log += line

    with open(os.path.join(os.getcwd(), 'log', data['ip']+'.log'), 'a+') as f:
        f.write(log+'\n')


def readLog(file):
    log = []
    node = []
    try:
        with open(file, "r+", encoding="utf-8") as f:
            lines = f.readlines()
    except:
        with open(file, "r+", encoding="ansi") as f:
            lines = f.readlines()

    for k, i in enumerate(lines):
        if re.match(r'\[\d{4}\-\d{2}\-\d{2}\ (\d{2}\:){2}\d{2}\].*', i):
            node.append((k, i))
    for i in range(len(node)):
        if (i < len(node) - 1):
            value = lines[node[i][0]:node[i+1][0]]
        else:
            value = lines[node[i][0]:]
        log.append(value)
    return log


def get_my_ip():
    try:
        csock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        csock.connect(('8.8.8.8', 80))
        (addr, port) = csock.getsockname()
        csock.close()
        return addr
    except socket.error:
        return "127.0.0.1"


def qcode(ip,port):
    url = f'http://{ip}:{port}/file'
    qr = qrcode.QRCode(
        version=5, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=8, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#757575")
    img = img.convert("RGBA")
    icon = Image.open("static/img/logo.PNG")
    img_w, img_h = img.size
    factor = 4
    size_w = int(img_w / factor)
    size_h = int(img_h / factor)
    icon_w, icon_h = icon.size
    if icon_w > size_w:
        icon_w = size_w
    if icon_h > size_h:
        icon_h = size_h
    icon = icon.resize((icon_w, icon_h), Image.ANTIALIAS)
    w = int((img_w - icon_w) / 2)
    h = int((img_h - icon_h) / 2)
    icon = icon.convert("RGBA")
    img.paste(icon, (w, h), icon)
    qcode_img_addr = f'static/img/qrcode/{ip}.png'
    img.save(qcode_img_addr)
    return qcode_img_addr


class Login:
    def GET(self):
        http_agent = web.ctx.env['HTTP_USER_AGENT']
        agent = 'mobile' if re.match(
            r'.*Android.*|.*iPhone.*', http_agent) else 'desktop'
        return render.login(agent)

    def POST(self):
        username, password = web.input().user, web.input().passwd
        if username == 'admin' and password == 'ADMIN!@#':
            session.login = 1
        return web.seeother('/file')


class Logout:
    def GET(self):
        session.kill()
        return web.seeother('/login')


class File:
    def GET(self):
        if session.login == 0:
            return web.seeother('/login')
        http_agent = web.ctx.env['HTTP_USER_AGENT']
        filedir = './media'
        res = {}
        for i in tree(filedir):
            i = i.replace("/", '\\')
            if not re.match('^\..*', i.split('\\')[-1]):
                url = i.lstrip('.\\media\\')
                filename = url.split('\\')[-1]
                url = base64.b64encode(bytes(url, encoding='utf-8'))
                res[filename] = quote(str(url, 'utf-8'))

        agent = 'mobile' if re.match(
            r'.*Android.*|.*iPhone.*', http_agent) else 'desktop'

        return render.file(res, agent, ip_list)


class Delete:
    def GET(self):
        if session.login == 0:
            return web.seeother('/login')

        value = web.input()
        try:
            path = value['file']
        except:
            pass
        path = base64.b64decode(
            bytes(unquote(path), encoding='utf-8')).decode('utf-8')

        myfile = './media/' + path.replace('\\', '/')
        # filename = myfile.split('/')[-1]
        os.remove(myfile)
        print("removed:", myfile)
        return web.seeother(f'/file')


class Download:
    def GET(self):
        if session.login == 0:
            return web.seeother('/login')

        value = web.input()
        try:
            path = value['file']
        except:
            pass

        path = base64.b64decode(
            bytes(path.replace('-', '+'), encoding='utf-8')).decode('utf-8')

        myfile = './media/' + path.replace('\\', '/')
        filename = myfile.split('/')[-1]
        f = None
        try:
            f = open(myfile, "rb")
            web.header('Content-Type', 'application/octet-stream')
            web.header('Content-disposition',
                       'attachment; filename=%s' % web.net.urlquote(filename))
            while True:
                c = f.read(262144)
                if c:
                    yield c
                else:
                    break
        except Exception as e:
            print(e)
            yield 'Error'
        finally:
            if f:
                f.close()


class Upload:
    def POST(self):
        if session.login == 0:
            return web.seeother('/login')

        x = web.input(myfile={})
        file_md5 = web.input(md5={})
        filedir = './media'
        if 'myfile' in x:
            filepath = x.myfile.filename.replace('\\', '/')
            filename = filepath.split('/')[-1]

            date_str = time.strftime("%Y,%m,%d", time.localtime()).split(',')
            mkpath = f'{filedir}/{date_str[0]}/{date_str[1]}/{date_str[2]}'

            if not os.path.isdir(mkpath):
                os.makedirs(mkpath)

            new_file = mkpath + '/' + filename

            if Path(new_file).exists():
                return json.dumps({'filename': filename, 'md5': file_md5.md5, 'list': None, 'state': 'exists'})

            fout = open(new_file, 'wb')
            fout.write(x.myfile.file.read())
            fout.close()

            file_object = open(new_file, 'rb')
            file_content = file_object.read()
            file_object.close()
            print("upload:", filename)

        if file_md5.md5 == hashlib.md5(file_content).hexdigest():
            res = file_md5.md5
        else:
            res = None

        files = {}
        filedir = './media'
        for i in tree(filedir):
            i = i.replace("/", '\\')
            if not re.match('^\..*', i.split('\\')[-1]):
                url = i.lstrip('.\\media\\')
                filename = url.split('\\')[-1]
                url = base64.b64encode(bytes(url, encoding='utf-8'))
                files[filename] = quote(str(url, 'utf-8'))

        return json.dumps({'filename': filename, 'md5': res, 'list': files, 'state': 'ok'})


class Msg:
    def POST(self):

        if session.login == 0:
            return web.seeother('/login')

        web.header("Access-Control-Allow-Origin", "*")
        value = web.input()
        strings = value['msg']

        if strings == '':
            pass
        else:
            strings = re.sub('\r', '', strings)
            data = {'msg': strings, 'ip': "msg"}
            Log(web.ctx.ip, data)

        log = readLog(f'{log_home}/msg.log')
        log.reverse()
        res = []
        for i in log:
            res.append(i)

        return json.dumps({'log': res})


if __name__ == "__main__":
    ip = get_my_ip()
    port = 8080
    ip_list = {}
    ip_list[ip] = qcode(ip, port)
    app.run(port=port)
