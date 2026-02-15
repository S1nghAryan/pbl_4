import { FileText } from "lucide-react";

const Navigation = () => {
  return (
    <nav className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-green-primary to-green-accent bg-clip-text text-transparent">
              QuickNote
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#"
              className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
            >
              Home
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
            >
              About
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
            >
              Contact
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-muted-foreground hover:text-primary">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;