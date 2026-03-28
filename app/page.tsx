import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mic, ShieldCheck, Heart, ArrowRight, Video, FileText } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">🔗 LinkAge</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login?role=senior">
              <Button variant="ghost" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-semibold text-base px-6">Login</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-24 sm:py-32 overflow-hidden border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-gray-900 mb-8 leading-tight">
              Bridging Generations, <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">One Question at a Time</span>
            </h1>
            <p className="mt-6 text-xl sm:text-2xl text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed mb-12">
              A safe, voice-first platform where seniors can easily get tech help from verified student volunteers in their local languages.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/login?role=senior">
                <Button size="lg" className="h-16 px-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xl font-bold shadow-lg shadow-orange-500/30 w-full sm:w-auto hover:-translate-y-1 transition-transform">
                  I Need Help (Senior)
                </Button>
              </Link>
              <Link href="/login?role=helper">
                <Button size="lg" className="h-16 px-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-bold shadow-lg shadow-indigo-600/30 w-full sm:w-auto hover:-translate-y-1 transition-transform">
                  I Want to Help (Student)
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
             <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Why Choose LinkAge?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-orange-50 rounded-3xl p-8 border border-orange-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Mic className="w-32 h-32 text-orange-600" />
              </div>
              <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                 <Mic className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 relative z-10">Voice-First Experience</h3>
              <p className="text-gray-600 text-lg leading-relaxed relative z-10">
                Seniors don&apos;t need to type long questions. Just press a button and speak in your preferred language.
              </p>
            </div>

            <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <ShieldCheck className="w-32 h-32 text-emerald-600" />
              </div>
              <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                 <ShieldCheck className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 relative z-10">Verified Students</h3>
              <p className="text-gray-600 text-lg leading-relaxed relative z-10">
                 Helpers are verified using their university email addresses to ensure a responsible and helpful community.
              </p>
            </div>

            <div className="bg-purple-50 rounded-3xl p-8 border border-purple-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Heart className="w-32 h-32 text-purple-600" />
              </div>
              <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                 <Heart className="w-7 h-7 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 relative z-10">Safe & Monitored</h3>
              <p className="text-gray-600 text-lg leading-relaxed relative z-10">
                Video responses from new helpers are manually reviewed by our team before they reach you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-slate-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
             <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
             <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-3xl font-bold mb-4 border-4 border-white shadow-md">1</div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Senior Speaks</h4>
                <p className="text-gray-500 font-medium">Using the mic to ask a question in their language.</p>
             </div>
             
             <div className="hidden md:flex items-center justify-center h-20">
               <ArrowRight className="w-8 h-8 text-gray-300" />
             </div>
             
             <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold mb-4 border-4 border-white shadow-md">2</div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Request Posted</h4>
                <p className="text-gray-500 font-medium">Text is generated and posted instantly.</p>
             </div>
             
             <div className="hidden md:flex items-center justify-center h-20">
               <ArrowRight className="w-8 h-8 text-gray-300" />
             </div>

             <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-3xl font-bold mb-4 border-4 border-white shadow-md">3</div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Student Answers</h4>
                <p className="text-gray-500 font-medium">A volunteer records a video or text solution.</p>
             </div>

             <div className="hidden md:flex items-center justify-center h-20">
               <ArrowRight className="w-8 h-8 text-gray-300" />
             </div>

             <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl font-bold mb-4 border-4 border-white shadow-md">4</div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Problem Solved</h4>
                <p className="text-gray-500 font-medium">Senior watches the video and solves their issue.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900 tracking-tight">🔗 LinkAge</span>
          </div>
          <p className="text-gray-500 text-sm font-medium">
            &copy; {new Date().getFullYear()} LinkAge Platform. Built to connect generations.
          </p>
          <div className="flex gap-4">
             <Link href="/login?role=owner" className="text-gray-400 hover:text-gray-900 text-sm font-medium transition-colors">
               Owner Login
             </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
