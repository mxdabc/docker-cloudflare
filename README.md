# 提示

1. 🛡️ 本服务用于加速 Docker 镜像下载，不存储任何数据，严禁违反相关法律法规。
2. 💬 TG Docker 交流群组 [点击加入 TG 群组](https://t.me/+MVUqygPYMKc2YzNh)
3. ❓ 有问题？请看 [Docker 镜像问题反馈](https://discuz.mxdyeah.top/mxdyeah_discuz_thread-410-1-1.html)
4. ☁️ 部署 [到 Cloudflare Workers](build.md)

## 设置镜像加速器

为了加速镜像拉取，你可以使用以下命令设置 registry mirror:

```bash
sudo tee /etc/docker/daemon.json <<EOF
{
    "registry-mirrors": ["https://docker.mxdyeah.top"]
}
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker
```

**注意**：Cloudflare 的 Workers 用量有限，为避免耗尽，你可以手动 pull 镜像然后 re-tag 之后 push 至本地镜像仓库。

---

## 操作示例（根据实际需要替换对应的镜像）

1. 🚀 拉取镜像

    ```bash
    docker pull docker.mxdyeah.top/library/alpine:latest
    ```

2. 🏷️ 重命名镜像

    ```bash
    docker image tag docker.mxdyeah.top/library/alpine:latest library/alpine:latest
    ```

3. 🗑️ 删除镜像

    ```bash
    docker rmi docker.mxdyeah.top/library/alpine:latest
    ```
