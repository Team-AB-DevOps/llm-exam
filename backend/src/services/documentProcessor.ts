import { PDFParse } from "pdf-parse";
import fs from "fs";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { addDocumentChunks } from "./vectorStore";
import db from "../db/index";

const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

export async function processDocument(documentId: string, filePath: string): Promise<void> {
    try {
        console.log(`[processor] Reading PDF file: ${filePath}`);
        const dataBuffer = fs.readFileSync(filePath);
        console.log(`[processor] PDF size: ${dataBuffer.length} bytes`);

        const parser = new PDFParse({ data: dataBuffer });
        const result = await parser.getText();
        const text = result.text;
        await parser.destroy();
        console.log(`[processor] Extracted ${text.length} characters from PDF (${result.total} pages)`);

        const chunks = await textSplitter.splitText(text);
        console.log(`[processor] Split into ${chunks.length} chunks`);

        console.log(`[processor] Generating embeddings and storing in ChromaDB...`);
        await addDocumentChunks(documentId, chunks);
        console.log(`[processor] Stored ${chunks.length} chunks in ChromaDB`);

        db.prepare("UPDATE documents SET chunk_count = ?, status = ? WHERE id = ?").run(chunks.length, "ready", documentId);
        console.log(`[processor] Document ${documentId} processing complete — status: ready`);
    } catch (error) {
        console.error(`[processor] Error processing document ${documentId}:`, error);
        db.prepare("UPDATE documents SET status = ? WHERE id = ?").run("error", documentId);
    }
}
