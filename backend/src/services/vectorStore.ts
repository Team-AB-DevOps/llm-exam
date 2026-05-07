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

export async function queryRelevantChunks(query: string, topK: number = 5): Promise<string[]> {
    console.log(`[vectorStore] Querying top-${topK} chunks for: "${query.substring(0, 80)}${query.length > 80 ? "..." : ""}"`);
    const col = await getCollection();
    const queryEmbedding = await embeddings.embedQuery(query);

    const results = await col.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK,
    });

    const docs = (results.documents?.[0] ?? []).filter((doc): doc is string => doc !== null);
    console.log(`[vectorStore] Retrieved ${docs.length} relevant chunk(s)`);
    return docs;
}

export async function deleteDocumentChunks(documentId: string): Promise<void> {
    console.log(`[vectorStore] Deleting chunks for document ${documentId}`);
    const col = await getCollection();
    await col.delete({
        where: { documentId },
    });
    console.log(`[vectorStore] Deleted chunks for document ${documentId}`);
}
