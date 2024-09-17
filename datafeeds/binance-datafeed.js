class BinanceDatafeed {
    constructor() {
        this.binanceApiBase = 'https://api.binance.com/api/v3';
        this.savedBars = []; // Хранение данных свечей для возможных изменений
        this.isModified = false; // Флаг для проверки изменения данных
    }

    onReady(callback) {
        setTimeout(() => callback({
            supported_resolutions: ["1", "3", "5", "15", "30", "60", "120", "240", "360", "480", "720", "D", "W", "M"]
        }), 0);
    }

    searchSymbols(userInput, exchange, symbolType, onResultReadyCallback) {
        fetch(`${this.binanceApiBase}/exchangeInfo`)
            .then(response => response.json())
            .then(data => {
                const symbols = data.symbols.map(symbol => ({
                    symbol: symbol.symbol,
                    full_name: symbol.symbol,
                    description: `${symbol.baseAsset} / ${symbol.quoteAsset}`,
                    exchange: 'Binance',
                    ticker: symbol.symbol,
                    type: 'crypto'
                }));
                onResultReadyCallback(symbols);
            })
            .catch(error => console.error('Error fetching symbols:', error));
    }

    resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
        fetch(`${this.binanceApiBase}/exchangeInfo?symbol=${symbolName}`)
            .then(response => response.json())
            .then(data => {
                const symbolInfo = data.symbols.find(s => s.symbol === symbolName);
                if (!symbolInfo) {
                    onResolveErrorCallback('Symbol not supported');
                    return;
                }

                onSymbolResolvedCallback({
                    name: symbolInfo.symbol,
                    description: `${symbolInfo.baseAsset} / ${symbolInfo.quoteAsset}`,
                    type: 'crypto',
                    session: '24x7',
                    timezone: 'Etc/UTC',
                    ticker: symbolInfo.symbol,
                    exchange: 'Binance',
                    minmov: 1,
                    pricescale: 100000000,
                    has_intraday: true,
                    supported_resolutions: ["1", "3", "5", "15", "30", "60", "120", "240", "360", "480", "720", "D", "W", "M"],
                    volume_precision: 8,
                    data_status: 'streaming',
                });
            })
            .catch(error => {
                onResolveErrorCallback('Error resolving symbol: ' + error.message);
            });
    }

    getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
        if (this.isModified) {
            // Возвращаем изменённые данные
            onHistoryCallback(this.savedBars, { noData: false });
            return;
        }

        const { from, to } = periodParams;
        const interval = this._getInterval(resolution);
        const url = `${this.binanceApiBase}/klines?symbol=${symbolInfo.name}&interval=${interval}&startTime=${from * 1000}&endTime=${to * 1000}&limit=1000`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    onHistoryCallback([], { noData: true });
                } else {
                    const bars = data.map(bar => ({
                        time: bar[0],
                        open: parseFloat(bar[1]),
                        high: parseFloat(bar[2]),
                        low: parseFloat(bar[3]),
                        close: parseFloat(bar[4]),
                        volume: parseFloat(bar[5])
                    }));

                    this.savedBars = bars; // Сохраняем данные
                    onHistoryCallback(bars, { noData: false });
                }
            })
            .catch(error => {
                console.error(`Error fetching bars: ${error}`);
                onErrorCallback(error);
            });
    }

    modifyLastCandle(priceChange) {
        if (this.savedBars.length > 0) {
            const lastCandle = this.savedBars[this.savedBars.length - 1];
            lastCandle.close += priceChange;
            lastCandle.high += priceChange;
            this.isModified = true; // Устанавливаем флаг изменения
        }
    }

    _getInterval(resolution) {
        if (resolution.includes('D')) return '1d';
        if (resolution.includes('W')) return '1w';
        if (resolution.includes('M')) return '1M';
        return resolution + 'm';
    }
}
