export default function Layout({ children }) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="shadow bg-white">
          <div className="container mx-auto px-6 py-4">
            <h1 className="text-xl font-semibold text-gray-800">
              전북생명의숲 🌳
            </h1>
          </div>
        </header>
  
        <main className="container mx-auto px-6 py-10">{children}</main>
  
        <footer className="bg-gray-100 border-t">
          <div className="container mx-auto px-6 py-4 text-gray-600 text-sm">
            © {new Date().getFullYear()} 전북생명의숲. All rights reserved.
          </div>
        </footer>
      </div>
    );
  }
  