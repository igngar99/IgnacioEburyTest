import { LightningElement } from 'lwc';

export default class TradesTable extends LightningElement {

    ID = 'TR0123456';
    Sell_Currency= 'USD';
    Sell_Amount = '500';
    Buy_Currency = 'EUR';
    Buy_Amount = '633.13';
    Rate = '1.2756';
    Date_Booked = '2018/05/27 23:13:05';

    handleNewTrade() {
        // Emit an event to switch to the "New Trade" tab
        const event = new CustomEvent('activatetab', { detail: 'newTrade' });
        this.dispatchEvent(event);
    }
}
