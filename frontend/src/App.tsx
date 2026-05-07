import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { ChatPage } from "@/pages/ChatPage";
import { DocumentsPage } from "@/pages/DocumentsPage";

function App() {
    return (
        <BrowserRouter>
            <div className="flex flex-col h-screen">
                <Navbar />
                <main className="flex-1 overflow-hidden">
                    <Routes>
                        <Route path="/chat" element={<ChatPage />} />
                        <Route path="/documents" element={<DocumentsPage />} />
                        <Route path="*" element={<Navigate to="/chat" replace />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
