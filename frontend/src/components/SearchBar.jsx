import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ searchQuery, setSearchQuery }) => {
    return (
        <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Search className="w-4 h-4 text-[#8696a0]" />
            </div>
            <input
                type="text"
                placeholder="Search or start new chat"
                className="w-full bg-[#202c33] rounded-lg py-2 pl-12 pr-4 text-sm focus:outline-none placeholder-[#8696a0]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
    );
};

export default SearchBar;
