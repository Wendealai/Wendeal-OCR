# Zerox OCR Web应用

## 🎉 恭喜！精美的Web前端已创建完成

基于Flask的现代化Web界面已成功创建，提供了完整的OCR处理功能。

## 🚀 快速启动

### 方法1：使用启动脚本
```bash
python run_web.py
```

### 方法2：使用浏览器自动打开
```bash
python open_web.py
```

### 方法3：手动启动
```bash
cd web_app
python app.py
```

## 🌐 访问地址

Web应用启动后，在浏览器中访问：
- http://localhost:5000
- http://127.0.0.1:5000

## ✨ 功能特性

### 📤 文件上传
- **拖拽上传**: 直接拖拽文件到上传区域
- **点击上传**: 点击按钮选择文件
- **格式支持**: PDF、DOCX、DOC、PNG、JPG、JPEG、GIF、BMP、TIFF、HTML
- **大小限制**: 最大50MB

### 🤖 AI模型支持
- **OpenAI**: GPT-4 Omni、GPT-4 Omni Mini
- **Google Gemini**: Gemini 1.5 Pro、Gemini 1.5 Flash、Gemini Pro Vision
- **Azure OpenAI**: Azure GPT-4 Omni、Azure GPT-4 Omni Mini

### ⚙️ 高级选项
- **保持格式**: 保持文档原始布局
- **并发处理**: 1-20个并发请求
- **自定义提示**: 自定义系统提示词

### 📊 结果展示
- **实时预览**: Markdown格式预览
- **源码查看**: 原始Markdown源码
- **统计信息**: 处理时间、Token消耗、页面数量
- **一键操作**: 下载、复制、清除

### 🎨 界面特性
- **响应式设计**: 支持桌面和移动设备
- **现代化UI**: Bootstrap 5 + 自定义样式
- **深色主题**: 支持主题切换
- **动画效果**: 流畅的交互动画
- **实时反馈**: Toast通知和进度提示

## 🔧 技术架构

### 后端技术栈
- **Flask**: Python Web框架
- **Flask-CORS**: 跨域支持
- **Zerox OCR**: 核心OCR引擎
- **LiteLLM**: AI模型统一接口

### 前端技术栈
- **Bootstrap 5**: UI组件库
- **Bootstrap Icons**: 图标库
- **Highlight.js**: 代码高亮
- **Marked.js**: Markdown渲染
- **原生JavaScript**: 交互逻辑

### 文件结构
```
web_app/
├── app.py                 # Flask主应用
├── templates/             # HTML模板
│   ├── base.html         # 基础模板
│   └── index.html        # 主页模板
├── static/               # 静态资源
│   ├── css/
│   │   └── style.css     # 样式文件
│   ├── js/
│   │   ├── main.js       # 主要功能
│   │   └── upload.js     # 上传功能
│   └── img/              # 图片资源
├── uploads/              # 上传文件存储
└── outputs/              # 处理结果存储
```

## 🔑 API接口

### 文件上传
- **POST** `/api/upload` - 上传文件
- **POST** `/api/process` - 处理文件
- **GET** `/api/download/<file_id>` - 下载结果

### 系统管理
- **GET** `/api/status` - 系统状态
- **POST** `/api/cleanup` - 清理文件

## 🎯 使用流程

1. **上传文件**: 拖拽或点击上传支持的文件格式
2. **选择模型**: 选择合适的AI模型（默认GPT-4 Omni）
3. **配置选项**: 设置高级选项（可选）
4. **开始处理**: 点击"开始OCR处理"按钮
5. **查看结果**: 在右侧面板查看处理结果
6. **下载保存**: 下载Markdown文件或复制内容

## 🔐 API密钥配置

Web应用已预配置OpenAI API密钥。如需使用其他模型，请设置相应的环境变量：

```bash
# OpenAI (已配置)
export OPENAI_API_KEY="your-openai-key"

# Google Gemini
export GEMINI_API_KEY="your-gemini-key"

# Azure OpenAI
export AZURE_API_KEY="your-azure-key"
```

## 🎨 界面预览

### 主界面
- 左侧：文件上传、模型选择、高级选项
- 右侧：处理结果、统计信息、操作按钮

### 响应式设计
- 桌面端：双列布局
- 移动端：单列堆叠布局

### 主题支持
- 浅色主题（默认）
- 深色主题（可切换）

## 🚨 注意事项

1. **开发模式**: 当前为开发模式，生产环境请使用WSGI服务器
2. **文件安全**: 上传的文件会临时存储在服务器上
3. **API限制**: 请注意各AI服务商的API调用限制
4. **网络要求**: 需要互联网连接访问AI模型API

## 🎊 完成状态

✅ **Web前端创建完成**
- Flask后端应用
- 现代化HTML模板
- 响应式CSS样式
- 交互式JavaScript功能
- 完整的文件上传和处理流程
- 美观的结果展示界面

🎯 **下一步建议**
- 部署到生产环境
- 添加用户认证功能
- 实现历史记录管理
- 优化性能和缓存
- 添加更多文件格式支持

---

**🎉 恭喜！您现在拥有了一个功能完整、界面精美的Zerox OCR Web应用！**
