import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img 
              src="/ejad-labs-logo.png" 
              alt="Ejad Labs" 
              className="h-12 md:h-14"
            />
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/silicon-valley" className="text-sm font-medium hover:text-primary transition-colors">
              Silicon Valley Tech Exchange
            </Link>
            <Link to="/usa" className="text-sm font-medium hover:text-primary transition-colors">
              USA Company Formation
            </Link>
            <Link to="/visa" className="text-sm font-medium hover:text-primary transition-colors">
              US/EU Visa Desk
            </Link>
            <Link to="/contact" className="text-sm font-medium hover:text-primary transition-colors">
              Contact
            </Link>
            <a href="https://www.futurefest.pk" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary transition-colors">
              Future Fest
            </a>
            <a href="https://www.paktechsummit.com" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary transition-colors">
              Pakistan Tech Summit
            </a>
          </nav>

          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <button className="p-2">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent>
              <nav className="flex flex-col gap-4 mt-8">
                <Link to="/" className="text-lg font-medium hover:text-primary transition-colors">
                  Home
                </Link>
                <Link to="/silicon-valley" className="text-lg font-medium hover:text-primary transition-colors">
                  Silicon Valley Tech Exchange
                </Link>
                <Link to="/usa" className="text-lg font-medium hover:text-primary transition-colors">
                  USA Company Formation
                </Link>
                <Link to="/visa" className="text-lg font-medium hover:text-primary transition-colors">
                  US/EU Visa Desk
                </Link>
                <Link to="/contact" className="text-lg font-medium hover:text-primary transition-colors">
                  Contact
                </Link>
                <a href="https://www.futurefest.pk" target="_blank" rel="noopener noreferrer" className="text-lg font-medium hover:text-primary transition-colors">
                  Future Fest
                </a>
                <a href="https://www.paktechsummit.com" target="_blank" rel="noopener noreferrer" className="text-lg font-medium hover:text-primary transition-colors">
                  Pakistan Tech Summit
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
