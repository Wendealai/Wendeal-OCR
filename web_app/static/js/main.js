/**
 * Zerox OCR Web App - 主要JavaScript文件
 * 包含通用功能、工具函数和事件处理
 */

// 全局变量
let currentFile = null;
let currentResult = null;
let isProcessing = false;

// 工具函数
const Utils = {
    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // 格式化时间
    formatTime(seconds) {
        if (seconds < 60) {
            return `${seconds.toFixed(1)}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    },

    // 显示Toast通知
    showToast(title, message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastTitle = document.getElementById('toastTitle');
        const toastMessage = document.getElementById('toastMessage');
        
        // 设置图标
        let icon = 'bi-info-circle';
        switch (type) {
            case 'success':
                icon = 'bi-check-circle';
                toast.classList.add('bg-success', 'text-white');
                break;
            case 'warning':
                icon = 'bi-exclamation-triangle';
                toast.classList.add('bg-warning', 'text-dark');
                break;
            case 'error':
                icon = 'bi-x-circle';
                toast.classList.add('bg-danger', 'text-white');
                break;
            default:
                toast.classList.add('bg-info', 'text-white');
        }
        
        // 移除其他类型
        toast.classList.remove('bg-success', 'bg-warning', 'bg-danger', 'bg-info', 'text-white', 'text-dark');
        
        // 设置内容
        toastTitle.innerHTML = `<i class="bi ${icon} me-2"></i>${title}`;
        toastMessage.textContent = message;
        
        // 显示Toast
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    },

    // 显示加载模态框
    showLoading(title = '正在处理...', message = '请稍候，这可能需要几分钟时间') {
        const modal = document.getElementById('loadingModal');
        const modalTitle = document.getElementById('loadingTitle');
        const modalMessage = document.getElementById('loadingMessage');
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    },

    // 隐藏加载模态框
    hideLoading() {
        const modal = document.getElementById('loadingModal');
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
            bsModal.hide();
        }
    },

    // 更新进度条
    updateProgress(percent) {
        const progressBar = document.querySelector('#loadingModal .progress-bar');
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
            progressBar.setAttribute('aria-valuenow', percent);
        }
    },

    // 复制文本到剪贴板
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('复制成功', '内容已复制到剪贴板', 'success');
        } catch (err) {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('复制成功', '内容已复制到剪贴板', 'success');
        }
    },

    // 下载文件
    downloadFile(content, filename, mimeType = 'text/markdown') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// API函数
const API = {
    // 检查系统状态
    async checkStatus() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('状态检查失败:', error);
            throw error;
        }
    },

    // 上传文件
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '上传失败');
            }
            
            return data;
        } catch (error) {
            console.error('文件上传失败:', error);
            throw error;
        }
    },

    // 处理文件
    async processFile(fileId, modelId, options = {}) {
        try {
            const response = await fetch('/api/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file_id: fileId,
                    model_id: modelId,
                    options: options
                })
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '处理失败');
            }
            
            return data;
        } catch (error) {
            console.error('文件处理失败:', error);
            throw error;
        }
    },

    // 下载结果
    async downloadResult(fileId) {
        try {
            const response = await fetch(`/api/download/${fileId}`);
            if (!response.ok) {
                throw new Error('下载失败');
            }
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileId}_result.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('下载失败:', error);
            throw error;
        }
    },

    // 清理文件
    async cleanupFiles(fileIds) {
        try {
            const response = await fetch('/api/cleanup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file_ids: fileIds
                })
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '清理失败');
            }
            
            return data;
        } catch (error) {
            console.error('文件清理失败:', error);
            throw error;
        }
    }
};

// 事件处理
document.addEventListener('DOMContentLoaded', function() {
    // 初始化工具提示
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // 系统状态检查
    const statusCheckBtn = document.getElementById('statusCheck');
    if (statusCheckBtn) {
        statusCheckBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                Utils.showLoading('检查系统状态', '正在检查API密钥和系统配置...');
                const status = await API.checkStatus();
                Utils.hideLoading();
                
                let message = '系统状态正常\n';
                message += `支持格式: ${status.supported_formats.join(', ')}\n`;
                message += `最大文件大小: ${Utils.formatFileSize(status.max_file_size)}\n\n`;
                message += 'API密钥状态:\n';
                message += `OpenAI: ${status.api_keys.openai ? '✅ 已配置' : '❌ 未配置'}\n`;
                message += `Gemini: ${status.api_keys.gemini ? '✅ 已配置' : '❌ 未配置'}\n`;
                message += `Azure: ${status.api_keys.azure ? '✅ 已配置' : '❌ 未配置'}`;
                
                Utils.showToast('系统状态', message, 'info');
            } catch (error) {
                Utils.hideLoading();
                Utils.showToast('状态检查失败', error.message, 'error');
            }
        });
    }

    // 主题切换
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const body = document.body;
            if (body.classList.contains('dark-theme')) {
                body.classList.remove('dark-theme');
                localStorage.setItem('theme', 'light');
                Utils.showToast('主题切换', '已切换到浅色主题', 'info');
            } else {
                body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
                Utils.showToast('主题切换', '已切换到深色主题', 'info');
            }
        });
    }

    // 并发数滑块
    const concurrencySlider = document.getElementById('concurrency');
    const concurrencyValue = document.getElementById('concurrencyValue');
    if (concurrencySlider && concurrencyValue) {
        concurrencySlider.addEventListener('input', function() {
            concurrencyValue.textContent = this.value;
        });
    }

    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter: 开始处理
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const processBtn = document.getElementById('processBtn');
            if (processBtn && !processBtn.disabled) {
                processBtn.click();
            }
        }
        
        // Ctrl/Cmd + S: 保存结果
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const downloadBtn = document.getElementById('downloadBtn');
            if (downloadBtn && currentResult) {
                downloadBtn.click();
            }
        }
        
        // Ctrl/Cmd + C: 复制结果
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            const copyBtn = document.getElementById('copyBtn');
            if (copyBtn && currentResult) {
                copyBtn.click();
            }
        }
    });

    // 页面可见性变化处理
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && isProcessing) {
            Utils.showToast('处理继续中', '页面已隐藏，但处理仍在后台继续', 'info');
        }
    });

    // 页面卸载前清理
    window.addEventListener('beforeunload', function(e) {
        if (isProcessing) {
            e.preventDefault();
            e.returnValue = '处理正在进行中，确定要离开吗？';
            return e.returnValue;
        }
    });

    // 加载保存的主题
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
});

// 导出到全局作用域
window.Utils = Utils;
window.API = API;
