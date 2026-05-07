const API_BASE = "http://localhost:3001/api";

export const api = {
    // Documents
    async uploadDocument(file: File): Promise<{ id: string }> {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${API_BASE}/documents`, {
            method: "POST",
            body: formData,
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async getDocuments() {
        const res = await fetch(`${API_BASE}/documents`);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async deleteDocument(id: string) {
        const res = await fetch(`${API_BASE}/documents/${id}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error(await res.text());
    },

    getDocumentFileUrl(id: string): string {
        return `${API_BASE}/documents/${id}/file`;
    },

    // Chat
    async sendMessage(message: string, conversationId?: string): Promise<Response> {
        const res = await fetch(`${API_BASE}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, conversationId }),
        });
        if (!res.ok) throw new Error(await res.text());
        return res;
    },

    async getChatHistory(conversationId: string) {
        const res = await fetch(`${API_BASE}/chat/${conversationId}`);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async getConversations() {
        const res = await fetch(`${API_BASE}/conversations`);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },
};
