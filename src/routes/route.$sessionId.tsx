            {/* Search Input */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                placeholder={
                  locale === "th"
                    ? "ค้นหาร้านค้า เช่น Siam Tea..."
                    : "Search stores..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 rounded-full border border-border bg-secondary/50 py-1.5 px-4 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button 
                onClick={() => window.location.href = `?store=${storeId}&locale=${locale === "th" ? "en" : "th"}`}
                className="min-h-8 shrink-0 rounded-full border border-border bg-card px-3 text-[0.6rem] font-bold uppercase text-foreground"
              >
                {locale === "th" ? "TH 🇹🇭" : "EN 🇬🇧"}
              </button>
            </div>