import { Card, CardContent } from "@/components/ui/card";
import { Linkedin } from "lucide-react";

const IncPortfolio = () => {
  const customers = [
    {
      name: "Arham Naeem Parvaiz",
      designation: "Co-Founder & MD",
      business: "Adhoox",
      image: "/images/customers/Arham_Naeem_Parvaiz.jpeg",
      linkedin: "https://www.linkedin.com/in/arham-naeem-marketing-digital-solutions-expert/?originalSubdomain=pk"
    },
    {
      name: "Sarwar Ali Khan",
      designation: "Founder & CEO",
      business: "Diagonal 3",
      image: "/images/customers/Sarwar_Ali_Khan.jpeg",
      linkedin: "https://www.linkedin.com/in/sarwar-khan-b5857737/"
    },
    {
      name: "Osama Gillani",
      designation: "CEO",
      business: "Mapalytics",
      image: "/images/customers/Osama_Gillani.jpeg",
      linkedin: "https://www.linkedin.com/in/osamagillani/"
    },
    {
      name: "Bakhtawar Gill",
      designation: "Web Application Architect",
      business: "Kanban Technology",
      image: "/images/customers/Bakhtawar_Gill.jpeg",
      linkedin: "https://www.linkedin.com/in/bakhtawar-gill-5582b765/?originalSubdomain=pk"
    },
    {
      name: "Amin Ali",
      designation: "Founder & CEO",
      business: "Ninja Acquisitions Network",
      image: "/images/customers/Amin_Ali.jpeg",
      linkedin: "https://www.linkedin.com/in/amin-ali-83a74b108/"
    },
    {
      name: "Hassaan Bassam",
      designation: "Lead Strategist",
      business: "Antifiller LLC",
      image: "/images/customers/Hassaan_Bassam.jpeg",
      linkedin: "https://www.linkedin.com/in/hassaanbassam/?originalSubdomain=pk"
    },
    {
      name: "Syed Husnain Haider Bukhari",
      designation: "Co-Founder & CEO",
      business: "Revolutionary technologies",
      image: "/images/customers/Syed_Husnain_Haider_Bukhari.jpeg",
      linkedin: "https://www.linkedin.com/in/syed-husnain-haider-bukhari/?originalSubdomain=pk"
    },
    {
      name: "Azman Ahmed Khan",
      designation: "CEO",
      business: "HRP Medical Services",
      image: "/images/customers/Azman_Ahmed_Khan.jpeg",
      linkedin: "https://www.linkedin.com/in/azman-ahmed-khan-034292176/?originalSubdomain=pk"
    },
    {
      name: "Wajid Gulistan",
      designation: "CEO",
      business: "Rapidev AI",
      image: "/images/customers/Wajid_Gulistan.jpeg",
      linkedin: "https://www.linkedin.com/in/wajidgulistan/"
    },
    {
      name: "Muhammad Usman Yaqoob",
      designation: "Managing Partner",
      business: "Corvexa Research",
      image: "/images/customers/Muhammad_Usman_Yaqoob.jpeg",
      linkedin: "https://www.linkedin.com/in/muhammad-usman-yaqoob-032a56228/?originalSubdomain=pk"
    },
    {
      name: "Muhammad Ayaz",
      designation: "Head of SEO",
      business: "Seoncode",
      image: "/images/customers/Muhammad_Ayaz.jpeg",
      linkedin: "https://www.linkedin.com/in/muhammad-ayaz-seo/"
    },
    {
      name: "Muhammad Uzair Imtiaz",
      designation: "CEO",
      business: "Folium Technologies",
      image: "/images/customers/Muhammad_Uzair_Imtiaz.jpeg",
      linkedin: "https://www.linkedin.com/in/uzairfoliumai/"
    },
    {
      name: "Minhal Rabbani",
      designation: "Head of Human Resources",
      business: "Megasight Technologies",
      image: "/images/customers/Minhal_Rabbani.jpeg",
      linkedin: "https://www.linkedin.com/in/minhaalrabbani/?originalSubdomain=pk"
    },
    {
      name: "Saad Aziz Rana",
      designation: "Founder & COO",
      business: "Typespace Studios",
      image: "/images/customers/Saad_Aziz_Rana.jpeg",
      linkedin: "https://www.linkedin.com/in/saad-rana-134b04b/?originalSubdomain=pk"
    },
    {
      name: "Adil Aslam",
      designation: "Founder & CEO",
      business: "Carenex RCM",
      image: "/images/customers/Adil_Aslam.jpeg",
      linkedin: "https://www.linkedin.com/in/adil-aslam-084a26114/"
    },
    {
      name: "Hussain Syed Mohtashim",
      designation: "Director",
      business: "Cyfrex Digital",
      image: "/images/customers/Hussain_Syed_Mohtashim.jpeg",
      linkedin: "https://www.linkedin.com/in/mohtashim-syed-72888443/"
    },
    {
      name: "Ahsan Ameen",
      designation: "Founder & CEO",
      business: "Code Knitters",
      image: "/images/customers/Ahsan_Ameen.jpeg",
      linkedin: "https://www.linkedin.com/in/ahsanameen/"
    },
    {
      name: "Yasir Ali",
      designation: "CEO",
      business: "Zeki Expert Solutions",
      image: "/images/customers/Yasir_Ali.jpeg",
      linkedin: "https://www.linkedin.com/in/yasir-ali-00260513/?originalSubdomain=pk"
    },
    {
      name: "Ahmad Majeed",
      designation: "CEO",
      business: "KMC Global Trading",
      image: "/images/customers/Ahmad_Majeed.jpeg",
      linkedin: "https://www.linkedin.com/in/kmcglobal/"
    },
    {
      name: "Faisal Saeed",
      designation: "Creative Director",
      business: "MURAQSH",
      image: "/images/customers/Faisal_Saeed.jpeg",
      linkedin: "https://www.linkedin.com/in/faisal-saeed-6957a51a5/?originalSubdomain=pk"
    },
    {
      name: "Raja Hamid Rab Nawaz",
      designation: "Founder & CEO",
      business: "esols Technologies, Furniturefy",
      image: "/images/customers/Raja_Hamid_Rab_Nawaz.jpeg",
      linkedin: "https://www.linkedin.com/in/hamid-techprenour/?originalSubdomain=uk"
    },
    {
      name: "Qasim Butt",
      designation: "Head of MultiPack",
      business: "SalesPush Inc",
      image: "/images/customers/Qasim_Butt.jpeg",
      linkedin: "https://www.linkedin.com/in/qasimibrahim1/"
    },
    {
      name: "Wajahat Karim",
      designation: "Vibe Coder",
      business: "Remote Karo",
      image: "/images/customers/Wajahat_Karim.png",
      linkedin: "https://www.linkedin.com/in/wajahatkarim/"
    },
    {
      name: "Agha Hassan Afzal Khan",
      designation: "CTO",
      business: "Bitselexion",
      image: "/images/customers/Agha_Hassan_Afzal_Khan.jpeg",
      linkedin: "https://www.linkedin.com/in/agha-hassan-afzal-khan/"
    },
    {
      name: "Muhammad Sohaib Shaheen",
      designation: "CEO",
      business: "DotX",
      image: "/images/customers/Muhammad_Sohaib_Shaheen.jpeg",
      linkedin: "https://www.linkedin.com/in/sohaib-shaheen/?originalSubdomain=pk"
    },
    {
      name: "Mohammad Ali Tariq",
      designation: "Team Lead",
      business: "Logizen",
      image: "/images/customers/Mohammad_Ali_Tariq.jpeg",
      linkedin: "https://www.linkedin.com/in/hamad-fayyaz/"
    },
    {
      name: "Sohail Bashir",
      designation: "Co-Founder & CEO",
      business: "Mobify",
      image: "/images/customers/Sohail_Bashir.jpeg",
      linkedin: "https://www.linkedin.com/in/sohail-bashir/?originalSubdomain=pk"
    },
    {
      name: "Ahmed Raza Firdosi",
      designation: "CEO",
      business: "Business Leads World",
      image: "/images/customers/Ahmed_Raza_Firdosi.jpeg",
      linkedin: "https://www.linkedin.com/in/ahmed-raza-firdousi-5b1667123/"
    },
    {
      name: "Taimur Iftikhar",
      designation: "Director Marketing",
      business: "Vektor Solutions",
      image: "/images/customers/Taimur_Iftikhar.jpeg",
      linkedin: "https://www.linkedin.com/in/taimur-iftikhar/"
    },
    {
      name: "Muhammad Farooq",
      designation: "Founder",
      business: "Stackworx",
      image: "/images/customers/Muhammad_Farooq.png",
      linkedin: "https://www.linkedin.com/in/farooq-ashraf-08b55311a/?originalSubdomain=pk"
    },
    {
      name: "Muhammad Usman",
      designation: "MD",
      business: "Dotline packaging",
      image: "/images/customers/Muhammad_Usman.jpeg",
      linkedin: "https://www.linkedin.com/in/usman-basit-721346159/?originalSubdomain=pk"
    },
    {
      name: "Muhammad Inaam",
      designation: "Founder",
      business: "SirajiaSol / Techpulse / Fliptron",
      image: "/images/customers/Muhammad_Inaam.png",
      linkedin: "https://www.linkedin.com/in/innam-dustgir-aa18a38a/?originalSubdomain=pk"
    },
    {
      name: "Ibad Ur Rehman",
      designation: "Founder",
      business: "Sirfastech",
      image: "/images/customers/Ibad_Ur_Rehman.jpeg",
      linkedin: "https://www.linkedin.com/in/ibadski/?originalSubdomain=pk"
    },
    {
      name: "Muhammad Salman",
      designation: "CEO",
      business: "The Trenzy Group",
      image: "/images/customers/Muhammad_Salman.jpeg",
      linkedin: "https://www.linkedin.com/in/muhammadsalmankamran/"
    },
    {
      name: "Muhammad Kashif",
      designation: "Founder & CEO",
      business: "TrailFive Technologies",
      image: "/images/customers/Muhammad_Kashif.jpeg",
      linkedin: "https://www.linkedin.com/in/mcashifsaleem/?originalSubdomain=pk"
    },
    {
      name: "Muhammad Ahmad Saeed",
      designation: "Import Export Assistant Manager",
      business: "SN Logistics",
      image: "/images/customers/Muhammad_Ahmad_Saeed.jpeg",
      linkedin: "https://www.linkedin.com/in/muhammad-ahmad-saeed-57b6a2274/?originalSubdomain=pk"
    },
    {
      name: "Adeel Amin Gondal",
      designation: "Chairman",
      business: "Km Ustawana International",
      image: "/images/customers/Adeel_Amin_Gondal.jpeg",
      linkedin: "https://www.linkedin.com/in/adeel-gondal-ag-13872a145/?originalSubdomain=pk"
    },
    {
      name: "Abdullah Saeed Dar",
      designation: "Solutions Architect",
      business: "Darson Tech",
      image: "/images/customers/Abdullah_Saeed_Dar.jpeg",
      linkedin: "https://www.linkedin.com/in/abdullahsaeeddar/"
    },
    {
      name: "Muhammad Wali",
      designation: "Finance Operations",
      business: "True Claim Partners",
      image: "/images/customers/Muhammad_Wali.jpeg",
      linkedin: "https://www.linkedin.com/in/muhammad-wali-a2b311368/?originalSubdomain=pk"
    },
    {
      name: "Iftikhar Ahmad Malik",
      designation: "CEO",
      business: "Malik & Sons Packages LLC",
      image: "/images/customers/Iftikhar_Ahmad_Malik.jpeg",
      linkedin: "https://www.linkedin.com/in/iftikhar-ahmad-malik-12a59842/"
    },
    {
      name: "Masood Khalid",
      designation: "Key Accounts Manager",
      business: "Dialer Guru",
      image: "/images/customers/Masood_Khalid.jpeg",
      linkedin: "https://www.linkedin.com/in/muhammad-tariq-b6097a11a/"
    },
    {
      name: "Muhammad Anees Sadiq",
      designation: "Team Lead",
      business: "Roots RCM",
      image: "/images/customers/Muhammad_Anees_Sadiq.jpeg",
      linkedin: "https://www.linkedin.com/in/arslan-khaliq-70081132b/"
    },
    {
      name: "Zeeshan Shah",
      designation: "CEO",
      business: "Corporate Art Task Force",
      image: "/images/team/zeeshan-shah.jpg",
      linkedin: "https://www.behance.net/CATaskForce?locale=cs_CZ"
    },
    {
      name: "Umar Saif",
      designation: "CEO",
      business: "aiSight.ai",
      image: "/testimonials/umar-saif.jpeg",
      linkedin: "https://www.linkedin.com/in/umarsaif/"
    },
    {
      name: "Asma Salman Omer",
      designation: "Co-Founder",
      business: "Marham",
      image: "/testimonials/asma-salman.jpeg",
      linkedin: "https://www.linkedin.com/in/asmaomer/"
    }
  ];

  // Group customers: 4 per slide for mobile 2x2 grid layout in each scroll-snap pane
  const groupedCustomers: typeof customers[] = [];
  for (let i = 0; i < customers.length; i += 4) {
    groupedCustomers.push(customers.slice(i, i + 4));
  }

  return (
    <section id="happy-customers" className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">4,000+ Happy Customers</h2>
          <p className="text-muted-foreground">Trusted by industry leaders</p>
        </div>

        {/* CSS scroll-snap carousel — zero JS, no embla/autoplay (~10KB saved). */}
        <div
          className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4"
          style={{ scrollbarWidth: "thin" }}
        >
          {groupedCustomers.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className="snap-start shrink-0 w-full grid grid-cols-2 gap-4 md:gap-6"
            >
              {group.map((customer, index) => (
                <Card key={index} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className="relative mb-3">
                      <img
                        src={customer.image}
                        alt={customer.name}
                        loading="lazy"
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
                      />
                      <a
                        href={customer.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${customer.name} LinkedIn`}
                        className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <Linkedin className="w-4 h-4 text-primary-foreground" />
                      </a>
                    </div>
                    <h4 className="font-semibold text-sm mb-1 line-clamp-2">{customer.name}</h4>
                    <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{customer.designation}</p>
                    <p className="text-sm text-foreground font-semibold line-clamp-2">{customer.business}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IncPortfolio;
