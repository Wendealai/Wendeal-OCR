/**
 * Zerox OCR Web App - 预览功能
 * 处理Markdown预览和结果展示
 */

// 预览相关功能
class PreviewManager {
    constructor() {
        this.initEventListeners();
    }

    initEventListeners() {
        // 预览/源码切换按钮事件已在upload.js中处理
        // 这里主要处理其他预览相关功能
        
        // 监听结果内容变化
        this.observeResultChanges();
        
        // 初始化代码高亮
        this.initCodeHighlighting();
    }

    // 监听结果内容变化
    observeResultChanges() {
        const resultContent = document.getElementById('resultContent');
        if (resultContent) {
            // 使用MutationObserver监听DOM变化
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' || mutation.type === 'characterData') {
                        this.updateCodeHighlighting();
                    }
                });
            });

            observer.observe(resultContent, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }
    }

    // 初始化代码高亮
    initCodeHighlighting() {
        if (typeof hljs !== 'undefined') {
            hljs.configure({
                languages: ['markdown', 'javascript', 'python', 'html', 'css', 'json']
            });
        }
    }

    // 更新代码高亮
    updateCodeHighlighting() {
        if (typeof hljs !== 'undefined') {
            const codeBlocks = document.querySelectorAll('#resultContent pre code');
            codeBlocks.forEach((block) => {
                if (!block.classList.contains('hljs')) {
                    hljs.highlightElement(block);
                }
            });
        }
    }

    // 格式化Markdown内容
    formatMarkdown(content) {
        if (typeof marked === 'undefined') {
            return content;
        }

        // 配置marked选项
        marked.setOptions({
            breaks: true,
            gfm: true,
            tables: true,
            sanitize: false
        });

        return marked.parse(content);
    }

    // 显示预览内容
    showPreview(content) {
        const resultContent = document.getElementById('resultContent');
        if (resultContent && content) {
            resultContent.innerHTML = this.formatMarkdown(content);
            resultContent.classList.add('preview-mode');
            this.updateCodeHighlighting();
        }
    }

    // 显示源码内容
    showSource(content) {
        const resultContent = document.getElementById('resultContent');
        if (resultContent && content) {
            resultContent.textContent = content;
            resultContent.classList.remove('preview-mode');
        }
    }

    // 复制内容到剪贴板
    async copyContent(content) {
        try {
            await navigator.clipboard.writeText(content);
            Utils.showToast('复制成功', '内容已复制到剪贴板', 'success');
        } catch (err) {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = content;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            Utils.showToast('复制成功', '内容已复制到剪贴板', 'success');
        }
    }

    // 下载内容为文件
    downloadContent(content, filename) {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 清理预览内容
    clearPreview() {
        const resultContent = document.getElementById('resultContent');
        if (resultContent) {
            resultContent.innerHTML = '';
            resultContent.classList.remove('preview-mode');
        }
    }

    // 设置预览模式
    setPreviewMode(isPreview) {
        const previewBtn = document.getElementById('previewBtn');
        const sourceBtn = document.getElementById('sourceBtn');
        
        if (previewBtn && sourceBtn) {
            if (isPreview) {
                previewBtn.classList.add('active');
                sourceBtn.classList.remove('active');
            } else {
                previewBtn.classList.remove('active');
                sourceBtn.classList.add('active');
            }
        }
    }

    // 获取当前内容
    getCurrentContent() {
        const resultContent = document.getElementById('resultContent');
        if (resultContent) {
            return resultContent.classList.contains('preview-mode') 
                ? resultContent.textContent 
                : resultContent.textContent;
        }
        return '';
    }

    // 滚动到顶部
    scrollToTop() {
        const resultContent = document.getElementById('resultContent');
        if (resultContent) {
            resultContent.scrollTop = 0;
        }
    }

    // 滚动到底部
    scrollToBottom() {
        const resultContent = document.getElementById('resultContent');
        if (resultContent) {
            resultContent.scrollTop = resultContent.scrollHeight;
        }
    }
}

// 导出到全局作用域
window.PreviewManager = PreviewManager;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    window.previewManager = new PreviewManager();
});
