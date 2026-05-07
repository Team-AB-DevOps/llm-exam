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
        const dataBuffer = fs.readFileSync(filePath);
        const parser = new PDFParse({ data: dataBuffer });
        const result = await parser.getText();
        const text = result.text;
        await parser.destroy();

        const chunks = await textSplitter.splitText(text);

        await addDocumentChunks(documentId, chunks);

        db.prepare("UPDATE documents SET chunk_count = ?, status = ? WHERE id = ?").run(chunks.length, "ready", documentId);
    } catch (error) {
        console.error(`Error processing document ${documentId}:`, error);
        db.prepare("UPDATE documents SET status = ? WHERE id = ?").run("error", documentId);
    }
}
