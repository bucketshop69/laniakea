import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SarosActionDefinition<T extends string = string> {
  id: T;
  icon: LucideIcon;
  label: string;
}

export interface SarosActionRailProps<T extends string = string> {
  actions: SarosActionDefinition<T>[];
  activeAction: T;
  onSelect: (id: T) => void;
}

function SarosActionRail<T extends string = string>({ actions, activeAction, onSelect }: SarosActionRailProps<T>) {
  return (
    <div className="col-span-1 flex flex-col items-center gap-1">
      {actions.map((action) => {
        const isActive = action.id === activeAction;

        return (
          <Button
            key={action.id}
            type="button"
            variant="ghost"
            size="icon"
            aria-label={action.label}
            onClick={() => onSelect(action.id)}
            className={cn(
              'h-8 w-8 rounded-md border border-transparent text-muted-foreground transition-colors',
              'hover:bg-muted hover:text-primary',
              isActive && 'border-blue bg-blue text-white hover:bg-blue hover:text-white'
            )}
          >
            <action.icon className="h-5 w-5" />
          </Button>
        );
      })}
    </div>
  );
}

export default SarosActionRail;
