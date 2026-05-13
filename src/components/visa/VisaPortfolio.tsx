import { Card, CardContent } from "@/components/ui/card";
import { Linkedin, Calendar } from "lucide-react";
import { useEffect, useState } from "react";

interface Delegate {
  name: string;
  picture: string;
  designation: string;
  organization: string;
  linkedin: string;
  visaType: string;
  approvalDate?: string;
}

// Delegates whose photos need zooming and centering
const zoomedPhotoDelegates = ["Awais Mustafa", "Awais Idrees"];

const VisaPortfolio = () => {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/alumni.csv')
      .then(response => response.text())
      .then(text => {
        const lines = text.split('\n');
        const parsed: Delegate[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Updated regex to handle visa types with commas like "US,Europe"
          const match = line.match(/^([^,]+),([^,]+\([^)]+\)),([^,]+),([^,]+),([^,]+),(.+?)(?:,(\d+\s+\w+\s+\d{4}))?$/);
          if (!match) continue;
          
          const [, name, picture, designation, organization, linkedin, visaType, approvalDate] = match;
          
          const pictureUrlMatch = picture.match(/\(([^)]+)\)/);
          const pictureUrl = pictureUrlMatch ? pictureUrlMatch[1] : '';
          
          parsed.push({
            name: name.trim(),
            picture: pictureUrl,
            designation: designation.trim(),
            organization: organization.trim(),
            linkedin: linkedin.trim(),
            visaType: visaType.trim(),
            approvalDate: approvalDate?.trim()
          });
        }
        
        setDelegates(parsed);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading delegates:', error);
        setLoading(false);
      });
  }, []);

  // Group delegates into groups of 4 (2x2 grid)
  const groupedDelegates = [];
  for (let i = 0; i < delegates.length; i += 4) {
    groupedDelegates.push(delegates.slice(i, i + 4));
  }

  if (loading) {
    return null;
  }

  return (
    <section id="visa-portfolio" className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Our Full Portfolio</h2>
          <p className="text-muted-foreground">Trusted by industry leaders</p>
        </div>

        {/* CSS scroll-snap (no JS): swipe left/right on mobile/desktop */}
        <div className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-4 px-4">
          {groupedDelegates.map((group, groupIndex) => (
            <div key={groupIndex} className="shrink-0 w-full snap-center">
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {group.map((delegate, index) => (
                  <Card key={index} className="group hover:shadow-lg transition-shadow relative">
                        <CardContent className="p-4 flex flex-col items-center text-center">
                          {/* Visa Type Flags */}
                          {delegate.visaType.includes('US') && delegate.visaType.includes('Europe') ? (
                            <>
                              <div className="absolute top-2 left-2">
                                <span className="text-2xl" title="United States">🇺🇸</span>
                              </div>
                              <div className="absolute top-2 right-2">
                                <span className="text-2xl" title="European Union">🇪🇺</span>
                              </div>
                            </>
                          ) : (
                            <div className="absolute top-2 right-2 flex gap-1">
                              {delegate.visaType.includes('US') && (
                                <span className="text-2xl" title="United States">🇺🇸</span>
                              )}
                              {delegate.visaType.includes('Europe') && (
                                <span className="text-2xl" title="European Union">🇪🇺</span>
                              )}
                            </div>
                          )}
                          <div className="relative mb-3">
                            <div className="w-20 h-20 rounded-full border-2 border-primary/20 overflow-hidden">
                              {delegate.picture ? (
                                <img 
                                  src={delegate.picture}
                                  alt={delegate.name}
                                  className={`w-full h-full ${
                                    zoomedPhotoDelegates.includes(delegate.name) 
                                      ? 'object-cover scale-150 object-center' 
                                      : 'object-cover'
                                  }`}
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<div class="w-full h-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">${delegate.name.split(' ').map(n => n[0]).join('')}</div>`;
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
                                  {delegate.name.split(' ').map(n => n[0]).join('')}
                                </div>
                              )}
                            </div>
                            {delegate.linkedin && (
                              <a 
                                href={delegate.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                              >
                                <Linkedin className="w-4 h-4 text-primary-foreground" />
                              </a>
                            )}
                          </div>
                          <h4 className="font-semibold text-sm mb-1 line-clamp-2">{delegate.name}</h4>
                          <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{delegate.designation}</p>
                          <p className="text-sm text-foreground font-semibold line-clamp-2 mb-2">{delegate.organization}</p>
                          {delegate.approvalDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>{delegate.approvalDate}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VisaPortfolio;
