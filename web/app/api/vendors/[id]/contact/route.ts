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
        const {
            name,
            email: customerEmail,
            mobileNumber,
            requirement,
            location: customerLocation,
            productInterest,
            quantity,
        } = await request.json();

        // Validate required fields
        if (!name || !name.trim()) {
            return NextResponse.json(apiError('Name is required'), { status: 400 });
        }
        if (!mobileNumber || !mobileNumber.trim()) {
            return NextResponse.json(apiError('Mobile number is required'), { status: 400 });
        }
        if (!requirement || !requirement.trim()) {
            return NextResponse.json(apiError('Requirement details are required'), { status: 400 });
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

        // Build detail rows for email
        const detailRows = [
            { label: 'Customer Name', value: name.trim() },
            { label: 'Mobile Number', value: mobileNumber.trim(), isPhone: true },
            ...(customerEmail ? [{ label: 'Email', value: customerEmail.trim(), isEmail: true }] : []),
            ...(customerLocation ? [{ label: 'Location / City', value: customerLocation.trim() }] : []),
            ...(productInterest ? [{ label: 'Product Interest', value: productInterest.trim() }] : []),
            ...(quantity ? [{ label: 'Quantity Required', value: quantity.trim() }] : []),
        ];

        const detailRowsHtml = detailRows.map(row => {
            let valueHtml = row.value;
            if ((row as any).isPhone) {
                valueHtml = `<a href="tel:${row.value}" style="color: #2563EB; text-decoration: none;">${row.value}</a>`;
            } else if ((row as any).isEmail) {
                valueHtml = `<a href="mailto:${row.value}" style="color: #2563EB; text-decoration: none;">${row.value}</a>`;
            }
            return `
                <tr>
                    <td style="padding: 10px 16px; font-weight: 600; color: #374151; white-space: nowrap; vertical-align: top;">${row.label}</td>
                    <td style="padding: 10px 16px; color: #111827;">${valueHtml}</td>
                </tr>
            `;
        }).join('');

        const plainTextDetails = detailRows.map(row => `${row.label}: ${row.value}`).join('\n');

        // Send Email
        console.log(`Sending enquiry email notification to ${vendorEmail}...`);
        await sendEmail({
            email: vendorEmail,
            subject: `🔔 New Lead: ${name.trim()} enquired about ${productInterest || 'your products'} — ${store.shopName}`,
            message: `New customer enquiry for ${store.shopName} on offers buddy!\n\n${plainTextDetails}\n\nRequirement:\n${requirement.trim()}`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #FDB913 0%, #F59E0B 100%); padding: 24px 32px; border-radius: 12px 12px 0 0;">
                        <h2 style="margin: 0; color: #111827; font-size: 22px;">🔔 New Customer Enquiry</h2>
                        <p style="margin: 6px 0 0 0; color: #92400E; font-size: 14px;">${store.shopName} — offers buddy</p>
                    </div>

                    <!-- Body -->
                    <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-top: none; padding: 28px 32px; border-radius: 0 0 12px 12px;">
                        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 0;">
                            A potential customer is interested in your products/services and has submitted the following enquiry:
                        </p>

                        <!-- Customer Details Table -->
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #F9FAFB; border-radius: 8px; overflow: hidden; border: 1px solid #E5E7EB;">
                            <thead>
                                <tr style="background: #F3F4F6;">
                                    <th colspan="2" style="padding: 12px 16px; text-align: left; font-size: 13px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">Customer Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${detailRowsHtml}
                            </tbody>
                        </table>

                        <!-- Requirement Box -->
                        <div style="background: #FFFBEB; border-left: 4px solid #FDB913; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                            <p style="margin: 0 0 8px 0; font-weight: 600; color: #92400E; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Requirement Details</p>
                            <p style="margin: 0; color: #111827; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${requirement.trim()}</p>
                        </div>

                        <!-- CTA Buttons -->
                        <div style="margin: 28px 0 8px 0; text-align: center;">
                            <a href="tel:${mobileNumber.trim()}" style="display: inline-block; background: #111827; color: #FFFFFF; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin-right: 12px;">
                                📞 Call Customer
                            </a>
                            ${customerEmail ? `
                            <a href="mailto:${customerEmail.trim()}" style="display: inline-block; background: #FDB913; color: #111827; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                                ✉️ Reply via Email
                            </a>
                            ` : ''}
                        </div>

                        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
                        <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
                            This enquiry was sent via <strong>offers buddy</strong>. Respond quickly to convert this lead!
                        </p>
                    </div>
                </div>
            `
        });
        console.log('Enquiry email sent successfully');

        return NextResponse.json(apiSuccess({ message: 'Enquiry sent successfully' }));
    } catch (error: any) {
        console.error('Contact supplier error:', error);
        return NextResponse.json(apiError('Internal server error'), { status: 500 });
    }
}
