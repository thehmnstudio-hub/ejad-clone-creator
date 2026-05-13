import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin, Youtube } from "lucide-react";

interface UnifiedFooterProps {
  /** Kept for backward compatibility — no longer renders a map preview. */
  showLiveMap?: boolean;
}

const UnifiedFooter = (_props: UnifiedFooterProps = {}) => {
  return (
    <footer className="py-12 md:py-16 bg-muted/30 border-t">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 mb-10">
          {/* Logo & Description */}
          <div>
            <img
              src="/ejad-labs-logo.png"
              alt="Ejad Labs"
              width={160}
              height={64}
              className="h-14 md:h-16 w-auto mb-4"
              loading="lazy"
              decoding="async"
            />
            <p className="text-sm text-muted-foreground mb-6">
              Empowering entrepreneurs through immersive tech experiences and global services.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h3>
            <ul className="space-y-1">
              <li>
                <a
                  href="https://maps.app.goo.gl/EbLJmNi2yuMfSubWA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-start gap-2"
                >
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>
                    <span className="block font-semibold text-foreground">Registered Office (USA)</span>
                    124 Broadkill Rd #601, Milton, DE 19968
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="https://maps.app.goo.gl/EbLJmNi2yuMfSubWA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-start gap-2"
                >
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>
                    <span className="block font-semibold text-foreground">Regional Office (Pakistan)</span>
                    19-D/1, Gulberg III, Lahore
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@ejadlabs.com"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>hello@ejadlabs.com</span>
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/924232300134"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-primary flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span>0423 230 0134</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+923041111055"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>0304 111 1055</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Programs & Events */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider">Programs</h3>
            <ul className="space-y-2">
              <li><Link to="/silicon-valley" className="text-sm text-muted-foreground hover:text-primary transition-colors">Silicon Valley Tech Exchange</Link></li>
              <li><Link to="/usa" className="text-sm text-muted-foreground hover:text-primary transition-colors">USA Company Formation</Link></li>
              <li><Link to="/visa" className="text-sm text-muted-foreground hover:text-primary transition-colors">US/EU Visa Desk</Link></li>
            </ul>
            <h3 className="font-semibold mb-3 mt-6 text-sm uppercase tracking-wider">Events</h3>
            <ul className="space-y-2">
              <li><a href="https://www.futurefest.pk" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">Future Fest</a></li>
              <li><a href="https://www.paktechsummit.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pakistan Tech Summit</a></li>
            </ul>
            <h3 className="font-semibold mb-3 mt-6 text-sm uppercase tracking-wider">Services</h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-muted-foreground">Full-Service Event Planning</span></li>
              <li><span className="text-sm text-muted-foreground">Government Relations</span></li>
            </ul>
          </div>

          {/* Social & Legal */}
          <div>
            <div className="flex gap-2 mb-6 flex-wrap">
              <a href="https://facebook.com/ejadlabs" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Facebook className="w-4 h-4 text-primary" />
              </a>
              <a href="https://twitter.com/ejadlabs" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Twitter className="w-4 h-4 text-primary" />
              </a>
              <a href="https://linkedin.com/company/ejadlabs" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Linkedin className="w-4 h-4 text-primary" />
              </a>
              <a href="https://instagram.com/ejadlabs" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Instagram className="w-4 h-4 text-primary" />
              </a>
              <a href="https://www.youtube.com/@FutureFestpk" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Youtube className="w-4 h-4 text-primary" />
              </a>
            </div>

            <ul className="space-y-2 mb-6">
              <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>

            <a href="https://www.uschamber.com" target="_blank" rel="noopener noreferrer" className="block min-h-0 min-w-0">
              <img
                alt="U.S. Chamber of Commerce Member"
                src="https://www.uschamber.com/assets/images/USCC_Webstickers_2022_234x75.png"
                title="U.S. Chamber of Commerce Member"
                width={125}
                height={40}
                className="h-10 w-auto"
                loading="lazy"
                decoding="async"
              />
            </a>
          </div>
        </div>

        <div className="pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Ejad Labs. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default UnifiedFooter;
