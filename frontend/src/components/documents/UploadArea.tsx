import { useState, useRef, useCallback } from "react";
import { Upload } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface UploadAreaProps {
    onUploadComplete: () => void;
}

export function UploadArea({ onUploadComplete }: UploadAreaProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(
        async (file: File) => {
            if (file.type !== "application/pdf") {
                setProgress("Only PDF files are supported.");
                toast.error("Only PDF files are supported.");
                return;
            }

            setIsUploading(true);
            setProgress(`Uploading ${file.name}...`);

            try {
                await api.uploadDocument(file);
                setProgress(`${file.name} uploaded successfully.`);
                toast.success(`${file.name} uploaded successfully.`);
                onUploadComplete();
            } catch {
                setProgress("Upload failed. Please try again.");
                toast.error("Upload failed. Please try again.");
            } finally {
                setIsUploading(false);
            }
        },
        [onUploadComplete],
    );

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = "";
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
        >
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleInputChange} className="hidden" />
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">{isUploading ? progress : "Drag & drop a PDF here, or click to browse"}</p>
            {!isUploading && progress && <p className="text-xs text-muted-foreground mt-2">{progress}</p>}
        </div>
    );
}
