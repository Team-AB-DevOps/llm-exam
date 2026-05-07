import { ChromaClient, Collection } from "chromadb";
import { OllamaEmbeddings } from "@langchain/ollama";
import { config } from "../config";

const client = new ChromaClient({ path: config.chromaUrl });

const embeddings = new OllamaEmbeddings({
    model: config.embeddingModel,
    baseUrl: config.ollamaBaseUrl,
});

let collection: Collection | null = null;

async function getCollection(): Promise<Collection> {
    if (!collection) {
        collection = await client.getOrCreateCollection({
            name: config.chromaCollection,
        });
    }
    return collection;
}

export async function addDocumentChunks(documentId: string, chunks: string[]): Promise<void> {
    const col = await getCollection();
    const vectors = await embeddings.embedDocuments(chunks);

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

export async function queryRelevantChunks(query: string, topK: number = 5): Promise<string[]> {
    const col = await getCollection();
    const queryEmbedding = await embeddings.embedQuery(query);

    const results = await col.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK,
    });

    return (results.documents?.[0] ?? []).filter((doc): doc is string => doc !== null);
}

export async function deleteDocumentChunks(documentId: string): Promise<void> {
    const col = await getCollection();
    await col.delete({
        where: { documentId },
    });
}
