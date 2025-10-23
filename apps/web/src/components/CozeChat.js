// src/components/CozeChat.js

import React, { useEffect } from 'react';

// --- Hằng số chứa token của bạn ---
const COZE_BOT_ID = '7564406577911463952';
const YOUR_COZE_PAT_TOKEN = 'pat_FrrZbPVDVnwl97NleYEMsc9RxKvggAuykeygC0NCI9nSB1ltKbRQD3kGzve6vjgq';

const CozeChat = () => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://sf-cdn.coze.com/obj/unpkg-va/flow-platform/chat-app-sdk/1.2.0-beta.6/libs/oversea/index.js";
        script.async = true;

        script.onload = () => {
            if (window.CozeWebSDK) {
                new window.CozeWebSDK.WebChatClient({
                    config: {
                        bot_id: COZE_BOT_ID,
                    },
                    componentProps: {
                        title: 'LandingHub Assistant',
                        description: 'Trợ lý AI của bạn',
                    },
                    // SỬA LẠI CHO ĐÚNG:
                    // Sử dụng hằng số YOUR_COZE_PAT_TOKEN đã khai báo ở trên
                    auth: {
                        type: 'token',
                        token: YOUR_COZE_PAT_TOKEN,
                        onRefreshToken: () => YOUR_COZE_PAT_TOKEN,
                    }
                });
            }
        };

        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
            const chatWidget = document.querySelector('.web-chat-sdk-container');
            if (chatWidget) {
                chatWidget.remove();
            }
        };
    }, []);

    return null;
};

export default CozeChat;