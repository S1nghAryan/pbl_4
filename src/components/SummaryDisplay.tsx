import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Download, RotateCcw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SummaryDisplayProps {
  prompt: string;
  fileName?: string;
  onBack: () => void;
  onNewPrompt: () => void;
  sessionId: string;
}

const SummaryDisplay = ({ prompt, fileName, onBack, onNewPrompt, sessionId }: SummaryDisplayProps) => {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResponse = async () => {
      setIsLoading(true);
      
      // Get the real response from sessionStorage (stored by Hero component)
      const storedResponse = sessionStorage.getItem('lastResponse');
      
      if (storedResponse) {
        // Simulate typing effect for better UX with real Groq response
        let currentText = "";
        for (let i = 0; i < storedResponse.length; i++) {
          currentText += storedResponse[i];
          setSummary(currentText);
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      } else {
        setSummary("No response available. Please try asking your question again.");
      }
      
      setIsLoading(false);
    };

    loadResponse();
  }, [prompt]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
  };

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-light via-background to-green-secondary/20" />
      
      {/* Header */}
      <div className="relative z-10 p-4 border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Document
          </Button>
          <h2 className="text-lg font-semibold text-foreground">
            {fileName ? `Summary - ${fileName}` : "Summary"}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Chat-style content */}
      <div className="relative max-w-4xl mx-auto p-6 min-h-[calc(100vh-120px)]">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-6">
            {/* User prompt */}
            <div className="flex justify-end">
              <div className="max-w-3xl bg-green-primary/10 border border-green-primary/20 rounded-2xl rounded-tr-md p-4">
                <p className="text-foreground font-medium">{prompt}</p>
              </div>
            </div>

            {/* AI Response */}
            <div className="flex justify-start">
              <div className="max-w-3xl bg-card border border-border/50 rounded-2xl rounded-tl-md p-6 shadow-[var(--shadow-card)]">
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-accent rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-green-accent rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-green-accent rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    <span className="text-muted-foreground ml-2">Getting response from Groq API...</span>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                      {summary}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Bottom actions */}
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border/50 p-4 mt-6">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={onNewPrompt}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Ask Another Question
            </Button>
            <Button
              className="bg-gradient-to-r from-green-primary to-green-accent hover:from-green-accent hover:to-green-primary"
            >
              Start New Analysis
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SummaryDisplay;