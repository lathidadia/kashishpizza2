const { json } = require("body-parser");
const { SinkPage } = require("twilio/lib/rest/events/v1/sink");
const Order = require("./Order");

const OrderState = Object.freeze({
    WELCOMING:   Symbol("welcoming"),
    SIZE:   Symbol("size"),
    TOPPINGS:   Symbol("toppings"),
    DRINKS:  Symbol("drinks"),
    DIPS:  Symbol("dips"),
    ITEM:  Symbol("item"),
    PAYMENT: Symbol("payment"),
    ADDITEM: Symbol("additem")
});

module.exports = class PizzaOrder extends Order{
    constructor(sNumber, sUrl){
        super(sNumber, sUrl);
        this.stateCur = OrderState.WELCOMING;
        this.sSize = "";
        this.sToppings = "";
        this.sDrinks = "";
        this.sDips = "";
        this.sItem = {};
        this.sTotal = 0;
        this.error = "";
        this.cart = [];
    }
    handleInput(sInput){
        let aReturn = [];
        switch(this.stateCur){
            case OrderState.WELCOMING:
                this.stateCur = OrderState.ITEM;
                aReturn.push("Welcome to Kashish's Pizza.");
                aReturn.push("What item would you like?\n1. Pizza\n2.Burger\n3.Sub");
                break;
            case OrderState.ITEM:
                switch (sInput.toLowerCase()){
                    case "1":
                    case "pizza":
                        this.sTotal += 15;
                        this.sItem["Name"] = "Pizza";                       
                        break;
                    case "2":
                    case "burger":
                        this.sTotal += 5;
                        this.sItem["Name"] = "Burger";                        
                        break;
                    case "3":
                    case "sub":
                        this.sTotal += 10;
                        this.sItem["Name"] = "Sub";
                        break;
                    default:
                        this.stateCur = OrderState.ITEM;                        
                        this.error = "Please try again.\nWhat item would you like?\n1. Pizza\n2.Burger\n3.Sub";
                        break;
                }
                if(this.error == "")
                    {
                        if(this.sItem["Name"] == "Pizza"){
                            aReturn.push("What size pizza would you like?\n1. Small\n2.Medium\n3.Large");
                            this.stateCur = OrderState.SIZE;
                        }
                        else{
                            aReturn.push("What toppings would you like?");
                            this.stateCur = OrderState.TOPPINGS;
                        }
                        
                    }
                else
                    aReturn.push(this.error)
                this.error = "";
                break;
            case OrderState.SIZE:
                switch (sInput.toLowerCase()){
                    case "1":
                    case "small":
                        this.sItem["Size"] = "Small";                       
                        break;
                    case "2":
                    case "medium":
                        this.sTotal += 5;
                        this.sItem["Size"] = "Medium";                        
                        break;
                    case "3":
                    case "large":
                        this.sTotal += 10;
                        this.sItem["Size"] = "Large";
                        break;
                    default:
                        this.stateCur = OrderState.SIZE;                        
                        this.error = "Please try again.\nWhat size pizza would you like?\n1. Small,\n2.Medium,\n3.Large";
                        break;
                }
                if(this.error == "")
                    {
                        aReturn.push("What toppings would you like?");
                        this.stateCur = OrderState.TOPPINGS;
                    }
                else
                    aReturn.push(this.error)
                this.error = "";
                break;
            case OrderState.TOPPINGS:
                this.stateCur = OrderState.ADDITEM
                this.sItem["Toppings"] = sInput;
                aReturn.push("Would you like to add another Item?\n1. Yes\n0. No");
                break;
            case OrderState.ADDITEM:
                switch (sInput.toLowerCase()){
                    case "1":
                    case "yes":
                        this.cart.push(this.sItem);
                        this.sItem = {};
                        //aReturn.push(JSON.stringify(this.cart));
                        this.stateCur = OrderState.ITEM;
                        aReturn.push("What item would you like?\n1. Pizza,\n2. Burger,\n3. Sub");                       
                        break;
                    case "0":
                    case "no":
                        this.cart.push(this.sItem);
                        this.sItem = {};
                        this.stateCur = OrderState.DIPS;
                        aReturn.push("Would you like any dips with that?\n We have\n1. Garlic,\n2. Chipotle,\n0. None");
                        break;
                    default:
                        this.stateCur = OrderState.ADDITEM;                        
                        this.error = "Please try again.\nWould you like to add another Item?\n1. Yes\n0. No";
                        aReturn.push(this.error);
                        this.error = "";
                        break;
                }
                break;
            case OrderState.DIPS:
                switch (sInput.toLowerCase()){
                    case "0":
                    case "none": this.DIPS = "";
                        break;
                    case "1":
                    case "garlic":
                        this.sTotal += 2;
                        this.sDips = "Garlic";                       
                        break;
                    case "2":
                    case "chipotle":
                        this.sTotal += 3;
                        this.sDips = "Chipotle";                        
                        break;
                    default:
                        this.stateCur = OrderState.DIPS;                        
                        this.error = "Please try again.\nWould you like any dips with that? \nWe have\n1. Garlic\n2. Chipotle\n0. None";
                        break;
                } 
                if(this.error == "")
                    {
                        aReturn.push("What Drinks would you like?\n1. Coke\n2. Sprite\n0. None");
                        this.stateCur = OrderState.DRINKS;
                    }
                else
                    aReturn.push(this.error)
                this.error = "";
                break;

            case OrderState.DRINKS:
                switch (sInput.toLowerCase()){
                    case "0":
                    case "none": this.DRINKS = "";
                        break;
                    case "1":
                    case "coke":
                        this.sTotal += 10;
                        this.sDrinks = "Coke";                       
                        break;
                    case "2":
                    case "sprite":
                        this.sTotal += 10;
                        this.sDrinks = "Sprite";                        
                        break;
                    default:
                        this.stateCur = OrderState.DRINKS;                        
                        this.error = "Please try again.\nWhat Drinks would you like?\n1.Coke,\n2.Sprite,\n0.None";
                        break;
                } 
                if(this.error == "")
                    {
                        this.stateCur = OrderState.PAYMENT;
                        aReturn.push("Thank-you for your order of");
                        //aReturn.push(JSON.stringify(this.cart));
                        this.cart.forEach(item => {
                            if(item["Size"])
                                aReturn.push(`${item["Size"]} ${item["Name"]} with ${item["Toppings"]}`);
                            else
                                aReturn.push(`${item["Name"]} with ${item["Toppings"]}`);
                        });
                        //aReturn.push(`${this.sSize} ${this.sItem} with ${this.sToppings}`);
                        if(this.sDrinks != ""){
                            aReturn.push(this.sDrinks);
                        }
                        if(this.sDips != ""){
                            aReturn.push(this.sDips);
                        }
                        let d = new Date(); 
                        d.setMinutes(d.getMinutes() + 20);
                        aReturn.push(`Your approximate total is $${this.sTotal}`);
                        //aReturn.push(`Please pick it up at ${d.toTimeString()}`);
                        aReturn.push(`Please pay for your order here`);
                        aReturn.push(`${this.sUrl}/payment/${this.sNumber}/`);                        
                        //this.isDone(true);
                        
                    }
                else
                    aReturn.push(this.error)
                this.error = "";                
                break;
            case OrderState.PAYMENT:
                console.log(sInput.purchase_units[0].shipping.address);
                this.isDone(true);
                let d = new Date();
                d.setMinutes(d.getMinutes() + 20);
                aReturn.push(`Your order will be delivered to\n${sInput.purchase_units[0].shipping.address.address_line_1} ${sInput.purchase_units[0].shipping.address.address_line_2 ? sInput.purchase_units[0].shipping.address.address_line_2 : ""}\n${sInput.purchase_units[0].shipping.address.postal_code} ${sInput.purchase_units[0].shipping.address.country_code}`);
                aReturn.push(`at ${d.toTimeString()}`);
                break;
        }
        return aReturn;
    }
    renderForm(sTitle = "-1", sAmount = "-1"){
        // your client id should be kept private
        if(sTitle != "-1"){
          this.sItem = sTitle;
        }
        if(sAmount != "-1"){
          this.sTotal = sAmount;
        }
        var items = "";
        this.cart.forEach(item => {
            if(item["Size"])
                items += (`${item["Size"]} ${item["Name"]} with ${item["Toppings"]}</br>`);
            else
                items +=(`${item["Name"]} with ${item["Toppings"]}</br>`);
        });
        if(this.sDrinks != ""){
            items += this.sDrinks + "</br>";
        }
        if(this.sDips != ""){
            items += this.sDips + "</br>";
        }
        const sClientID = process.env.SB_CLIENT_ID || 'put your client id here for testing ... Make sure that you delete it before committing'
        return(`
        <!DOCTYPE html>
    
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- Ensures optimal rendering on mobile devices. -->
          <meta http-equiv="X-UA-Compatible" content="IE=edge" /> <!-- Optimal Internet Explorer compatibility -->
        </head>
        
        <body>
          <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
          <script
            src="https://www.paypal.com/sdk/js?client-id=${sClientID}"> // Required. Replace SB_CLIENT_ID with your sandbox client ID.
          </script>
          Thank you ${this.sNumber} for your ${items} </br>Total order of $${this.sTotal}.
          <div id="paypal-button-container"></div>
    
          <script>
            paypal.Buttons({
                createOrder: function(data, actions) {
                  // This function sets up the details of the transaction, including the amount and line item details.
                  return actions.order.create({
                    purchase_units: [{
                      amount: {
                        value: '${this.sTotal}'
                      }
                    }]
                  });
                },
                onApprove: function(data, actions) {
                  // This function captures the funds from the transaction.
                  return actions.order.capture().then(function(details) {
                    // This function shows a transaction success message to your buyer.
                    $.post(".", details, ()=>{
                      window.open("", "_self");
                      window.close(); 
                    });
                  });
                }
            
              }).render('#paypal-button-container');
            // This function displays Smart Payment Buttons on your web page.
          </script>
        
        </body>
            
        `);
    
    }    
}