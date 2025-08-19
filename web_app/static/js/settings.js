/**
 * Zerox OCR Web App - 设置页面功能
 * 处理API密钥配置、系统设置等
 */

class SettingsManager {
    constructor() {
        this.settings = this.loadSettings();
        this.initEventListeners();
        this.loadCurrentSettings();
    }

    // 加载设置
    loadSettings() {
        const defaultSettings = {
            apiKeys: {
                openai: '',
                gemini: '',
                azure: ''
            },
            system: {
                defaultModel: 'gpt-4o',
                maxFileSize: 50,
                defaultConcurrency: 10,
                autoCleanup: true
            },
            ui: {
                theme: 'light',
                language: 'zh-CN',
                enableAnimations: true
            }
        };

        const saved = localStorage.getItem('zerox_settings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }

    // 保存设置
    saveSettings() {
        localStorage.setItem('zerox_settings', JSON.stringify(this.settings));
    }

    // 初始化事件监听器
    initEventListeners() {
        // API密钥显示/隐藏切换
        document.getElementById('toggleOpenai')?.addEventListener('click', () => {
            this.togglePasswordVisibility('openaiKey', 'toggleOpenai');
        });
        document.getElementById('toggleGemini')?.addEventListener('click', () => {
            this.togglePasswordVisibility('geminiKey', 'toggleGemini');
        });
        document.getElementById('toggleAzure')?.addEventListener('click', () => {
            this.togglePasswordVisibility('azureKey', 'toggleAzure');
        });

        // API密钥保存
        document.getElementById('saveOpenai')?.addEventListener('click', () => {
            this.saveApiKey('openai');
        });
        document.getElementById('saveGemini')?.addEventListener('click', () => {
            this.saveApiKey('gemini');
        });
        document.getElementById('saveAzure')?.addEventListener('click', () => {
            this.saveApiKey('azure');
        });

        // 系统设置
        document.getElementById('saveSettings')?.addEventListener('click', () => {
            this.saveAllSettings();
        });
        document.getElementById('resetSettings')?.addEventListener('click', () => {
            this.resetToDefault();
        });

        // 工具按钮
        document.getElementById('testConnection')?.addEventListener('click', () => {
            this.testApiConnections();
        });
        document.getElementById('clearData')?.addEventListener('click', () => {
            this.clearAllData();
        });

        // 主题切换
        document.getElementById('theme')?.addEventListener('change', (e) => {
            this.applyTheme(e.target.value);
        });
    }

    // 加载当前设置到界面
    async loadCurrentSettings() {
        try {
            // 检查API密钥状态
            const status = await API.checkStatus();
            this.updateApiKeyStatus(status.api_keys);

            // 加载系统设置
            document.getElementById('defaultModel').value = this.settings.system.defaultModel;
            document.getElementById('maxFileSize').value = this.settings.system.maxFileSize;
            document.getElementById('defaultConcurrency').value = this.settings.system.defaultConcurrency;
            document.getElementById('autoCleanup').checked = this.settings.system.autoCleanup;

            // 加载UI设置
            document.getElementById('theme').value = this.settings.ui.theme;
            document.getElementById('language').value = this.settings.ui.language;
            document.getElementById('enableAnimations').checked = this.settings.ui.enableAnimations;

            // 应用主题
            this.applyTheme(this.settings.ui.theme);

        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    // 更新API密钥状态
    updateApiKeyStatus(apiStatus) {
        const statusMap = {
            openai: 'openaiStatus',
            gemini: 'geminiStatus',
            azure: 'azureStatus'
        };

        Object.entries(apiStatus).forEach(([key, configured]) => {
            const statusElement = document.getElementById(statusMap[key]);
            if (statusElement) {
                if (configured) {
                    statusElement.className = 'badge bg-success ms-2';
                    statusElement.textContent = '已配置';
                } else {
                    statusElement.className = 'badge bg-secondary ms-2';
                    statusElement.textContent = '未配置';
                }
            }
        });
    }

    // 切换密码显示/隐藏
    togglePasswordVisibility(inputId, buttonId) {
        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'bi bi-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'bi bi-eye';
        }
    }

    // 保存API密钥
    async saveApiKey(provider) {
        const keyInputs = {
            openai: 'openaiKey',
            gemini: 'geminiKey',
            azure: 'azureKey'
        };

        const input = document.getElementById(keyInputs[provider]);
        const key = input.value.trim();

        if (!key) {
            Utils.showToast('错误', '请输入API密钥', 'error');
            return;
        }

        try {
            // 验证密钥格式
            if (!this.validateApiKey(provider, key)) {
                Utils.showToast('错误', 'API密钥格式不正确', 'error');
                return;
            }

            // 保存到本地存储
            this.settings.apiKeys[provider] = key;
            this.saveSettings();

            // 发送到服务器（如果有相应的API）
            await this.sendApiKeyToServer(provider, key);

            Utils.showToast('成功', `${provider.toUpperCase()} API密钥已保存`, 'success');
            
            // 更新状态
            this.loadCurrentSettings();

        } catch (error) {
            Utils.showToast('错误', `保存API密钥失败: ${error.message}`, 'error');
        }
    }

    // 验证API密钥格式
    validateApiKey(provider, key) {
        const patterns = {
            openai: /^sk-[a-zA-Z0-9]{48,}$/,
            gemini: /^AIzaSy[a-zA-Z0-9_-]{33}$/,
            azure: /^[a-zA-Z0-9]{32}$/
        };

        return patterns[provider] ? patterns[provider].test(key) : true;
    }

    // 发送API密钥到服务器
    async sendApiKeyToServer(provider, key) {
        try {
            const response = await fetch('/api/config/api-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    provider: provider,
                    api_key: key
                })
            });

            if (!response.ok) {
                throw new Error('服务器响应错误');
            }
        } catch (error) {
            console.warn('发送API密钥到服务器失败:', error);
            // 不抛出错误，因为本地存储已成功
        }
    }

