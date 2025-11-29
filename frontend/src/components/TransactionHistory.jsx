import { ExternalLink, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

/**
 * TransactionHistory - Displays recent transaction history in a table
 * @param {Object} props
 * @param {string} props.theme - Theme ('dark' or 'light')
 * @param {Array} props.transactions - Optional array of real transactions
 */
export default function TransactionHistory({ theme = 'dark', transactions = null }) {
  // Mock data for demonstration (will be replaced by real data when available)
  const mockTransactions = [
    {
      id: 1,
      date: new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      action: 'Premium API Access',
      amount: '0.0001 ETH',
      hash: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
      status: 'success',
      basescanUrl: 'https://sepolia.basescan.org/tx/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8'
    },
    {
      id: 2,
      date: new Date(Date.now() - 1000 * 60 * 45).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      action: 'Market Forecast Request',
      amount: '0.008 ETH',
      hash: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
      status: 'success',
      basescanUrl: 'https://sepolia.basescan.org/tx/0x8ba1f109551bD432803012645Ac136ddd64DBA72'
    },
    {
      id: 3,
      date: new Date(Date.now() - 1000 * 60 * 120).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      action: 'Agent Activation',
      amount: '0.005 ETH',
      hash: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
      status: 'success',
      basescanUrl: 'https://sepolia.basescan.org/tx/0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd'
    }
  ];

  // Use real transactions if provided, otherwise use mock data
  const displayTransactions = transactions || mockTransactions;

  const isDark = theme === 'dark';

  // Truncate hash for display
  const truncateHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      success: {
        icon: CheckCircle2,
        color: 'text-green-400 bg-green-500/10 border-green-500/30',
        label: 'Success'
      },
      failed: {
        icon: XCircle,
        color: 'text-red-400 bg-red-500/10 border-red-500/30',
        label: 'Failed'
      },
      pending: {
        icon: AlertCircle,
        color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
        label: 'Pending'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className={`rounded-lg border overflow-hidden ${
      isDark 
        ? 'bg-gray-900/50 border-purple-500/30' 
        : 'bg-white border-purple-300'
    }`}>
      {/* Card Header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between ${
        isDark 
          ? 'bg-purple-900/20 border-purple-500/30' 
          : 'bg-purple-50 border-purple-300'
      }`}>
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          <h2 className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Transaction History
          </h2>
        </div>
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Last 24 hours
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`${
              isDark 
                ? 'bg-gray-800/50 text-gray-300' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                Transaction Hash
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${
            isDark ? 'divide-gray-800' : 'divide-gray-200'
          }`}>
            {displayTransactions.length === 0 ? (
              <tr>
                <td 
                  colSpan="5" 
                  className={`px-6 py-8 text-center ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  No transactions yet. Activate your agent to get started.
                </td>
              </tr>
            ) : (
              displayTransactions.map((tx) => (
                <tr 
                  key={tx.id}
                  className={`transition-colors ${
                    isDark 
                      ? 'hover:bg-purple-900/20 text-gray-300' 
                      : 'hover:bg-purple-50 text-gray-700'
                  }`}
                >
                  {/* Time */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                    {tx.date}
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {tx.action}
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                    <span className={isDark ? 'text-green-400' : 'text-green-600'}>
                      {tx.amount}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <StatusBadge status={tx.status} />
                  </td>

                  {/* Transaction Hash */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {tx.hash ? (
                      <a
                        href={tx.basescanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 font-mono hover:underline ${
                          isDark ? 'text-cyan-400' : 'text-cyan-600'
                        }`}
                      >
                        {truncateHash(tx.hash)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                        N/A
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className={`px-6 py-3 border-t text-xs ${
        isDark 
          ? 'bg-gray-800/30 border-gray-800 text-gray-500' 
          : 'bg-gray-50 border-gray-200 text-gray-600'
      }`}>
        <div className="flex justify-between items-center">
          <span>Showing {displayTransactions.length} transaction{displayTransactions.length !== 1 ? 's' : ''}</span>
          <span className="font-mono">Chain: Base Sepolia (84532)</span>
        </div>
      </div>
    </div>
  );
}
