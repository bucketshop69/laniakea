import { useMemo } from 'react';
import { Plus, Search, Droplets } from 'lucide-react';
import { Card } from '@/components/ui/card';
import ActionRail, { type ActionDefinition } from '@/components/ui/ActionRail';
import SarosDiscover from './SarosDiscover';
import SarosManage from './SarosManage';
import SarosCreatePool from './SarosCreatePool';
import { useSarosStore, useSarosDataStore, type SarosView } from '../state';
import type { SarosPoolOverview } from '@/modules/saros/types/domain';

const SarosAction = () => {
    const setSelectedSarosPool = useSarosDataStore((store) => store.setSelectedPool);
    const activeAction = useSarosStore((state) => state.activeView);
    const setActiveAction = useSarosStore((state) => state.setActiveView);
    const setSelectedPoolAddress = useSarosStore((state) => state.setSelectedPoolAddress);

    const actions = useMemo<ActionDefinition<SarosView>[]>(
        () => [
            { id: 'discover', icon: Search, label: 'Discover pools' },
            { id: 'create', icon: Plus, label: 'Create pool' },
            { id: 'manage', icon: Droplets, label: 'Manage liquidity' },
        ],
        []
    );

    const handlePoolSelect = (pool: SarosPoolOverview) => {
        setSelectedSarosPool(pool);
        setSelectedPoolAddress(pool.pairs[0]?.pair ?? null);
        setActiveAction('manage');
    };

    const handleBackToDiscover = () => {
        setSelectedSarosPool(null);
        setSelectedPoolAddress(null);
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
            <ActionRail actions={actions} activeAction={activeAction} onSelect={setActiveAction} />
            <div className="col-span-11 flex flex-col">{renderContent()}</div>
        </div>
    );
};

export default SarosAction;
