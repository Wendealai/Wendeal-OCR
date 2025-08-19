/**
 * Zerox OCR Web App - 文件上传功能
 * 处理文件上传、拖拽、验证和处理
 */

// 文件上传相关元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFileBtn');
const processBtn = document.getElementById('processBtn');

// 文件上传处理
class FileUploader {
    constructor() {
        this.currentFile = null;
        this.initEventListeners();
    }

    // 计算颜色亮度，范围 0(黑) - 1(白)
    static computeLuminanceFromRgbString(rgbString) {
        if (!rgbString) return 1;
        const match = rgbString.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\)/i);
        if (!match) return 1;
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        const a = match[4] === undefined ? 1 : parseFloat(match[4]);
        if (a === 0) return 1; // 透明视为无背景
        // 相对亮度 (sRGB)
        const toLinear = (c) => {
            const cs = c / 255;
            return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
        };
        const rl = toLinear(r);
        const gl = toLinear(g);
        const bl = toLinear(b);
        return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
    }

    // 将过暗背景统一为白色（表头为浅灰）
    lightenDarkBackgrounds(rootElement) {
        if (!rootElement) return;
        const candidates = rootElement.querySelectorAll('table, thead, tbody, tr, td, th');
        candidates.forEach((el) => {
            const style = window.getComputedStyle(el);
            const bg = style.backgroundColor;
            const luminance = FileUploader.computeLuminanceFromRgbString(bg);
            // 阈值 0.75（越小越暗）。深蓝/深灰都会被覆盖
            if (luminance < 0.75) {
                // 表头使用浅灰，其余白色
                const newBg = el.tagName === 'TH' ? '#f8f9fa' : '#ffffff';
                el.style.setProperty('background-color', newBg, 'important');
                el.style.setProperty('background', 'none', 'important');
                el.style.setProperty('background-image', 'none', 'important');
            }
        });
    }

    initEventListeners() {
        // 选择文件按钮
        if (selectFileBtn) {
            selectFileBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }

        // 文件输入变化
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleFileSelect(file);
                }
            });
        }

        // 拖拽事件
        if (uploadArea) {
            uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
            uploadArea.addEventListener('drop', this.handleDrop.bind(this));
            // 不添加uploadArea的点击事件，避免与selectFileBtn冲突
            // 用户可以通过按钮点击或拖拽来选择文件
        }

        // 移除文件按钮
        if (removeFileBtn) {
            removeFileBtn.addEventListener('click', this.removeFile.bind(this));
        }

        // 开始处理按钮
        if (processBtn) {
            processBtn.addEventListener('click', this.startProcessing.bind(this));
        }
    }

    // 处理文件选择
    async handleFileSelect(file) {
        try {
            // 验证文件
            if (!this.validateFile(file)) {
                return;
            }

            // 显示文件信息
            this.showFileInfo(file);

            // 上传文件
            Utils.showLoading('上传文件', '正在上传文件到服务器...');
            Utils.updateProgress(30);
            
            const uploadResult = await API.uploadFile(file);
            
            Utils.updateProgress(100);
            setTimeout(() => {
                Utils.hideLoading();
            }, 500);

            // 保存文件信息
            this.currentFile = {
                ...uploadResult.file,
                originalFile: file
            };

            // 启用处理按钮
            this.enableProcessButton();

            Utils.showToast('上传成功', `文件 "${file.name}" 已成功上传`, 'success');

        } catch (error) {
            Utils.hideLoading();
            Utils.showToast('上传失败', error.message, 'error');
            this.removeFile();
        }
    }

    // 验证文件
    validateFile(file) {
        // 检查文件大小 (50MB)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            Utils.showToast('文件过大', '文件大小不能超过50MB', 'error');
            return false;
        }

        // 检查文件类型
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/gif',
            'image/bmp',
            'image/tiff',
            'text/html'
        ];

        if (!allowedTypes.includes(file.type)) {
            Utils.showToast('不支持的文件类型', '请选择PDF、DOCX、图片或HTML文件', 'error');
            return false;
        }

        return true;
    }

    // 显示文件信息
    showFileInfo(file) {
        if (fileInfo && fileName && fileSize) {
            fileName.textContent = file.name;
            fileSize.textContent = Utils.formatFileSize(file.size);
            fileInfo.style.display = 'block';
        }

        // 隐藏上传区域
        if (uploadArea) {
            uploadArea.style.display = 'none';
        }
    }

    // 移除文件
    removeFile() {
        this.currentFile = null;

        // 隐藏文件信息
        if (fileInfo) {
            fileInfo.style.display = 'none';
        }

        // 显示上传区域
        if (uploadArea) {
            uploadArea.style.display = 'block';
        }

        // 禁用处理按钮
        this.disableProcessButton();

        // 清除文件输入
        if (fileInput) {
            fileInput.value = '';
        }

        // 重置结果区域
        this.resetResultArea();
    }

    // 启用处理按钮
    enableProcessButton() {
        if (processBtn) {
            processBtn.disabled = false;
            processBtn.classList.remove('btn-secondary');
            processBtn.classList.add('btn-success');
        }
    }

    // 禁用处理按钮
    disableProcessButton() {
        if (processBtn) {
            processBtn.disabled = true;
            processBtn.classList.remove('btn-success');
            processBtn.classList.add('btn-secondary');
        }
    }

    // 重置结果区域
    resetResultArea() {
        const initialState = document.getElementById('initialState');
        const processingState = document.getElementById('processingState');
        const resultState = document.getElementById('resultState');

        if (initialState) initialState.style.display = 'block';
        if (processingState) processingState.style.display = 'none';
        if (resultState) resultState.style.display = 'none';
    }

    // 拖拽悬停
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragover');
    }

    // 拖拽离开
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
    }

    // 拖拽放下
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFileSelect(files[0]);
        }
    }

    // 开始处理
    async startProcessing() {
        if (!this.currentFile) {
            Utils.showToast('错误', '请先上传文件', 'error');
            return;
        }

        // 获取选择的模型
        const selectedModel = document.querySelector('input[name="modelSelect"]:checked');
        if (!selectedModel) {
            Utils.showToast('错误', '请选择AI模型', 'error');
            return;
        }

        // 获取高级选项
        const options = this.getProcessingOptions();

        try {
            // 设置处理状态
            isProcessing = true;
            this.showProcessingState();

            // 开始处理
            Utils.showLoading('OCR处理中', '正在使用AI模型处理文档，请耐心等待...');
            Utils.updateProgress(10);
            
            // 模拟进度更新
            const progressInterval = setInterval(() => {
                const currentProgress = parseInt(document.querySelector('#loadingModal .progress-bar').style.width) || 10;
                if (currentProgress < 90) {
                    Utils.updateProgress(currentProgress + Math.random() * 10);
                }
            }, 2000);
            
            const result = await API.processFile(
                this.currentFile.id,
                selectedModel.value,
                options
            );

            clearInterval(progressInterval);
            Utils.updateProgress(100);
            setTimeout(() => {
                Utils.hideLoading();
            }, 500);
            isProcessing = false;

            // 显示结果
            this.showResult(result.result);

            Utils.showToast('处理完成', '文档OCR处理成功完成', 'success');

        } catch (error) {
            Utils.hideLoading();
            isProcessing = false;
            this.showInitialState();
            Utils.showToast('处理失败', error.message, 'error');
        }
    }

    // 获取处理选项
    getProcessingOptions() {
        const options = {};

        // 保持格式
        const maintainFormat = document.getElementById('maintainFormat');
        if (maintainFormat) {
            options.maintain_format = maintainFormat.checked;
        }

        // 并发数
        const concurrency = document.getElementById('concurrency');
        if (concurrency) {
            options.concurrency = parseInt(concurrency.value);
        }

        // 自定义提示
        const customPrompt = document.getElementById('customPrompt');
        if (customPrompt && customPrompt.value.trim()) {
            options.custom_system_prompt = customPrompt.value.trim();
        }

        return options;
    }

    // 显示处理状态
    showProcessingState() {
        const initialState = document.getElementById('initialState');
        const processingState = document.getElementById('processingState');
        const resultState = document.getElementById('resultState');

        if (initialState) initialState.style.display = 'none';
        if (processingState) processingState.style.display = 'block';
        if (resultState) resultState.style.display = 'none';
    }

    // 显示初始状态
    showInitialState() {
        const initialState = document.getElementById('initialState');
        const processingState = document.getElementById('processingState');
        const resultState = document.getElementById('resultState');

        if (initialState) initialState.style.display = 'block';
        if (processingState) processingState.style.display = 'none';
        if (resultState) resultState.style.display = 'none';
    }

    // 显示结果
    showResult(result) {
        currentResult = result;

        // 更新统计信息
        this.updateStatistics(result);

        // 显示结果内容
        this.displayResultContent(result.content);

        // 设置结果状态
        const initialState = document.getElementById('initialState');
        const processingState = document.getElementById('processingState');
        const resultState = document.getElementById('resultState');

        if (initialState) initialState.style.display = 'none';
        if (processingState) processingState.style.display = 'none';
        if (resultState) resultState.style.display = 'block';

        // 绑定结果操作按钮
        this.bindResultButtons();
    }

    // 更新统计信息
    updateStatistics(result) {
        const completionTime = document.getElementById('completionTime');
        const inputTokens = document.getElementById('inputTokens');
        const outputTokens = document.getElementById('outputTokens');
        const pageCount = document.getElementById('pageCount');

        if (completionTime) {
            completionTime.textContent = Utils.formatTime(result.completion_time / 1000);
        }
        if (inputTokens) {
            inputTokens.textContent = result.input_tokens.toLocaleString();
        }
        if (outputTokens) {
            outputTokens.textContent = result.output_tokens.toLocaleString();
        }
        if (pageCount) {
            pageCount.textContent = result.pages;
        }
    }

    // 显示结果内容
    displayResultContent(content) {
        const resultContent = document.getElementById('resultContent');
        if (resultContent) {
            // 检查内容是否已经是HTML格式
            if (content.trim().startsWith('<')) {
                // 直接显示HTML内容
                resultContent.innerHTML = content;
            } else {
                // 使用marked解析Markdown
                resultContent.innerHTML = marked.parse(content);
            }
            
            resultContent.classList.add('preview-mode');
            
            // 灰度层次配色方案 - 强制白色背景
            resultContent.style.setProperty('color', '#2c3e50', 'important'); // 深灰色主文字
            resultContent.style.setProperty('background-color', '#ffffff', 'important'); // 纯白色背景
            
            // 为所有子元素设置颜色
            const allElements = resultContent.querySelectorAll('*');
            allElements.forEach(element => {
                // 移除所有可能的颜色样式
                element.style.removeProperty('color');
                element.removeAttribute('color');
                
                // 灰度层次设置
                let textColor = '#2c3e50'; // 默认深灰色
                
                // 根据元素类型设置不同灰度
                if (element.tagName && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName)) {
                    textColor = '#1a252f'; // 最深灰色 - 标题
                } else if (element.tagName === 'CODE') {
                    textColor = '#495057'; // 中灰色 - 代码
                } else if (element.tagName === 'EM') {
                    textColor = '#495057'; // 中灰色 - 斜体
                } else if (element.tagName === 'STRONG') {
                    textColor = '#1a252f'; // 最深灰色 - 粗体
                }
                
                element.style.setProperty('color', textColor, 'important');
                element.style.setProperty('background-color', 'transparent', 'important');
                
                // 移除任何可能的黑色背景样式
                element.style.removeProperty('background');
                element.removeAttribute('bgcolor');
                
                // 特别处理表格元素
                if (element.tagName === 'TD') {
                    element.style.setProperty('color', '#495057', 'important'); // 中灰色 - 表格内容
                    element.style.setProperty('background-color', '#ffffff', 'important');
                } else if (element.tagName === 'TH') {
                    element.style.setProperty('color', '#1a252f', 'important'); // 最深灰色 - 表头
                    element.style.setProperty('background-color', '#f8f9fa', 'important');
                } else if (element.tagName === 'TR') {
                    element.style.setProperty('background-color', '#ffffff', 'important'); // 强制行背景白色
                } else if (element.tagName === 'TABLE') {
                    element.style.setProperty('background-color', '#ffffff', 'important'); // 强制表格背景白色
                }
                
                // 处理特殊标签
                if (element.tagName === 'PAGE_NUMBER' || element.tagName === 'FONT') {
                    element.style.setProperty('color', '#6c757d', 'important'); // 中等灰色 - 特殊元素
                    element.style.setProperty('background-color', 'transparent', 'important');
                }
            });
            
            // 额外处理：移除任何内联样式中的白色和黑色背景
            const elementsWithStyle = resultContent.querySelectorAll('[style]');
            elementsWithStyle.forEach(element => {
                let style = element.getAttribute('style');
                if (style) {
                    // 替换颜色
                    style = style.replace(/color\s*:\s*[^;]+;?/gi, 'color: #2c3e50 !important;');
                    // 移除黑色背景
                    style = style.replace(/background(-color)?\s*:\s*(#000|#000000|black|rgba?\(0,\s*0,\s*0[^)]*\))[^;]*;?/gi, '');
                    // 确保背景透明
                    if (!style.includes('background-color')) {
                        style += ' background-color: transparent !important;';
                    }
                    element.setAttribute('style', style);
                }
            });
            
            // 强制移除所有可能的黑色背景
            resultContent.querySelectorAll('*').forEach(element => {
                const computedStyle = window.getComputedStyle(element);
                if (computedStyle.backgroundColor === 'rgb(0, 0, 0)' || 
                    computedStyle.backgroundColor === '#000000' ||
                    computedStyle.backgroundColor === 'black') {
                    element.style.setProperty('background-color', 'transparent', 'important');
                }
            });
            
            // 专门处理表格背景
            resultContent.querySelectorAll('table, tr, td, th').forEach(tableElement => {
                const computedStyle = window.getComputedStyle(tableElement);
                const bgColor = computedStyle.backgroundColor;
                
                // 如果是深色背景，强制改为白色
                const luminance = FileUploader.computeLuminanceFromRgbString(bgColor);
                if (luminance < 0.75) {
                    
                    if (tableElement.tagName === 'TH') {
                        tableElement.style.setProperty('background-color', '#f8f9fa', 'important');
                    } else {
                        tableElement.style.setProperty('background-color', '#ffffff', 'important');
                    }
                }
            });

            // 再次统一校正，确保无漏网之鱼
            this.lightenDarkBackgrounds(resultContent);
            
            // 高亮代码
            resultContent.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
    }

    // 绑定结果操作按钮
    bindResultButtons() {
        // 下载按钮
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.onclick = () => {
                if (currentResult && this.currentFile) {
                    const filename = `${this.currentFile.original_name.replace(/\.[^/.]+$/, '')}_ocr_result.md`;
                    Utils.downloadFile(currentResult.content, filename);
                }
            };
        }

        // 复制按钮
        const copyBtn = document.getElementById('copyBtn');
        if (copyBtn) {
            copyBtn.onclick = () => {
                if (currentResult) {
                    Utils.copyToClipboard(currentResult.content);
                }
            };
        }

        // 清除按钮
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.onclick = () => {
                this.removeFile();
                currentResult = null;
            };
        }

        // 预览/源码切换按钮
        const previewBtn = document.getElementById('previewBtn');
        const sourceBtn = document.getElementById('sourceBtn');
        const resultContent = document.getElementById('resultContent');

        if (previewBtn && sourceBtn && resultContent) {
            previewBtn.onclick = () => {
                if (currentResult) {
                    // 检查内容格式
                    if (currentResult.content.trim().startsWith('<')) {
                        resultContent.innerHTML = currentResult.content;
                    } else {
                        resultContent.innerHTML = marked.parse(currentResult.content);
                    }
                    
                    resultContent.classList.add('preview-mode');
                    
                    // 灰度层次配色方案 - 强制白色背景
                    resultContent.style.setProperty('color', '#2c3e50', 'important'); // 深灰色主文字
                    resultContent.style.setProperty('background-color', '#ffffff', 'important'); // 纯白色背景
                    const allElements = resultContent.querySelectorAll('*');
                    allElements.forEach(element => {
                        // 移除所有可能的颜色样式
                        element.style.removeProperty('color');
                        element.removeAttribute('color');
                        
                        // 强制设置颜色 - 白色背景，黑色文字
                        element.style.setProperty('color', '#000000', 'important');
                        element.style.setProperty('background-color', 'transparent', 'important');
                        
                        // 特别处理表格元素
                        if (element.tagName === 'TD') {
                            element.style.setProperty('color', '#495057', 'important'); // 中灰色 - 表格内容
                            element.style.setProperty('background-color', '#ffffff', 'important');
                        } else if (element.tagName === 'TH') {
                            element.style.setProperty('color', '#1a252f', 'important'); // 最深灰色 - 表头
                            element.style.setProperty('background-color', '#f8f9fa', 'important');
                        } else if (element.tagName === 'TR') {
                            element.style.setProperty('background-color', '#ffffff', 'important'); // 强制行背景白色
                        } else if (element.tagName === 'TABLE') {
                            element.style.setProperty('background-color', '#ffffff', 'important'); // 强制表格背景白色
                        }
                        
                        // 处理特殊标签
                        if (element.tagName === 'PAGE_NUMBER' || element.tagName === 'FONT') {
                            element.style.setProperty('color', '#000000', 'important');
                            element.style.setProperty('background-color', 'transparent', 'important');
                        }
                    });
                    
                    // 额外处理内联样式
                    const elementsWithStyle = resultContent.querySelectorAll('[style*="color"]');
                    elementsWithStyle.forEach(element => {
                        const style = element.getAttribute('style');
                        if (style) {
                            const newStyle = style.replace(/color\s*:\s*[^;]+;?/gi, 'color: #000000 !important;');
                            element.setAttribute('style', newStyle);
                        }
                    });
                    
                    resultContent.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightElement(block);
                    });
                }
                previewBtn.classList.add('active');
                sourceBtn.classList.remove('active');
            };

            sourceBtn.onclick = () => {
                if (currentResult) {
                    resultContent.textContent = currentResult.content;
                    resultContent.classList.remove('preview-mode');
                    resultContent.style.color = '#212529';
                }
                sourceBtn.classList.add('active');
                previewBtn.classList.remove('active');
            };
        }
    }
}

// 初始化文件上传器
document.addEventListener('DOMContentLoaded', function() {
    window.fileUploader = new FileUploader();
});
