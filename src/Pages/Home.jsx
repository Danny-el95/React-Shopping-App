import { getProducts } from "../Data/Products"
import ProductCard from '../Components/ProductCard'
import { Link } from "react-router-dom";

const Home = () => {
    const products = getProducts();
    return (
        <div className="page home-page">
            <header className='home-hero'>
                <p className='home-eyebrow'>D&apos;s NutShop</p>
                <h1 className='home-title'>
                    A little crunch.<br />
                    <span>A moment to enjoy.</span>
                </h1>
                <p className='home-subtitle'>From cashews to pistachios, discover your favorite nuts for everyday snacking, sharing, and everything in between.</p>
            </header>

            <div className='container'>
                <h2 className='home-products-title'>Explore our selection</h2>
                <div className='product-grid'>
                    {products.slice(0, 3).map((product) => (
                        <ProductCard product={product} key={product.id} />
                    ))}
                </div>
                <Link className="home-view-products" to="/product">View all products <span aria-hidden="true">&#8594;</span></Link>
            </div>
        </div>
    )
}

export default Home
