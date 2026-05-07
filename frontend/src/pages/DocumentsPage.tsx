import { useState, useEffect, useCallback, useRef } from "react";
import { UploadArea } from "@/components/documents/UploadArea";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Document } from "@/types";

export function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const initialized = useRef(false);

    const fetchDocuments = useCallback(async () => {
        try {
            const docs = await api.getDocuments();
            setDocuments(docs);
        } catch {
            toast.error("Failed to load documents.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            fetchDocuments();
        }
    }, [fetchDocuments]);

    // Poll for processing documents
    useEffect(() => {
        const hasProcessing = documents.some((d) => d.status === "processing");
        if (!hasProcessing) return;

        const interval = setInterval(fetchDocuments, 3000);
        return () => clearInterval(interval);
    }, [documents, fetchDocuments]);

    const handleDelete = async (id: string) => {
        try {
            await api.deleteDocument(id);
            setDocuments((prev) => prev.filter((d) => d.id !== id));
            toast.success("Document deleted.");
        } catch {
            toast.error("Failed to delete document.");
        }
    };

    return (
        <div className="flex flex-col h-full p-6 max-w-4xl mx-auto w-full gap-6">
            <h2 className="text-2xl font-semibold">Documents</h2>
            <UploadArea onUploadComplete={fetchDocuments} />
            {loading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading documents...</p>
            ) : (
                <DocumentList documents={documents} onDelete={handleDelete} onPreview={setPreviewDoc} />
            )}
            <DocumentPreview
                document={previewDoc}
                open={!!previewDoc}
                onOpenChange={(open) => {
                    if (!open) setPreviewDoc(null);
                }}
            />
        </div>
    );
}
