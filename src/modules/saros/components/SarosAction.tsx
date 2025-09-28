import { useMemo, useState } from 'react';
import { Plus, Search, Droplets } from 'lucide-react';
import { Card } from '@/components/ui/card';
import SarosActionRail, { type SarosActionDefinition } from './SarosActionRail';

const DiscoverPlaceholder = () => (
    <Card className="h-full rounded-2xl p-6">
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-primary">Discover Pools</h2>
            <p className="text-sm text-muted-foreground">
                Search Saros pools and review opportunities. (Content coming soon.)
            </p>
        </div>
    </Card>
);

const CreatePlaceholder = () => (
    <Card className="h-full rounded-2xl p-6">
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-primary">Create Pool</h2>
            <p className="text-sm text-muted-foreground">
                Configure DLMM pool parameters and launch liquidity. (Form coming soon.)
            </p>
        </div>
    </Card>
);

const ManagePlaceholder = () => (
    <Card className="h-full rounded-2xl p-6">
        <div className="space-y-4">
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
                return <DiscoverPlaceholder />;
        }
    };

    return (
        <div className="grid h-full grid-cols-12 gap-2">
            <SarosActionRail actions={actions} activeAction={activeAction} onSelect={setActiveAction} />
            <div className="col-span-11 flex flex-col">{renderContent()}</div>
        </div>
    );
};

export default SarosAction;