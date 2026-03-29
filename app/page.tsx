import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mic, ShieldCheck, Heart, ArrowDown } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      {/* Compact mobile navbar */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900 tracking-tight">LinkAge</span>
          <div className="flex gap-2">
            <Link href="/login?role=helper">
              <Button variant="ghost" size="sm" className="text-slate-600 active:text-slate-900 font-semibold text-sm px-3">Student</Button>
            </Link>
            <Link href="/login?role=senior">
              <Button size="sm" className="bg-amber-600 active:bg-amber-700 text-white font-bold text-sm px-4 rounded-lg">Login</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — mobile-first */}
      <section className="bg-white py-12 sm:py-24 overflow-hidden border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 text-center">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-4 sm:mb-8 leading-tight">
              Bridging Generations, <br />
              <span className="text-amber-600">One Question at a Time</span>
            </h1>
            <p className="text-base sm:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed mb-8 sm:mb-12">
              A safe, voice-first platform where seniors get tech help from verified student volunteers — in their own language.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6 justify-center items-center">
              <Link href="/login?role=senior" className="w-full sm:w-auto">
                <Button size="lg" className="h-14 sm:h-16 w-full sm:w-auto px-10 rounded-2xl bg-amber-600 active:bg-amber-700 text-white text-lg font-extrabold shadow-lg shadow-amber-600/20">
                  I Need Help
                </Button>
              </Link>
              <Link href="/login?role=helper" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="h-14 sm:h-16 w-full sm:w-auto px-10 rounded-2xl border-2 border-slate-300 active:border-slate-400 text-slate-700 text-lg font-extrabold">
                  I Want to Help
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features — stack on mobile */}
      <section className="py-12 sm:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 text-center mb-8 sm:mb-16">Why Choose LinkAge?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-10">
            {[
              { icon: Mic, title: 'Voice-First Experience', desc: "Seniors don't need to type. Just press a button and speak in your preferred language." },
              { icon: ShieldCheck, title: 'Verified Students', desc: 'Helpers are verified using their university email to ensure a responsible community.' },
              { icon: Heart, title: 'Safe & Monitored', desc: 'Video responses are manually reviewed by our team before they reach you.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200 flex items-start gap-4 sm:flex-col sm:items-start">
                <div className="bg-amber-50 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-bold text-slate-900 mb-1 sm:mb-3">{f.title}</h3>
                  <p className="text-slate-500 text-sm sm:text-base leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — vertical on mobile */}
      <section className="py-12 sm:py-24 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 text-center mb-8 sm:mb-16">How It Works</h2>
          <div className="flex flex-col sm:grid sm:grid-cols-4 gap-6 sm:gap-8 items-center">
            {[
              { num: '1', title: 'Senior Speaks', desc: 'Uses the mic to ask a question in their language.' },
              { num: '2', title: 'Request Posted', desc: 'Voice is transcribed and shared with helpers.' },
              { num: '3', title: 'Student Answers', desc: 'A volunteer records a video or text solution.' },
              { num: '4', title: 'Problem Solved', desc: 'Senior watches the answer and resolves their issue.', final: true },
            ].map((step, i) => (
              <div key={step.num} className="flex flex-col items-center text-center w-full">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold mb-3 sm:mb-4 ${
                  step.final
                    ? 'bg-slate-800 text-white'
                    : 'bg-amber-100 text-amber-700 border-2 border-amber-200'
                }`}>
                  {step.num}
                </div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-1 sm:mb-2">{step.title}</h4>
                <p className="text-slate-500 font-medium text-sm max-w-[200px]">{step.desc}</p>
                {i < 3 && (
                  <ArrowDown className="w-5 h-5 text-slate-300 mt-4 sm:hidden" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer — compact on mobile */}
      <footer className="bg-slate-50 border-t border-slate-200 mt-auto">
        <div className="max-w-6xl mx-auto px-5 py-6 sm:py-12 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-6">
          <span className="text-base font-bold text-slate-900 tracking-tight">LinkAge</span>
          <p className="text-slate-400 text-xs sm:text-sm font-medium text-center">
            &copy; {new Date().getFullYear()} LinkAge. Built to connect generations.
          </p>
          <Link href="/login?role=owner" className="text-slate-400 active:text-slate-600 text-xs sm:text-sm font-medium">
            Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
