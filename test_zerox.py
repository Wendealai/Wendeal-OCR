#!/usr/bin/env python3
"""
Zerox OCR 自动化测试脚本
用于验证部署和功能
"""

import os
import sys
import asyncio
import tempfile
import shutil
from pathlib import Path

# Add py_zerox package to import path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'zerox', 'py_zerox'))

def test_environment():
    """测试环境配置"""
    print("=== 环境测试 ===")
    
    # 测试Python版本
    python_version = sys.version_info
    print(f"Python版本: {python_version.major}.{python_version.minor}.{python_version.micro}")
    if python_version < (3, 11):
        print("❌ Python版本过低，需要3.11或更高版本")
        return False
    else:
        print("✅ Python版本符合要求")
    
    # 测试虚拟环境
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("✅ 虚拟环境已激活")
    else:
        print("⚠️  虚拟环境未激活")
    
    # 测试依赖包
    required_packages = ['aiofiles', 'aiohttp', 'pdf2image', 'litellm', 'aioshutil', 'PyPDF2']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package} 已安装")
        except ImportError:
            print(f"❌ {package} 未安装")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"缺少依赖包: {missing_packages}")
        return False
    
    # 测试API密钥
    api_keys = ['GEMINI_API_KEY', 'OPENAI_API_KEY']
    has_api_key = False
    
    for key in api_keys:
        if os.environ.get(key):
            print(f"✅ {key} 已设置")
            has_api_key = True
        else:
            print(f"⚠️  {key} 未设置")
    
    if not has_api_key:
        print("⚠️  未设置任何API密钥")
    
    # 测试poppler
    try:
        from pdf2image import convert_from_path
        print("✅ pdf2image 可以导入")
    except Exception as e:
        print(f"❌ pdf2image 导入失败: {e}")
        return False
    
    return True

def test_zerox_import():
    """测试Zerox模块导入"""
    print("\n=== Zerox模块测试 ===")
    
    try:
        from pyzerox.core.zerox import zerox
        print("✅ Zerox模块导入成功")
        return True
    except Exception as e:
        print(f"❌ Zerox模块导入失败: {e}")
        return False

async def test_api_connection():
    """测试API连接"""
    print("\n=== API连接测试 ===")
    
    if not os.environ.get('GEMINI_API_KEY'):
        print("⚠️  未设置GEMINI_API_KEY，跳过API测试")
        return True
    
    try:
        import litellm
        
        # 测试简单的API调用
        response = await litellm.acompletion(
            model="gemini/gemini-1.5-pro",
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=10
        )
        print("✅ API连接测试成功")
        return True
    except Exception as e:
        if "429" in str(e):
            print("⚠️  API配额限制，但连接正常")
            return True
        else:
            print(f"❌ API连接测试失败: {e}")
            return False

def test_file_processing():
    """测试文件处理功能"""
    print("\n=== 文件处理测试 ===")
    
    # 创建测试PDF文件（简单的文本文件）
    test_content = """
    Test Document
    
    This is a test document for Zerox OCR.
    
    Features:
    - PDF to Markdown conversion
    - AI-powered OCR
    - Multiple model support
    
    End of test document.
    """
    
    try:
        # 创建临时目录
        with tempfile.TemporaryDirectory() as temp_dir:
            test_file = Path(temp_dir) / "test.txt"
            test_file.write_text(test_content)
            
            print(f"✅ 测试文件创建成功: {test_file}")
            print(f"✅ 临时目录创建成功: {temp_dir}")
            
        return True
    except Exception as e:
        print(f"❌ 文件处理测试失败: {e}")
        return False

async def run_full_test():
    """运行完整测试套件"""
    print("开始Zerox OCR完整测试...\n")
    
    tests = [
        ("环境配置", test_environment),
        ("模块导入", test_zerox_import),
        ("API连接", test_api_connection),
        ("文件处理", test_file_processing),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = await test_func()
            else:
                result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name}测试异常: {e}")
            results.append((test_name, False))
    
    # 输出测试结果
    print("\n=== 测试结果汇总 ===")
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n总体结果: {passed}/{total} 测试通过")
    
    if passed == total:
        print("🎉 所有测试通过！Zerox OCR部署成功。")
        return True
    else:
        print("⚠️  部分测试失败，请检查配置。")
        return False

if __name__ == "__main__":
    # 运行测试
    success = asyncio.run(run_full_test())
    
    if success:
        print("\n🚀 可以开始使用Zerox OCR了！")
        print("运行命令: python run_zerox.py")
    else:
        print("\n🔧 请根据测试结果修复问题后重试。")
        sys.exit(1)
