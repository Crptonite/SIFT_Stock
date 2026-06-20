import React, { useMemo, useEffect, useState } from "react";
import { X, Bell, BrainCircuit } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FiftyTwoWeekVisualizer } from "./FiftyTwoWeekVisualizer";

interface Stock {
  id: number;
  ticker: string;
  name: string;
  exchange: string;
  price: number;
  low52: number;
  high52: number;
  mktCap?: string | null;
  pe?: number | null;
  pb?: number | null;
  yield?: string | null;
  debtEq?: number | null;
  roic?: string | null;
  margin?: string | null;
  profitGrowth?: string | null;
  divGrowth?: string | null;
  fcf?: string | null;
}

interface StockDetailsPanelProps {
  stock: Stock | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StockDetailsPanel({ stock, isOpen, onClose }: StockDetailsPanelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const { historicalData, change, changePercent } = useMemo(() => {
    if (!stock) return { historicalData: [], change: 0, changePercent: 0 };
    
    // Generate realistic-looking 30-day historical data
    const data = [];
    let currentPrice = stock.price * 0.95; // start slightly lower to ensure an overall positive or negative trend
    let isPositiveTrend = Math.random() > 0.5;

    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const volatility = stock.price * 0.02;
      const trend = isPositiveTrend ? volatility * 0.2 : -volatility * 0.2;
      
      let open = currentPrice;
      let close = open + (Math.random() - 0.5) * volatility + trend;
      
      // Ensure the last day matches current price
      if (i === 0) {
        close = stock.price;
      }

      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      const volume = Math.floor(Math.random() * 5000000) + 1000000;

      data.push({
        name: `day-${i}`,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date.toISOString().split('T')[0],
        open: parseFloat(open.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        volume,
      });

      currentPrice = close;
    }

    const firstClose = data[data.length - 2].close;
    const lastClose = data[data.length - 1].close;
    const dailyChange = lastClose - firstClose;
    const dailyChangePercent = (dailyChange / firstClose) * 100;

    return { 
      historicalData: data, 
      change: dailyChange, 
      changePercent: dailyChangePercent 
    };
  }, [stock]);

  if (!isVisible && !isOpen) return null;

  const isPositive = change >= 0;
  const colorClass = "text-foreground";
  const strokeColor = "#E5E7EB"; // neutral off-white
  const fillColor = "rgba(229, 231, 235, 0.15)";

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(num);
  const formatVolume = (num: number) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1C1C1E] border border-[#2C2C2E] p-3 rounded-lg shadow-xl text-sm font-mono z-50">
          <p className="text-muted-foreground mb-2 text-xs">{data.fullDate}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-muted-foreground">Open</span>
            <span className="text-right text-foreground font-medium">{formatNumber(data.open)}</span>
            <span className="text-muted-foreground">High</span>
            <span className="text-right text-foreground font-medium">{formatNumber(data.high)}</span>
            <span className="text-muted-foreground">Low</span>
            <span className="text-right text-foreground font-medium">{formatNumber(data.low)}</span>
            <span className="text-muted-foreground">Close</span>
            <span className="text-right text-foreground font-medium">{formatNumber(data.close)}</span>
            <span className="text-muted-foreground">Volume</span>
            <span className="text-right text-foreground font-medium">{formatVolume(data.volume)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Slide-out Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-[#0A0A0B] border-l border-border z-50 shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {stock && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-[#2C2C2E] sticky top-0 bg-[#0A0A0B]/95 backdrop-blur z-10 flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="px-1.5 py-0.5 bg-[#1C1C1E] text-[10px] font-semibold rounded border border-[#2C2C2E] text-muted-foreground">{stock.exchange}</span>
                  <span className="text-sm font-medium text-muted-foreground font-mono">{stock.ticker}</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">{stock.name}</h2>
                <div className="mt-4 flex items-end space-x-3">
                  <span className="text-4xl font-bold text-foreground font-mono tabular-nums leading-none">
                    {formatNumber(stock.price)}
                  </span>
                  <div className={`flex items-baseline space-x-1 font-mono text-lg font-medium tabular-nums ${colorClass} mb-0.5`}>
                    <span>{isPositive ? '+' : ''}{formatNumber(change)}</span>
                    <span className="text-sm">({isPositive ? '+' : ''}{formatNumber(changePercent)}%)</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-[#1C1C1E] rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 space-y-8">
              {/* Chart */}
              <div className="space-y-4">
                {/* Timeframe Toggles */}
                <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none">
                  {['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'All'].map((tf) => (
                    <button
                      key={tf}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                        tf === '5Y' 
                          ? 'bg-[#1C1C1E] text-foreground border border-[#2C2C2E]' 
                          : 'text-muted-foreground hover:bg-[#1C1C1E] hover:text-foreground'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <div className="h-[240px] w-full -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`colorClose-${stock.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#636366" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                        allowDuplicatedCategory={false}
                        tickFormatter={(val) => {
                          const item = historicalData.find(d => d.name === val);
                          return item ? item.date : '';
                        }}
                      />
                      <YAxis 
                        domain={['dataMin - 1', 'dataMax + 1']} 
                        stroke="#636366" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => val.toFixed(2)}
                        orientation="right"
                        width={40}
                      />
                      <Tooltip 
                        content={<CustomTooltip />} 
                        cursor={{ stroke: '#636366', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="close" 
                        stroke={strokeColor} 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill={`url(#colorClose-${stock.id})`}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* 52 Week Range */}
                <div className="pt-2">
                  <div className="bg-[#1C1C1E] p-4 rounded-xl border border-[#2C2C2E]">
                    <FiftyTwoWeekVisualizer low={stock.low52} high={stock.high52} current={stock.price} />
                  </div>
                </div>
              </div>

              {/* Extra Stats Grid */}
              <div className="grid grid-cols-3 gap-x-4 gap-y-6 pt-2">
                <StatBox label="Market Cap" value={stock.mktCap || "N/A"} />
                <StatBox label="P/E Ratio" value={stock.pe?.toFixed(2) || "N/A"} />
                <StatBox label="Div Yield" value={stock.yield || "N/A"} />
                <StatBox label="Rev Growth" value={stock.profitGrowth || "N/A"} />
                <StatBox label="Debt/Eq" value={stock.debtEq?.toFixed(2) || "N/A"} />
                <StatBox label="P/B Ratio" value={stock.pb?.toFixed(2) || "N/A"} />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-3 pt-6 mt-auto">
                <button className="h-12 w-full bg-secondary border border-border hover:bg-muted text-foreground rounded-xl font-semibold flex items-center justify-center transition-colors">
                  <Bell className="w-4 h-4 mr-2" />
                  Enable WhatsApp Alerts
                </button>
                <button className="h-12 w-full bg-secondary border border-border hover:bg-muted text-foreground rounded-xl font-semibold flex items-center justify-center transition-colors">
                  <BrainCircuit className="w-4 h-4 mr-2" />
                  Run AI Sentiment Analysis
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function StatBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col space-y-1 pb-3 border-b border-[#2C2C2E]">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className="text-sm font-mono font-medium text-foreground">{value}</span>
    </div>
  );
}
