Crafty.c('Merchant', {
    init: function () {
        this.requires('Actor')
            .size(64, 64)
            .color("green")
            .onKeyPress(Crafty.keys.SPACE, this.barter)
            .onClick(this.barter);
        
        var numGoods = config("numGoodsPerMerchant");
        // Random but biased towards the first item(s?) heavily. Oh well.
        // https://stackoverflow.com/questions/19269545/how-to-get-n-no-elements-randomly-from-an-array
        var itemNames = config("goods").sort(() => .5 - Math.random()).slice(0, numGoods);
        this.items = [];
        for (var i = 0; i < itemNames.length; i++) {
            var randomPrice = randomBetween(config("minPrice"), config("maxPrice"));
            var randomQuantity = randomBetween(config("minQuantity"), config("maxQuantity"));
            var item = new Item(itemNames[i], Math.round(randomPrice), randomQuantity);
            this.items.push(item);
        }

        if (config('features').merchantsHaveFavouriteItems) {
            var itemName = itemNames[Math.floor(Math.random()*itemNames.length)];
            var price = randomBetween(config("minPrice"), config("maxPrice")) + config("maxPrice");
            this.favouriteItem = {name: itemName, price: price};
            console.log(itemName, price);
        }
    },

    barter: function() {
        var player = Crafty('Player');
        var barterDistance = config('barterDistance');
        if (distanceBetween(this, player) <= barterDistance)
        {
            var merchantWindow = Crafty.e('MerchantListWindow');
            if (config('features').merchantsHaveFavouriteItems) {
                merchantWindow.setFavouriteItem(this.favouriteItem);
            }
            
            merchantWindow.setBuyingAndSellingItems(this.items, player.inventory);
        }
    }
});