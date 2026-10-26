import ProductCard from "../Components/ProductCard"
import { getProducts } from "../Data/Products"

const ProductsPage = () => {
    const products = getProducts();

    return (
        <div className="page products-page">
            <div className='container'>
                <h1 className='page-title'>All Products</h1>
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
