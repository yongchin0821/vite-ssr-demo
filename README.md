# Vue 3 + Typescript + Vite + Naive-ui

踩坑无数，旨在搭建Vue3 版本的ssr。轻量级，开箱即用。

### 项目参考
- vite ssr [官方例子](https://github.com/vitejs/vite/tree/main/packages/playground/ssr-vue)
- naive-ui ssr [官方例子](https://www.naiveui.com/zh-CN/os-theme/docs/ssr)
- [Ephemeres](https://github.com/Zolyn/Ephemeres)

特别感谢[@Zorin](https://github.com/Zolyn)的帮助支持
### 依赖
除开vite自建，还需要安装的依赖:  
(个人理解)  
1. unplugin-vue-components  
vite开箱即用的插件  
2. esno  
node serve无法识别.ts文件，改用 esno server启用  
3. cross-env  
执行cross-env命令时候要用到  
4. compression  
官方例子依赖  

### 安装
yarn install

### 本地开发运行
yarn dev

### 打包运行
yarn build
yarn serve
