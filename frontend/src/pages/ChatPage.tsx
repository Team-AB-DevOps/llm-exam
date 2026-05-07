import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { ChatMessage as ChatMessageType, Conversation } from "@/types";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DisplayMessage {
    role: "user" | "assistant";
    content: string;
}

export function ChatPage() {
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchConversations = useCallback(async () => {
        try {
            const convos = await api.getConversations();
            setConversations(convos);
        } catch {
            toast.error("Failed to load conversations.");
        }
    }, []);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            fetchConversations();
        }
    }, [fetchConversations]);

    const loadConversation = async (convId: string) => {
        try {
            const data = await api.getChatHistory(convId);
            setConversationId(convId);
            setMessages(
                data.messages.map((m: ChatMessageType) => ({
                    role: m.role,
                    content: m.content,
                })),
            );
        } catch {
            toast.error("Failed to load conversation.");
        }
    };

    const startNewConversation = () => {
        setConversationId(null);
        setMessages([]);
    };

    const handleSend = async (message: string) => {
        setMessages((prev) => [...prev, { role: "user", content: message }]);
        setIsStreaming(true);

        // Add empty assistant message for streaming
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        try {
            const res = await api.sendMessage(message, conversationId ?? undefined);
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error("No response body");

            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    const json = line.slice(6);

                    try {
                        const event = JSON.parse(json);

                        if (event.type === "meta" && event.conversationId) {
                            setConversationId(event.conversationId);
                        } else if (event.type === "token") {
                            setMessages((prev) => {
                                const updated = [...prev];
                                const last = updated[updated.length - 1];
                                if (last?.role === "assistant") {
                                    updated[updated.length - 1] = {
                                        ...last,
                                        content: last.content + event.content,
                                    };
                                }
                                return updated;
                            });
                        } else if (event.type === "error") {
                            setMessages((prev) => {
                                const updated = [...prev];
                                const last = updated[updated.length - 1];
                                if (last?.role === "assistant") {
                                    updated[updated.length - 1] = {
                                        ...last,
                                        content: event.content,
                                    };
                                }
                                return updated;
                            });
                        }
                    } catch {
                        // skip malformed JSON lines
                    }
                }
            }

            fetchConversations();
        } catch {
            toast.error("Failed to get a response. Please try again.");
            setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") {
                    updated[updated.length - 1] = {
                        ...last,
                        content: "Failed to get a response. Please try again.",
                    };
                }
                return updated;
            });
        } finally {
            setIsStreaming(false);
        }
    };

    return (
        <div className="flex h-full">
            {/* Sidebar */}
            {sidebarOpen && (
                <div className="w-64 border-r flex flex-col bg-secondary/30">
                    <div className="p-3 border-b">
                        <Button variant="outline" className="w-full justify-start gap-2" onClick={startNewConversation}>
                            <Plus className="h-4 w-4" />
                            New Chat
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {conversations.map((conv) => (
                            <button
                                key={conv.conversation_id}
                                onClick={() => loadConversation(conv.conversation_id)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors ${
                                    conv.conversation_id === conversationId
                                        ? "bg-secondary text-secondary-foreground"
                                        : "text-muted-foreground hover:bg-secondary/50"
                                }`}
                            >
                                {conv.title || "New conversation"}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main chat area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Toggle sidebar */}
                <div className="p-2 border-b flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen((o) => !o)} title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}>
                        <MessageSquare className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">{conversationId ? "Conversation" : "New Chat"}</span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto">
                    {messages.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center h-full text-muted-foreground">
                            <div className="text-center space-y-2">
                                <MessageSquare className="h-10 w-10 mx-auto" />
                                <p className="text-lg font-medium">HR Chat Assistant</p>
                                <p className="text-sm">Ask questions about your uploaded HR documents.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4">
                            {messages.map((msg, i) => (
                                <ChatMessage
                                    key={i}
                                    role={msg.role}
                                    content={msg.content}
                                    isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant"}
                                />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input */}
                <ChatInput onSend={handleSend} disabled={isStreaming} />
            </div>
        </div>
    );
}
