import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { Document } from "@/types";

interface DocumentPreviewProps {
    document: Document | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DocumentPreview({ document, open, onOpenChange }: DocumentPreviewProps) {
    if (!document) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{document.original_name}</DialogTitle>
                </DialogHeader>
                <iframe src={api.getDocumentFileUrl(document.id)} className="flex-1 w-full rounded border" title={document.original_name} />
            </DialogContent>
        </Dialog>
    );
}
