export interface Document {
    id: string;
    filename: string;
    original_name: string;
    upload_date: string;
    chunk_count: number;
    status: "processing" | "ready" | "error";
}

export interface ChatMessage {
    id: string;
    conversation_id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
}

export interface Conversation {
    conversation_id: string;
    started_at: string;
    last_message_at: string;
    message_count: number;
    title?: string;
}
