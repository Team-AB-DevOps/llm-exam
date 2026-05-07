import { Trash2, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Document } from "@/types";

interface DocumentListProps {
    documents: Document[];
    onDelete: (id: string) => void;
    onPreview: (doc: Document) => void;
}

function statusBadge(status: Document["status"]) {
    switch (status) {
        case "ready":
            return <Badge variant="default">Ready</Badge>;
        case "processing":
            return (
                <Badge variant="secondary" className="gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processing
                </Badge>
            );
        case "error":
            return <Badge variant="destructive">Error</Badge>;
    }
}

export function DocumentList({ documents, onDelete, onPreview }: DocumentListProps) {
    if (documents.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-8">No documents uploaded yet.</p>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Chunks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {documents.map((doc) => (
                    <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.original_name}</TableCell>
                        <TableCell>{new Date(doc.upload_date).toLocaleDateString()}</TableCell>
                        <TableCell>{doc.chunk_count}</TableCell>
                        <TableCell>{statusBadge(doc.status)}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => onPreview(doc)} title="Preview">
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => onDelete(doc.id)} title="Delete">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
