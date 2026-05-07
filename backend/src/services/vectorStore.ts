import { ChromaClient, Collection, EmbeddingFunction } from "chromadb";
import { OllamaEmbeddings } from "@langchain/ollama";
import { config } from "../config";

const client = new ChromaClient({ path: config.chromaUrl });

const embeddings = new OllamaEmbeddings({
    model: config.embeddingModel,
    baseUrl: config.ollamaBaseUrl,
});

// No-op embedding function — we compute embeddings ourselves via Ollama
const noopEmbeddingFunction: EmbeddingFunction = {
    generate: async (texts: string[]) => texts.map(() => []),
};

let collection: Collection | null = null;

async function getCollection(): Promise<Collection> {
    if (!collection) {
        console.log(`[vectorStore] Connecting to ChromaDB collection: ${config.chromaCollection}`);
        collection = await client.getOrCreateCollection({
            name: config.chromaCollection,
            embeddingFunction: noopEmbeddingFunction,
        });
        console.log(`[vectorStore] ChromaDB collection ready`);
    }
    return collection;
}

export async function addDocumentChunks(documentId: string, chunks: string[]): Promise<void> {
    console.log(`[vectorStore] Embedding ${chunks.length} chunks for document ${documentId}`);
    const col = await getCollection();
    const vectors = await embeddings.embedDocuments(chunks);
    console.log(`[vectorStore] Generated ${vectors.length} embeddings (dim: ${vectors[0]?.length})`);

    const ids = chunks.map((_, i) => `${documentId}_chunk_${i}`);
    const metadatas = chunks.map((_, i) => ({
        documentId,
        chunkIndex: i,
    }));

    await col.add({
        ids,
        embeddings: vectors,
        documents: chunks,
        metadatas,
    });
}

export interface RetrievedChunk {
    content: string;
    documentId: string;
}

export async function queryRelevantChunks(query: string, topK: number = 5): Promise<RetrievedChunk[]> {
    console.log(`[vectorStore] Querying top-${topK} chunks for: "${query.substring(0, 80)}${query.length > 80 ? "..." : ""}"`);
    const col = await getCollection();
    const queryEmbedding = await embeddings.embedQuery(query);

    const results = await col.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK,
    });

    const docs = results.documents?.[0] ?? [];
    const metas = results.metadatas?.[0] ?? [];

    const chunks: RetrievedChunk[] = [];
    for (let i = 0; i < docs.length; i++) {
        const content = docs[i];
        const meta = metas[i];
        if (content) {
            chunks.push({
                content,
                documentId: (meta?.documentId as string) ?? "unknown",
            });
        }
    }
    console.log(`[vectorStore] Retrieved ${chunks.length} relevant chunk(s)`);
    return chunks;
}

export async function deleteDocumentChunks(documentId: string): Promise<void> {
    console.log(`[vectorStore] Deleting chunks for document ${documentId}`);
    const col = await getCollection();
    await col.delete({
        where: { documentId },
    });
    console.log(`[vectorStore] Deleted chunks for document ${documentId}`);
}
