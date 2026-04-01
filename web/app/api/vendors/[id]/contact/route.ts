import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';
import { apiSuccess, apiError } from '@/lib/utils';
import { sendEmail } from '@/lib/mail';
import User from '@/models/User'; // needed if we want to get the vendor's user email as fallback

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;

    try {
        await dbConnect();

        const vendorId = params.id;
        const { mobileNumber, requirement } = await request.json();

        if (!mobileNumber || !requirement) {
            return NextResponse.json(apiError('Mobile number and requirement are required'), { status: 400 });
        }

        // Fetch the store
        const store = await Store.findById(vendorId).populate('vendorId');

        if (!store) {
            return NextResponse.json(apiError('Vendor not found'), { status: 404 });
        }

        // Determine vendor email
        let vendorEmail = '';
        if (store.contactInfo?.email) {
            vendorEmail = store.contactInfo.email;
        } else if (store.vendorId && (store.vendorId as any).email) {
            vendorEmail = (store.vendorId as any).email;
        }

        if (!vendorEmail) {
            console.error('Vendor has no email address configured:', vendorId);
            return NextResponse.json(apiError('Vendor email not configured'), { status: 500 });
        }

        // Send Email
        console.log(`Sending email notification to ${vendorEmail}...`);
        await sendEmail({
            email: vendorEmail,
            subject: `New Lead: Customer Enquiry for ${store.shopName} on Offer Buddy`,
            message: `A potential customer is trying to reach you!\n\nCustomer Mobile: ${mobileNumber}\nRequirement: ${requirement}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h3 style="color: #FDB913;">New Customer Enquiry</h3>
                    <p>A potential customer is interested in your products/services and wants you to contact them.</p>
                    
                    <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #FDB913; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>Customer Mobile:</strong> <a href="tel:${mobileNumber}">${mobileNumber}</a></p>
                        <p style="margin: 0;"><strong>Their Requirement:</strong></p>
                        <p style="margin: 5px 0 0 0; white-space: pre-wrap;">${requirement}</p>
                    </div>
                    
                    <p style="margin-top: 20px;">
                        <a href="tel:${mobileNumber}" style="background-color: #FDB913; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Call Customer Now
                        </a>
                    </p>
                </div>
            `
        });
        console.log('Email sent successfully');

        return NextResponse.json(apiSuccess({ message: 'Enquiry sent successfully' }));
    } catch (error: any) {
        console.error('Contact supplier error:', error);
        return NextResponse.json(apiError('Internal server error'), { status: 500 });
    }
}
