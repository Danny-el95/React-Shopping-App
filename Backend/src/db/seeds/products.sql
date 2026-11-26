-- Keep IDs 1-8 unchanged: saved carts reference these product IDs.
-- Re-running this seed updates product details without deleting product rows.
INSERT INTO products (id, name, price, image, description)
VALUES
    (
        1,
        'Cashews',
        9.99,
        '/images/products/Cashew.webp',
        'Crunchy cashew nuts with delicious smoky flavor. Buy now at the lowest price!'
    ),
    (
        2,
        'Almonds',
        12.99,
        '/images/products/Almonds.jpg',
        'Delicious almond nuts with a satisfying crunch to soothe your taste for the best price on the market.'
    ),
    (
        3,
        'Pistachios',
        15.99,
        '/images/products/Pistachios.jpg',
        'Handpicked pistachios from local and organic farms, grown naturally and packed straight to you!.'
    ),
    (
        4,
        'Peanuts',
        9.99,
        '/images/products/Peanuts.jpg',
        'Tasty salted peanuts perfect for your soaks. Buy now!.'
    ),
    (
        5,
        'Hazelnuts',
        9.99,
        '/images/products/Hazel.webp',
        'Delicious hazelnuts with a satisfying crunch to soothe your taste for the best price on the market.'
    ),
    (
        6,
        'Macadamia nuts',
        9.99,
        '/images/products/Macadamia.webp',
        'Delicious macadamia nuts with a satisfying crunch to soothe your taste for the best price on the market.'
    ),
    (
        7,
        'Walnuts',
        9.99,
        '/images/products/Walnut.webp',
        'Delicious walnuts with a satisfying crunch to soothe your taste for the best price on the market.'
    ),
    (
        8,
        'Brazil nuts',
        9.99,
        '/images/products/Brazil.webp',
        'Delicious brazil nut with a satisfying crunch to soothe your taste for the best price on the market.'
    )
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    price = VALUES(price),
    image = VALUES(image),
    description = VALUES(description);
