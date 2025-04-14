import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="py-8 border-t">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} 짭냥이. All rights reserved.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                이용 약관
              </Link>
              <Link
                to="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                개인정보 처리방침
              </Link>
              <Link
                to="/contact"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                문의하기
              </Link>
              <Link
                to="/donate"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                후원
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
