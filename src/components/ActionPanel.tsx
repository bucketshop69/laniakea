import React, { useEffect, useState } from 'react';
import { PlusCircle, MinusCircle, Settings, User, Rss, ArrowRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import DappSelector, { type DappOption } from './DappSelector';
import SarosAction from '@/modules/saros/components/SarosAction';
import DriftAction from '@/modules/drift/components/DriftAction';
import MeteoraAction from '@/modules/meteora/components/MeteoraAction';
import { useDappStore, type SupportedDapp } from '@/store/dappStore';
import { useSarosDataStore } from '@/modules/saros/state';
import { useMeteoraDataStore } from '@/modules/meteora/state';
import { WalletButton } from './WalletButton';
import { FeedPanel } from '@/modules/feed/components';
import { ProfilePanel } from '@/modules/profile';
import Stats from '@/components/Stats';

interface Pool {
    pair: string;
    apy: string;
    tvl: string;
    fee: string;
    currentPrice: number;
    priceChange24h: string;
    volume24h: string;
    high24h: string;
    low24h: string;
}

interface PortfolioData {
    totalValue: string;
    totalPnL: string;
    activePositions: number;
    averageAPY: string;
    performance: {
        return7d: string;
        return30d: string;
        maxDrawdown: string;
        winRate: string;
    };
}

interface Position {
    pair: string;
    amount: string;
    pnl: string;
    apy: string;
    entryDate: string;
}

interface NewsItem {
    id: number;
    type: string;
    title: string;
    description: string;
    time: string;
    impact: string;
    date?: string;
}

interface ChartDataPoint {
    time: string;
    price: number;
    volume: number;
    reserveBase?: number;
    reserveQuote?: number;
    binId?: number;
    isActive?: boolean;
}

interface ActionPanelProps {
    selectedPool: string;
    onSelectedPoolChange: (pool: string) => void;
    pools: Pool[];
    portfolioData: PortfolioData;
    positions: Position[];
    newsItems: NewsItem[];
    currentPool: Pool;
    chartData: ChartDataPoint[];
}

const ActionPanel: React.FC<ActionPanelProps> = ({
    selectedPool,
    onSelectedPoolChange,
    pools,
    portfolioData,
    positions,
    newsItems,
    currentPool,
    chartData,
}) => {
    const [mainTab, setMainTab] = useState('manage');
    const [manageSubTab, setManageSubTab] = useState('add');
    const [addAmount, setAddAmount] = useState('');
    const [removeAmount, setRemoveAmount] = useState('');
    const [showSimulation, setShowSimulation] = useState(false);
    const selectedDapp = useDappStore((state) => state.selectedDapp);
    const setSelectedDapp = useDappStore((state) => state.setSelectedDapp);
    const triggerSarosFetch = useSarosDataStore((state) => state.fetchPools);
    const triggerMeteoraFetch = useMeteoraDataStore((state) => state.fetchPairGroupsData);

    const dapps: DappOption[] = [
        { id: 'meteora', name: 'Meteora', iconSrc: '/meteora/meteora.png' },
        { id: 'drift', name: 'Drift', iconSrc: '/drift/drift-logo.svg' },
        { id: 'saros', name: 'Saros', iconSrc: '/saros/SAROS_Mark_Purple.png' },
    ];

    const handleDappSelection = (id: string) => {
        setSelectedDapp(id as SupportedDapp);
        setMainTab('manage');
    };

    useEffect(() => {
        if (selectedDapp === 'saros') {
            void triggerSarosFetch({ force: true });
        } else if (selectedDapp === 'meteora') {
            void triggerMeteoraFetch({ force: true });
        }
    }, [selectedDapp, triggerSarosFetch, triggerMeteoraFetch]);
    return (
        <div className="col-span-12 md:col-start-8 md:col-span-5 w-full h-full md:min-h-[600px]">
            <Card className="flex flex-col h-full rounded-none md:rounded-lg overflow-hidden md:overflow-visible">
                <div className="grid grid-cols-12 gap-1 p-1">
                    <div className="col-span-10">
                        <DappSelector dapps={dapps} selectedId={selectedDapp} onSelect={handleDappSelection} />
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                        <WalletButton />
                    </div>
                </div>
                <Tabs value={mainTab} onValueChange={setMainTab} className="flex flex-col h-full">
                    <TabsList className="flex mb-1 mx-1 mt-1 rounded-lg p-1 h-auto">
                        <TabsTrigger value="manage"
                            className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-primary">
                            <Settings size={16} className="mr-1" />Manage
                        </TabsTrigger>
                        <TabsTrigger value="profile"
                            className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-primary">
                            <User size={16} className="mr-1" />Profile</TabsTrigger>
                        <TabsTrigger value="feed" className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-primary"><Rss size={16} className="mr-1" />Feed</TabsTrigger>
                    </TabsList>
                    <div className="md:hidden mx-1 mt-2 h-[25vh] overflow-hidden">
                        <Stats
                            selectedPool={selectedPool}
                            currentPool={currentPool}
                            chartData={chartData}
                            className="h-full"
                            chartHeight="100%"
                        />
                    </div>
                    <TabsContent value="manage" className="flex-1 px-1">
                        {selectedDapp === 'saros' ? (
                            <SarosAction />
                        ) : selectedDapp === 'meteora' ? (
                            <MeteoraAction />
                        ) : selectedDapp === 'drift' ? (
                            <DriftAction />
                        ) : (
                            <>
                                {/* Pool Selector */}
                                <div className="mb-4">
                                    <label className="block  text-sm font-medium mb-2">
                                        Select Pool
                                    </label>
                                    <Select value={selectedPool} onValueChange={onSelectedPoolChange}>
                                        <SelectTrigger className="w-full px-3 py-3 text-primary text-left flex items-center 
                                justify-between hover:border-primary transition-all duration-300">
                                            <span className="text-sm ml-2">
                                                {currentPool.apy} APY
                                            </span>

                                        </SelectTrigger>
                                        <SelectContent className="cosmic-dropdown z-10">
                                            {pools.map((pool, index) => (
                                                <SelectItem
                                                    key={index}
                                                    value={pool.pair}
                                                    className="cosmic-dropdown-item w-full text-left first:rounded-t-lg last:rounded-b-lg"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <span className="text-primary font-medium">{pool.pair}</span>
                                                            <div className="text-xs  mt-1">
                                                                TVL: {pool.tvl} • Fee: {pool.fee}
                                                            </div>
                                                        </div>
                                                        <span className="text-secondary-foreground text-sm font-medium">{pool.apy}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Sub-Tab Navigation */}
                                <div className="flex mb-6 bg-muted-foreground/10 rounded-lg p-1">
                                    {[
                                        { id: 'add', label: 'Add', icon: PlusCircle },
                                        { id: 'remove', label: 'Remove', icon: MinusCircle }
                                    ].map(tab => (
                                        <Button
                                            key={tab.id}
                                            onClick={() => setManageSubTab(tab.id)}
                                            variant={manageSubTab === tab.id ? "default" : "ghost"}
                                            className="flex-1"
                                        >
                                            <tab.icon size={16} className="mr-1" />
                                            {tab.label}
                                        </Button>
                                    ))}
                                </div>

                                {/* Add Liquidity Form */}
                                {manageSubTab === 'add' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block  text-sm font-medium mb-2">
                                                Amount
                                            </label>
                                            <div className="flex">
                                                <Input
                                                    type="number"
                                                    value={addAmount}
                                                    onChange={(e) => setAddAmount(e.target.value)}
                                                    placeholder="0.00"
                                                />
                                                <Button className="">
                                                    MAX
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="bg-card p-1">
                                            <p className=" text-xs mb-2">You will receive</p>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="">LP Tokens</span>
                                                    <span className="text-primary">~{addAmount ? (parseFloat(addAmount) * 0.85).toFixed(1) : '0.0'}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="">Pool Share</span>
                                                    <span className="text-secondary-foreground">{addAmount ? (parseFloat(addAmount) * 0.01).toFixed(2) : '0.00'}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        {addAmount && parseFloat(addAmount) > 0 && (
                                            <Button
                                                variant={'ghost'}
                                                className="w-full"
                                                onClick={() => setShowSimulation((prev) => !prev)}
                                            >
                                                {showSimulation ? 'Hide' : 'Simulate Strategy'} ↗
                                            </Button>
                                        )}

                                        {showSimulation && addAmount && parseFloat(addAmount) > 0 && (
                                            <div className="-dark p-1 space-y-2">
                                                <p className="text-secondary-foreground text-xs font-medium mb-2">Strategy Simulation</p>
                                                <div className="space-y-1 text-xs">
                                                    <div className="flex justify-between">
                                                        <span className="">Projected APY</span>
                                                        <span className="text-secondary-foreground">{currentPool.apy}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="">IL Risk (30d)</span>
                                                        <span className="text-muted-foreground">2.3%</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="">Expected Return (30d)</span>
                                                        <span className="text-secondary-foreground">+${(parseFloat(addAmount) * 0.02).toFixed(0)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="">Max Drawdown</span>
                                                        <span className="text-destructive">-5.1%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <Button className="w-full">
                                            <PlusCircle size={16} className="mr-2" />
                                            Launch Liquidity
                                        </Button>
                                    </div>
                                )}

                                {/* Remove Liquidity Form */}
                                {manageSubTab === 'remove' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block  text-sm font-medium mb-2">
                                                LP Tokens
                                            </label>
                                            <div className="flex">
                                                <Input
                                                    type="number"
                                                    value={removeAmount}
                                                    onChange={(e) => setRemoveAmount(e.target.value)}
                                                    placeholder="0.00"
                                                />
                                                <Button className="">
                                                    MAX
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="-dark p-1">
                                            <p className="text-secondary-foreground text-xs mb-2 font-medium">You will receive</p>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="">{selectedPool.split('/')[0]}</span>
                                                    <span className="text-primary">{removeAmount ? (parseFloat(removeAmount) * 0.5 * 0.025).toFixed(4) : '0.0000'}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="">{selectedPool.split('/')[1]}</span>
                                                    <span className="text-primary">{removeAmount ? (parseFloat(removeAmount) * 0.5 * 52).toFixed(2) : '0.00'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Button variant="secondary" className="w-full">
                                            <MinusCircle size={16} className="mr-2" />
                                            Extract Resources
                                        </Button>
                                    </div>
                                )}

                                {/* Pool Info */}
                                <div className="mt-6 pt-4 cosmic-border">
                                    <h3 className=" font-medium mb-3 text-sm">Pool Info</h3>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="">Fee</span>
                                            <span className="text-secondary-foreground">{currentPool.fee}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="">Network</span>
                                            <span className="text-secondary-foreground">Ethereum</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="">Status</span>
                                            <span className="text-purple">Active</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    {/* PROFILE TAB CONTENT */}
                    <TabsContent value="profile" className="flex-1 overflow-hidden">
                        <ProfilePanel />
                    </TabsContent>

                    {/* FEED TAB CONTENT */}
                    <TabsContent value="feed" className="flex-1 px-1">
                        <FeedPanel />
                    </TabsContent>
                </Tabs>


            </Card>
        </div >
    );
};

export default ActionPanel;
