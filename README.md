# 局域网文件共享

可简单满足局域网内文件共享与消息发送

### 环境
    
    python 3.x

### 第三方依赖包

    # pip install web.py
    # pip install pillow
    # pip install qrcode

### 使用说明

    # python run.py


> 浏览器中打开地址 127.0.0.1:8080

> 默认用户及口令: admin / ADMIN!@#

> 修改默认登录验证打开run.py，搜索`ADMIN!@#`修改即可

> 修改端口，打开run.py，查看最后几行，修改`port = 8080`即可

```python
if __name__ == "__main__":
    ip = get_my_ip()
    port = 8080
    ip_list = {}
    ip_list[ip] = qcode(ip, port)
    app.run(port=port)
```


![avatar](https://github.com/u2mycat/fileshare/blob/main/src/login.png)
![avatar](https://github.com/u2mycat/fileshare/blob/main/src/p-1.png)
![avatar](https://github.com/u2mycat/fileshare/blob/main/src/p-2.png)

> 手机端浏览器中打开服务端地址或扫二维码
> 
![avatar](https://github.com/u2mycat/fileshare/blob/main/src/login.jpg)
![avatar](https://github.com/u2mycat/fileshare/blob/main/src/p-1.jpg)
![avatar](https://github.com/u2mycat/fileshare/blob/main/src/p-2.jpg)

### 相关引用
[codemirror](https://codemirror.net/)

[spark-md5.js](https://github.com/satazor/js-spark-md5/blob/master/spark-md5.js)

[base64.js](https://github.com/dankogai/js-base64)
