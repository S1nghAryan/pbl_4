import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import SampleSummaries from "@/components/SampleSummaries";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <Hero />
        <SampleSummaries />
      </main>
    </div>
  );
};

export default Index;
