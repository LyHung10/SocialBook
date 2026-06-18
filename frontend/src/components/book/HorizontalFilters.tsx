'use client';
import { Filter, Hash, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FiltersData } from '@/features/books/types/book.interface';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRef, useState } from 'react';

interface HorizontalFiltersProps {
  allGenres: FiltersData['genres'];
  allTags: FiltersData['tags'];
  selectedGenres: string[];
  selectedTags: string[];
  onToggleGenre: (slug: string) => void;
  onToggleTag: (tag: string) => void;
  onClearGenres: () => void;
  onClearFilters?: () => void;
}

export const HorizontalFilters = ({
  allGenres,
  allTags,
  selectedGenres,
  selectedTags,
  onToggleGenre,
  onToggleTag,
  onClearGenres,
}: HorizontalFiltersProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragged, setDragged] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setDragged(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    setDragged(true);
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleClick = (e: React.MouseEvent, action: () => void) => {
    if (dragged) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    action();
  };

  return (
    <div className="w-full bg-background border-b border-border/40 sticky top-16 z-30 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 md:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          
          {/* Scrollable Genres */}
          <div 
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex-1 flex items-center gap-2 overflow-x-auto thin-scrollbar pb-2 pt-1 cursor-grab active:cursor-grabbing select-none"
          >
            <button
              onClick={(e) => handleClick(e, onClearGenres)}
              className={cn(
                "shrink-0 px-4 py-1.5 text-sm font-medium rounded-full transition-all border whitespace-nowrap",
                selectedGenres.length === 0 
                  ? "bg-foreground text-background border-foreground" 
                  : "bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Tất cả
            </button>
            
            {allGenres?.map((genre) => {
              const isSelected = selectedGenres.includes(genre.slug);
              return (
                <button
                  key={genre.id}
                  onClick={(e) => handleClick(e, () => onToggleGenre(genre.slug))}
                  className={cn(
                    "shrink-0 px-4 py-1.5 text-sm font-medium rounded-full transition-all border whitespace-nowrap flex items-center gap-1.5",
                    isSelected 
                      ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400" 
                      : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {isSelected && <Check size={14} strokeWidth={3} />}
                  {genre.name}
                </button>
              );
            })}
          </div>

          {/* Tags Dropdown Button */}
          {allTags?.length > 0 && (
            <div className="shrink-0 flex items-center border-l border-border/50 pl-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full gap-2 text-sm font-medium h-9">
                    <Filter size={14} className="text-muted-foreground" />
                    Lọc Tags
                    {selectedTags.length > 0 && (
                      <span className="flex items-center justify-center bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 w-5 h-5 rounded-full text-[10px] ml-1">
                        {selectedTags.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 border-b border-border/50 flex items-center gap-2">
                    <Hash size={16} className="text-muted-foreground" />
                    <span className="font-semibold text-sm">Chọn Tags phổ biến</span>
                  </div>
                  <ScrollArea className="h-[300px] p-4">
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => {
                        const isActive = selectedTags.includes(tag.name);
                        return (
                          <button
                            key={tag.name}
                            onClick={() => onToggleTag(tag.name)}
                            className={cn(
                              "inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors border",
                              isActive
                                ? "bg-foreground text-background border-foreground"
                                : "bg-muted/30 border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                          >
                            #{tag.name}
                            <span className="opacity-50 ml-1.5 text-[10px]">{tag.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
