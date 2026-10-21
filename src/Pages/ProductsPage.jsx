import ProductCard from "../Components/ProductCard"
import { getProducts } from "../Data/Products"

const ProductsPage = () => {
    const products = getProducts();

    return (
        <div className="page">
            <div className='container'>
                <div className='page-title'>All Products</div>
                <div className='product-grid'>
                    {products.map((product) => (
                        <ProductCard product={product} key={product.id} />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ProductsPage