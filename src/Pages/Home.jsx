import { getProducts } from "../Data/Products"
import ProductCard from '../Components/ProductCard'

const Home = () => {
    const products = getProducts();
    return (
        <div className="page">
            <div className='home-title'>
                <h1 className='home-title'>
                    Welcome to D's Nutshop
                </h1>
                <p className='home-subtitle'>Your one-stop shop for all your nutty needs!</p>
            </div>

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

export default Home