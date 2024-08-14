# 📁 如何上传 `_worker.js` 到 Cloudflare Workers

1. **登录 Cloudflare 账户** 🌐
   - 打开浏览器，访问 [Cloudflare 登录页面](https://dash.cloudflare.com/)。
   - 输入你的账号信息并登录。

2. **选择你的站点** 🏠
   - 登录后，你会看到 Cloudflare 的主控制面板。选择你要操作的站点（如果你有多个站点）。

3. **进入 Workers 面板** 🔧
   - 在左侧导航栏中，点击 **"Workers"**。这将带你进入 Workers 控制面板。

4. **创建或编辑 Worker** ✏️
   - 如果你还没有创建 Worker，点击 **"Create a Worker"** 按钮。如果已经有 Worker，你可以点击 **"Manage Workers"** 并选择现有的 Worker 进行编辑。

5. **打开代码编辑器** 🖥️
   - 在 Worker 编辑器中，你会看到默认的代码。如果你已有代码，可以选择全部删除，然后将本仓库`_worker.js`代码复制进去。

6. **保存并部署 Worker** 💾
   - 代码粘贴完成后，点击右上角的 **"Save and Deploy"** 按钮。Cloudflare 将自动保存并部署你的 Worker。

7. **验证部署** ✅
   - 部署完成后，你可以在 **"Overview"** 选项卡下查看 Worker 的状态，确保它已成功部署。如果需要，可以点击 **"Preview"** 来测试 Worker 的效果。

---

这样，你就完成了通过浏览器操作将 `_worker.js` 上传到 Cloudflare Workers 的步骤！如果有任何问题或需要进一步的帮助，可以查看 Cloudflare 的 [官方文档](https://developers.cloudflare.com/workers/) 或联系支持团队。
