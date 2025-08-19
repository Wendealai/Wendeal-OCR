/**
 * Zerox OCR Web App - 历史记录页面功能
 * 处理历史记录显示、筛选、操作等
 */

class HistoryManager {
    constructor() {
        this.history = this.loadHistory();
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.initEventListeners();
        this.loadHistoryList();
    }

    // 加载历史记录
    loadHistory() {
        const saved = localStorage.getItem('zerox_history');
        return saved ? JSON.parse(saved) : [];
    }

    // 保存历史记录
    saveHistory() {
        localStorage.setItem('zerox_history', JSON.stringify(this.history));
    }

    // 初始化事件监听器
    initEventListeners() {
        // 刷新按钮
        document.getElementById('refreshHistory')?.addEventListener('click', () => {
            this.loadHistoryList();
        });

        // 清空历史按钮
        document.getElementById('clearHistory')?.addEventListener('click', () => {
            this.clearAllHistory();
        });

        // 筛选器
        document.getElementById('filterStatus')?.addEventListener('change', () => {
            this.applyFilters();
        });
        document.getElementById('filterModel')?.addEventListener('change', () => {
            this.applyFilters();
        });
        document.getElementById('filterDate')?.addEventListener('change', () => {
            this.applyFilters();
        });
        document.getElementById('searchFiles')?.addEventListener('input', Utils.debounce(() => {
            this.applyFilters();
        }, 300));

        // 模态框按钮
        document.getElementById('modalPreviewBtn')?.addEventListener('click', () => {
            this.toggleModalView(true);
        });
        document.getElementById('modalSourceBtn')?.addEventListener('click', () => {
            this.toggleModalView(false);
        });
        document.getElementById('modalDownloadBtn')?.addEventListener('click', () => {
            this.downloadModalResult();
        });
        document.getElementById('modalCopyBtn')?.addEventListener('click', () => {
            this.copyModalResult();
        });
    }

