import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Vendor from '@/models/Vendor';
import Product from '@/models/Product';
import Analytics from '@/models/Analytics';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest, hasRole } from '@/lib/auth';
import { subDays, startOfDay, format } from 'date-fns';

// GET - Get platform statistics (Admin only)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getUserFromRequest(request);
    if (!hasRole(user, ['admin'])) {
      return NextResponse.json(
        apiError('Unauthorized'),
        { status: 403 }
      );
    }

    // Get counts
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalVendors = await Vendor.countDocuments({ isApproved: true });
    const pendingVendors = await Vendor.countDocuments({ 
      isApproved: false, 
      isActive: true 
    });
    const totalProducts = await Product.countDocuments({ isActive: true });

    // Get analytics for last 30 days
    const last30Days = subDays(new Date(), 30);
    
    const analyticsData = await Analytics.aggregate([
      {
        $match: {
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

    // Get recent users
    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get top vendors by views
    const topVendors = await Vendor.find({ isApproved: true })
      .select('shopName shopLogo analytics')
      .sort({ 'analytics.totalViews': -1 })
      .limit(10);

    // Get top products by views
    const topProducts = await Product.find({ isActive: true })
      .select('title images analytics vendorId')
      .populate('vendorId', 'shopName')
      .sort({ 'analytics.views': -1 })
      .limit(10);

    // Format analytics for charts
    const chartData: any[] = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const views = analyticsData.find(
        (a) => a._id.date === date && a._id.type === 'view'
      );
      const contacts = analyticsData.filter(
        (a) => a._id.date === date && ['contact', 'call', 'whatsapp', 'directions'].includes(a._id.type)
      ).reduce((sum, a) => sum + a.count, 0);

      chartData.push({
        date: format(subDays(new Date(), i), 'MMM dd'),
        views: views ? views.count : 0,
        contacts: contacts,
      });
    }

    return NextResponse.json(
      apiSuccess({
        summary: {
          totalUsers,
          totalVendors,
          pendingVendors,
          totalProducts,
        },
        chartData,
        recentUsers,
        topVendors,
        topProducts,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      apiError('Failed to fetch statistics'),
      { status: 500 }
    );
  }
}

