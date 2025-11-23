// Chat Page
let currentConversationId = null;
let messageInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Authentication is checked by auth-guard.js
    // Wait for API to be loaded
    if (!window.API) {
        await new Promise(resolve => {
            const checkAPI = setInterval(() => {
                if (window.API) {
                    clearInterval(checkAPI);
                    resolve();
                }
            }, 100);
        });
    }
    
    // Check if conversation ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('conversationId');
    const orderId = urlParams.get('orderId');
    
    // Load conversations
    await loadConversations();
    
    // If conversation ID provided, open it
    if (conversationId) {
        await openConversation(conversationId);
    } else if (orderId) {
        // Create conversation for order
        await createOrderConversation(orderId);
    }
});

async function loadConversations() {
    const list = document.getElementById('conversationsList');
    
    try {
        const conversations = await window.API.Chat.getConversations();
        
        if (conversations && conversations.length > 0) {
            list.innerHTML = '';
            conversations.forEach(conv => {
                const item = createConversationItem(conv);
                list.appendChild(item);
            });
        } else {
            list.innerHTML = '<div class="no-results">لا توجد محادثات</div>';
        }
    } catch (error) {
        console.error('Error loading conversations:', error);
        list.innerHTML = '<div class="error-message">حدث خطأ في تحميل المحادثات</div>';
    }
}

function createConversationItem(conversation) {
    const item = document.createElement('div');
    item.className = 'conversation-item';
    item.onclick = () => openConversation(conversation.id);
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const otherUser = conversation.participants.find(p => p.id !== user.id);
    
    item.innerHTML = `
        <div class="conversation-avatar">
            ${otherUser?.avatar ? `<img src="${otherUser.avatar}" alt="${otherUser.name}">` : '👤'}
        </div>
        <div class="conversation-info">
            <h4>${otherUser?.name || 'مستخدم'}</h4>
            <p class="conversation-preview">${conversation.lastMessage || 'لا توجد رسائل'}</p>
        </div>
        <div class="conversation-time">
            ${conversation.lastMessageTime ? formatTime(conversation.lastMessageTime) : ''}
        </div>
    `;
    
    return item;
}

async function openConversation(conversationId) {
    currentConversationId = conversationId;
    
    // Update active conversation
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Load messages
    await loadMessages(conversationId);
    
    // Start polling for new messages
    if (messageInterval) clearInterval(messageInterval);
    messageInterval = setInterval(() => loadMessages(conversationId), 3000);
}

async function loadMessages(conversationId) {
    const chatArea = document.getElementById('chatArea');
    
    try {
        const messages = await window.API.Chat.getMessages(conversationId);
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const conversation = await getConversationInfo(conversationId);
        const otherUser = conversation.participants.find(p => p.id !== user.id);
        
        chatArea.innerHTML = `
            <div class="chat-header">
                <div class="chat-user-info">
                    <div class="chat-user-avatar">
                        ${otherUser?.avatar ? `<img src="${otherUser.avatar}" alt="${otherUser.name}">` : '👤'}
                    </div>
                    <h3>${otherUser?.name || 'مستخدم'}</h3>
                </div>
            </div>
            
            <div class="messages-container" id="messagesContainer">
                ${messages.map(msg => createMessageElement(msg, user.id)).join('')}
            </div>
            
            <div class="chat-input-container">
                <input type="text" id="messageInput" placeholder="اكتب رسالة..." class="chat-input">
                <button class="btn btn-primary" id="sendBtn">إرسال</button>
            </div>
        `;
        
        // Scroll to bottom
        const container = document.getElementById('messagesContainer');
        container.scrollTop = container.scrollHeight;
        
        // Setup send button
        document.getElementById('sendBtn').addEventListener('click', sendMessage);
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function createMessageElement(message, currentUserId) {
    const isOwn = message.senderId === currentUserId;
    return `
        <div class="message ${isOwn ? 'message-sent' : 'message-received'}">
            <div class="message-content">
                <p>${message.text}</p>
                <span class="message-time">${formatTime(message.createdAt)}</span>
            </div>
        </div>
    `;
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text || !currentConversationId) return;
    
    try {
        await window.API.Chat.sendMessage(currentConversationId, text);
        input.value = '';
        await loadMessages(currentConversationId);
    } catch (error) {
        console.error('Error sending message:', error);
        alert('فشل إرسال الرسالة');
    }
}

async function createOrderConversation(orderId) {
    try {
        const conversation = await window.API.Chat.createConversation(orderId, null);
        await openConversation(conversation.id);
    } catch (error) {
        console.error('Error creating conversation:', error);
    }
}

async function getConversationInfo(conversationId) {
    // This would typically come from the API
    // For now, we'll get it from conversations list
    const conversations = await window.API.Chat.getConversations();
    return conversations.find(c => c.id === conversationId);
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}


