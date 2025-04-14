
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import PageTransition from '@/components/PageTransition';

const NotFound: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-md">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse-subtle"></div>
            <div className="absolute inset-0 flex items-center justify-center text-7xl font-bold text-primary">
              404
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
          
          <p className="text-muted-foreground mb-8">
            We couldn't find the page you were looking for. The page may have been moved, deleted, or never existed.
          </p>
          
          <Link to="/">
            <Button className="gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
};

export default NotFound;
