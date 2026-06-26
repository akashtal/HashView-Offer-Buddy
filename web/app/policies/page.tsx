import React from 'react';
import { Shield, RefreshCw, AlertTriangle, FileText, CreditCard, Trash2 } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Policies | OffersBuddy',
  description: 'Privacy Policy, Terms & Conditions, and Account Deletion Policy for OffersBuddy',
};

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-indigo-600 px-8 py-10 text-white">
          <h1 className="text-3xl font-bold mb-2">Legal & Policies</h1>
          <p className="text-indigo-100">
            Return, Refund, Replacement, Privacy Policy, Terms & Conditions, and Account Deletion
          </p>
        </div>

        <div className="p-8 md:p-12 space-y-12 text-gray-700">
          
          {/* Section 1: Returns & Refunds */}
          <section>
            <div className="flex items-center gap-3 mb-4 text-indigo-600">
              <RefreshCw size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Returns, Refunds & Replacements</h2>
            </div>
            <div className="space-y-4 ml-9">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Return Policy</h3>
                <p className="mt-1">
                  OffersBuddy does not provide or manage product returns. All purchases are made directly between the customer and the business. Any return requests must be discussed directly with the business from whom the product was purchased.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Refund Policy</h3>
                <p className="mt-1">
                  OffersBuddy does not provide refunds for any products or services listed on the platform. Customers are responsible for verifying products before making payment. Any refund requests must be handled directly between the customer and the business.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Replacement Policy</h3>
                <p className="mt-1">
                  OffersBuddy does not offer replacements for products purchased from businesses listed on the platform. Any replacement requests are solely the responsibility of the business from which the product was purchased.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Customer Responsibility */}
          <section>
            <div className="flex items-center gap-3 mb-4 text-orange-500">
              <AlertTriangle size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Customer Responsibility & Disclaimer</h2>
            </div>
            <div className="space-y-4 ml-9">
              <ul className="list-disc pl-5 space-y-2">
                <li>Customers are responsible for inspecting and verifying products before making payment.</li>
                <li>Purchases are completed directly with the business in person (face-to-face).</li>
                <li>OffersBuddy acts only as a platform to display offers and connect customers with businesses.</li>
                <li>OffersBuddy is not responsible for product quality, condition, availability, warranties, or after-sales support.</li>
              </ul>
              <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-100">
                <h3 className="font-semibold text-orange-800 mb-1">Product Description Disclaimer</h3>
                <p className="text-sm text-orange-700">
                  Customers are encouraged to verify that a product matches its description before purchasing. Since purchases occur directly with the business, customers can inspect products face-to-face before payment. OffersBuddy is not responsible for discrepancies between product descriptions and actual products.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Privacy Policy */}
          <section id="privacy">
            <div className="flex items-center gap-3 mb-4 text-green-600">
              <Shield size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Privacy Policy</h2>
            </div>
            <div className="ml-9">
              <p>
                OffersBuddy may collect information such as name, contact details, location information, device information, and app usage data to provide and improve services. User information may be used for customer support, security, fraud prevention, analytics, and service improvements. OffersBuddy takes reasonable measures to protect user data and does not sell personal information to third parties without consent, except where required by law.
              </p>
            </div>
          </section>

          {/* Section 4: Terms & Conditions */}
          <section id="terms">
            <div className="flex items-center gap-3 mb-4 text-blue-600">
              <FileText size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Terms & Conditions</h2>
            </div>
            <div className="ml-9">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Users must provide accurate information when using the app.</li>
                <li>Users agree to use the platform lawfully and responsibly.</li>
                <li>Businesses are solely responsible for the products, services, pricing, and information they provide.</li>
                <li>OffersBuddy is not a seller, supplier, manufacturer, or distributor of any products listed by businesses.</li>
                <li>OffersBuddy shall not be liable for disputes arising between customers and businesses.</li>
                <li>Users who engage in fraudulent, abusive, or unlawful activities may have their accounts suspended or terminated.</li>
                <li>OffersBuddy reserves the right to modify, update, or remove content and services at any time.</li>
              </ol>
            </div>
          </section>

          {/* Section 5: Payment Policy */}
          <section>
            <div className="flex items-center gap-3 mb-4 text-purple-600">
              <CreditCard size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Payment Policy</h2>
            </div>
            <div className="ml-9">
              <p className="mb-3">Payments are made directly to the business and not to OffersBuddy. Businesses may accept:</p>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                <li>Cash payments</li>
                <li>Online bank transfers</li>
                <li>Mobile payment services</li>
                <li>Other payment methods available in the customer&apos;s country</li>
              </ul>
              <p className="font-medium text-gray-900">
                OffersBuddy does not process, hold, or guarantee payments between customers and businesses.
              </p>
            </div>
          </section>

          {/* Section 6: Account Deletion */}
          <section id="deletion">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <Trash2 size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Account Deletion Policy</h2>
            </div>
            <div className="ml-9">
              <p className="mb-4">
                Users may delete their OffersBuddy account at any time through the app or by contacting support.
              </p>
              <h3 className="font-semibold text-gray-900 mb-2">Once an account is deleted:</h3>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                <li>Access to the account will be permanently removed.</li>
                <li>Account information and related data will be deleted from active systems.</li>
                <li>Deleted accounts cannot be recovered.</li>
              </ul>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> OffersBuddy may retain certain information where required by law, security, fraud prevention, or dispute resolution purposes.
                </p>
              </div>
            </div>
          </section>

        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 flex justify-center">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
            &larr; Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}
