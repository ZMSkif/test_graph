document.addEventListener('DOMContentLoaded', function() {
    const widget = new TradingView.widget({
        symbol: 'BTCUSDT',
        interval: '15',
        container_id: 'tv_chart_container',
        datafeed: Datafeed,
        library_path: '/charting_library/',
        locale: 'en',
        disabled_features: ['use_localstorage_for_settings'],
        enabled_features: ['study_templates'],
        charts_storage_url: 'https://saveload.tradingview.com',
        charts_storage_api_version: '1.1',
        client_id: 'tradingview.com',
        user_id: 'public_user_id',
        fullscreen: false,
        autosize: true,
    });
});