#!/usr/bin/env python3
"""
Zerox OCR 功能演示脚本
展示项目配置和使用方法
"""

import os
import sys
import asyncio
from pathlib import Path

# Add py_zerox package to import path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'zerox', 'py_zerox'))

def print_banner():
    """打印项目横幅"""
    print("=" * 60)
    print("🚀 Zerox OCR - AI驱动的文档OCR工具")
    print("=" * 60)
    print("基于AI视觉模型的文档转Markdown工具")
    print("支持PDF、DOCX、图片等多种格式")
    print("=" * 60)

def show_configuration():
    """显示当前配置"""
    print("\n📋 当前配置:")
    print("-" * 40)
    
    # Python环境
    print(f"Python版本: {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")
    
    # 虚拟环境
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("虚拟环境: ✅ 已激活")
    else:
        print("虚拟环境: ⚠️  未激活")
    
    # API密钥
    api_keys = {
        'GEMINI_API_KEY': os.environ.get('GEMINI_API_KEY'),
        'OPENAI_API_KEY': os.environ.get('OPENAI_API_KEY'),
        'AZURE_API_KEY': os.environ.get('AZURE_API_KEY')
    }
    
    print("\n🔑 API密钥配置:")
    for key, value in api_keys.items():
        if value:
            print(f"  {key}: ✅ 已设置")
        else:
            print(f"  {key}: ❌ 未设置")

def show_supported_models():
    """显示支持的模型"""
    print("\n🤖 支持的AI模型:")
    print("-" * 40)
    
    models = {
        "Google Gemini": [
            "gemini/gemini-1.5-pro",
            "gemini/gemini-1.5-flash", 
            "gemini/gemini-pro-vision"
        ],
        "OpenAI": [
            "gpt-4o",
            "gpt-4o-mini"
        ],
        "Azure OpenAI": [
            "azure/gpt-4o",
            "azure/gpt-4o-mini"
        ]
    }
    
    for provider, model_list in models.items():
        print(f"\n{provider}:")
        for model in model_list:
            print(f"  • {model}")

def show_usage_examples():
    """显示使用示例"""
    print("\n💡 使用示例:")
    print("-" * 40)
    
    examples = [
        {
            "title": "基本OCR处理",
            "description": "将PDF文件转换为Markdown",
            "code": """
import asyncio
from pyzerox.core.zerox import zerox

async def basic_ocr():
    result = await zerox(
        file_path="document.pdf",
        model="gemini/gemini-1.5-pro",
        output_dir="./output"
    )
    print(result)
"""
        },
        {
            "title": "自定义配置",
            "description": "使用自定义参数进行OCR",
            "code": """
async def custom_ocr():
    result = await zerox(
        file_path="document.pdf",
        model="gemini/gemini-1.5-pro",
        output_dir="./output",
        concurrency=5,           # 并发数
        maintain_format=True,    # 保持格式
        select_pages=[1, 3, 5],  # 选择特定页面
        custom_system_prompt="请将文档转换为结构化的Markdown格式"
    )
"""
        },
        {
            "title": "批量处理",
            "description": "处理多个文件",
            "code": """
import os
from pathlib import Path

async def batch_ocr():
    pdf_dir = Path("./documents")
    for pdf_file in pdf_dir.glob("*.pdf"):
        result = await zerox(
            file_path=str(pdf_file),
            model="gemini/gemini-1.5-pro",
            output_dir=f"./output/{pdf_file.stem}"
        )
        print(f"处理完成: {pdf_file.name}")
"""
        }
    ]
    
    for i, example in enumerate(examples, 1):
        print(f"\n{i}. {example['title']}")
        print(f"   {example['description']}")
        print(f"   ```python{example['code']}   ```")

def show_file_formats():
    """显示支持的文件格式"""
    print("\n📄 支持的文件格式:")
    print("-" * 40)
    
    formats = {
        "PDF文件": "*.pdf",
        "Word文档": "*.docx, *.doc",
        "图片文件": "*.png, *.jpg, *.jpeg, *.gif, *.bmp, *.tiff",
        "网页文件": "*.html, *.htm"
    }
    
    for format_name, extensions in formats.items():
        print(f"  {format_name}: {extensions}")

def show_output_format():
    """显示输出格式"""
    print("\n📝 输出格式:")
    print("-" * 40)
    
    print("Zerox OCR 将文档转换为结构化的Markdown格式，包括:")
    print("  • 标题层级结构")
    print("  • 表格转换")
    print("  • 列表和编号")
    print("  • 代码块")
    print("  • 图片引用")
    print("  • 链接保持")

def show_performance_tips():
    """显示性能优化建议"""
    print("\n⚡ 性能优化建议:")
    print("-" * 40)
    
    tips = [
        "调整并发数 (concurrency) 以平衡速度和资源使用",
        "使用 select_pages 参数只处理需要的页面",
        "选择合适的模型 (Flash版本更快，Pro版本更准确)",
        "设置合适的图像密度 (image_density) 平衡质量和速度",
        "使用 temp_dir 参数指定临时文件目录"
    ]
    
    for i, tip in enumerate(tips, 1):
        print(f"  {i}. {tip}")

def show_troubleshooting():
    """显示故障排除指南"""
    print("\n🔧 常见问题解决:")
    print("-" * 40)
    
    issues = {
        "API配额限制": "等待配额重置或升级到付费计划",
        "Poppler未找到": "确保已安装Poppler并添加到PATH",
        "模型访问失败": "检查API密钥和模型名称是否正确",
        "内存不足": "减少并发数或分批处理大文件",
        "网络超时": "检查网络连接或增加超时时间"
    }
    
    for issue, solution in issues.items():
        print(f"  • {issue}: {solution}")

def main():
    """主函数"""
    print_banner()
    show_configuration()
    show_supported_models()
    show_file_formats()
    show_output_format()
    show_usage_examples()
    show_performance_tips()
    show_troubleshooting()
    
    print("\n" + "=" * 60)
    print("🎯 下一步:")
    print("1. 设置有效的API密钥")
    print("2. 准备要处理的文档")
    print("3. 运行: python run_zerox.py")
    print("4. 查看输出目录中的结果")
    print("=" * 60)

if __name__ == "__main__":
    main()
