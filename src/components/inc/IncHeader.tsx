import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const IncHeader = () => {
  return (
    <header className="z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
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
            <Link to="/inc#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link to="/inc#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
              Testimonials
            </Link>
            <Link to="/inc#contact" className="text-sm font-medium hover:text-primary transition-colors">
              Contact
            </Link>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              Apply Today
            </Button>
          </nav>

          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <nav className="flex flex-col gap-4 mt-8">
                <Link to="/inc#pricing" className="text-lg font-medium hover:text-primary transition-colors">
                  Pricing
                </Link>
                <Link to="/inc#testimonials" className="text-lg font-medium hover:text-primary transition-colors">
                  Testimonials
                </Link>
                <Link to="/inc#contact" className="text-lg font-medium hover:text-primary transition-colors">
                  Contact
                </Link>
                <Button className="bg-primary hover:bg-primary/90 mt-4">
                  Apply Today
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default IncHeader;
