import "/Users/anvesh/Work/code_commit/react-chatbot/src/styles/chatbot.css"
import React, { useState, useEffect,useRef } from 'react';
import axios from 'axios';

const Chatbot = () => {
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);

    const inputRef = useRef(null);

    useEffect(() => {
        setMessages([
            { type: 'bot', text: 'Hello! I am your chatbot assistant. How can I help you?' },
        ]);
    }, []);

    const toggleChat = () => {
        setShowChat(!showChat);
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const sendMessage = async () => {
        if (inputText.trim() === '') return;

        const newMessage = { type: 'user', text: inputText };
        setInputText('');

        try {
            if (inputText.trim().toLowerCase().includes('invoice details')) {
                setMessages(prevMessages => [...prevMessages, newMessage]);
                setMessages(prevMessages => [
                    ...prevMessages,
                    { type: 'bot', text: 'Sure! Please provide the ID for which you need invoice details.' }
                ]);
            } else {
                const userId = inputText.trim();
                const relevantEndpoints = [
                    '/find/trans',
                    '/find/customerTrackingNumber',
                    '/find/carrierCode',
                    '/find/trackingNumber',
                    '/find/trackingNumberUniqueId',
                    '/find/meterNumber',
                    '/find/goodsClassificationCode',
                    '/find/latestStatusCode'
                ];

                console.log(userId);

                let responseData = null;
                for (const endpoint of relevantEndpoints) {
                    try {
                        const response = await axios.get(`http://localhost:8080${endpoint}/${userId}`);
                        if (response && response.status === 200 && response.data) {
                            responseData = response.data;
                            break;
                        }
                    } catch (error) {
                        console.error(`Error sending request to ${endpoint}:`, error);
                    }
                }

                if (responseData) {
                    const tableRows = responseData.map((data, index) => (
                        <tr key={index}>
                            {Object.values(data).map((value, index) => (
                                <td key={index}>{JSON.stringify(value)}</td>
                            ))}
                        </tr>
                    ));
                    const botMessage = {
                        type: 'bot',
                        text: (
                            <div className="table-container">
                                <button className="download-btn" onClick={() => downloadTable(responseData)}>Download Table</button>
                                <table className="table">
                                    <tbody>
                                        <tr>
                                            {Object.keys(responseData[0]).map((key, index) => (
                                                <th key={index}>{key}</th>
                                            ))}
                                        </tr>
                                        {tableRows}
                                    </tbody>
                                </table>
                            </div>
                        )
                    };
                    setMessages(prevMessages => [...prevMessages, newMessage, botMessage]);
                } else {
                    setMessages(prevMessages => [
                        ...prevMessages, newMessage,
                        { type: 'bot', text: 'Sorry, unable to retrieve data from any relevant endpoint.' }
                    ]);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };
    const downloadTable = (data) => {
        const headers = Object.keys(data[0]);
        let csvContent = '';
        csvContent += headers.join(',') + '\n';
        data.forEach(row => {
            const rowData = headers.map(header => {
                const value = row[header];
                const formattedValue = typeof value === 'object' ? JSON.stringify(value) : value;
                return typeof formattedValue === 'string' && (formattedValue.includes(',') || formattedValue.includes('\n'))
                    ? `"${formattedValue.replace(/"/g, '""')}"`
                    : formattedValue;
            });
            csvContent += rowData.join(',') + '\n';
        });
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'table.csv');

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div className={`chatbot-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
            <div className={`chat-button ${showChat ? 'active' : ''}`} onClick={toggleChat}>
                <i className={`fas ${showChat ? 'fa-times' : 'fa-comment-alt'}`}></i>
            </div>
            {showChat && (

                <div className={`chat-window ${isFullscreen ? 'fullscreen' : ''}`}>
                    <div className="chat-header">
                        <div className="title">Chatbot</div>
                        <div className="close-expand-container">
                            <div className="fullscreen-button" onClick={toggleFullscreen}>
                                <i className={`fas ${isFullscreen ? 'fa-compress-arrows-alt' : 'fa-expand-arrows-alt'}`}></i>
                            </div>
                            <div className="close-button" onClick={toggleChat}>
                                <i className="fas fa-times"></i>
                            </div>
                        </div>
                    </div>
                    <div className="msg-container">
                    <div className="bot-response-container">
                        <div className={`bot-response ${isFullscreen ? 'expanded' : ''}`}>
                            {messages.map((message, index) => (
                                <div key={index} className={`${message.type}-inbox inbox`}>
                                    <div className={`msg-header ${message.type === 'user' ? 'right' : 'left'}`}>
                                        {message.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                        </div>
                    </div>
                    <div className="typing-field">
                        <div className="input-data">
                            <input
                                ref={inputRef}
                                id="data"
                                type="text"
                                placeholder="Type something here.."
                                value={inputText}
                                onKeyDown={handleKeyDown} 
                                onChange={(e) => setInputText(e.target.value)}
                                required
                            />
                            <button id="send-btn" onClick={sendMessage}>Send</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chatbot;
