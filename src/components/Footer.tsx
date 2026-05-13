const Footer = () => {
  return (
    <footer className="py-8 bg-background border-t">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground mb-4">POWERED BY</p>
        <img 
          src="/ejad-labs-logo.png" 
          alt="Ejad Labs" 
          className="h-8 mx-auto"
        />
      </div>
    </footer>
  );
};

export default Footer;