    // 加载历史记录列表
    loadHistoryList() {
        const historyList = document.getElementById('historyList');
        const emptyState = document.getElementById('emptyState');

        if (this.history.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        this.renderHistoryItems();
    }

    // 渲染历史记录项
    renderHistoryItems(items = null) {
        const historyList = document.getElementById('historyList');
        const itemsToRender = items || this.getFilteredItems();
        
        // 清除现有内容（保留空状态）
        const emptyState = document.getElementById('emptyState');
        historyList.innerHTML = '';
        historyList.appendChild(emptyState);

        if (itemsToRender.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        // 分页处理
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageItems = itemsToRender.slice(startIndex, endIndex);

        pageItems.forEach(item => {
            const itemElement = this.createHistoryItemElement(item);
            historyList.appendChild(itemElement);
        });

        // 更新分页
        this.updatePagination(itemsToRender.length);
    }

    // 创建历史记录项元素
    createHistoryItemElement(item) {
        const div = document.createElement('div');
        div.className = 'history-item border rounded p-3 mb-3 fade-in';
        
        const statusClass = item.status === 'success' ? 'success' : 
                           item.status === 'failed' ? 'danger' : 'warning';
        const statusText = item.status === 'success' ? '成功' : 
                          item.status === 'failed' ? '失败' : '处理中';

        const fileIcon = this.getFileIcon(item.fileName);
        const fileType = this.getFileType(item.fileName);

        div.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-2">
                    <div class="text-center">
                        <i class="bi ${fileIcon}" style="font-size: 2rem;"></i>
                        <div class="small text-muted mt-1">${fileType}</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <h6 class="mb-1">${item.fileName}</h6>
                    <small class="text-muted">${Utils.formatFileSize(item.fileSize)} • ${this.formatDate(item.processTime)}</small>
                    <div class="mt-1">
                        <span class="badge bg-${statusClass}">${statusText}</span>
                        <span class="badge bg-info">${item.model}</span>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="small">
                        <div><i class="bi bi-clock me-1"></i>处理时间: ${Utils.formatTime(item.duration / 1000)}</div>
                        <div><i class="bi bi-file-text me-1"></i>页面: ${item.pages}</div>
                        <div><i class="bi bi-cpu me-1"></i>Tokens: ${item.tokens.toLocaleString()}</div>
                    </div>
                </div>
                <div class="col-md-3 text-end">
                    <div class="btn-group btn-group-sm">
                        ${item.status === 'success' ? `
                            <button class="btn btn-outline-primary" onclick="historyManager.viewResult('${item.id}')" title="查看结果">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-outline-success" onclick="historyManager.downloadResult('${item.id}')" title="下载">
                                <i class="bi bi-download"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-outline-info" onclick="historyManager.reprocessFile('${item.id}')" title="重新处理">
                            <i class="bi bi-arrow-clockwise"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="historyManager.deleteHistoryItem('${item.id}')" title="删除">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        return div;
    }

    // 获取文件图标
    getFileIcon(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        const iconMap = {
            'pdf': 'bi-file-earmark-pdf text-danger',
            'docx': 'bi-file-earmark-word text-primary',
            'doc': 'bi-file-earmark-word text-primary',
            'png': 'bi-file-earmark-image text-success',
            'jpg': 'bi-file-earmark-image text-success',
            'jpeg': 'bi-file-earmark-image text-success',
            'gif': 'bi-file-earmark-image text-success',
            'html': 'bi-file-earmark-code text-warning',
            'htm': 'bi-file-earmark-code text-warning'
        };
        return iconMap[ext] || 'bi-file-earmark text-muted';
    }

    // 获取文件类型
    getFileType(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        return ext.toUpperCase();
    }

    // 格式化日期
    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN');
    }

    // 应用筛选器
    applyFilters() {
        const filteredItems = this.getFilteredItems();
        this.currentPage = 1; // 重置到第一页
        this.renderHistoryItems(filteredItems);
    }

    // 获取筛选后的项目
    getFilteredItems() {
        let filtered = [...this.history];

        // 状态筛选
        const statusFilter = document.getElementById('filterStatus').value;
        if (statusFilter) {
            filtered = filtered.filter(item => item.status === statusFilter);
        }

        // 模型筛选
        const modelFilter = document.getElementById('filterModel').value;
        if (modelFilter) {
            filtered = filtered.filter(item => item.model === modelFilter);
        }

        // 日期筛选
        const dateFilter = document.getElementById('filterDate').value;
        if (dateFilter) {
            const filterDate = new Date(dateFilter);
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.processTime);
                return itemDate.toDateString() === filterDate.toDateString();
            });
        }

        // 文件名搜索
        const searchQuery = document.getElementById('searchFiles').value.toLowerCase();
        if (searchQuery) {
            filtered = filtered.filter(item => 
                item.fileName.toLowerCase().includes(searchQuery)
            );
        }

        return filtered;
    }

    // 更新分页
    updatePagination(totalItems) {
        const pagination = document.getElementById('historyPagination');
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);

        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'block';
        // 这里可以添加更详细的分页逻辑
    }

    // 查看结果
    viewResult(itemId) {
        const item = this.history.find(h => h.id === itemId);
        if (!item || !item.result) {
            Utils.showToast('错误', '找不到处理结果', 'error');
            return;
        }

        // 设置模态框内容
        document.getElementById('resultFileName').textContent = item.fileName;
        document.getElementById('modalResultContent').innerHTML = marked.parse(item.result);
        
        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('viewResultModal'));
        modal.show();

        // 保存当前查看的项目
        this.currentViewingItem = item;
    }

    // 切换模态框视图
    toggleModalView(isPreview) {
        const content = document.getElementById('modalResultContent');
        const previewBtn = document.getElementById('modalPreviewBtn');
        const sourceBtn = document.getElementById('modalSourceBtn');

        if (isPreview) {
            content.innerHTML = marked.parse(this.currentViewingItem.result);
            content.classList.add('preview-mode');
            previewBtn.classList.add('active');
            sourceBtn.classList.remove('active');
        } else {
            content.textContent = this.currentViewingItem.result;
            content.classList.remove('preview-mode');
            sourceBtn.classList.add('active');
            previewBtn.classList.remove('active');
        }
    }

    // 下载模态框结果
    downloadModalResult() {
        if (this.currentViewingItem) {
            const filename = `${this.currentViewingItem.fileName.replace(/\.[^/.]+$/, '')}_result.md`;
            Utils.downloadFile(this.currentViewingItem.result, filename);
        }
    }

    // 复制模态框结果
    copyModalResult() {
        if (this.currentViewingItem) {
            Utils.copyToClipboard(this.currentViewingItem.result);
        }
    }

    // 下载结果
    downloadResult(itemId) {
        const item = this.history.find(h => h.id === itemId);
        if (item && item.result) {
            const filename = `${item.fileName.replace(/\.[^/.]+$/, '')}_result.md`;
            Utils.downloadFile(item.result, filename);
        }
    }

    // 重新处理文件
    reprocessFile(itemId) {
        const item = this.history.find(h => h.id === itemId);
        if (item) {
            // 跳转到主页并预填充设置
            localStorage.setItem('reprocess_item', JSON.stringify(item));
            window.location.href = '/';
        }
    }

    // 删除历史记录项
    deleteHistoryItem(itemId) {
        if (confirm('确定要删除这条历史记录吗？')) {
            this.history = this.history.filter(h => h.id !== itemId);
            this.saveHistory();
            this.loadHistoryList();
            Utils.showToast('成功', '历史记录已删除', 'success');
        }
    }

    // 清空所有历史记录
    clearAllHistory() {
        if (confirm('确定要清空所有历史记录吗？此操作不可撤销。')) {
            this.history = [];
            this.saveHistory();
            this.loadHistoryList();
            Utils.showToast('成功', '所有历史记录已清空', 'success');
        }
    }

    // 添加历史记录
    addHistoryItem(item) {
        const historyItem = {
            id: item.id || Date.now().toString(),
            fileName: item.fileName,
            fileSize: item.fileSize,
            model: item.model,
            status: item.status,
            processTime: item.processTime || Date.now(),
            duration: item.duration,
            pages: item.pages,
            tokens: item.tokens,
            result: item.result
        };

        this.history.unshift(historyItem); // 添加到开头
        this.saveHistory();
    }

    // 更新历史记录项状态
    updateHistoryItemStatus(itemId, status, result = null) {
        const item = this.history.find(h => h.id === itemId);
        if (item) {
            item.status = status;
            if (result) {
                item.result = result.content;
                item.duration = result.completion_time;
                item.pages = result.pages;
                item.tokens = result.input_tokens + result.output_tokens;
            }
            this.saveHistory();
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    window.historyManager = new HistoryManager();
});
