import React, { useEffect, useState } from 'react';
import { PlusCircle, MinusCircle, Settings, User, Rss, Calendar, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import DappSelector, { type DappOption } from './DappSelector';
import SarosAction from '@/modules/saros/components/SarosAction';
import { useDappStore, type SupportedDapp } from '@/store/dappStore';
import { WalletButton } from './WalletButton';

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

interface ActionPanelProps {
    selectedPool: string;
    onSelectedPoolChange: (pool: string) => void;
    pools: Pool[];
    portfolioData: PortfolioData;
    positions: Position[];
    newsItems: NewsItem[];
}

const ActionPanel: React.FC<ActionPanelProps> = ({
    selectedPool,
    onSelectedPoolChange,
    pools,
    portfolioData,
    positions,
    newsItems,
}) => {
    const [mainTab, setMainTab] = useState('manage');
    const [manageSubTab, setManageSubTab] = useState('add');
    const [addAmount, setAddAmount] = useState('');
    const [removeAmount, setRemoveAmount] = useState('');
    const [showSimulation, setShowSimulation] = useState(false);
    const selectedDapp = useDappStore((state) => state.selectedDapp);
    const setSelectedDapp = useDappStore((state) => state.setSelectedDapp);
    const triggerSarosFetch = useDappStore((state) => state.fetchSarosData);

    const dapps: DappOption[] = [
        { id: 'saros', name: 'Saros', iconSrc: '/saros/SAROS_Mark_Purple.png' },
        // { id: 'meteora', name: 'Meteora', iconSrc: '/meteora/meteora.png' }
    ];

    const currentPool = pools.find(p => p.pair === selectedPool) || pools[0];
    const handleDappSelection = (id: string) => {
        setSelectedDapp(id as SupportedDapp);
        setMainTab('manage');
    };

    useEffect(() => {
        if (selectedDapp === 'saros') {
            void triggerSarosFetch();
        }
    }, [selectedDapp, triggerSarosFetch]);
    return (
        <div className="col-start-8 col-span-5 w-full min-h-[600px]">
            <Card className="flex flex-col h-full">
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

                    <TabsContent value="manage" className="flex-1 px-1">
                        {selectedDapp === 'saros' ? (
                            <SarosAction />
                        ) : (
                            <>
                                {/* Pool Selector */}
                                <div className="mb-4">
                                    <label className="block  text-sm font-medium mb-2">
                                        Select Pool
                                    </label>
                                    <Select value={selectedPool} onValueChange={onSelectedPoolChange}>
                                        <SelectTrigger className="w-full px-3 py-3 text-primary text-left flex items-center 
                                justify-between hover:border-blue transition-all duration-300">
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
                                                        <span className="text-blue text-sm font-medium">{pool.apy}</span>
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
                                                    <span className="text-blue">{addAmount ? (parseFloat(addAmount) * 0.01).toFixed(2) : '0.00'}%</span>
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
                                                <p className="text-purple text-xs font-medium mb-2">Strategy Simulation</p>
                                                <div className="space-y-1 text-xs">
                                                    <div className="flex justify-between">
                                                        <span className="">Projected APY</span>
                                                        <span className="text-blue">{currentPool.apy}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="">IL Risk (30d)</span>
                                                        <span className="text-yellow-400">2.3%</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="">Expected Return (30d)</span>
                                                        <span className="text-blue">+${(parseFloat(addAmount) * 0.02).toFixed(0)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="">Max Drawdown</span>
                                                        <span className="text-red-400">-5.1%</span>
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
                                            <p className="text-purple text-xs mb-2 font-medium">You will receive</p>
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
                                            <span className="text-blue">{currentPool.fee}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="">Network</span>
                                            <span className="text-blue">Ethereum</span>
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
                    <TabsContent value="profile" className="flex-1 space-y-4 px-4">
                        {/* Portfolio Overview */}
                        <div className="-dark p-1 opacity-50">
                            <h3 className="text-muted-foreground font-medium mb-3">Portfolio Overview</h3>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div>
                                    <p className="text-muted-foreground text-xs">Total Value</p>
                                    <p className="text-lg font-bold text-muted-foreground">{portfolioData.totalValue}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Total PnL</p>
                                    <p className="text-lg font-bold text-muted-foreground">{portfolioData.totalPnL}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Active Positions</p>
                                    <p className="text-lg font-bold text-muted-foreground">{portfolioData.activePositions}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Avg APY</p>
                                    <p className="text-lg font-bold text-muted-foreground">{portfolioData.averageAPY}</p>
                                </div>
                            </div>

                            {/* Performance Metrics */}
                            <div className="grid grid-cols-2 gap-2 text-xs cosmic-border pt-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">7d Return</span>
                                    <span className="text-muted-foreground">{portfolioData.performance.return7d}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">30d Return</span>
                                    <span className="text-muted-foreground">{portfolioData.performance.return30d}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Max Drawdown</span>
                                    <span className="text-muted-foreground">{portfolioData.performance.maxDrawdown}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Win Rate</span>
                                    <span className="text-muted-foreground">{portfolioData.performance.winRate}</span>
                                </div>
                            </div>
                        </div>

                        {/* Active Positions */}
                        <div className="opacity-50">
                            <h3 className="text-muted-foreground font-medium mb-3 text-sm">Active Positions</h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {positions.map((position, index) => (
                                    <div key={index} className="-dark p-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-muted-foreground font-medium text-sm">{position.pair}</p>
                                                <p className="text-muted-foreground text-xs">Entry: {position.entryDate}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-muted-foreground text-sm">{position.amount}</p>
                                                <p className="text-muted-foreground text-xs">
                                                    {position.pnl}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">APY: {position.apy}</span>
                                            <ArrowRight size={12} className="text-muted-foreground" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* FEED TAB CONTENT */}
                    <TabsContent value="feed" className="flex-1 space-y-4 px-4 opacity-50">
                        <h3 className="text-muted-foreground font-medium mb-3 text-sm">Market Feed</h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {newsItems.map((item, index) => (
                                <div key={item.id} className="relative">
                                    {/* Timeline line */}
                                    {index !== newsItems.length - 1 && (
                                        <div className="absolute left-4 top-8 w-0.5 h-full bg-slate-700/50"></div>
                                    )}

                                    <div className={`flex ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                                        {/* Timeline dot */}
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                                            {item.type === 'event' ?
                                                <Calendar size={12} className="text-muted-foreground" /> :
                                                item.impact === 'bullish' ? <TrendingUp size={12} className="text-muted-foreground" /> :
                                                    item.impact === 'bearish' ? <TrendingDown size={12} className="text-muted-foreground" /> :
                                                        <Rss size={12} className="text-muted-foreground" />
                                            }
                                        </div>

                                        {/* Content */}
                                        <div className={`-dark p-1 flex-1 ${index % 2 === 0 ? 'ml-3' : 'mr-3'}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-muted-foreground text-sm font-medium">{item.title}</h4>
                                                <span className="text-muted-foreground text-xs">{item.time}</span>
                                            </div>
                                            <p className="text-muted-foreground text-xs mb-2">{item.description}</p>
                                            {item.date && (
                                                <p className="text-muted-foreground text-xs font-medium">{item.date}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </Card>
        </div >
    );
};

export default ActionPanel;
