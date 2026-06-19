export default function PublicShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-200">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-serif font-semibold tracking-tight">SUTURA</div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-[#A8A19A]">
            <a href="#" className="hover:text-zinc-900 transition-colors">Catalog</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Book Appointment</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Our Process</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Contact</a>
          </nav>
        </div>
      </header>
      <main>
        {children}
      </main>
      <footer className="bg-zinc-50 border-t border-zinc-200 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-[#A8A19A]">
          Powered by SUTURA. All garments are crafted with precision.
        </div>
      </footer>
    </div>
  );
}
