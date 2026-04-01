'use client';

import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ContactPage() {
    return (
        <div className="container-custom py-16">
            <div className="grid md:grid-cols-2 gap-12 items-start">
                {/* Contact Info */}
                <div>
                    <h1 className="text-4xl font-bold text-secondary mb-6">
                        Get in Touch
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Have a question or spotted a super deal we missed? Tell us about it!
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <FiMail className="text-primary text-xl" />
                            </div>
                            <div>
                                <h3 className="font-bold text-secondary mb-1">Email Us</h3>
                                <p className="text-gray-600">support@offerbuddy.com</p>
                                <p className="text-gray-600">partners@offerbuddy.com</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <FiPhone className="text-primary text-xl" />
                            </div>
                            <div>
                                <h3 className="font-bold text-secondary mb-1">Call Us</h3>
                                <p className="text-gray-600">+91 123 456 7890</p>
                                <p className="text-sm text-gray-500">Mon-Fri, 9am - 6pm</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <FiMapPin className="text-primary text-xl" />
                            </div>
                            <div>
                                <h3 className="font-bold text-secondary mb-1">Visit Us</h3>
                                <p className="text-gray-600">
                                    123 Tech Park, Sector 5<br />
                                    Bangalore, Karnataka 560001
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <CardBody>
                        <form className="space-y-4">
                            <h2 className="text-2xl font-bold text-secondary mb-4">
                                Send a Message
                            </h2>

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="First Name" placeholder="John" />
                                <Input label="Last Name" placeholder="Doe" />
                            </div>

                            <Input type="email" label="Email" placeholder="john@example.com" />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    rows={4}
                                    placeholder="How can we help you?"
                                ></textarea>
                            </div>

                            <Button variant="primary" fullWidth size="lg">
                                Send Message
                            </Button>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
