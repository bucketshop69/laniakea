import { useMemo } from 'react';
import { Search, TrendingUp, LayoutDashboard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import SarosActionRail, { type SarosActionDefinition } from '../../saros/components/SarosActionRail';
import DriftMarketDiscovery from './DriftMarketDiscovery';
import DriftTrade from './DriftTrade';
import { useDriftStore, type DriftView } from '../state';
import { useDriftMarketChart } from '../hooks/useDriftMarketChart';
import { useDriftMarketDiscovery } from '../hooks/useDriftMarketDiscovery';

const DriftAction = () => {
    // Ensure sockets and discovery are active regardless of sub-view
    useDriftMarketChart();
    useDriftMarketDiscovery();

    const activeAction = useDriftStore((state) => state.activeView);
    const setActiveAction = useDriftStore((state) => state.setActiveView);

    const actions = useMemo<SarosActionDefinition<DriftView>[]>(
        () => [
            { id: 'discover', icon: Search, label: 'Discover markets' },
            { id: 'trade', icon: TrendingUp, label: 'Trade' },
            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
        ],
        []
    );

    const renderContent = () => {
        switch (activeAction) {
            case 'discover':
                return (
                    <Card className="h-full rounded-2xl p-1">
                        <DriftMarketDiscovery />
                    </Card>
                );
            case 'trade':
                return (
                    <Card className="h-full rounded-2xl p-1">
                        <DriftTrade />
                    </Card>
                );
            case 'overview':
                return (
                    <Card className="h-full rounded-2xl p-4">
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            Overview coming soon...
                        </div>
                    </Card>
                );
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
