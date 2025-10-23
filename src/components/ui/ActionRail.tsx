import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ActionDefinition<T extends string = string> {
    id: T;
    icon: LucideIcon;
    label: string;
}

export interface ActionRailProps<T extends string = string> {
    actions: ActionDefinition<T>[];
    activeAction: T;
    onSelect: (id: T) => void;
}

function ActionRail<T extends string = string>({ actions, activeAction, onSelect }: ActionRailProps<T>) {
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
                            'h-8 w-8 rounded-md border border-transparent text-primary transition-colors',
                            'hover:bg-muted hover:text-primary',
                            isActive && 'border-border'
                        )}
                    >
                        <action.icon className="h-5 w-5" />
                    </Button>
                );
            })}
        </div>
    );
}

export default ActionRail;
