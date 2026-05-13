import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, ChevronLeft, ChevronRight, Linkedin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
const ApprovedDelegates = () => {
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };
  // Avatars render at 64-96px — use the 400w webp variant to slash payload (~600KB → ~20KB)
  const toAvatarSrc = (path: string) => {
    if (!path) return path;
    if (/\.svg$/i.test(path)) return path;
    return path.replace(/\.(png|jpe?g|webp)$/i, "-400w.webp");
  };

  // Delegates whose photos should be centered instead of cropped
  const centeredPhotoDelegates = ["Kamal Hasan", "Obaid Arshad", "Kashif Javed", "Yashfa Raza", "Saqib Agha", "Hisham Mir"];

  // Delegates whose photos need to be zoomed in to focus on face
  const zoomedPhotoDelegates = ["Awais Idrees", "Awais Mustafa"];
  const delegates = [{
    name: "Awais Idrees",
    title: "COO & Co-Founder",
    company: "VASL",
    approvalDate: "",
    attempt: "1st",
    picture: "/delegates/Awais_Idrees.png",
    socialLink: "https://www.linkedin.com/in/awais-idrees-b903a0372/"
  }, {
    name: "Muhammad Qasim",
    title: "CEO",
    company: "Compass Design Co",
    approvalDate: "",
    attempt: "1st",
    picture: "/delegates/Muhammad_Qasim.jpeg",
    socialLink: "https://www.linkedin.com/in/muhammad-qasim/"
  }, {
    name: "Hafiz Ahmad Ashfaq",
    title: "Co-Founder & CEO",
    company: "Madsgency",
    approvalDate: "",
    attempt: "1st",
    picture: "/delegates/Hafiz_Ahmad_Ashfaq.jpeg",
    socialLink: "https://www.linkedin.com/in/hafizahmadashfaq/"
  }, {
    name: "Awais Mustafa",
    title: "Director Global Operations",
    company: "Redex IT Limited",
    approvalDate: "",
    attempt: "1st",
    picture: "/delegates/Awais_Mustafa.png",
    socialLink: "https://www.linkedin.com/in/awaismustafaofficial/"
  }, {
    name: "Saman Fatima",
    title: "Founder & CEO",
    company: "VASL",
    approvalDate: "14 November 2025",
    attempt: "1st",
    picture: "/delegates/saman-fatima.jpg",
    socialLink: "https://www.linkedin.com/in/saman-fatima-/"
  }, {
    name: "Muhammad Hasnain Khalid",
    title: "Founder & CEO",
    company: "HKS TechLabs",
    approvalDate: "12 November 2025",
    attempt: "1st",
    picture: "/delegates/muhammad-hasnain-khalid.jpg",
    socialLink: "https://www.linkedin.com/in/hasnaink007/"
  }, {
    name: "Aneeq Essani",
    title: "Founder & CEO",
    company: "Consultisor",
    approvalDate: "7 November 2025",
    attempt: "1st",
    picture: "/delegates/aneeq-essani.jpg",
    socialLink: "https://www.linkedin.com/in/aneeqessani/"
  }, {
    name: "Muhammad Soaman Faruqi",
    title: "Chief Marketing Officer",
    company: "Spotcomm Global",
    approvalDate: "5 November 2025",
    attempt: "1st",
    picture: "/delegates/muhammad-soaman-faruqi.jpg",
    socialLink: "https://www.linkedin.com/in/muhammad-soaman-faruqi-9ba94879"
  }, {
    name: "Atif Javed",
    title: "CEO",
    company: "Granni's Kitchen",
    approvalDate: "31 October 2025",
    attempt: "1st",
    picture: "/delegates/atif-javed.jpg",
    socialLink: "https://www.instagram.com/atif.chaudhary1/"
  }, {
    name: "Fozia Badar",
    title: "COO",
    company: "Granni's Kitchen",
    approvalDate: "31 October 2025",
    attempt: "1st",
    picture: "/delegates/fozia-badar.jpg",
    socialLink: "https://www.linkedin.com/in/fozia-badar-7b8979208/"
  }, {
    name: "Shahzad Jameel",
    title: "Founder & CEO",
    company: "VirtueNetz Limited",
    approvalDate: "30 September 2025",
    attempt: "1st",
    picture: "/delegates/shahzad-jameel.jpg",
    socialLink: "https://www.linkedin.com/in/shahzadjameel/"
  }, {
    name: "Tausif Akram",
    title: "CEO & FOUNDER",
    company: "Content Arcade",
    approvalDate: "29 September 2025",
    attempt: "1st",
    picture: "/delegates/tausif-akram-2.jpg",
    socialLink: "https://www.linkedin.com/in/tausif-akram-0b66402b/"
  }, {
    name: "Usama Shahid",
    title: "CTO",
    company: "LifeRx.md,Inc",
    approvalDate: "25 September 2025",
    attempt: "1st",
    picture: "/delegates/usama-shahid.jpg",
    socialLink: "https://www.linkedin.com/in/muhammadusama25/"
  }, {
    name: "Muhammad Irfan",
    title: "Founder & CEO",
    company: "Xeven Solutions",
    approvalDate: "3 September 2025",
    attempt: "4th",
    picture: "/delegates/muhammad-irfan.jpg",
    socialLink: "https://www.linkedin.com/in/immuhammadirfan/"
  }, {
    name: "Talha Ahmed",
    title: "CTO",
    company: "Digitrends",
    approvalDate: "29 August 2025",
    attempt: "1st",
    picture: "/delegates/talha-ahmed.jpg",
    socialLink: "https://www.linkedin.com/in/talhaahmed/"
  }, {
    name: "Amir Ahmed Bajwa",
    title: "Founder",
    company: "Corebits",
    approvalDate: "21 August 2025",
    attempt: "1st",
    picture: "/delegates/amir-ahmed-bajwa.jpg",
    socialLink: "https://www.linkedin.com/in/aamirbajwa"
  }, {
    name: "Kanwal Ali",
    title: "Growth & Engagement Strategist",
    company: "Intelliscience",
    approvalDate: "20 August 2025",
    attempt: "2nd",
    picture: "/delegates/kanwal-ali.jpg",
    socialLink: "https://www.linkedin.com/in/kanwalali89/"
  }, {
    name: "Naeem Asghar",
    title: "Journalist",
    company: "Express News Media Group",
    approvalDate: "18 August 2025",
    attempt: "1st",
    picture: "/delegates/naeem-asghar.jpg",
    socialLink: "https://www.linkedin.com/in/naeem-asghar-a7a7bb66/"
  }, {
    name: "Hamza Razzaq",
    title: "COO",
    company: "Fillinx Solutions Pvt Ltd",
    approvalDate: "13 August 2025",
    attempt: "1st",
    picture: "/delegates/hamza-razzaq.jpg",
    socialLink: "https://www.linkedin.com/in/hamza-razzaq/"
  }, {
    name: "Yasir Aziz",
    title: "Founder and CEO",
    company: "PikesSoft",
    approvalDate: "13 August 2025",
    attempt: "1st",
    picture: "/delegates/yasir-aziz.jpg",
    socialLink: "https://www.linkedin.com/in/muhammadyasir"
  }, {
    name: "Obaid Arshad",
    title: "Co-Founder",
    company: "Gingko Retail",
    approvalDate: "21 July 2025",
    attempt: "1st",
    picture: "/delegates/obaid-arshad.jpg",
    socialLink: "https://www.linkedin.com/in/obaid-arshad/"
  }, {
    name: "Umar Majeed",
    title: "Founder & CEO",
    company: "EXYT XR",
    approvalDate: "16 June 2025",
    attempt: "1st",
    picture: "/delegates/umar-majeed.jpg",
    socialLink: "https://www.linkedin.com/in/umarmajeed"
  }, {
    name: "Shahzad Khan",
    title: "CEO",
    company: "The Laptop Living",
    approvalDate: "5 June 2025",
    attempt: "1st",
    picture: "/delegates/shahzad-khan.jpg",
    socialLink: "https://www.linkedin.com/in/shahzad-khan-copywriter/"
  }, {
    name: "Anees Iqbal",
    title: "CEO",
    company: "SteelBrain",
    approvalDate: "20 May 2025",
    attempt: "1st",
    picture: "/delegates/anees-iqbal.jpg",
    socialLink: "https://www.linkedin.com/in/anees-iqbal/"
  }, {
    name: "Zain Rana",
    title: "CEO",
    company: "MedBill RCM",
    approvalDate: "19 May 2025",
    attempt: "1st",
    picture: "/delegates/zain-rana.jpg",
    socialLink: "https://www.linkedin.com/in/zain-azhar-rana-03517861"
  }, {
    name: "Rimsha Nasir",
    title: "Freelance Photographer",
    company: "Self Employed",
    approvalDate: "2 May 2025",
    attempt: "1st",
    picture: "/delegates/rimsha-nasir.jpg",
    socialLink: "https://www.instagram.com/rimshanasir/"
  }, {
    name: "Kashif Abid",
    title: "President",
    company: "Diginatives",
    approvalDate: "17 April 2025",
    attempt: "1st",
    picture: "/delegates/kashif-abid.jpg",
    socialLink: "https://www.linkedin.com/in/kashifsohailabid/"
  }, {
    name: "Kamal Hasan",
    title: "Founder & CEO",
    company: "Kamsoft Technologies",
    approvalDate: "16 April 2025",
    attempt: "1st",
    picture: "/delegates/kamal-hasan.jpg",
    socialLink: "https://www.linkedin.com/in/kamal-hasan-83318b46/"
  }, {
    name: "Sajjawal Khan Jadoon",
    title: "CEO",
    company: "Maverick Wells",
    approvalDate: "15 April 2025",
    attempt: "2nd",
    picture: "/delegates/sajjawal-khan-jadoon.jpg",
    socialLink: "https://www.linkedin.com/in/sajjawal-khan-647a38344/"
  }, {
    name: "Hassan Mehmood",
    title: "CEO",
    company: "Astapor Technologies",
    approvalDate: "15 April 2025",
    attempt: "4th",
    picture: "/delegates/hassan-mehmood.jpg",
    socialLink: "https://www.linkedin.com/in/hassan-mehmood-3b140a48"
  }, {
    name: "Muhammad Naqi Ejaz",
    title: "CEO",
    company: "MIMAR Studios SMC-PVT LTD",
    approvalDate: "15 April 2025",
    attempt: "1st",
    picture: "/delegates/muhammad-naqi-ejaz.jpg",
    socialLink: "https://www.linkedin.com/in/naqiejaz"
  }, {
    name: "Kashif Javed",
    title: "Managing Director",
    company: "Media Agency Group",
    approvalDate: "12 April 2025",
    attempt: "2nd",
    picture: "/delegates/kashif-javed.png",
    socialLink: "https://www.instagram.com/kashifjaved10/"
  }, {
    name: "Hassan Sajjad",
    title: "CTO & Co-Founder",
    company: "Ginkgo Retail",
    approvalDate: "11 April 2025",
    attempt: "2nd",
    picture: "/delegates/hassan-sajjad.jpg",
    socialLink: "https://www.linkedin.com/in/hassan-sajjadd"
  }, {
    name: "Waqas Akhtar",
    title: "CEO",
    company: "Emaan Adeel",
    approvalDate: "9 April 2025",
    attempt: "2nd",
    picture: "/delegates/waqas-akhtar.jpg",
    socialLink: "https://www.linkedin.com/in/waqas-akhtar-60239010a/"
  }, {
    name: "Tahir Bashir",
    title: "Co-Founder",
    company: "TechnoFuzion",
    approvalDate: "4 April 2025",
    attempt: "1st",
    picture: "/delegates/tahir-bashir.jpg",
    socialLink: "https://www.linkedin.com/in/tahir-bashir-81854232/"
  }, {
    name: "Asfand Yar Khan",
    title: "CEO",
    company: "EdSavvy Solutions PVT LTD",
    approvalDate: "28 March 2025",
    attempt: "1st",
    picture: "/delegates/asfand-yar-khan.jpg",
    socialLink: "https://www.linkedin.com/in/asfand-yar-3744a0106/"
  }, {
    name: "Qasim Sana Ramay",
    title: "Founder & CEO",
    company: "Empowerers",
    approvalDate: "28 March 2025",
    attempt: "1st",
    picture: "/delegates/qasim-sana-ramay.jpg",
    socialLink: "https://www.linkedin.com/in/qasimsanaramay/"
  }, {
    name: "Fatima Azam",
    title: "Revenue Enablement Trainer",
    company: "Podium",
    approvalDate: "28 March 2025",
    attempt: "1st",
    picture: "/delegates/fatima-azam.jpg",
    socialLink: "http://linkedin.com/in/fatima-azam-2b1970178"
  }, {
    name: "Yashfa Raza",
    title: "Artist",
    company: "Independent Printmaker",
    approvalDate: "24 March 2025",
    attempt: "1st",
    picture: "/delegates/yashfa-raza.jpg",
    socialLink: "https://www.instagram.com/yashfaraza/"
  }, {
    name: "Viqas Nazim Sheikh",
    title: "CEO",
    company: "Smartbiz incubator",
    approvalDate: "19 March 2025",
    attempt: "2nd",
    picture: "/delegates/viqas-nazim-sheikh.jpg",
    socialLink: "https://www.linkedin.com/in/viqasnazim/"
  }, {
    name: "Saqib Agha",
    title: "CEO",
    company: "INTELLISCENCE",
    approvalDate: "7 March 2025",
    attempt: "1st",
    picture: "/delegates/saqib-agha.jpg",
    socialLink: "https://www.linkedin.com/in/saqibagha/"
  }, {
    name: "Muhammad Rizwan",
    title: "CEO",
    company: "Riz Technology",
    approvalDate: "4 March 2025",
    attempt: "1st",
    picture: "/delegates/muhammad-rizwan.jpg",
    socialLink: "https://www.linkedin.com/in/mohammad-rizwan-1a06362a/"
  }, {
    name: "Anns Gilani",
    title: "CEO",
    company: "Gutech International LLC",
    approvalDate: "18 February 2025",
    attempt: "2nd",
    picture: "/delegates/anns-gilani.jpg",
    socialLink: "https://www.linkedin.com/in/annsgilani/"
  }, {
    name: "Sharjeel Shahab",
    title: "Founder & CEO",
    company: "Lemon Leads",
    approvalDate: "18 February 2025",
    attempt: "2nd",
    picture: "/delegates/sharjeel-shahab.jpg",
    socialLink: "https://www.linkedin.com/in/seanshahab/"
  }, {
    name: "Muhammad Sohail Safdar",
    title: "Founder & CEO",
    company: "Nimble Web Solutions",
    approvalDate: "14 February 2025",
    attempt: "3rd",
    picture: "/delegates/muhammad-sohail-safdar.jpg",
    socialLink: "https://www.linkedin.com/in/msohailsafdar"
  }, {
    name: "Muhammad Zeeshan Sikander",
    title: "CEO",
    company: "ZenKoders",
    approvalDate: "13 February 2025",
    attempt: "1st",
    picture: "/delegates/muhammad-zeeshan-sikander.jpg",
    socialLink: "https://www.linkedin.com/in/mzeeshansikander/"
  }, {
    name: "Omair Shamshir",
    title: "CEO",
    company: "IgniCube Pvt Ltd",
    approvalDate: "12 February 2025",
    attempt: "1st",
    picture: "/delegates/omair-shamshir.jpg",
    socialLink: "https://www.linkedin.com/in/omair-shamshir/"
  }, {
    name: "Muhammad Azhar Iqbal",
    title: "Founder & CEO",
    company: "RankSol",
    approvalDate: "11 February 2025",
    attempt: "5th",
    picture: "/delegates/muhammad-azhar-iqbal.jpg",
    socialLink: "https://www.linkedin.com/in/azhriqbal/"
  }, {
    name: "Shah Hassan",
    title: "CEO",
    company: "Lahore Analytica",
    approvalDate: "31 January 2025",
    attempt: "1st",
    picture: "/delegates/shah-hassan.jpg",
    socialLink: "https://www.linkedin.com/in/shah-hassan-ceo-la/"
  }, {
    name: "Safeer Ul Haq",
    title: "CEO & Founder",
    company: "Indus Office Automation",
    approvalDate: "22 November 2024",
    attempt: "1st",
    picture: "/delegates/safeer-ul-haq.jpg",
    socialLink: "https://www.linkedin.com/in/safeer-ul-hak-b600aa190/"
  }, {
    name: "Syed Muhammad Tayyab",
    title: "CEO",
    company: "CodeJunkie",
    approvalDate: "21 November 2024",
    attempt: "1st",
    picture: "/delegates/syed-muhammad-tayyab.jpg",
    socialLink: "https://www.linkedin.com/in/tayyabsyed"
  }, {
    name: "Omer Bin Tariq",
    title: "CEO",
    company: "Merkavoix",
    approvalDate: "15 November 2024",
    attempt: "1st",
    picture: "/delegates/omar-bin-tariq.jpg",
    socialLink: "https://www.linkedin.com/in/omer-bin-tariq-47309aa9/"
  }, {
    name: "Usman Shahid Dar",
    title: "CEO",
    company: "Location92",
    approvalDate: "5 November 2024",
    attempt: "2nd",
    picture: "/delegates/usman-shahid-dar.jpg",
    socialLink: "https://www.linkedin.com/in/usmandar3/"
  }, {
    name: "Hisham Mir",
    title: "Co-Founder",
    company: "SecurityWall",
    approvalDate: "5 November 2024",
    attempt: "3rd",
    picture: "/delegates/hisham-mir.jpg",
    socialLink: "https://www.linkedin.com/in/hishammir/"
  }];
  const [currentPage, setCurrentPage] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const itemsPerPage = 4;
  const totalPages = Math.ceil(delegates.length / itemsPerPage);
  const handleImageLoad = (name: string) => {
    setLoadedImages(prev => new Set(prev).add(name));
  };
  const handlePrevious = () => {
    setCurrentPage(prev => (prev - 1 + totalPages) % totalPages);
  };
  const handleNext = () => {
    setCurrentPage(prev => (prev + 1) % totalPages);
  };
  const currentDelegates = delegates.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  return <section className="py-8 md:py-16 bg-muted/30">
      <div className="container mx-auto px-3 md:px-4">
        <div className="text-center mb-6 md:mb-8">
           <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3">2026 Delegates</h2>
           <p className="text-muted-foreground text-sm md:text-lg mb-1 md:mb-2">5 - 18 October 2026 | San Francisco & Los Angeles</p>
           <p className="text-xs md:text-sm text-muted-foreground">Last Updated:  26 Aprl 2027</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6 md:mb-8">
            {currentDelegates.map((delegate, index) => <Card key={index} className="border hover:shadow-lg transition-all duration-300 animate-fade-in">
                <CardContent className="pt-4 pb-4 md:pt-6 md:pb-6 px-3 md:px-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative group mb-2 md:mb-4">
                      {delegate.socialLink ? <a href={delegate.socialLink} target="_blank" rel="noopener noreferrer" className="block relative">
                          <Avatar className="w-16 h-16 md:w-24 md:h-24 border-2 border-primary/20 transition-transform duration-300 hover:scale-105">
                            {delegate.picture && <AvatarImage src={toAvatarSrc(delegate.picture)} alt={delegate.name} loading={currentPage === 0 ? "eager" : "lazy"} decoding="async" width={96} height={96} onLoad={() => handleImageLoad(delegate.name)} className={`w-full h-full ${centeredPhotoDelegates.includes(delegate.name) ? "object-contain" : "object-cover"} ${zoomedPhotoDelegates.includes(delegate.name) ? "scale-150 object-center" : ""}`} />}
                            <AvatarFallback asChild>
                              <Skeleton className="w-full h-full rounded-full" />
                            </AvatarFallback>
                          </Avatar>
                          {loadedImages.has(delegate.name) && <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <Linkedin className="w-5 h-5 md:w-8 md:h-8 text-white" />
                            </div>}
                        </a> : <Avatar className="w-16 h-16 md:w-24 md:h-24 border-2 border-primary/20">
                          {delegate.picture && <AvatarImage src={toAvatarSrc(delegate.picture)} alt={delegate.name} loading={currentPage === 0 ? "eager" : "lazy"} decoding="async" width={96} height={96} onLoad={() => handleImageLoad(delegate.name)} className={`w-full h-full ${centeredPhotoDelegates.includes(delegate.name) ? "object-contain" : "object-cover"} ${zoomedPhotoDelegates.includes(delegate.name) ? "scale-150 object-center" : ""}`} />}
                          <AvatarFallback asChild>
                            <Skeleton className="w-full h-full rounded-full" />
                          </AvatarFallback>
                        </Avatar>}
                    </div>
                    <h3 className="font-bold text-xs md:text-lg mb-1 leading-tight">
                      {delegate.name}
                    </h3>
                    <p className="text-[10px] md:text-sm text-muted-foreground mb-1 md:mb-2 leading-tight">{delegate.title}</p>
                    <div className="flex items-center justify-center gap-1 md:gap-1.5">
                      <span className="text-[10px] md:text-sm font-semibold md:font-bold leading-tight">{delegate.company}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div>

          <div className="flex items-center justify-center gap-6">
            <Button variant="outline" size="icon" onClick={handlePrevious} className="rounded-full w-12 h-12" aria-label="Previous page">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <Button variant="outline" size="icon" onClick={handleNext} className="rounded-full w-12 h-12" aria-label="Next page">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>;
};
export default ApprovedDelegates;