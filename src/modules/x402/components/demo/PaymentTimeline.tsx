import { motion } from 'framer-motion';
import { Check, Loader2, ExternalLink, Copy } from 'lucide-react';
import { PaymentStep, StepTiming } from '../../types/demo';
import { useState } from 'react';

interface PaymentTimelineProps {
  currentStep: PaymentStep;
  stepTimings: StepTiming[];
  transactionSignature: string | null;
}

interface Step {
  step: PaymentStep;
  number: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    step: PaymentStep.DISCOVERY,
    number: '①',
    title: 'Discovery',
    description: 'Detect payment requirement',
  },
  {
    step: PaymentStep.BUILD_TRANSACTION,
    number: '②',
    title: 'Build Tx',
    description: 'Calculate splits + create tx',
  },
  {
    step: PaymentStep.USER_SIGNS,
    number: '③',
    title: 'User Signs',
    description: 'Wallet approval',
  },
  {
    step: PaymentStep.SETTLE,
    number: '④',
    title: 'Settle',
    description: 'Kora co-signs + on-chain',
  },
];

export const PaymentTimeline: React.FC<PaymentTimelineProps> = ({
  currentStep,
  stepTimings,
  transactionSignature,
}) => {
  const [copiedSig, setCopiedSig] = useState(false);

  const getStepStatus = (step: PaymentStep): 'pending' | 'active' | 'complete' => {
    if (currentStep > step) return 'complete';
    if (currentStep === step) return 'active';
    return 'pending';
  };

  const getStepTiming = (step: PaymentStep): string | null => {
    const timing = stepTimings.find(t => t.step === step);
    if (!timing) return null;

    const duration = timing.duration;
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  const copySignature = () => {
    if (transactionSignature) {
      navigator.clipboard.writeText(transactionSignature);
      setCopiedSig(true);
      setTimeout(() => setCopiedSig(false), 2000);
    }
  };

  const explorerUrl = transactionSignature
    ? `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-2">
      <h3 className="text-lg font-semibold text-white mb-6">Payment Flow Timeline</h3>

      {/* Timeline */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-gray-800">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: '0%' }}
            animate={{
              width: currentStep === 0 ? '0%' : `${(Math.min(currentStep, STEPS.length) / STEPS.length) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {STEPS.map((step) => {
            const status = getStepStatus(step.step);
            const timing = getStepTiming(step.step);

            return (
              <div key={step.step} className="flex flex-col items-center" style={{ width: '25%' }}>
                {/* Step Circle */}
                <motion.div
                  className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2 transition-colors ${
                    status === 'complete'
                      ? 'bg-green-500 border-green-500 text-white'
                      : status === 'active'
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-500'
                  }`}
                  initial={{ scale: 1 }}
                  animate={{
                    scale: status === 'active' ? [1, 1.1, 1] : 1,
                  }}
                  transition={{ duration: 1, repeat: status === 'active' ? Infinity : 0 }}
                >
                  {status === 'complete' ? (
                    <Check className="w-6 h-6" />
                  ) : status === 'active' ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    step.number
                  )}
                </motion.div>

                {/* Step Info */}
                <div className="mt-3 text-center">
                  <div
                    className={`font-medium ${
                      status !== 'pending' ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{step.description}</div>
                  {timing && (
                    <div className="text-xs text-green-400 mt-1 font-mono">✓ {timing}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction Details */}
      {transactionSignature && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-4 bg-gray-800/50 border border-gray-700 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Transaction:</span>
                <code className="text-sm font-mono text-blue-400">
                  {transactionSignature.slice(0, 8)}...{transactionSignature.slice(-8)}
                </code>
              </div>
              <button
                onClick={copySignature}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Copy full signature"
              >
                {copiedSig ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>

            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                <span>View on Solana Explorer</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
              Devnet
            </span>
            <span className="text-xs text-gray-500">
              Payment split successfully distributed on-chain
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
