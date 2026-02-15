import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Users, Brain } from "lucide-react";

const sampleSummaries = [
  {
    id: 1,
    title: "Machine Learning in Healthcare: A Comprehensive Review",
    originalLength: "47 pages",
    summaryTime: "23 seconds",
    category: "Healthcare AI",
    icon: Brain,
    summary: "This comprehensive review examines the application of machine learning techniques in healthcare systems. Key findings include a 34% improvement in diagnostic accuracy when AI-assisted tools are used alongside traditional methods. The study analyzed 15,000 patient cases across multiple hospitals, revealing significant cost reductions and improved patient outcomes. Challenges identified include data privacy concerns and the need for standardized protocols.",
    keyPoints: [
      "34% improvement in diagnostic accuracy",
      "Analysis of 15,000 patient cases",
      "Significant cost reduction demonstrated",
      "Data privacy remains key challenge"
    ]
  },
  {
    id: 2,
    title: "Climate Change Impact on Global Food Security",
    originalLength: "32 pages",
    summaryTime: "18 seconds",
    category: "Environmental Science",
    icon: TrendingUp,
    summary: "Research indicates that climate change will reduce global crop yields by 10-25% by 2050. The study examines temperature and precipitation patterns across major agricultural regions. Adaptation strategies include drought-resistant crop varieties and improved irrigation systems. Economic implications suggest a need for $280 billion in agricultural infrastructure investments globally.",
    keyPoints: [
      "10-25% reduction in crop yields by 2050",
      "Major agricultural regions analyzed",
      "Drought-resistant varieties recommended",
      "$280B infrastructure investment needed"
    ]
  },
  {
    id: 3,
    title: "Social Media's Effect on Mental Health in Adolescents",
    originalLength: "28 pages",
    summaryTime: "21 seconds",
    category: "Psychology",
    icon: Users,
    summary: "A longitudinal study of 3,200 adolescents reveals complex relationships between social media usage and mental health outcomes. Heavy users (>4 hours daily) showed 40% higher rates of anxiety and depression. However, moderate usage with positive interactions demonstrated improved social connections. The research emphasizes the importance of digital literacy and parental guidance.",
    keyPoints: [
      "3,200 adolescents studied longitudinally",
      "Heavy users show 40% higher anxiety rates",
      "Moderate usage can improve social connections",
      "Digital literacy education crucial"
    ]
  }
];

const SampleSummaries = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-green-light/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-green-primary to-green-accent bg-clip-text text-transparent">
              Sample Summaries
            </span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            See how QuickNote transforms complex research papers into clear, actionable insights
          </p>
        </div>

        {/* Sample cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {sampleSummaries.map((sample) => {
            const IconComponent = sample.icon;
            return (
              <Card
                key={sample.id}
                className="group cursor-pointer transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1 border border-border/50 bg-card/80 backdrop-blur-sm"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-green-secondary rounded-lg flex items-center justify-center group-hover:bg-green-primary/10 transition-colors duration-300">
                      <IconComponent className="h-6 w-6 text-green-accent" />
                    </div>
                    <Badge variant="secondary" className="bg-green-secondary/50 text-green-accent border-green-primary/20">
                      {sample.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-green-primary transition-colors duration-200">
                    {sample.title}
                  </CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{sample.summaryTime}</span>
                    </div>
                    <div className="text-green-accent font-medium">
                      {sample.originalLength} → Summary
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm leading-relaxed">
                    {sample.summary}
                  </CardDescription>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Key Points:</h4>
                    <ul className="space-y-1">
                      {sample.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-green-primary rounded-full mt-2 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA section */}
        <div className="text-center mt-16">
          <p className="text-lg text-muted-foreground mb-6">
            Ready to summarize your own research papers?
          </p>
          <a
            href="#"
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-green-primary to-green-accent text-primary-foreground font-semibold rounded-lg hover:from-green-accent hover:to-green-primary transition-all duration-300 transform hover:scale-105 shadow-[var(--shadow-hero)]"
          >
            Get Started Now
          </a>
        </div>
      </div>
    </section>
  );
};

export default SampleSummaries;