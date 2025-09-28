import { useMemo, useState } from 'react';
import { Plus, Search, Droplets } from 'lucide-react';
import { Card } from '@/components/ui/card';
import SarosActionRail, { type SarosActionDefinition } from './SarosActionRail';
import SarosDiscover from './SarosDiscover';

const CreatePlaceholder = () => (
    <Card className="h-full rounded-2xl p-1">
        <div className="space-y-1">
            <h2 className="text-lg font-semibold text-primary">Create Pool</h2>
            <p className="text-sm text-muted-foreground">
                Configure DLMM pool parameters and launch liquidity. (Form coming soon.)
            </p>
        </div>
    </Card>
);

const ManagePlaceholder = () => (
    <Card className="h-full rounded-2xl p-1">
        <div className="space-y-1">
            <h2 className="text-lg font-semibold text-primary">Manage Liquidity</h2>
            <p className="text-sm text-muted-foreground">
                Add, remove, or claim rewards from your Saros pools. (Controls coming soon.)
            </p>
        </div>
    </Card>
);

type SarosActionId = 'discover' | 'create' | 'manage';

const SarosAction = () => {
    const [activeAction, setActiveAction] = useState<SarosActionId>('discover');

    const actions = useMemo<SarosActionDefinition<SarosActionId>[]>(
        () => [
            { id: 'discover', icon: Search, label: 'Discover pools' },
            { id: 'create', icon: Plus, label: 'Create pool' },
            { id: 'manage', icon: Droplets, label: 'Manage liquidity' },
        ],
        []
    );

    const renderContent = () => {
        switch (activeAction) {
            case 'create':
                return <CreatePlaceholder />;
            case 'manage':
                return <ManagePlaceholder />;
            case 'discover':
            default:
                return (
                    <Card className="h-full rounded-2xl p-1">
                        <SarosDiscover />
                    </Card>
                );
        }
    };

    return (
        <div className="grid h-full grid-cols-12 gap-1">
            <SarosActionRail actions={actions} activeAction={activeAction} onSelect={setActiveAction} />
            <div className="col-span-11 flex flex-col">{renderContent()}</div>
        </div>
    );
};

export default SarosAction;