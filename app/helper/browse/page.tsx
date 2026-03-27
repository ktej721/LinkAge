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
  
  // Filters
  const [language, setLanguage] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const url = new URL('/api/requests', window.location.origin);
        // We fetch all open and filter client-side for better UX in this small app
        // Or we can pass language to API. Let's filter client-side.
        const res = await fetch(url.toString());
        const json = await res.json();
        if (json.data) {
          setRequests(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch requests', error);
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
          <h1 className="text-3xl font-bold text-gray-900">Browse Requests</h1>
          <p className="text-gray-500 mt-1">
            {!loading && <span className="font-semibold text-indigo-600">{filteredRequests.length}</span>} open requests waiting for help
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search keywords..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[140px] capitalize">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
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

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px] capitalize">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
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
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-gray-500">Finding requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-lg font-medium text-gray-900">No matching requests found.</p>
          <p className="text-gray-500 mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRequests.map(req => (
            <RequestCard key={req.id} request={req} viewAs="helper" />
          ))}
        </div>
      )}
    </div>
  );
}
