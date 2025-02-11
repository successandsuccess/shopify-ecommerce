function updateConversionElementsNav() {
    const isUSDCurrency = Shopify.currency.active === "USD";
    // console.log('isUSDCurrency ', isUSDCurrency)
    if (!isUSDCurrency) {
        const convertElements = document.getElementsByClassName('convert_nav');
        
        // console.log('convertElements ', convertElements)
        for (var i = 0; i < convertElements.length; i++) {
            const element = convertElements[i];
            
            const currencyInfo = element.innerText.match(/(\d+(\.\d+)?)/);
            // console.log('currencyInfo ',  currencyInfo)
            if (currencyInfo) {
                const amount = parseFloat(currencyInfo[1]);
                const conversionFee =  amount * 0.015;
                // console.log('convert fee', Math.ceil(conversionFee/100)*100, Math.round(conversionFee * 100) / 100)
                if (!isNaN(amount)) {
                    const conversionRate = Shopify.currency.rate;
                    // console.log('conversionRate', conversionRate)
                    if (conversionRate) {
                        
                        const convertedAmount = (amount * conversionRate) + 1;
                        const fee = Math.round(conversionFee * 100) / 100;
                                                                                    
                        // const totalAmount = (amount + fee) * parseFloat(conversionRate).toFixed(2)
                        // element.innerText = `${symbol + ' ' + convertedAmount.toFixed(2) }`;
                        
                        element.innerText = `${symbol + ' ' + Math.round(convertedAmount) }`;
                        //element.innerText = `${symbol + ' ' +  Math.round(totalAmount).toFixed(2) }`;
                        // console.log('CONVERTED ', rdApp.products)
                    }
                }
            }
        };
        
    }
}
  
 // Function to check if the active currency is USD and perform conversion if not
 function updateConversionElements() {
    const isUSDCurrency = Shopify.currency.active === "USD";
    // console.log('isUSDCurrency ', isUSDCurrency)
    if (!isUSDCurrency) {
        const convertElements = document.getElementsByClassName('convert');
        
        // console.log('convertElements ', convertElements)
        for (var i = 0; i < convertElements.length; i++) {
            const element = convertElements[i];
            
            const currencyInfo = element.innerText.match(/(\d+(\.\d+)?)/);
            // console.log('currencyInfo ',  currencyInfo)
            if (currencyInfo) {
                const amount = parseFloat(currencyInfo[1]);
                const conversionFee =  amount * 0.015;
                // console.log('convert fee', Math.ceil(conversionFee/100)*100, Math.round(conversionFee * 100) / 100)
                if (!isNaN(amount)) {
                    const conversionRate = Shopify.currency.rate;
                    // console.log('conversionRate', conversionRate)
                    if (conversionRate) {
                       
                        const convertedAmount = (amount * conversionRate) ;
                        // + 1;
                        const fee = Math.round(conversionFee * 100) / 100;                                                       
                                                         
                        // const totalAmount = (amount + fee) * parseFloat(conversionRate).toFixed(2)
                        // element.innerText = `${symbol + ' ' + convertedAmount.toFixed(2) }`;
                        if(rdApp.products[17970954257]?.type == "Gift Cards") {
                            element.innerText = `${symbol + ' ' + Math.round(convertedAmount - 1)  }`;
                        } else {
                            element.innerText = `${symbol + ' ' + Math.round(convertedAmount) }`;
                        }
                       
                        //element.innerText = `${symbol + ' ' +  Math.round(totalAmount).toFixed(2) }`;
                        // console.log('CONVERTED ', rdApp.products)
                    }
                }
            }
        };
      
    }
}

// Call the updateConversionElements function when the page loads
updateConversionElementsNav();
updateConversionElements();

