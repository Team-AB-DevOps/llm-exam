import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
    role: "user" | "assistant";
    content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
    const isUser = role === "user";

    return (
        <div className={cn("flex gap-3 px-4 py-3", isUser && "flex-row-reverse")}>
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
                {content}
            </div>
        </div>
    );
}
