const fs = require('fs');
const content = fs.readFileSync('src/components/Header.tsx', 'utf8');
const searchHTML = `
          {/* Search Bar */}
          <div className="relative group hidden xl:block mr-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm dịch vụ, tin tức..."
              className="pl-9 pr-4 py-2 w-48 focus:w-64 transition-all duration-300 bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 shadow-inner normal-case tracking-normal font-medium"
            />
          </div>
`;
const result = content.replace(
  '<nav className="hidden lg:flex items-center space-x-6 text-[10px] leading-[13px] whitespace-nowrap uppercase tracking-wider font-semibold font-sans">',
  '<nav className="hidden lg:flex items-center space-x-4 xl:space-x-6 text-[10px] leading-[13px] whitespace-nowrap uppercase tracking-wider font-semibold font-sans">\n' + searchHTML
);
fs.writeFileSync('src/components/Header.tsx', result);
