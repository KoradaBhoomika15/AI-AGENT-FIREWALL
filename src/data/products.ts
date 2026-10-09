import { Product } from '../types';

export const SERVER_PRODUCTS: Record<string, Product> = {
  'smart-watch': {
    id: 'smart-watch',
    name: 'TitanPulse Smart Watch',
    price: 1999,
    description: 'Precision AMOLED biometric tracker with continuous optical HR monitoring and cybernetic titanium casing.',
    category: 'Wearables',
    image: '/src/assets/images/product_smart_watch_1791563950877.jpg',
    features: ['AMOLED Display', 'Heart Rate & SpO2', '7-Day Battery', 'IP68 Water Resistant']
  },
  'wireless-headphones': {
    id: 'wireless-headphones',
    name: 'AcousticShield ANC Headphones',
    price: 1499,
    description: 'Ultra-low latency studio wireless acoustics with 40mm neodymium drivers and hybrid active noise cancellation.',
    category: 'Audio',
    image: '/src/assets/images/product_headphones_1791563968034.jpg',
    features: ['Active Noise Cancellation', '40hr Playback', 'Multipoint Bluetooth 5.3', 'Ultra-low Latency']
  },
  'usb-c-hub': {
    id: 'usb-c-hub',
    name: 'NexusPort 7-in-1 USB-C Hub',
    price: 999,
    description: 'Aircraft aluminum pass-through dock supporting 4K@60Hz HDMI, 100W Power Delivery, and dual UHS-I slots.',
    category: 'Accessories',
    image: '/src/assets/images/product_usb_c_hub_1791563984539.jpg',
    features: ['100W PD Pass-through', '4K@60Hz HDMI', '3x USB 3.2 Gen 1', 'SD/MicroSD Slots']
  },
  'laptop-stand': {
    id: 'laptop-stand',
    name: 'ErgoVault Adjustable Laptop Stand',
    price: 799,
    description: 'CNC-machined dual-pivot ergonomic aluminum stand engineered for thermal dispersion and heavy load stability.',
    category: 'Ergonomics',
    image: '/src/assets/images/product_laptop_stand_1791564169162.jpg',
    features: ['Dual Z-Shape Pivot', 'Anti-slip Silicone Pads', 'Ventilated Airflow', 'Foldable Ultra-compact']
  }
};

export const PRODUCT_LIST = Object.values(SERVER_PRODUCTS);
