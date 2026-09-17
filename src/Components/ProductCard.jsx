import { Link } from 'react-router-dom'


const ProductCard = ({ product }) => {
    return (
        <div>
            <div className='product-card'>
                <img src={product.image} alt={product.name} className='product-card-image' />
                <div className='product-card-content'>
                    <h3 className='product-card-name'>{product.name}</h3>
                    <p className='product-card-price'>${product.price}</p>
                    <div className='product-card-action btn-flex'>
                        <Link className='btn-link btn-secondary' to={`/products/${product.id}`}>View Details</Link>
                        <button className='button btn-primary'>Add to Cart</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductCard