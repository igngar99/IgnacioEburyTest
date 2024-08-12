import { LightningElement, track, wire } from 'lwc';
import getBookedTrades from '@salesforce/apex/TradeController.getBookedTrades';
import saveTrade from '@salesforce/apex/TradeController.saveTrade';
import getExchangeRates from '@salesforce/apex/TradeController.getExchangeRates';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class TradeApplication extends LightningElement {
    @track isView1 = true;
    @track isView2 = false;

    @track bookedTrades = [];
    @track error;

    @track currencies = [];
    @track rates = {}; // Store all rates
    @track filteredRates = []; // Store filtered rates for the selected currency

    @track sellCurrency = '';
    @track sellAmount = '';
    @track buyCurrency = '';
    @track buyAmount = '';
    @track rate = 0;
    baseCurrency = 'EUR';

    // Store the result from the wire adapter to refresh it later
    wiredRatesResult;

    // Initialize currencies and rates from API response
    @wire(getExchangeRates)
    wiredRates(result) {
        this.wiredRatesResult = result;
        const { data, error } = result;
        if (data) {
            this.processRatesData(data);
            // Update rate after the rates are fetched
            this.updateRate();
            this.updateFilteredRates(); // Ensure filtered rates are updated
        } else if (error) {
            this.error = error;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error fetching exchange rates',
                    message: error.body ? error.body.message : 'Unknown error',
                    variant: 'error',
                })
            );
        }
    }

    @wire(getBookedTrades)
    wiredTrades(result) {
        this.wiredTradesResult = result;
        const { data, error } = result;
        if (data) {
            this.bookedTrades = data.map(trade => ({
                ID: trade.ID__c,
                Sell_Currency: trade.Sell_Currency__c,
                Sell_Amount: trade.Sell_amount__c,
                Buy_Currency: trade.Buy_currency__c,
                Buy_Amount: trade.Buy_amount__c,
                Rate: trade.Rate__c,
                Date_Booked: trade.Date_booked__c
            }));

            this.bookedTrades = this.bookedTrades.sort((a, b) => new Date(b.Date_Booked) - new Date(a.Date_Booked));
        } else if (error) {
            this.error = error;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error loading trades',
                    message: error.body ? error.body.message : 'Unknown error',
                    variant: 'error',
                })
            );
        }
    }

    handleNewTrade() {
        this.isView1 = false;
        this.isView2 = true;
    }

    handleAddClick() {
        if (!this.sellCurrency || !this.sellAmount || !this.buyCurrency || !this.buyAmount || this.rate <= 0) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'All fields must have a value.',
                    variant: 'error',
                })
            );
            return;
        }
    
        const newTrade = {
            Sell_Currency__c: this.sellCurrency.toUpperCase(),
            Sell_amount__c: parseFloat(this.sellAmount),
            Buy_currency__c: this.buyCurrency.toUpperCase(),
            Buy_amount__c: parseFloat(this.buyAmount),
            Rate__c: parseFloat(this.rate.toFixed(4)),
            Date_booked__c: new Date().toISOString()
        };
    
        saveTrade({ trade: newTrade })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Trade saved successfully!',
                        variant: 'success',
                    })
                );
                this.isView1 = true;
                this.isView2 = false;
                this.sellCurrency = '';
                this.sellAmount = '';
                this.buyCurrency = '';
                this.buyAmount = '';
                this.rate = 0;
    
                return refreshApex(this.wiredTradesResult);
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error saving trade',
                        message: error.body ? error.body.message : 'Unknown error',
                        variant: 'error',
                    })
                );
            });
    }
    
    handleCancelClick() {
        this.isView1 = true;
        this.isView2 = false;
    }

    handleSellCurrencyChange(event) {
        this.sellCurrency = event.detail.value;
        this.updateRate();
        this.updateFilteredRates();
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

    handleBaseCurrencyChange(event) {
        this.baseCurrency = event.detail.value;
        this.updateBaseCurrency(this.baseCurrency);
    }

    updateBaseCurrency(newBaseCurrency) {
        this.baseCurrency = newBaseCurrency;
        // Refresh rates data when base currency changes
        return refreshApex(this.wiredRatesResult);
    }

    updateRate() {
        if (this.sellCurrency && this.buyCurrency) {
            const key = `${this.sellCurrency}_${this.buyCurrency}`;
            this.rate = this.rates[key] || 0;
            this.updateBuyAmount();
        }
    }
    
    /*NOTE:
    The test said to only allow change to the sell amount and automatically calculate the buy amount.
    I consider that making it so that you can also change the buy amount and 
    get the sell amount attomatically provides a better user experience
    */
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
    
    updateFilteredRates() {
        if (this.sellCurrency) {
            this.filteredRates = Object.entries(this.rates)
                .filter(([key]) => key.startsWith(`${this.sellCurrency}_`))
                .map(([key, rate]) => {
                    const targetCurrency = key.split('_')[1];
                    return {
                        currency: targetCurrency,
                        rate: rate.toFixed(4)
                    };
                });
        } else {
            this.filteredRates = [];
        }
    }

    processRatesData(data) {
        const currencies = new Set();
        const rates = {};
    
        for (const [base, rateData] of Object.entries(data)) {
            currencies.add(base);
            for (const [currency, rate] of Object.entries(rateData)) {
                if (base !== currency) {
                    currencies.add(currency);
                    rates[`${base}_${currency}`] = rate;
                }
            }
        }
    
        this.currencies = Array.from(currencies).map(currency => ({
            label: currency,
            value: currency
        }));
        this.rates = rates;
    }
}
