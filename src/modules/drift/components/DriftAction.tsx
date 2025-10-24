import { useMemo } from 'react';
import { Search, TrendingUp, LayoutDashboard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import ActionRail, { type ActionDefinition } from '@/components/ui/ActionRail';
import DriftMarketDiscovery from './DriftMarketDiscovery';
import DriftTrade from './DriftTrade';
import DriftOverview from './DriftOverview';
import { useDriftStore, type DriftView } from '../state';
import { useDriftMarketChart } from '../hooks/useDriftMarketChart';
import { useDriftMarketDiscovery } from '../hooks/useDriftMarketDiscovery';
import { useDriftPositions } from '../hooks/useDriftPositions';

const DriftAction = () => {
    // Ensure sockets and discovery are active regardless of sub-view
    useDriftMarketChart();
    useDriftMarketDiscovery();
    useDriftPositions();

    const activeAction = useDriftStore((state) => state.activeView);
    const setActiveAction = useDriftStore((state) => state.setActiveView);

    const actions = useMemo<ActionDefinition<DriftView>[]>(
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
                    <Card className="h-full rounded-2xl p-1">
                        <DriftOverview />
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
            <ActionRail actions={actions} activeAction={activeAction} onSelect={setActiveAction} />
            <div className="col-span-11 flex flex-col">{renderContent()}</div>
        </div>
    );
};

export default DriftAction;
