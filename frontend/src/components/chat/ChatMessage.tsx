import { useState, useEffect } from "react";
import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
    role: "user" | "assistant";
    content: string;
    isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
    const isUser = role === "user";
    const [prevLen, setPrevLen] = useState(0);

    const stableContent = !isUser && isStreaming ? content.slice(0, prevLen) : content;
    const newContent = !isUser && isStreaming ? content.slice(prevLen) : "";

    useEffect(() => {
        const id = requestAnimationFrame(() => setPrevLen(content.length));
        return () => cancelAnimationFrame(id);
    }, [content.length]);

    return (
        <div className={cn("flex gap-3 px-4 py-3 animate-fade-in", isUser && "flex-row-reverse")}>
            <div
                className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                )}
            >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div
                className={cn(
                    "rounded-lg px-4 py-2 max-w-[75%] text-sm whitespace-pre-wrap",
                    isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                )}
            >
                {!isUser && content === "" ? (
                    <span className="flex gap-1 py-1">
                        <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-bounce [animation-delay:0ms]" />
                        <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-bounce [animation-delay:300ms]" />
                    </span>
                ) : (
                    <>
                        {stableContent}
                        {newContent && <span className="animate-streaming">{newContent}</span>}
                    </>
                )}
            </div>
        </div>
    );
}
