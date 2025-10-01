import { useMemo, useState } from 'react';
import { Plus, Search, Droplets } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useDappStore, type SarosPoolOverview } from '@/store/dappStore';
import SarosActionRail, { type SarosActionDefinition } from './SarosActionRail';
import SarosDiscover from './SarosDiscover';
import SarosManage from './SarosManage';
import SarosCreatePool from './SarosCreatePool';

type SarosActionId = 'discover' | 'create' | 'manage';

const SarosAction = () => {
    const [activeAction, setActiveAction] = useState<SarosActionId>('discover');
    const setSelectedSarosPool = useDappStore((state) => state.setSelectedSarosPool);

    const actions = useMemo<SarosActionDefinition<SarosActionId>[]>(
        () => [
            { id: 'discover', icon: Search, label: 'Discover pools' },
            { id: 'create', icon: Plus, label: 'Create pool' },
            { id: 'manage', icon: Droplets, label: 'Manage liquidity' },
        ],
        []
    );

    const handlePoolSelect = (pool: SarosPoolOverview) => {
        setSelectedSarosPool(pool);
        setActiveAction('manage');
    };

    const handleBackToDiscover = () => {
        setSelectedSarosPool(null);
        setActiveAction('discover');
    };

    const renderContent = () => {
        switch (activeAction) {
            case 'create':
                return (
                    <Card className="h-full rounded-2xl p-1 overflow-y-auto">
                        <SarosCreatePool />
                    </Card>
                );
            case 'manage':
                return <SarosManage onBack={handleBackToDiscover} />;
            case 'discover':
            default:
                return (
                    <Card className="h-full rounded-2xl p-1">
                        <SarosDiscover onSelect={handlePoolSelect} />
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