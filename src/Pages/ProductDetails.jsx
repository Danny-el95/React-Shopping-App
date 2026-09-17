import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"
import { getProductsById } from "../Data/Products";

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const navigate = useNavigate()

    useEffect(() => {
        const foundProduct = getProductsById(id);

        if (!foundProduct) {
            navigate("*");
            return;
        }

        setProduct(foundProduct);
    }, [id, navigate]);

    // If product/id isn't found, return this:
    // if (!product) {
    //     return <div className="">Loading product...</div>
    // }

    return (
        <div className="page">
            <div className="container">
                <div className="product-detail">
                    <div className="product-detail-image">
                        <img src={product?.image} alt={product?.name}></img>
                    </div>
                    <div className="product-detail-content">
                        <h1 className="product-detail-name">{product?.name}</h1>
                        <p className="product-detail-price">${product?.price}</p>
                        <p className="product-detail-description">{product?.description}</p>
                        <button className="btn btn-primary">Add to cart</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductDetails