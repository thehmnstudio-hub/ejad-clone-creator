import { Link } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const UnifiedHeaderMobileMenu = ({ open, onOpenChange }: Props) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent>
      <nav className="flex flex-col gap-3 mt-8" aria-label="Mobile">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Programs</div>
        <Link to="/silicon-valley" onClick={() => onOpenChange(false)} className="text-base font-medium hover:text-primary transition-colors pl-3 py-1">
          Silicon Valley Tech Exchange
        </Link>
        <Link to="/inc" onClick={() => onOpenChange(false)} className="text-base font-medium hover:text-primary transition-colors pl-3 py-1">
          USA Company Formation
        </Link>
        <Link to="/visa" onClick={() => onOpenChange(false)} className="text-base font-medium hover:text-primary transition-colors pl-3 py-1">
          US/EU Visa Desk
        </Link>

        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-3">Events</div>
        <a href="https://www.futurefest.pk" target="_blank" rel="noopener noreferrer" className="text-base font-medium hover:text-primary transition-colors pl-3 py-1">
          Future Fest
        </a>
        <a href="https://www.paktechsummit.com" target="_blank" rel="noopener noreferrer" className="text-base font-medium hover:text-primary transition-colors pl-3 py-1">
          Pakistan Tech Summit
        </a>

        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-3">About</div>
        <Link to="/legacy" onClick={() => onOpenChange(false)} className="text-base font-medium hover:text-primary transition-colors pl-3 py-1">
          Our Legacy
        </Link>

        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-3">Contact</div>
        <Link to="/contact" onClick={() => onOpenChange(false)} className="text-base font-medium hover:text-primary transition-colors pl-3 py-1">
          Contact Us
        </Link>
      </nav>
    </SheetContent>
  </Sheet>
);

export default UnifiedHeaderMobileMenu;
