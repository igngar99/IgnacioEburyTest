public with sharing class TradeController {

    @AuraEnabled(cacheable=true)
    public static List<Trade__c> getBookedTrades() {
        return [SELECT Id, Sell_Currency__c, Sell_Amount__c, Buy_Currency__c, Buy_Amount__c, Rate__c, Date_Booked__c FROM Trade__c];
    }

    @AuraEnabled
    public static void saveTrade(Trade__c trade) {
        try {
            insert trade;
            String message = 'A new trade has been created with the following data:\n' +
                             'Sell Currency: ' + trade.Sell_Currency__c + '\n' +
                             'Sell Amount: ' + trade.Sell_Amount__c + '\n' +
                             'Buy Currency: ' + trade.Buy_Currency__c + '\n' +
                             'Buy Amount: ' + trade.Buy_Amount__c + '\n' +
                             'Rate: ' + trade.Rate__c + '\n' +
                             'Booked Date: ' + trade.Date_Booked__c;
            postToChatter(trade.Id, message);
        } catch (DmlException e) {
            throw new AuraHandledException('Error inserting trade: ' + e.getMessage());
        }
    }

   	@AuraEnabled(cacheable=true)
	public static Map<String, Map<String, Double>> getExchangeRates() {
    	// TODO remove place holder currencies for a dinamic solution that searches for all abaliable currencies
    	List<String> baseCurrencies = new List<String>{'EUR', 'GBP', 'JPY', 'USD', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'KRW', 'TRY', 'RUB', 'INR', 'BRL', 'ZAR'};
    	Map<String, Map<String, Double>> rates = new Map<String, Map<String, Double>>();
    
	    Http http = new Http();
    	
    	for (String baseCurrency : baseCurrencies) {
        	String endpoint = 'https://api.exchangerate-api.com/v4/latest/' + baseCurrency;
        	HttpRequest req = new HttpRequest();
        	req.setEndpoint(endpoint);
        	req.setMethod('GET');
        	req.setHeader('Content-Type', 'application/json');

	        HttpResponse res = http.send(req);
	
    	    if (res.getStatusCode() == 200) {
        	    Map<String, Object> response = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            	Map<String, Object> rateData = (Map<String, Object>) response.get('rates');

	            Map<String, Double> baseRates = new Map<String, Double>();
    	        for (String key : rateData.keySet()) {
        	        baseRates.put(key, (Double) rateData.get(key));
            	}
	            rates.put(baseCurrency, baseRates);
    	    } else {
        	    throw new AuraHandledException('Failed to fetch exchange rates for ' + baseCurrency + ': ' + res.getStatus());
        	}
    	}
    
   		return rates;
	}


    private static void postToChatter(Id tradeId, String message) {
        FeedItem post = new FeedItem();
        post.ParentId = tradeId;
        post.Body = message;
        insert post;
    }
}