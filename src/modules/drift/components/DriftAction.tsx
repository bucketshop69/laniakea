import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import SarosActionRail, { type SarosActionDefinition } from '../../saros/components/SarosActionRail';
import DriftMarketDiscovery from './DriftMarketDiscovery';
import { useDriftStore, type DriftView } from '../state';
import { useDriftMarketChart } from '../hooks/useDriftMarketChart';

const DriftAction = () => {
    useDriftMarketChart();
    
    const activeAction = useDriftStore((state) => state.activeView);
    const setActiveAction = useDriftStore((state) => state.setActiveView);

    const actions = useMemo<SarosActionDefinition<DriftView>[]>(
        () => [
            { id: 'discover', icon: Search, label: 'Discover markets' },
        ],
        []
    );

    const renderContent = () => {
        switch (activeAction) {
            case 'discover':
            default:
                return (
                    <Card className="h-full rounded-2xl p-1">
                        <DriftMarketDiscovery />
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

export default DriftAction;
