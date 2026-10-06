import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"
import { getProductsById } from "../Data/Products";
import { useCart } from '../Context/CartContext'


const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const navigate = useNavigate()
    const { addToCart, cartItems } = useCart();

    useEffect(() => {
        const foundProduct = getProductsById(id);

        if (!foundProduct) {
            navigate("*");
            return;
        }

        setProduct(foundProduct);
    }, [id, navigate]);

    // If product / id isn't found, return this:
    if (!product) {
        return <div className="">Loading product...</div>
    }

    const productInCart = cartItems.find((item) => item.id === product.id);

    return (
        <div className="page">
            <div className="container">
                <div className="product-detail">
                    <div className="product-detail-image">
                        <img src={product.image} alt={product.name}></img>
                    </div>
                    <div className="product-detail-content">
                        <p className="product-card-eyebrow">D&apos;s NutShop</p>
                        <h1 className="product-detail-name">{product.name}</h1>
                        <p className="product-detail-price">${product.price.toFixed(2)}</p>
                        <p className="product-detail-description">{product.description}</p>
                        <span className="product-card-cart-count product-detail-cart-count">
                            {productInCart ? `${productInCart.quantity} in cart` : 'Not in cart yet'}
                        </span>
                        <button type="button" className="product-card-add product-detail-add" onClick={() => addToCart(product.id)}>+ Add to cart</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductDetails
