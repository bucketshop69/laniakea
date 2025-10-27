import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DappOption {
  id: string;
  name: string;
  iconSrc: string;
  disabled?: boolean;
}

interface DappSelectorProps {
  dapps: DappOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const DappSelector: FC<DappSelectorProps> = ({ dapps, selectedId, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Split dapps into visible (first 3) and hidden (rest)
  const visibleDapps = dapps.slice(0, 3);
  const hiddenDapps = dapps.slice(3);
  const previewDapps = hiddenDapps.slice(0, 3);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const handleDappClick = (id: string) => {
    onSelect(id);
    setIsExpanded(false);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      ref={containerRef}
      className="relative px-1 pt-1 w-fit"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "relative rounded-md transition-all duration-300",
          (isHovered || isExpanded) && "bg-muted/20"
        )}
      >
        {/* Main visible dapps + arrow on mobile */}
        <div className="flex items-center gap-3 p-1">
          {visibleDapps.map((dapp) => {
            const isActive = dapp.id === selectedId;
            const isDisabled = dapp.disabled;

            return (
              <Button
                key={dapp.id}
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => !isDisabled && handleDappClick(dapp.id)}
                disabled={isDisabled}
                className={cn(
                  'h-10 w-10 rounded-md border border-transparent text-primary transition-colors',
                  'hover:bg-muted hover:text-primary',
                  isActive && 'border-border',
                  isDisabled && 'opacity-50 cursor-not-allowed grayscale'
                )}
              >
                <img
                  src={dapp.iconSrc}
                  alt={dapp.name}
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              </Button>
            );
          })}

          {/* Arrow beside icons (mobile) */}
          {hiddenDapps.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleExpanded}
              className={cn(
                'h-10 w-10 rounded-md transition-all duration-300 md:hidden',
                'hover:bg-muted'
              )}
            >
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-300',
                  isExpanded && 'rotate-180'
                )}
              />
            </Button>
          )}
        </div>

        {/* Arrow - shown below (desktop only), absolutely positioned and centered */}
        {hiddenDapps.length > 0 && (
          <div className="hidden md:flex absolute top-full left-1/2 -translate-x-1/2 mt-0 z-50">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleExpanded}
              className={cn(
                'h-6 w-6 rounded-md transition-all duration-300',
                'hover:bg-muted bg-muted/50',
                (isHovered || isExpanded) ? 'opacity-100' : 'opacity-0'
              )}
            >
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-300 text-foreground',
                  isExpanded && 'rotate-180'
                )}
              />
            </Button>

            {/* Preview dapps - commented out for now */}
            {/* <div
              className={cn(
                "flex gap-3 transition-all duration-300",
                isHovered || isExpanded ? "opacity-100" : "opacity-0 scale-95"
              )}
            >
              {previewDapps.map((dapp) => (
                <div
                  key={dapp.id}
                  className={cn(
                    'h-10 w-10 rounded-md transition-all duration-300',
                    'blur-[2px] opacity-50 grayscale',
                    isHovered && 'blur-[1px] opacity-60'
                  )}
                >
                  <img
                    src={dapp.iconSrc}
                    alt={dapp.name}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </div>
              ))}
            </div> */}
          </div>
        )}

        {/* Expanded dropdown with all hidden dapps */}
        {isExpanded && hiddenDapps.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 md:mt-7 bg-card border border-border rounded-md shadow-lg z-50 p-2 min-w-[200px]">
            <div className="grid grid-cols-3 gap-2">
              {hiddenDapps.map((dapp) => {
                const isActive = dapp.id === selectedId;
                const isDisabled = dapp.disabled;

                return (
                  <Button
                    key={dapp.id}
                    type="button"
                    variant="ghost"
                    onClick={() => !isDisabled && handleDappClick(dapp.id)}
                    disabled={isDisabled}
                    className={cn(
                      'h-12 w-full flex flex-col items-center justify-center gap-1 p-2',
                      'hover:bg-muted transition-colors',
                      isActive && 'border border-border bg-muted/50',
                      isDisabled && 'opacity-50 cursor-not-allowed grayscale'
                    )}
                  >
                    <img
                      src={dapp.iconSrc}
                      alt={dapp.name}
                      className="h-6 w-6 object-contain"
                      loading="lazy"
                    />
                    <span className="text-[10px] text-muted-foreground truncate max-w-full">
                      {dapp.name}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DappSelector;
