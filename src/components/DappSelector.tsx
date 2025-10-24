import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DappOption {
  id: string;
  name: string;
  iconSrc: string;
}

interface DappSelectorProps {
  dapps: DappOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const DappSelector: FC<DappSelectorProps> = ({ dapps, selectedId, onSelect }) => {
  return (
    <div className="px-1 pt-1">
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-3 min-w-max">
          {dapps.map((dapp) => {
            const isActive = dapp.id === selectedId;

            return (
              <Button
                key={dapp.id}
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onSelect(dapp.id)}
                className={cn(
                  'h-10 w-10 rounded-md border border-transparent text-primary transition-colors',
                  'hover:bg-muted hover:text-primary',
                  isActive && 'border-border'
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
        </div>
      </div>
    </div>
  );
};

export default DappSelector;
