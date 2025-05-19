这是一个使用 [`plasmo init`](https://www.npmjs.com/package/plasmo) 引导的 [Plasmo 扩展](https://docs.plasmo.com/) 项目。

## 快速开始

首先，运行开发服务器：

```bash
npm run dev
```

打开浏览器并加载相应的开发构建。例如，如果您正在为 Chrome 浏览器开发，使用 manifest v3，请使用：`build/chrome-mv3-dev`。

您可以通过修改 `popup.tsx` 开始编辑弹出页面。更改时它应该会自动更新。要添加选项页面，只需在项目根目录中添加一个 `options.tsx` 文件，并默认导出一个 React 组件。同样，要添加内容页面，请在项目根目录中添加一个 `content.ts` 文件，导入一些模块并编写逻辑，然后在浏览器中重新加载扩展。


## 构建生产版本

运行以下命令：

```bash
npm run build
```

这将为您的扩展创建一个生产包，可以打包为 zip 文件并发布到商店。

## 使用生产版本
将build/chrome-mv3-prod 目录直接拖入到拓展程序中即可
