import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useX402Payment } from '../hooks/useX402Payment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const X402Demo: React.FC = () => {
  const {
    aiAgent,
    currentStep,
    transactionStatus,
    walletOverview,
    isLoading,
    error,
    connected,
    executePaymentFlow,
    resetDemo,
  } = useX402Payment();

  // Payment split data for visualization
  const paymentSplits = [
    { recipient: 'Platform', percentage: 50, amount: 0.0005, label: 'Platform', color: '#3b82f6' },
    { recipient: 'Data Provider', percentage: 30, amount: 0.0003, label: 'Provider', color: '#10b981' },
    { recipient: 'Referral', percentage: 20, amount: 0.0002, label: 'Referral', color: '#8b5cf6' },
  ];

  const paymentSteps = ['Discovery', 'Build Tx', 'Verify', 'Settle', 'Access'];

  const handleRequestData = async () => {
    await executePaymentFlow('/api/wallet_overview?wallet_address=demo&user_id=demo');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">x402 Payment Protocol Demo</h1>
        <p className="text-center text-muted-foreground mb-8">
          AI Agent requesting wallet overview with automated payment splitting
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: AI Agent Card and Payment Flow */}
          <div className="space-y-8">
            {/* AI Agent Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 8V4H8" />
                      <rect width="16" height="12" x="4" y="8" rx="2" />
                      <path d="M2 14h2" />
                      <path d="M20 14h2" />
                      <path d="M15 13v2" />
                      <path d="M9 13v2" />
                    </svg>
                  </div>
                  <span>AI Agent: {aiAgent.name}</span>
                </CardTitle>
                <CardDescription>Autonomous agent requesting wallet insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <Badge 
                    variant={aiAgent.status === 'completed' ? 'default' : 
                            aiAgent.status === 'error' ? 'destructive' : 'secondary'}
                  >
                    {aiAgent.status.charAt(0).toUpperCase() + aiAgent.status.slice(1)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {aiAgent.lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="mb-4 p-4 bg-muted rounded-lg">
                  <p className="font-medium">Request:</p>
                  <p className="text-sm">{aiAgent.request}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleRequestData}
                    disabled={isLoading || (aiAgent.status !== 'idle' && aiAgent.status !== 'completed')}
                    className="flex-1"
                  >
                    {isLoading 
                      ? 'Processing...' 
                      : (aiAgent.status !== 'idle' && aiAgent.status !== 'completed') 
                        ? 'Processing...' 
                        : 'Request with Payment'}
                  </Button>
                  
                  {aiAgent.status !== 'idle' && (
                    <Button 
                      variant="outline" 
                      onClick={resetDemo}
                      className="flex-1"
                    >
                      Reset Demo
                    </Button>
                  )}
                </div>

                {!connected && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Connect your wallet to proceed:</p>
                    <WalletMultiButton />
                  </div>
                )}
                
                {error && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                    <p className="text-sm text-destructive">Error: {error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Flow Visualization */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Flow</CardTitle>
                <CardDescription>Step-by-step x402 process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentSteps.map((step, index) => (
                    <div key={index} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index < currentStep 
                          ? 'bg-green-500 text-white' 
                          : index === currentStep 
                            ? 'bg-blue-500 text-white animate-pulse' 
                            : 'bg-gray-200 text-gray-500'
                      }`}>
                        {index < currentStep ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className={`font-medium ${
                          index === currentStep ? 'text-blue-600' : ''
                        }`}>
                          {step}
                        </p>
                      </div>
                      {index < currentStep && (
                        <div className="text-xs text-green-600 font-medium">Completed</div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{Math.round((currentStep / (paymentSteps.length - 1)) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(currentStep / (paymentSteps.length - 1)) * 100} 
                    className="h-2"
                  />
                </div>

                {(transactionStatus.status !== 'pending' || transactionStatus.signature) && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium mb-1">Transaction Status:</p>
                    <p className="text-sm">
                      <span className={`${
                        transactionStatus.status === 'confirmed' ? 'text-green-600' :
                        transactionStatus.status === 'failed' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        {transactionStatus.status.charAt(0).toUpperCase() + transactionStatus.status.slice(1)}
                      </span>
                      {transactionStatus.signature && (
                        <span className="block mt-1 text-xs text-muted-foreground break-all">
                          Signature: {transactionStatus.signature.substring(0, 20)}...
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Payment Split Chart and Results */}
          <div className="space-y-8">
            {/* Payment Split Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Split Distribution</CardTitle>
                <CardDescription>
                  How the payment is split between multiple recipients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentSplits}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percentage"
                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {paymentSplits.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {paymentSplits.map((split, index) => (
                    <div key={index} className="flex flex-col items-center p-3 border rounded-md">
                      <div className="w-4 h-4 rounded-full mb-2" style={{ backgroundColor: split.color }}></div>
                      <p className="font-medium">{split.label}</p>
                      <p className="text-sm text-muted-foreground">{split.percentage}%</p>
                      <p className="text-xs mt-1">{split.amount} SOL</p>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                <div className="text-center">
                  <p className="text-lg font-semibold">Total Payment: 0.001 SOL</p>
                  <p className="text-sm text-muted-foreground">Split across multiple recipients</p>
                </div>
              </CardContent>
            </Card>

            {/* Live Transaction Card */}
            {transactionStatus.signature && (
              <Card>
                <CardHeader>
                  <CardTitle>Live Transaction</CardTitle>
                  <CardDescription>
                    Solana transaction on the blockchain
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted rounded-md mb-4">
                    <p className="text-sm font-medium mb-1">Transaction Signature:</p>
                    <p className="text-xs break-all font-mono">
                      {transactionStatus.signature}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className={`text-sm font-medium ${
                        transactionStatus.status === 'confirmed' ? 'text-green-600' : 
                        transactionStatus.status === 'failed' ? 'text-red-600' : 
                        'text-blue-600'
                      }`}>
                        {transactionStatus.status.charAt(0).toUpperCase() + transactionStatus.status.slice(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="text-sm font-medium">0.001 SOL</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(`https://explorer.solana.com/tx/${transactionStatus.signature}`, '_blank')}
                  >
                    View on Solana Explorer
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Wallet Overview Result */}
            {walletOverview && (
              <Card>
                <CardHeader>
                  <CardTitle>Wallet Overview Result</CardTitle>
                  <CardDescription>
                    Data received by the AI agent after payment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Wallet Balance</h3>
                      <p className="text-xl font-bold">${walletOverview.totalValue.toLocaleString()}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-xs text-muted-foreground">24h Change</p>
                        <p className={`text-lg font-semibold ${
                          walletOverview.change24h > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {walletOverview.change24h > 0 ? '+' : ''}{walletOverview.changePercent24h}%
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-xs text-muted-foreground">Token Count</p>
                        <p className="text-lg font-semibold">{walletOverview.tokenCount}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">User Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {walletOverview.userInterests.map((interest, idx) => (
                          <Badge key={idx} variant="secondary">{interest}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <ul className="space-y-2">
                        {walletOverview.recommendations.slice(0, 3).map((rec, idx) => (
                          <li key={idx} className="flex justify-between text-sm">
                            <span>{rec.name}: {rec.reason}</span>
                            <span className="text-muted-foreground">{rec.relevanceScore.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default X402Demo;