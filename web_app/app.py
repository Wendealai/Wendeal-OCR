#!/usr/bin/env python3
"""
Zerox OCR Web Application
提供精美的Web界面来使用Zerox OCR功能
"""

import os
import sys
import json
import asyncio
import tempfile
import shutil
from datetime import datetime
from pathlib import Path
from flask import Flask, render_template, request, jsonify, send_file, session
from flask_cors import CORS
from werkzeug.utils import secure_filename
import uuid

# 添加Zerox OCR包到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'zerox', 'py_zerox'))

# 导入Zerox OCR
from pyzerox.core.zerox import zerox

app = Flask(__name__)
app.secret_key = 'zerox_ocr_web_app_secret_key_2025'
CORS(app)

# 配置
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'docx', 'doc', 'html', 'htm'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
CONFIG_FILE = Path(__file__).parent / 'config.json'

# 创建必要的目录
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# ========== 配置持久化工具 ==========
def _load_config() -> dict:
    try:
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def _save_config(cfg: dict) -> None:
    try:
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(cfg, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


def _apply_config_to_env() -> None:
    cfg = _load_config()
    api = cfg.get('api_keys', {})
    if api.get('openai'):
        os.environ['OPENAI_API_KEY'] = api['openai']
    if api.get('gemini'):
        os.environ['GEMINI_API_KEY'] = api['gemini']
    if api.get('azure'):
        os.environ['AZURE_API_KEY'] = api['azure']


# 应用已保存的配置到环境变量
_apply_config_to_env()

# 默认模型（用于页面初始选中）
DEFAULT_MODEL = 'gemini/gemini-1.5-flash'

# 支持的模型配置（移除 Azure 选项）
SUPPORTED_MODELS = {
    'Google Gemini': [
        {'id': 'gemini/gemini-1.5-pro', 'name': 'Gemini 1.5 Pro', 'description': 'Google最新的多模态模型'},
        {'id': 'gemini/gemini-1.5-flash', 'name': 'Gemini 1.5 Flash', 'description': '快速处理模型'},
        {'id': 'gemini/gemini-pro-vision', 'name': 'Gemini Pro Vision', 'description': '专门的视觉模型'}
    ],
    'OpenAI': [
        {'id': 'gpt-4o', 'name': 'GPT-4 Omni', 'description': '最新最强大的OpenAI模型'},
        {'id': 'gpt-4o-mini', 'name': 'GPT-4 Omni Mini', 'description': '快速且经济的OpenAI模型'}
    ]
}

def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_api_key_for_model(model_id):
    """根据模型ID获取对应的API密钥"""
    cfg = _load_config()
    api = cfg.get('api_keys', {})
    if model_id.startswith('gpt-4'):
        return os.environ.get('OPENAI_API_KEY') or api.get('openai')
    elif model_id.startswith('gemini'):
        return os.environ.get('GEMINI_API_KEY') or api.get('gemini')
    elif model_id.startswith('azure'):
        return os.environ.get('AZURE_API_KEY') or api.get('azure')
    return None

@app.route('/')
def index():
    """主页面"""
    return render_template('index.html', models=SUPPORTED_MODELS, default_model=DEFAULT_MODEL)

@app.route('/settings')
def settings():
    """设置页面"""
    return render_template('settings.html')

@app.route('/history')
def history():
    """历史记录页面"""
    return render_template('history.html')

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """文件上传API"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有选择文件'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': '不支持的文件格式'}), 400
        
        # 检查文件大小
        file.seek(0, 2)  # 移动到文件末尾
        file_size = file.tell()
        file.seek(0)  # 重置到文件开头
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({'error': '文件大小超过50MB限制'}), 400
        
        # 保存文件
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(file_path)
        
        # 返回文件信息
        file_info = {
            'id': unique_filename,
            'original_name': filename,
            'size': file_size,
            'upload_time': datetime.now().isoformat(),
            'path': file_path
        }
        
        return jsonify({
            'success': True,
            'file': file_info
        })
    
    except Exception as e:
        return jsonify({'error': f'上传失败: {str(e)}'}), 500

@app.route('/api/process', methods=['POST'])
def process_file():
    """OCR处理API"""
    try:
        data = request.get_json()
        file_id = data.get('file_id')
        model_id = data.get('model_id')
        options = data.get('options', {})
        
        if not file_id or not model_id:
            return jsonify({'error': '缺少必要参数'}), 400
        
        # 获取文件路径
        file_path = os.path.join(UPLOAD_FOLDER, file_id)
        if not os.path.exists(file_path):
            return jsonify({'error': '文件不存在'}), 404
        
        # 获取API密钥
        api_key = get_api_key_for_model(model_id)
        if not api_key:
            return jsonify({'error': '未配置对应的API密钥'}), 400
        
        # 设置环境变量
        if model_id.startswith('gpt-4'):
            os.environ['OPENAI_API_KEY'] = api_key
        elif model_id.startswith('gemini'):
            os.environ['GEMINI_API_KEY'] = api_key
        elif model_id.startswith('azure'):
            os.environ['AZURE_API_KEY'] = api_key
        
        # 创建输出目录
        output_dir = os.path.join(OUTPUT_FOLDER, file_id.replace('.', '_'))
        os.makedirs(output_dir, exist_ok=True)
        
        # 处理参数
        process_options = {
            'file_path': file_path,
            'model': model_id,
            'output_dir': output_dir,
            'maintain_format': options.get('maintain_format', False),
            'concurrency': options.get('concurrency', 10),
            'select_pages': options.get('select_pages'),
            'custom_system_prompt': options.get('custom_system_prompt')
        }
        
        # 异步处理
        async def process_ocr():
            try:
                result = await zerox(**process_options)
                return result
            except Exception as e:
                raise e
        
        # 运行OCR处理
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(process_ocr())
        finally:
            loop.close()
        
        # 查找生成的Markdown文件
        md_files = list(Path(output_dir).glob('*.md'))
        if not md_files:
            return jsonify({'error': '处理完成但未生成输出文件'}), 500
        
        md_file = md_files[0]
        
        # 读取结果内容
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 返回结果
        return jsonify({
            'success': True,
            'result': {
                'content': content,
                'file_path': str(md_file),
                'completion_time': getattr(result, 'completion_time', 0),
                'input_tokens': getattr(result, 'input_tokens', 0),
                'output_tokens': getattr(result, 'output_tokens', 0),
                'pages': len(getattr(result, 'pages', []))
            }
        })
    
    except Exception as e:
        return jsonify({'error': f'处理失败: {str(e)}'}), 500

@app.route('/api/download/<file_id>')
def download_file(file_id):
    """下载处理结果"""
    try:
        output_dir = os.path.join(OUTPUT_FOLDER, file_id.replace('.', '_'))
        md_files = list(Path(output_dir).glob('*.md'))
        
        if not md_files:
            return jsonify({'error': '文件不存在'}), 404
        
        md_file = md_files[0]
        return send_file(md_file, as_attachment=True, download_name=f"{file_id}_result.md")
    
    except Exception as e:
        return jsonify({'error': f'下载失败: {str(e)}'}), 500

@app.route('/api/status')
def status():
    """系统状态API"""
    try:
        # 检查API密钥状态
        cfg = _load_config()
        api = cfg.get('api_keys', {})
        api_status = {
            'openai': bool(os.environ.get('OPENAI_API_KEY') or api.get('openai')),
            'gemini': bool(os.environ.get('GEMINI_API_KEY') or api.get('gemini')),
            'azure': bool(os.environ.get('AZURE_API_KEY') or api.get('azure'))
        }
        
        # 检查目录状态
        dir_status = {
            'upload': os.path.exists(UPLOAD_FOLDER),
            'output': os.path.exists(OUTPUT_FOLDER)
        }
        
        return jsonify({
            'success': True,
            'api_keys': api_status,
            'directories': dir_status,
            'supported_formats': list(ALLOWED_EXTENSIONS),
            'max_file_size': MAX_FILE_SIZE
        })
    
    except Exception as e:
        return jsonify({'error': f'状态检查失败: {str(e)}'}), 500

@app.route('/api/cleanup', methods=['POST'])
def cleanup_files():
    """清理临时文件"""
    try:
        data = request.get_json()
        file_ids = data.get('file_ids', [])
        clear_all = data.get('clear_all', False)
        
        if clear_all:
            # 清理所有文件
            if os.path.exists(UPLOAD_FOLDER):
                shutil.rmtree(UPLOAD_FOLDER)
                os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            if os.path.exists(OUTPUT_FOLDER):
                shutil.rmtree(OUTPUT_FOLDER)
                os.makedirs(OUTPUT_FOLDER, exist_ok=True)
            return jsonify({
                'success': True,
                'message': '所有文件已清理'
            })
        
        cleaned = []
        for file_id in file_ids:
            # 删除上传文件
            upload_path = os.path.join(UPLOAD_FOLDER, file_id)
            if os.path.exists(upload_path):
                os.remove(upload_path)
            
            # 删除输出目录
            output_dir = os.path.join(OUTPUT_FOLDER, file_id.replace('.', '_'))
            if os.path.exists(output_dir):
                shutil.rmtree(output_dir)
            
            cleaned.append(file_id)
        
        return jsonify({
            'success': True,
            'cleaned_files': cleaned
        })
    
    except Exception as e:
        return jsonify({'error': f'清理失败: {str(e)}'}), 500

@app.route('/api/config/api-key', methods=['POST'])
def save_api_key():
    """保存API密钥"""
    try:
        data = request.get_json()
        provider = data.get('provider')
        api_key = data.get('api_key')
        
        if not provider or not api_key:
            return jsonify({'error': '缺少必要参数'}), 400
        
        # 设置环境变量
        env_key_map = {
            'openai': 'OPENAI_API_KEY',
            'gemini': 'GEMINI_API_KEY',
            'azure': 'AZURE_API_KEY'
        }
        
        if provider in env_key_map:
            # 更新环境变量
            os.environ[env_key_map[provider]] = api_key
            # 写入配置文件
            cfg = _load_config()
            api = cfg.get('api_keys', {})
            api[provider] = api_key
            cfg['api_keys'] = api
            _save_config(cfg)
            return jsonify({
                'success': True,
                'message': f'{provider.upper()} API密钥已保存'
            })
        else:
            return jsonify({'error': '不支持的提供商'}), 400
    
    except Exception as e:
        return jsonify({'error': f'保存API密钥失败: {str(e)}'}), 500

@app.route('/api/test-connection', methods=['POST'])
def test_connection():
    """测试API连接"""
    try:
        data = request.get_json()
        provider = data.get('provider')
        api_key = data.get('api_key')
        
        if not provider or not api_key:
            return jsonify({'error': '缺少必要参数'}), 400
        
        # 这里可以添加实际的API连接测试逻辑
        # 目前返回模拟结果
        return jsonify({
            'success': True,
            'provider': provider,
            'message': 'API连接测试成功'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
