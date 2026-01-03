'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    Phone,
    MapPin,
    Clock,
    ShieldCheck,
    Star,
    Mail,
    Globe,
    CheckCircle,
    MessageSquare
} from 'lucide-react';
import axios from 'axios';
import { useLocation } from '@/lib/LocationContext';
import { calculateDistance } from '@/lib/location-utils';
import IndiaMArtProductCard from '@/components/IndiaMART/ProductCard';

export default function VendorDetailPage() {
    const params = useParams();
    const vendorId = params.id as string;
    const { location } = useLocation();

    const [vendor, setVendor] = useState<any>(null);
    const [vendorProducts, setVendorProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('products');
    const [showEnquiryModal, setShowEnquiryModal] = useState(false);

    useEffect(() => {
        loadVendorData();
    }, [vendorId]);

    const loadVendorData = async () => {
        try {
            setIsLoading(true);
            // Fetch vendor details
            const vendorRes = await axios.get(`/api/vendors/${vendorId}`);
            const vendorData = vendorRes.data.data.vendor;

            // Calculate distance
            if (location?.coordinates && vendorData.location?.coordinates) {
                const [vendorLng, vendorLat] = vendorData.location.coordinates.coordinates;
                vendorData.distance = calculateDistance(
                    location.coordinates,
                    { latitude: vendorLat, longitude: vendorLng }
                );
            }
            setVendor(vendorData);

            // Fetch vendor products
            // Ideally the API endpoint might return them, but if not we search products by vendorId
            const productsRes = await axios.get(`/api/products`, {
                params: {
                    vendorId: vendorId, // Assuming API supports filtering by vendorId
                    limit: 20
                }
            });
            // Filter manually if API doesn't support vendorId param yet (fallback)
            const allProducts = productsRes.data.data.products;
            const filtered = allProducts.filter((p: any) => p.vendorId?._id === vendorId || p.vendorId === vendorId);
            setVendorProducts(filtered);

            setIsLoading(false);
        } catch (error) {
            console.error('Failed to load vendor:', error);
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen bg-gray-50 p-8 text-center">Loading Supplier Profile...</div>;
    }

    if (!vendor) return <div className="p-12 text-center">Supplier not found</div>;

    return (
        <div className="min-h-screen bg-[#F3F3F3]">
            {/* IndiaMART Style Header/Banner for Vendor */}
            <div className="bg-white border-b border-gray-200">
                <div className="container-custom py-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <div className="relative w-24 h-24 md:w-32 md:h-32 border border-gray-200 rounded-lg overflow-hidden p-2 bg-white">
                                <Image
                                    src={vendor.shopLogo || '/placeholder-shop.jpg'}
                                    alt={vendor.shopName}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                {vendor.shopName}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
                                <span className="flex items-center gap-1 text-gray-600">
                                    <MapPin size={16} />
                                    {vendor.location?.city}, {vendor.location?.state}
                                </span>
                                {vendor.isApproved && (
                                    <span className="verified-badge">
                                        <ShieldCheck size={14} className="mr-1" />
                                        TrustSEAL Verified
                                    </span>
                                )}
                                {vendor.rating && (
                                    <span className="flex items-center gap-1 font-bold text-gray-900">
                                        {vendor.rating} <Star size={14} fill="currentColor" className="text-[#FDB913]" />
                                        <span className="text-gray-500 font-normal">({vendor.analytics?.totalViews} views)</span>
                                    </span>
                                )}
                            </div>

                            <p className="text-gray-600 text-sm max-w-3xl line-clamp-2 md:line-clamp-3 mb-4">
                                {vendor.shopDescription || `Leading supplier of ${vendor.category?.name || 'various products'} in ${vendor.location?.city}. Contact us for best quality and price.`}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => setShowEnquiryModal(true)}
                                    className="indiamart-btn-primary py-2 px-6 flex items-center gap-2"
                                >
                                    <Phone size={18} />
                                    Contact Supplier
                                </button>
                                {vendor.contactInfo?.whatsapp && (
                                    <a
                                        href={`https://wa.me/${vendor.contactInfo.whatsapp}`}
                                        target="_blank"
                                        className="flex items-center gap-2 bg-[#25D366] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#128C7E] transition-colors"
                                    >
                                        <MessageSquare size={18} />
                                        WhatsApp
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="container-custom mt-4">
                    <div className="flex gap-8 border-b border-gray-200 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`pb-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'products' ? 'border-[#FDB913] text-black' : 'border-transparent text-gray-500 hover:text-black'
                                }`}
                        >
                            Products & Services
                        </button>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`pb-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'profile' ? 'border-[#FDB913] text-black' : 'border-transparent text-gray-500 hover:text-black'
                                }`}
                        >
                            Company Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('contact')}
                            className={`pb-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'contact' ? 'border-[#FDB913] text-black' : 'border-transparent text-gray-500 hover:text-black'
                                }`}
                        >
                            Contact Us
                        </button>
                    </div>
                </div>
            </div>

            <div className="container-custom py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="hidden lg:block space-y-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">Contact Details</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex gap-2">
                                    <div className="w-6 mt-1 text-gray-400"><MapPin size={16} /></div>
                                    <div className="text-gray-600">
                                        {vendor.location?.address}<br />
                                        {vendor.location?.city} - {vendor.location?.pincode}<br />
                                        {vendor.location?.state}, India
                                    </div>
                                </div>
                                {vendor.contactInfo?.phone && (
                                    <div className="flex gap-2 items-center">
                                        <div className="w-6 text-gray-400"><Phone size={16} /></div>
                                        <div className="font-bold text-gray-900">{vendor.contactInfo.phone}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-[#FFF9E6] p-4 rounded-lg border border-[#FFEBA1]">
                            <h3 className="font-bold text-gray-900 mb-2">Tell us what you need</h3>
                            <p className="text-xs text-gray-600 mb-3">Get quotes from this supplier</p>
                            <button
                                onClick={() => setShowEnquiryModal(true)}
                                className="w-full indiamart-btn-secondary text-sm py-2"
                            >
                                Send Enquiry
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                        {activeTab === 'products' && (
                            <div className="space-y-6">
                                <h2 className="indiamart-section-title text-xl">
                                    Products from {vendor.shopName}
                                </h2>

                                {vendorProducts.length === 0 ? (
                                    <div className="bg-white p-8 rounded-lg text-center border border-dashed border-gray-300">
                                        <p className="text-gray-500">No products listed by this supplier yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {vendorProducts.map(product => (
                                            <IndiaMArtProductCard
                                                key={product._id}
                                                id={product._id}
                                                title={product.title}
                                                image={product.images?.[0]}
                                                price={product.price}
                                                offer={product.offer}
                                                // No vendor details needed inside the card since we are on vendor page, but component expects it
                                                vendor={{ shopName: vendor.shopName, city: vendor.location?.city }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h2 className="text-xl font-bold mb-4">About Us</h2>
                                <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
                                    {vendor.shopDescription || 'No description available.'}
                                </p>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-3">Company Facts</h3>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-gray-500">Nature of Business</span>
                                                <span className="font-medium">Supplier / Distributor</span>
                                            </li>
                                            <li className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-gray-500">Year of Establishment</span>
                                                <span className="font-medium">{vendor.yearEstablished || 'N/A'}</span>
                                            </li>
                                            <li className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-gray-500">Legal Status</span>
                                                <span className="font-medium">Proprietorship</span>
                                            </li>
                                        </ul>
                                    </div>

                                    {vendor.businessHours && (
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-3">Opening Hours</h3>
                                            <ul className="space-y-1 text-sm">
                                                {vendor.businessHours.map((h: any, i: number) => (
                                                    <li key={i} className="flex justify-between">
                                                        <span className="text-gray-500 w-24">{h.day}</span>
                                                        <span className="font-medium">
                                                            {h.isClosed ? 'Closed' : `${h.openTime} - ${h.closeTime}`}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'contact' && (
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h2 className="text-xl font-bold mb-6">Contact Us</h2>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-gray-100 p-2 rounded-full"><MapPin size={20} className="text-[#FDB913]" /></div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">Registered Address</h4>
                                                <p className="text-gray-600">
                                                    {vendor.location?.address}<br />
                                                    {vendor.location?.city} - {vendor.location?.pincode},<br />
                                                    {vendor.location?.state}, India
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="bg-gray-100 p-2 rounded-full"><Phone size={20} className="text-[#FDB913]" /></div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">Call Us</h4>
                                                <p className="text-gray-900 font-bold text-lg">{vendor.contactInfo?.phone}</p>
                                            </div>
                                        </div>

                                        {vendor.contactInfo?.email && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-gray-100 p-2 rounded-full"><Mail size={20} className="text-[#FDB913]" /></div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">Email Us</h4>
                                                    <p className="text-gray-600">{vendor.contactInfo.email}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-lg">
                                        <h3 className="font-bold text-gray-900 mb-4">Send Message</h3>
                                        <div className="space-y-3">
                                            <input type="text" placeholder="Your Name" className="w-full p-2 border border-gray-300 rounded focus:border-[#FDB913] outline-none" />
                                            <input type="text" placeholder="Mobile Number" className="w-full p-2 border border-gray-300 rounded focus:border-[#FDB913] outline-none" />
                                            <textarea rows={3} placeholder="Requirement Details" className="w-full p-2 border border-gray-300 rounded focus:border-[#FDB913] outline-none"></textarea>
                                            <button className="w-full indiamart-btn-primary py-2">Submit</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Enquiry Modal */}
            {showEnquiryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden relative">
                        <button
                            onClick={() => setShowEnquiryModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"
                        >
                            ✕
                        </button>
                        <div className="bg-[#FDB913] p-4 text-black">
                            <h3 className="text-xl font-bold">Contact Supplier</h3>
                            <p className="text-sm opacity-90">{vendor.shopName}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <input type="tel" className="block w-full rounded-md border-gray-300 border p-2" placeholder="Mobile number" />
                            <textarea rows={3} className="block w-full rounded-md border-gray-300 border p-2" placeholder="Describe your requirement..."></textarea>
                            <button className="w-full indiamart-btn-primary py-3">Submit Requirement</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
