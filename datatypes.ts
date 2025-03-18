// These enums are not necessarily exhaustive nor real. The database is
// authorative on this; This is just here to give an idea of what to expect
export type Side = 'breadsticks' | 'cookie' | '2L soda';
export type Topping = 'pepperoni' | 'sausage' | 'pineapple' | 'mushroom';
export type Sauce = 'tomato' | 'pesto' | 'alfredo';
export type DoughType = 'regular' | 'stuffed' | 'pretzel';
export type DoughSize = 'personal' | 'small' | 'medium' | 'large';

export class Dough {
    type: DoughType;
    size: DoughSize;
}

export class Pizza {
    dough: Dough;
    toppings: Topping[];
    sauce: Sauce;
}

export class AddedSide {
    side: Side;
    quantity: number;
}

export type OrderLine = Pizza | AddedSide;
export type Order = OrderLine[];

export class PlacedOrder {
    phone?: String;
    dateOrdered: Date;
    orderNumber: String;

    contents: Order;
}

export type Popular<Item> = [Item, number][];
export type Trend = [Date, number][];
