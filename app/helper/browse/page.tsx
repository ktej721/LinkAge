'use client';

import { useState, useEffect } from 'react';
import { Request } from '@/types';
import RequestCard from '@/components/RequestCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';

export default function BrowseRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [language, setLanguage] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const url = new URL('/api/requests', window.location.origin);
        url.searchParams.set('status', 'open');
        const res = await fetch(url.toString());
        const json = await res.json();
        if (json.data) {
          setRequests(json.data);
        }
      } catch (error) {
        // Silently handle fetch error
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const filteredRequests = requests.filter(req => {
    const matchLang = language === 'all' || req.language === language;
    const matchCat = category === 'all' || req.category === category;
    const matchSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        req.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLang && matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Browse Requests</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {!loading && <span className="font-semibold text-amber-600">{filteredRequests.length}</span>} open requests waiting for help
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group space-y-3">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-50 to-rose-50/50 mix-blend-overlay"></div>
        <div className="flex-1 relative z-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
          <Input 
            placeholder="Search keywords..." 
            className="pl-10 border-white/50 bg-white/50 backdrop-blur-md h-12 text-base shadow-inner focus-visible:ring-amber-500/50"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-3 relative z-10 w-full">
          <Select value={language} onValueChange={(val) => setLanguage(val || 'all')}>
            <SelectTrigger className="flex-1 capitalize border-white/50 bg-white/50 backdrop-blur-md h-11 shadow-inner focus:ring-amber-500/50 transition-colors">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="border-white/20 bg-white/80 backdrop-blur-xl">
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="hindi">Hindi</SelectItem>
              <SelectItem value="tamil">Tamil</SelectItem>
              <SelectItem value="telugu">Telugu</SelectItem>
              <SelectItem value="kannada">Kannada</SelectItem>
              <SelectItem value="malayalam">Malayalam</SelectItem>
              <SelectItem value="marathi">Marathi</SelectItem>
              <SelectItem value="bengali">Bengali</SelectItem>
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={(val) => setCategory(val || 'all')}>
            <SelectTrigger className="flex-1 capitalize border-white/50 bg-white/50 backdrop-blur-md h-11 shadow-inner focus:ring-amber-500/50 transition-colors">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="border-white/20 bg-white/80 backdrop-blur-xl">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="health">Health</SelectItem>
              <SelectItem value="government">Government</SelectItem>
              <SelectItem value="shopping">Shopping</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="entertainment">Entertainment</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
          <p className="text-slate-500">Finding requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <p className="text-lg font-medium text-slate-900">No matching requests found.</p>
          <p className="text-slate-500 mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map(req => (
            <RequestCard key={req.id} request={req} viewAs="helper" />
          ))}
        </div>
      )}
    </div>
  );
}
