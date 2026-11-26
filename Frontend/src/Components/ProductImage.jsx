import { useState } from 'react'

const Placeholder = '/images/product-placeholder.svg';

export default function ProductImage(props) {
    return <ProductImageSetup key={props.src} {...props} />;
}


function ProductImageSetup({ src, alt, ...props }) {
    const [failed, setFailed] = useState(false);
    const showPlaceholder = !src || failed;
    return (
        <img
            {...props}
            src={showPlaceholder ? Placeholder : src}
            alt={showPlaceholder ? `${alt}: Image unavailable` : alt}
            onError={
                showPlaceholder ? undefined : () => setFailed(true)
            }
        />

    )
}

