# Zerox OCR 部署指南

## 项目简介

Zerox OCR 是一个基于AI视觉模型的文档OCR工具，支持将PDF、DOCX、图片等文档转换为Markdown格式。支持多种AI提供商，包括OpenAI、Azure OpenAI、AWS Bedrock、Google Gemini等。

## 系统要求

- Windows 10/11
- Python 3.11 或更高版本
- PowerShell 5.0 或更高版本
- 网络连接（用于下载依赖和API调用）

## 快速部署

### 1. 自动部署（推荐）

运行自动部署脚本：

```powershell
.\deploy.ps1
```

### 2. 手动部署

#### 步骤1：克隆项目
```bash
git clone <repository-url>
cd "Zerox OCR"
```

#### 步骤2：创建虚拟环境
```powershell
python -m venv .venv
.venv\Scripts\activate
```

#### 步骤3：安装依赖
```powershell
python -m pip install --upgrade pip
python -m pip install -r zerox/pyproject.toml
```

#### 步骤4：安装Poppler
```powershell
winget install oschwartz10612.Poppler
```

#### 步骤5：配置环境变量
```powershell
$env:PATH += ";C:\Users\$env:USERNAME\AppData\Local\Microsoft\WinGet\Packages\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\poppler-24.08.0\Library\bin"
```

## 配置API密钥

### Google Gemini API
```powershell
$env:GEMINI_API_KEY="your-gemini-api-key"
```

### OpenAI API
```powershell
$env:OPENAI_API_KEY="your-openai-api-key"
```

### Azure OpenAI
```powershell
$env:AZURE_API_KEY="your-azure-api-key"
$env:AZURE_API_BASE="https://your-endpoint.openai.azure.com"
$env:AZURE_API_VERSION="2023-05-15"
```

## 使用方法

### 基本使用

1. 激活虚拟环境：
```powershell
.venv\Scripts\activate
```

2. 设置API密钥：
```powershell
$env:GEMINI_API_KEY="your-api-key"
```

3. 运行OCR：
```powershell
python run_zerox.py
```

### 自定义使用

修改 `run_zerox.py` 文件中的参数：

```python
file_url = 'your-file-url-or-path'  # 文件URL或本地路径
model = 'gemini/gemini-1.5-pro'     # 使用的模型
out_dir = './output_test'           # 输出目录
```

## 支持的模型

### Google Gemini
- `gemini/gemini-1.5-pro` - Gemini 1.5 Pro
- `gemini/gemini-1.5-flash` - Gemini 1.5 Flash
- `gemini/gemini-pro-vision` - Gemini Pro Vision

### OpenAI
- `gpt-4o` - GPT-4 Omni
- `gpt-4o-mini` - GPT-4 Omni Mini

### Azure OpenAI
- `azure/gpt-4o` - Azure GPT-4 Omni
- `azure/gpt-4o-mini` - Azure GPT-4 Omni Mini

## 故障排除

### 常见问题

1. **Poppler未找到**
   - 确保已安装Poppler：`winget install oschwartz10612.Poppler`
   - 检查PATH环境变量是否正确设置

2. **API密钥错误**
   - 确保API密钥正确设置
   - 检查API密钥是否有效
   - 确认模型名称正确

3. **配额限制**
   - 检查API使用配额
   - 考虑升级到付费计划

4. **依赖安装失败**
   - 确保Python版本正确（3.11+）
   - 尝试升级pip：`python -m pip install --upgrade pip`

### 调试模式

启用详细日志：
```python
import litellm
litellm.set_verbose = True
```

## 输出说明

OCR处理完成后，会在指定的输出目录中生成：
- `{filename}.md` - 转换后的Markdown文件
- 临时文件（自动清理）

## 性能优化

- 调整并发数：修改 `concurrency` 参数
- 选择特定页面：使用 `select_pages` 参数
- 优化图像质量：调整 `image_density` 参数

## 许可证

本项目基于MIT许可证开源。

## 支持

如有问题，请参考：
- [Zerox官方文档](https://docs.getomni.ai/zerox)
- [LiteLLM文档](https://docs.litellm.ai/docs/providers)
- [GitHub Issues](https://github.com/getomni-ai/zerox/issues)
