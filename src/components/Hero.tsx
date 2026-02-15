import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Upload, FileText, Zap, ArrowLeft, Send, Loader2 } from "lucide-react";
import { Document, Page, pdfjs } from 'react-pdf';
import { useToast } from "@/hooks/use-toast";
import mascotImage from "@/assets/quicknote-mascot.png";
import SummaryDisplay from "./SummaryDisplay";
import { apiService, UploadResponse } from "@/lib/api";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const Hero = () => {
  const [paperText, setPaperText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [prompt, setPrompt] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      setIsUploading(true);
      try {
        const response: UploadResponse = await apiService.uploadFile(file);
        setUploadedFile(file);
        setSessionId(response.session_id);
        toast({
          title: "Success",
          description: "PDF uploaded and processed successfully!",
        });
      } catch (error) {
        toast({
          title: "Upload Error",
          description: error instanceof Error ? error.message : "Failed to upload file",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    } else {
      // Handle non-PDF files by reading as text
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setPaperText(text);
      };
      reader.readAsText(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleBackToUpload = () => {
    if (sessionId) {
      apiService.deleteSession(sessionId).catch(console.error);
    }
    setUploadedFile(null);
    setPaperText("");
    setPrompt("");
    setPageNumber(1);
    setNumPages(0);
    setShowSummary(false);
    setSubmittedPrompt("");
    setSessionId("");
  };

  const handleSendPrompt = async () => {
    if (!prompt.trim() || !sessionId) return;

    setIsSending(true);
    try {
      const response = await apiService.sendMessage(sessionId, prompt);
      setSubmittedPrompt(prompt);
      setShowSummary(true);
      // Store the response for SummaryDisplay component
      sessionStorage.setItem('lastResponse', response.answer);
    } catch (error) {
      toast({
        title: "Chat Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleBackToPrompt = () => {
    setShowSummary(false);
  };

  const handleNewPrompt = () => {
    setPrompt("");
    setShowSummary(false);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // If showing summary, render the summary display
  if (showSummary) {
    return (
      <SummaryDisplay
        prompt={submittedPrompt}
        fileName={uploadedFile?.name}
        onBack={handleBackToPrompt}
        onNewPrompt={handleNewPrompt}
        sessionId={sessionId}
      />
    );
  }

  // If file is uploaded, show the split view
  if (uploadedFile) {
    return (
      <section className="relative min-h-screen overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-light via-background to-green-secondary/20" />
        
        {/* Header */}
        <div className="relative z-10 p-4 border-b border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={handleBackToUpload}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Upload
            </Button>
            <h2 className="text-lg font-semibold text-foreground">
              {uploadedFile.name}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Page {pageNumber} of {numPages}
            </div>
          </div>
        </div>

        {/* Split view content */}
        <div className="relative h-[calc(100vh-80px)]">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* PDF Preview Panel */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full bg-card border-r border-border/50 flex flex-col">
                <div className="flex-1 overflow-auto p-4">
                  <div className="flex justify-center">
                    <Document
                      file={uploadedFile}
                      onLoadSuccess={onDocumentLoadSuccess}
                      className="max-w-full"
                    >
                      <Page 
                        pageNumber={pageNumber} 
                        className="shadow-lg"
                        width={Math.min(600, window.innerWidth * 0.4)}
                      />
                    </Document>
                  </div>
                </div>
                
                {/* PDF Navigation */}
                {numPages > 1 && (
                  <div className="p-4 border-t border-border/50 bg-card/50">
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                        disabled={pageNumber <= 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {pageNumber} / {numPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                        disabled={pageNumber >= numPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Prompt Panel */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full bg-card flex flex-col">
                <div className="p-6 border-b border-border/50">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    <span className="bg-gradient-to-r from-green-primary via-green-accent to-green-primary bg-clip-text text-transparent">
                      Ask Questions
                    </span>
                  </h3>
                  <p className="text-muted-foreground">
                    Ask questions about your document or request a summary
                  </p>
                </div>
                
                <div className="flex-1 p-6 flex flex-col">
                  <div className="flex-1 mb-4">
                    <Textarea
                      placeholder="What would you like to know about this document? E.g., 'Summarize the main findings' or 'What are the key conclusions?'"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="h-full min-h-[200px] resize-none border-2 border-green-accent/80 focus:border-green-accent focus:ring-green-accent/30 focus:ring-2 focus:ring-offset-0 transition-all duration-200 hover:border-green-accent"
                      disabled={isSending}
                    />
                  </div>
                  
                  <Button
                    size="lg"
                    onClick={handleSendPrompt}
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-primary to-green-accent hover:from-green-accent hover:to-green-primary shadow-[var(--shadow-hero)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 transform hover:scale-[1.02]"
                    disabled={!prompt.trim() || isSending}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Send Prompt
                      </>
                    )}
                  </Button>
                  
                  {/* Quick suggestions */}
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Quick suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                      {["Summarize key points", "Extract main conclusions", "List important findings"].map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          size="sm"
                          onClick={() => setPrompt(suggestion)}
                          className="text-xs"
                          disabled={isSending}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </section>
    );
  }

  // Default upload UI
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-light via-background to-green-secondary/20" />
      
      {/* Content */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Hero heading */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-green-primary via-green-accent to-green-primary bg-clip-text text-transparent">
                Summarize Subjects
              </span>
              <br />
              <span className="text-foreground">In Seconds</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transform lengthy research papers into clear, concise summaries. 
              Perfect for students, researchers, and academics who value their time.
            </p>
          </div>

          {/* Input section */}
          <div className="max-w-5xl mx-auto relative">
            {/* Mascot - Now visible on medium screens and up */}
            <div className="absolute -right-20 md:-right-32 lg:-right-40 top-4 md:top-8 hidden md:block animate-fade-in z-10">
              <div className="relative">
                <img 
                  src={mascotImage} 
                  alt="QuickNote mascot - friendly owl with glasses" 
                  className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 transition-transform duration-300 hover:scale-110 bg-transparent mix-blend-multiply"
                  style={{ backgroundColor: 'transparent' }}
                />
              </div>
            </div>
            
            {/* Mobile mascot - shows at the top center on small screens */}
            <div className="flex justify-center mb-4 md:hidden animate-fade-in">
              <div className="relative">
                <img 
                  src={mascotImage} 
                  alt="QuickNote mascot - friendly owl with glasses" 
                  className="w-32 h-32 transition-transform duration-300 hover:scale-110 bg-transparent mix-blend-multiply"
                  style={{ backgroundColor: 'transparent' }}
                />
              </div>
            </div>
            
            <div className="bg-card rounded-2xl shadow-[var(--shadow-card)] p-6 md:p-8 mb-8 border border-border/50">
              <div className="space-y-6">
                {/* Textarea with continuous border */}
                <div className="relative">
                  <Textarea
                    placeholder="Paste your research paper text here, or upload a file below..."
                    value={paperText}
                    onChange={(e) => setPaperText(e.target.value)}
                    className="min-h-[200px] text-base resize-none border-2 border-green-accent/80 focus:border-green-accent focus:ring-green-accent/30 focus:ring-2 focus:ring-offset-0 transition-all duration-200 hover:border-green-accent bg-background"
                  />
                  <div className="absolute bottom-4 right-4 text-sm text-muted-foreground bg-background/80 px-2 py-1 rounded">
                    {paperText.length}/10000
                  </div>
                </div>

                {/* Upload option */}
                <div className="flex items-center justify-center gap-4">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={triggerFileUpload}
                    className="flex items-center space-x-2"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Upload File</span>
                      </>
                    )}
                  </Button>
                  <span className="text-sm text-muted-foreground">PDF, DOC, TXT supported</span>
                </div>

                {/* CTA Button */}
                <Button
                  size="lg"
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-primary to-green-accent hover:from-green-accent hover:to-green-primary shadow-[var(--shadow-hero)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 transform hover:scale-[1.02]"
                  disabled={!paperText.trim()}
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Summarize Now
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-green-secondary rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-green-accent" />
                </div>
                <h3 className="font-semibold text-foreground">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">Get summaries in under 30 seconds</p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-green-secondary rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-accent" />
                </div>
                <h3 className="font-semibold text-foreground">Key Insights</h3>
                <p className="text-sm text-muted-foreground">Extract main findings and conclusions</p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-green-secondary rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6 text-green-accent" />
                </div>
                <h3 className="font-semibold text-foreground">Multiple Formats</h3>
                <p className="text-sm text-muted-foreground">Support for PDF, DOC, and TXT files</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
