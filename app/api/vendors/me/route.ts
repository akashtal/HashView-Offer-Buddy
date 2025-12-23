import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import Product from '@/models/Product';
import Analytics from '@/models/Analytics';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest } from '@/lib/auth';
import { startOfDay, subDays, format } from 'date-fns';

// GET - Get current vendor's profile and analytics
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'vendor') {
      return NextResponse.json(
        apiError('Unauthorized'),
        { status: 403 }
      );
    }

    const vendor = await Vendor.findOne({ userId: user.userId })
      .populate('category', 'name slug icon')
      .populate('userId', 'name email');

    if (!vendor) {
      return NextResponse.json(
        apiError('Vendor profile not found'),
        { status: 404 }
      );
    }

    // Get vendor's products
    const products = await Product.find({
      vendorId: vendor._id,
    })
      .populate('category', 'name slug icon')
      .sort({ createdAt: -1 });

    // Get analytics for last 30 days
    const last30Days = subDays(new Date(), 30);
    
    const analyticsData = await Analytics.aggregate([
      {
        $match: {
          vendorId: vendor._id,
          createdAt: { $gte: last30Days },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type',
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.date': 1 },
      },
    ]);

    // Get top products by views
    const topProducts = await Product.find({
      vendorId: vendor._id,
      isActive: true,
    })
      .sort({ 'analytics.views': -1 })
      .limit(5)
      .select('title images analytics');

    // Format analytics for charts
    const viewsData: any[] = [];
    const contactsData: any[] = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const views = analyticsData.find(
        (a) => a._id.date === date && a._id.type === 'view'
      );
      const contacts = analyticsData.find(
        (a) => a._id.date === date && ['contact', 'call', 'whatsapp', 'directions'].includes(a._id.type)
      );

      viewsData.push({
        date: format(subDays(new Date(), i), 'MMM dd'),
        views: views ? views.count : 0,
      });

      contactsData.push({
        date: format(subDays(new Date(), i), 'MMM dd'),
        contacts: contacts ? contacts.count : 0,
      });
    }

    return NextResponse.json(
      apiSuccess({
        vendor,
        products,
        analytics: {
          summary: vendor.analytics,
          viewsData,
          contactsData,
          topProducts,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Get vendor profile error:', error);
    return NextResponse.json(
      apiError('Failed to fetch vendor profile'),
      { status: 500 }
    );
  }
}

