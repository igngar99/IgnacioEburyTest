import { LightningElement, track } from 'lwc';

export default class TradeComponent extends LightningElement {
    @track sellCurrency = '';
    @track sellAmount = '';
    @track buyCurrency = '';
    @track buyAmount = '';
    @track rate = 0;

    currencyOptions = [
        { label: 'USD', value: 'usd' },
        { label: 'EUR', value: 'eur' },
        { label: 'GBP', value: 'gbp' },
    ];

    rates = {
        'usd_eur': 0.85,
        'usd_gbp': 0.75,
        'eur_usd': 1.18,
        'eur_gbp': 0.88,
        'gbp_usd': 1.33,
        'gbp_eur': 1.14
    };

    handleSellCurrencyChange(event) {
        this.sellCurrency = event.detail.value;
        this.updateRate();
    }

    handleBuyCurrencyChange(event) {
        this.buyCurrency = event.detail.value;
        this.updateRate();
    }

    handleSellAmountChange(event) {
        this.sellAmount = event.detail.value;
        this.updateBuyAmount();
    }

    handleBuyAmountChange(event) {
        this.buyAmount = event.detail.value;
        this.updateSellAmount();
    }

    updateRate() {
        if (this.sellCurrency && this.buyCurrency) {
            const key = `${this.sellCurrency}_${this.buyCurrency}`;
            this.rate = this.rates[key] || 0;
            this.updateBuyAmount();
        }
    }

    updateSellAmount() {
        if (this.rate > 0 && this.buyAmount) {
            this.sellAmount = (this.buyAmount / this.rate).toFixed(2);
        }
    }

    updateBuyAmount() {
        if (this.rate > 0 && this.sellAmount) {
            this.buyAmount = (this.sellAmount * this.rate).toFixed(2);
        }
    }

    handleAddClick() {
        // Emit an event to switch to the "Booked Trades" tab
        const event = new CustomEvent('activatetab', { detail: 'bookedTrades' });
        this.dispatchEvent(event);
    }

    handleCancelClick() {
        // Emit an event to switch to the "Booked Trades" tab
        const event = new CustomEvent('activatetab', { detail: 'bookedTrades' });
        this.dispatchEvent(event);
    }
}
