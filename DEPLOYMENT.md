# Vercel部署指南

## 本地准备步骤

### 1. 安装Vercel CLI（可选）
```bash
npm i -g vercel
```

### 2. 本地构建测试
```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 预览构建结果
npm run preview
```

## Vercel部署方式

### 方式一：通过Vercel网站（推荐）

1. 访问 [vercel.com](https://vercel.com)
2. 使用GitHub账号登录
3. 点击 "New Project"
4. 导入你的GitHub仓库
5. Vercel会自动检测这是一个Vite项目
6. 点击 "Deploy" 开始部署

### 方式二：通过Git集成

1. 将代码推送到GitHub
```bash
git add .
git commit -m "准备部署到Vercel"
git push origin main
```

2. 在Vercel中连接GitHub仓库
3. 每次推送代码都会自动部署

### 方式三：通过Vercel CLI

```bash
# 登录Vercel
vercel login

# 在项目目录中部署
vercel

# 部署到生产环境
vercel --prod
```

## 项目配置说明

### vercel.json配置
- `buildCommand`: 构建命令
- `outputDirectory`: 构建输出目录
- `framework`: 框架类型
- `rewrites`: 路由重写规则，支持SPA路由

### 环境变量设置
如果项目需要环境变量，在Vercel项目设置中添加：
1. 进入项目设置
2. 选择 "Environment Variables"
3. 添加需要的环境变量

## 注意事项

1. **文件大小限制**：Vercel免费版有100MB的部署限制
2. **音频文件**：大的音频文件建议使用CDN或外部存储
3. **域名**：免费版提供 `.vercel.app` 域名
4. **HTTPS**：Vercel自动提供HTTPS证书

## 常见问题解决

### 1. 构建失败
- 检查TypeScript类型错误
- 确保所有依赖都在package.json中

### 2. 静态资源404
- 检查vite.config.ts中的base配置
- 确保资源路径正确

### 3. 音频文件无法播放
- 检查CORS设置
- 确认音频文件格式兼容性

## 部署后测试

1. 测试音频上传功能
2. 测试图片上传功能
3. 测试视频生成功能
4. 测试不同浏览器兼容性
