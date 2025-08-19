#!/usr/bin/env python3
"""
打开Zerox OCR Web应用的浏览器脚本
"""

import webbrowser
import time
import requests
import subprocess
import sys

def wait_for_server(url, timeout=30):
    """等待服务器启动"""
    print(f"等待服务器启动 ({url})...")
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print("✅ 服务器已启动")
                return True
        except requests.exceptions.RequestException:
            pass
        time.sleep(1)
    
    print("❌ 服务器启动超时")
    return False

def main():
    """主函数"""
    print("🌐 启动Zerox OCR Web应用")
    print("=" * 50)
    
    # 启动Web服务器
    print("正在启动Web服务器...")
    try:
        # 在后台启动Web应用
        subprocess.Popen([
            sys.executable, "run_web.py"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # 等待服务器启动
        if wait_for_server("http://localhost:5000"):
            print("🚀 正在打开浏览器...")
            webbrowser.open("http://localhost:5000")
            print("\n✅ Web应用已在浏览器中打开")
            print("🔗 访问地址: http://localhost:5000")
            print("\n功能特性:")
            print("  • 支持PDF、DOCX、图片等多种格式")
            print("  • 支持OpenAI GPT-4、Google Gemini等多种AI模型")
            print("  • 拖拽上传、实时预览")
            print("  • Markdown输出、一键下载")
            print("\n按 Ctrl+C 停止服务器")
            
            # 保持脚本运行
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\n👋 Web应用已停止")
        else:
            print("❌ 无法启动Web服务器")
            
    except Exception as e:
        print(f"❌ 启动失败: {e}")

if __name__ == '__main__':
    main()
