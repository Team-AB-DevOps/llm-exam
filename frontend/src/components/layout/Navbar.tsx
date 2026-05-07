import { NavLink } from "react-router-dom";
import { MessageSquare, FileText } from "lucide-react";

export function Navbar() {
    return (
        <nav className="border-b bg-background">
            <div className="container mx-auto flex h-14 items-center px-4">
                <h1 className="text-lg font-semibold mr-8">HR Chat Assistant</h1>
                <div className="flex gap-1">
                    <NavLink
                        to="/chat"
                        className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            }`
                        }
                    >
                        <MessageSquare className="h-4 w-4" />
                        Chat
                    </NavLink>
                    <NavLink
                        to="/documents"
                        className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            }`
                        }
                    >
                        <FileText className="h-4 w-4" />
                        Documents
                    </NavLink>
                </div>
            </div>
        </nav>
    );
}
