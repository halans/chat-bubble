(function () {
    // State & Elements
    let isOpen = false;
    let chatHistory = []; // { role: 'user'|'assistant', content: string }
    let DEBUG = false; // Toggle via config
    let EXPLANATION_TEXT = "Master any concept through explanation. Break down complex ideas into simple terms, identify knowledge gaps as you teach, and build genuine understanding by articulating what you've learned in your own words.";

    // Avoid duplicate initialization
    if (document.getElementById('chat-widget-container')) return;

    // Inject Styles
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles.css';
    document.head.appendChild(link);

    // Inject Marked (Markdown Parser)
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    document.head.appendChild(script);

    // Create Container
    const container = document.createElement('div');
    container.id = 'chat-widget-container';
    container.className = 'chat-widget-container';
    document.body.appendChild(container);

    // Launcher Bubble
    const launcher = document.createElement('div');
    launcher.className = 'chat-launcher';
    launcher.innerHTML = `
        <svg class="icon-open" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path></svg>
        <svg class="icon-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
    `;
    container.appendChild(launcher);

    // Chat Window
    const window = document.createElement('div');
    window.className = 'chat-window';
    window.innerHTML = `
        <div class="chat-header" id="chat-header">
            <div class="chat-title">Learning Assistant</div>
            <div class="chat-close-btn">
                <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
            </div>
            <div class="chat-expand-btn">
                <svg class="icon-expand" viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"></path></svg>
                <svg class="icon-collapse" viewBox="0 0 24 24" style="display:none"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"></path></svg>
            </div>
        </div>
        <div class="chat-messages" id="chat-messages">
            <div class="explanation-box">
                ${EXPLANATION_TEXT}
            </div>
            <div class="message bot">Hello! How can I help you today?</div>
        </div>
        <div class="chat-input-area">
            <div class="input-wrapper">
                <div class="sparkle-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.39 8.26L20.66 10.66L14.39 13.06L12 19.32L9.61 13.06L3.34 10.66L9.61 8.26L12 2Z"></path></svg>
                </div>
                <textarea class="chat-input" placeholder="Ask me anything" id="chat-input" rows="1"></textarea>
                <button class="chat-send-btn" id="chat-send-btn">
                    <svg viewBox="0 0 24 24"><path d="M12 4L12 20M12 4L4 12M12 4L20 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"></path></svg>
                </button>
            </div>
            <div class="chat-actions" style="display: flex; gap: 4px;">
                <button class="chat-action-btn" id="chat-clear-btn" title="Clear History">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
                <button class="chat-action-btn" id="chat-expand-btn" title="Expand/Collapse">
                    <svg class="icon-expand" viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"></path></svg>
                    <svg class="icon-collapse" viewBox="0 0 24 24" style="display:none"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"></path></svg>
                </button>
            </div>
        </div>
    `;
    container.appendChild(window);

    const messagesContainer = document.getElementById('chat-messages');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const clearBtn = document.getElementById('chat-clear-btn');
    const expandBtn = document.getElementById('chat-expand-btn');

    // Auto-Resize Input
    function autoResizeInput() {
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';
    }
    input.addEventListener('input', autoResizeInput);

    // Helper: Debug Logger
    function debugLog(...args) {
        if (DEBUG) console.log('[ChatWidget]', ...args);
    }

    // Config Fetch & Init
    fetch('/api/config')
        .then(res => res.json())
        .then(config => {
            DEBUG = config.debug;
            debugLog('Config loaded:', config);

            // Apply Theme
            if (config.themeColor) {
                document.documentElement.style.setProperty('--chat-primary', config.themeColor);
                document.documentElement.style.setProperty('--chat-user-bg', config.themeColor);
                document.documentElement.style.setProperty('--chat-primary-hover', config.themeColor);
            }
            if (config.themeAccentColor) {
                document.documentElement.style.setProperty('--chat-accent', config.themeAccentColor);
            }

            // Header Visibility Logic
            const headerEl = document.getElementById('chat-header');
            if (config.showHeader) {
                if (headerEl) headerEl.style.display = 'flex';
                // Only hide footer expand if header expand is available/shown
                if (expandBtn) expandBtn.style.display = 'none';
            } else {
                if (headerEl) headerEl.style.display = 'none';
                if (expandBtn) expandBtn.style.display = 'flex';
            }

            // Apply Explanation Text
            if (config.explanationText) {
                EXPLANATION_TEXT = config.explanationText;
                // Update specific element if it exists and hasn't been removed
                const explanationEl = container.querySelector('.explanation-box');
                if (explanationEl) {
                    explanationEl.textContent = EXPLANATION_TEXT;
                }
            }

            if (config.centered) {
                window.classList.add('centered');
                // Auto-open in centered mode
                isOpen = true;
                launcher.classList.add('open');
                window.classList.add('open');
                input.focus();
            }
        })
        .catch(err => console.log('Config fetch error, using defaults', err));

    // Expand Logic
    function toggleExpand() {
        // Toggle 'expanded' class instead of 'centered'
        // 'expanded' css handles centering and size
        const isExpanded = window.classList.toggle('expanded');
        debugLog('Toggle Expand:', isExpanded);

        const updateIcons = (btn) => {
            if (btn) {
                const expandIcon = btn.querySelector('.icon-expand');
                const collapseIcon = btn.querySelector('.icon-collapse');
                if (expandIcon && collapseIcon) {
                    if (isExpanded) {
                        expandIcon.style.display = 'none';
                        collapseIcon.style.display = 'block';
                    } else {
                        expandIcon.style.display = 'block';
                        collapseIcon.style.display = 'none';
                    }
                }
            }
        };

        updateIcons(expandBtn); // Footer button
        const headerExpand = container.querySelector('.chat-header .chat-expand-btn');
        updateIcons(headerExpand); // Header button
    }

    if (expandBtn) {
        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleExpand();
        });
    }

    // Load History
    function loadHistory() {
        const saved = localStorage.getItem('chat_history');
        if (saved) {
            try {
                chatHistory = JSON.parse(saved);
                debugLog('History loaded:', chatHistory.length, 'messages');
                if (chatHistory.length > 0) {
                    // Clear default greeting/explanation if we have history
                    messagesContainer.innerHTML = '';
                }

                chatHistory.forEach(msg => {
                    addMessageToDOM(msg.content, msg.role === 'user' ? 'user' : 'bot');
                });

                // If history exists, ensure scroll to bottom
                setTimeout(scrollToBottom, 50);

            } catch (e) {
                console.error('Failed to parse chat history', e);
            }
        }
    }

    // Wait for marked to load
    const markedInterval = setInterval(() => {
        if (typeof marked !== 'undefined') {
            clearInterval(markedInterval);
            loadHistory();
        }
    }, 100);

    // Clear History Logic
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            debugLog('Clear button clicked');
            e.stopPropagation();
            if (confirm('Clear chat history?')) {
                localStorage.removeItem('chat_history');
                chatHistory = [];

                // Reset UI
                messagesContainer.innerHTML = `
                    <div class="explanation-box">
                        ${EXPLANATION_TEXT}
                    </div>
                    <div class="message bot">Hello! How can I help you today?</div>
                `;
                debugLog('History cleared');
            }
        });
    }

    // Toggle Chat
    launcher.addEventListener('click', () => {
        isOpen = !isOpen;
        debugLog('Toggle:', isOpen ? 'Open' : 'Closed');
        if (isOpen) {
            launcher.classList.add('open');
            window.classList.add('open');
            setTimeout(() => input.focus(), 300);
        } else {
            launcher.classList.remove('open');
            window.classList.remove('open');
        }
    });

    // Send Message Logic
    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        debugLog('Sending message:', text);

        // Reset Input Height
        input.value = '';
        input.style.height = 'auto';

        // Visual Cleanup: Remove explanation box
        const explanation = window.querySelector('.explanation-box');
        if (explanation) {
            explanation.style.opacity = '0';
            setTimeout(() => explanation.remove(), 300);
        }

        // Add User Message
        addMessageToDOM(text, 'user');
        chatHistory.push({ role: 'user', content: text });
        saveHistory();

        // Add Loading Indicator
        const loadingId = addLoading();

        try {
            // Prepare context (last 10 messages)
            // Filter out any messages with null/empty content to avoid OpenAI errors
            const payloadMessages = chatHistory
                .slice(-10)
                .filter(msg => msg.content && typeof msg.content === 'string');

            debugLog('Request Payload:', payloadMessages);

            // Call Backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: payloadMessages })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            debugLog('Response Data:', data);

            removeMessage(loadingId);

            const reply = data.reply;

            if (reply) {
                addMessageToDOM(reply, 'bot');
                chatHistory.push({ role: 'assistant', content: reply });
                saveHistory();
            } else {
                // Fallback if reply is empty
                addMessageToDOM("(No response)", 'error');
                debugLog('Empty response received');
            }

        } catch (error) {
            console.error('Error:', error);
            removeMessage(loadingId);
            addMessageToDOM('Sorry, something went wrong. Please try again.', 'error');
        }
    }

    // Helpers
    function saveHistory() {
        localStorage.setItem('chat_history', JSON.stringify(chatHistory));
    }

    function addMessageToDOM(text, type) {
        const div = document.createElement('div');
        div.className = `message ${type}`;

        // Use markdown for both, or just bot? User asked "Only the response of OpenAI should be formatted"
        // But users might want to see their own code snippets too. 
        // "Only the reponse of OpenAI should be formatted" is specific.
        if (type === 'bot' && typeof marked !== 'undefined') {
            div.innerHTML = marked.parse(text);
        } else {
            div.textContent = text;
        }

        messagesContainer.appendChild(div);
        scrollToBottom();
        return div;
    }

    function addLoading() {
        const id = 'loading-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'typing-indicator';
        div.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        messagesContainer.appendChild(div);
        scrollToBottom();
        return id;
    }

    function removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Event Listeners
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent newline
            sendMessage();
        }
    });

    // Wire up Header Buttons
    const headerEl = document.getElementById('chat-header');
    if (headerEl) {
        const hExpand = headerEl.querySelector('.chat-expand-btn');
        const hClose = headerEl.querySelector('.chat-close-btn');

        if (hExpand) {
            hExpand.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleExpand();
            });
        }

        if (hClose) {
            hClose.addEventListener('click', (e) => {
                e.stopPropagation();
                isOpen = false;
                launcher.classList.remove('open');
                window.classList.remove('open');
            });
        }
    }

})();