    // 保存所有设置
    saveAllSettings() {
        try {
            // 收集系统设置
            this.settings.system.defaultModel = document.getElementById('defaultModel').value;
            this.settings.system.maxFileSize = parseInt(document.getElementById('maxFileSize').value);
            this.settings.system.defaultConcurrency = parseInt(document.getElementById('defaultConcurrency').value);
            this.settings.system.autoCleanup = document.getElementById('autoCleanup').checked;

            // 收集UI设置
            this.settings.ui.theme = document.getElementById('theme').value;
            this.settings.ui.language = document.getElementById('language').value;
            this.settings.ui.enableAnimations = document.getElementById('enableAnimations').checked;

            // 保存设置
            this.saveSettings();

            // 应用设置
            this.applyTheme(this.settings.ui.theme);

            Utils.showToast('成功', '所有设置已保存', 'success');

        } catch (error) {
            Utils.showToast('错误', `保存设置失败: ${error.message}`, 'error');
        }
    }

    // 重置为默认设置
    resetToDefault() {
        if (confirm('确定要重置所有设置为默认值吗？此操作不可撤销。')) {
            localStorage.removeItem('zerox_settings');
            this.settings = this.loadSettings();
            this.loadCurrentSettings();
            Utils.showToast('成功', '设置已重置为默认值', 'success');
        }
    }

    // 应用主题
    applyTheme(theme) {
        const body = document.body;
        
        switch (theme) {
            case 'dark':
                body.classList.add('dark-theme');
                break;
            case 'light':
                body.classList.remove('dark-theme');
                break;
            case 'auto':
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                    body.classList.add('dark-theme');
                } else {
                    body.classList.remove('dark-theme');
                }
                break;
        }
    }

    // 测试API连接
    async testApiConnections() {
        Utils.showLoading('测试连接', '正在测试API连接...');

        try {
            const results = {};
            const providers = ['openai', 'gemini', 'azure'];

            for (const provider of providers) {
                const key = this.settings.apiKeys[provider];
                if (key) {
                    try {
                        const result = await this.testSingleApiConnection(provider, key);
                        results[provider] = result;
                    } catch (error) {
                        results[provider] = { success: false, error: error.message };
                    }
                }
            }

            Utils.hideLoading();
            this.showConnectionTestResults(results);

        } catch (error) {
            Utils.hideLoading();
            Utils.showToast('错误', `测试连接失败: ${error.message}`, 'error');
        }
    }

    // 测试单个API连接
    async testSingleApiConnection(provider, key) {
        const response = await fetch('/api/test-connection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                provider: provider,
                api_key: key
            })
        });

        const result = await response.json();
        return result;
    }

    // 显示连接测试结果
    showConnectionTestResults(results) {
        let message = 'API连接测试结果:\n\n';
        
        Object.entries(results).forEach(([provider, result]) => {
            const status = result.success ? '✅ 成功' : '❌ 失败';
            const error = result.error ? ` (${result.error})` : '';
            message += `${provider.toUpperCase()}: ${status}${error}\n`;
        });

        Utils.showToast('测试结果', message, 'info');
    }

    // 清除所有数据
    clearAllData() {
        if (confirm('确定要清除所有数据吗？包括设置、历史记录和临时文件。此操作不可撤销。')) {
            try {
                // 清除本地存储
                localStorage.clear();
                
                // 清除服务器数据（如果有相应的API）
                this.clearServerData();

                Utils.showToast('成功', '所有数据已清除', 'success');
                
                // 重新加载页面
                setTimeout(() => {
                    window.location.reload();
                }, 2000);

            } catch (error) {
                Utils.showToast('错误', `清除数据失败: ${error.message}`, 'error');
            }
        }
    }

    // 清除服务器数据
    async clearServerData() {
        try {
            await fetch('/api/cleanup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    clear_all: true
                })
            });
        } catch (error) {
            console.warn('清除服务器数据失败:', error);
        }
    }

    // 获取当前设置
    getSettings() {
        return this.settings;
    }

    // 更新设置
    updateSetting(path, value) {
        const keys = path.split('.');
        let current = this.settings;
        
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        this.saveSettings();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    window.settingsManager = new SettingsManager();
});
