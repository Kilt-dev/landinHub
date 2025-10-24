// src/components/CozeChat.js

import React, { useEffect, useRef } from 'react';

// --- Hằng số ---
const COZE_BOT_ID = '7564406577911463952';
const YOUR_COZE_PAT_TOKEN = 'pat_FrrZbPVDVnwl97NleYEMsc9RxKvggAuykeygC0NCI9nSB1ltKbRQD3kGzve6vjgq';
const COZE_SCRIPT_ID = 'coze-web-sdk-script';

const CozeChat = () => {
    const clientRef = useRef(null);

    useEffect(() => {
        const initializeChat = () => {
            if (window.CozeWebSDK && !clientRef.current) {

                // --- ĐÂY LÀ THAY ĐỔI QUAN TRỌNG ---
                // Tạo một ID người dùng ngẫu nhiên mỗi lần tải trang
                const randomUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

                clientRef.current = new window.CozeWebSDK.WebChatClient({
                    config: {
                        bot_id: COZE_BOT_ID,
                        // Cung cấp ID người dùng ngẫu nhiên này cho SDK
                        user_id: randomUserId,
                    },
                    componentProps: {
                        title: 'LandingHub Assistant',
                        description: 'Trợ lý AI của bạn',
                    },
                    auth: {
                        type: 'token',
                        token: YOUR_COZE_PAT_TOKEN,
                        onRefreshToken: () => Promise.resolve(YOUR_COZE_PAT_TOKEN),
                    }
                });
            }
        };

        const loadScript = () => {
            if (document.getElementById(COZE_SCRIPT_ID)) {
                initializeChat();
                return;
            }
            const script = document.createElement('script');
            script.id = COZE_SCRIPT_ID;
            script.src = "https://sf-cdn.coze.com/obj/unpkg-va/flow-platform/chat-app-sdk/1.2.0-beta.6/libs/oversea/index.js";
            script.async = true;
            script.onload = initializeChat;
            document.body.appendChild(script);
        };

        loadScript();

        return () => {
            if (clientRef.current && typeof clientRef.current.destroy === 'function') {
                clientRef.current.destroy();
            }
            const chatWidget = document.querySelector('.web-chat-sdk-container');
            if (chatWidget) {
                chatWidget.parentElement.removeChild(chatWidget);
            }
            clientRef.current = null;
        };
    }, []);

    return null;
};

export default CozeChat;