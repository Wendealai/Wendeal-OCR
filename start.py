#!/usr/bin/env python3
"""
Zerox OCR 快速启动脚本
提供交互式菜单和功能选择
"""

import os
import sys
import asyncio
import subprocess
from pathlib import Path

# Add py_zerox package to import path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'zerox', 'py_zerox'))

def print_header():
    """打印头部信息"""
    print("🚀 Zerox OCR 快速启动")
    print("=" * 50)

def show_menu():
    """显示主菜单"""
    print("\n请选择操作:")
    print("1. 🧪 运行测试")
    print("2. 📖 查看演示")
    print("3. 🔧 运行OCR")
    print("4. 📋 查看部署状态")
    print("5. 🔑 设置API密钥")
    print("6. 📚 查看文档")
    print("0. 🚪 退出")
    print("-" * 50)

def run_test():
    """运行测试"""
    print("\n🧪 运行Zerox OCR测试...")
    try:
        result = subprocess.run([sys.executable, "test_zerox.py"], 
                              capture_output=True, text=True, check=True)
        print(result.stdout)
        print("✅ 测试完成")
    except subprocess.CalledProcessError as e:
        print(f"❌ 测试失败: {e}")
        print(e.stdout)
        print(e.stderr)

def show_demo():
    """显示演示"""
    print("\n📖 显示Zerox OCR演示...")
    try:
        result = subprocess.run([sys.executable, "demo.py"], 
                              capture_output=True, text=True, check=True)
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"❌ 演示失败: {e}")

def run_ocr():
    """运行OCR"""
    print("\n🔧 运行Zerox OCR...")
    print("注意: 当前API配额已用完，可能需要等待重置")
    
    # 检查API密钥
    if not os.environ.get('GEMINI_API_KEY'):
        print("⚠️  未设置API密钥，请先设置")
        return
    
    try:
        result = subprocess.run([sys.executable, "run_zerox.py"], 
                              capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print("错误信息:")
            print(result.stderr)
    except Exception as e:
        print(f"❌ 运行失败: {e}")

def show_deployment_status():
    """显示部署状态"""
    print("\n📋 部署状态:")
    print("-" * 30)
    
    # 检查Python版本
    python_version = sys.version_info
    print(f"Python版本: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    # 检查虚拟环境
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("虚拟环境: ✅ 已激活")
    else:
        print("虚拟环境: ⚠️  未激活")
    
    # 检查依赖
    required_packages = ['aiofiles', 'aiohttp', 'pdf2image', 'litellm', 'aioshutil', 'PyPDF2']
    print("\n依赖包状态:")
    for package in required_packages:
        try:
            __import__(package)
            print(f"  {package}: ✅")
        except ImportError:
            print(f"  {package}: ❌")
    
    # 检查API密钥
    print("\nAPI密钥状态:")
    api_keys = ['GEMINI_API_KEY', 'OPENAI_API_KEY', 'AZURE_API_KEY']
    for key in api_keys:
        if os.environ.get(key):
            print(f"  {key}: ✅ 已设置")
        else:
            print(f"  {key}: ❌ 未设置")
    
    # 检查输出目录
    output_dir = Path("output_test")
    if output_dir.exists():
        print(f"\n输出目录: ✅ {output_dir} 存在")
    else:
        print(f"\n输出目录: ❌ {output_dir} 不存在")

def set_api_key():
    """设置API密钥"""
    print("\n🔑 设置API密钥")
    print("-" * 30)
    
    print("支持的API提供商:")
    print("1. Google Gemini")
    print("2. OpenAI")
    print("3. Azure OpenAI")
    
    choice = input("\n请选择API提供商 (1-3): ").strip()
    
    if choice == "1":
        key = input("请输入GEMINI_API_KEY: ").strip()
        if key:
            os.environ['GEMINI_API_KEY'] = key
            print("✅ GEMINI_API_KEY 已设置")
        else:
            print("❌ 密钥不能为空")
    elif choice == "2":
        key = input("请输入OPENAI_API_KEY: ").strip()
        if key:
            os.environ['OPENAI_API_KEY'] = key
            print("✅ OPENAI_API_KEY 已设置")
        else:
            print("❌ 密钥不能为空")
    elif choice == "3":
        key = input("请输入AZURE_API_KEY: ").strip()
        if key:
            os.environ['AZURE_API_KEY'] = key
            print("✅ AZURE_API_KEY 已设置")
        else:
            print("❌ 密钥不能为空")
    else:
        print("❌ 无效选择")

def show_documentation():
    """显示文档"""
    print("\n📚 文档和帮助:")
    print("-" * 30)
    
    docs = [
        ("部署文档", "README_DEPLOY.md"),
        ("部署清单", "DEPLOYMENT_CHECKLIST.md"),
        ("官方文档", "https://docs.getomni.ai/zerox"),
        ("LiteLLM文档", "https://docs.litellm.ai/docs/providers"),
        ("GitHub仓库", "https://github.com/getomni-ai/zerox")
    ]
    
    for i, (name, path) in enumerate(docs, 1):
        if path.endswith('.md'):
            if Path(path).exists():
                print(f"{i}. {name}: ✅ 本地文件")
            else:
                print(f"{i}. {name}: ❌ 文件不存在")
        else:
            print(f"{i}. {name}: 🌐 {path}")

def main():
    """主函数"""
    print_header()
    
    while True:
        show_menu()
        choice = input("请输入选择 (0-6): ").strip()
        
        if choice == "0":
            print("👋 再见！")
            break
        elif choice == "1":
            run_test()
        elif choice == "2":
            show_demo()
        elif choice == "3":
            run_ocr()
        elif choice == "4":
            show_deployment_status()
        elif choice == "5":
            set_api_key()
        elif choice == "6":
            show_documentation()
        else:
            print("❌ 无效选择，请重新输入")
        
        input("\n按回车键继续...")

if __name__ == "__main__":
    main()
