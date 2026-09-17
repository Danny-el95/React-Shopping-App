const products = [
    {
        id: 1,
        name: "Cashews",
        price: 9.99,
        image: "https://media.istockphoto.com/id/2226253191/photo/hand-holding-packaged-cashew-nuts-at-local-market.webp?a=1&b=1&s=612x612&w=0&k=20&c=kiKAx4psASRAk5cMlU3fWM0kZ0bR8fkj68ZqJFa1fBw=",
        description: "Crunchy cashew nuts with delicious smoky flavor. Buy now at the lowest price!"
    },
    {
        id: 2,
        name: "Almonds",
        price: 12.99,
        image: "https://media.istockphoto.com/id/1209457254/photo/packaged-roasted-almonds-and-wellness.webp?a=1&b=1&s=612x612&w=0&k=20&c=2pK-TJgqh2iuHfkt6Gqr3mwSMpQ6KRO_oU87HxabKs0=",
        description: "Delicious almond nuts with a satisfying crunch to soothe your taste for the best price on the market."
    },
    {
        id: 3,
        name: "Pistachios",
        price: 15.99,
        image: "https://media.istockphoto.com/id/2226253190/photo/hand-holding-packaged-pistachio-nuts-at-market-stall.webp?a=1&b=1&s=612x612&w=0&k=20&c=Ugm7RD9m6EvtuH3svkVW82l_TXws74ofOJCcHFiKphs=",
        description: "Handpicked pistachios from local and organic farms, grown naturally and packed straight to you!."
    },
    {
        id: 4,
        name: "Peanuts",
        price: 9.99,
        image: "https://media.istockphoto.com/id/2261725237/photo/food-ingredients-in-the-form-of-nuts-and-dried-seeds-are-packaged-in-plastic-on-the-shelves.webp?a=1&b=1&s=612x612&w=0&k=20&c=yaWuj-7Xv8LPvTJYPP2txMOZL2Js3Ta9FirkhhPWPu0=",
        description: "Tasty salted peanuts perfect for your soaks. Buy now!."
    },
    {
        id: 5,
        name: "Hazelnuts",
        price: 9.99,
        image: "https://media.istockphoto.com/id/149215325/photo/hazelnut-filberts-packaged-inside-of-clear-bags-in-gift-basket.webp?a=1&b=1&s=612x612&w=0&k=20&c=FcMqyrmLpxKKOjhHqCSn0lO7fUjI_WbCHcBDBoqRU18=",
        description: "Delicious hazelnuts with a satisfying crunch to soothe your taste for the best price on the market."
    },
    {
        id: 6,
        name: "Macadamia nuts",
        price: 19.99,
        image: "https://media.istockphoto.com/id/1569841715/photo/macadamia-nuts-in-the-shell-and-without-it-in-plastic-containers-in-the-store.webp?a=1&b=1&s=612x612&w=0&k=20&c=8OktZOxpjC0dRUXKdPPVqkEotmLI_8gDWOQsHzaraO0=",
        description: "Delicious macadamia nuts with a satisfying crunch to soothe your taste for the best price on the market."
    },
    {
        id: 7,
        name: "Walnuts",
        price: 9.99,
        image: "https://media.istockphoto.com/id/1184601185/photo/packaged-walnuts.webp?a=1&b=1&s=612x612&w=0&k=20&c=Xf_TMcGJa4GFvhx85-99rO8sR1SUxtMFn78ZB8VimRI=",
        description: "Delicious walnuts with a satisfying crunch to soothe your taste for the best price on the market."
    },
    {
        id: 8,
        name: "Brazil nuts",
        price: 9.99,
        image: "https://media.istockphoto.com/id/512108416/photo/brazil-nuts.webp?a=1&b=1&s=612x612&w=0&k=20&c=0-hOklwbBMm5Y3Mn2EAknO-iTfwhznzv5-M6PIWLXmw=",
        description: "Delicious brazil nut with a satisfying crunch to soothe your taste for the best price on the market."
    },
]

export function getProducts() {
    return products;
}

export function getProductsById(id) {
    return products.find((p) => p.id === Number(id))
}